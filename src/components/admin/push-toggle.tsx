"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff } from "lucide-react";

/**
 * Bouton "Activer / désactiver les notifications push".
 *
 * Cycle de vie :
 *  1. Détecte le support Push API + Service Worker (sinon → null, on n'affiche rien)
 *  2. Lit l'état courant (Notification.permission + subscription)
 *  3. Clic :
 *     - non abonné → demande permission, enregistre SW, souscrit, POST /api/admin/push/subscribe
 *     - abonné     → unsubscribe + POST /api/admin/push/unsubscribe
 *  4. Affiche une icône cloche barrée/active selon l'état
 *
 * Composant volontairement compact pour s'intégrer dans le header du bell.
 */

type Status = "unsupported" | "loading" | "denied" | "off" | "on" | "error";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToBuffer(base64: string): ArrayBuffer {
  // Convertit la clé VAPID URL-safe base64 en ArrayBuffer "plain" (pas
  // SharedArrayBuffer) — applicationServerKey n'accepte que ce type.
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

export function PushToggle({ compact = true }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  // Détection initiale + lecture de l'état courant
  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window) ||
        !VAPID_PUBLIC
      ) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const sub = await reg?.pushManager.getSubscription();
        if (!cancelled) setStatus(sub ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("off");
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    if (busy) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      // Enregistre (ou récupère) le SW à la racine pour scope global.
      const reg =
        (await navigator.serviceWorker.getRegistration("/sw.js")) ??
        (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
      // Attendre que le SW soit actif avant de souscrire.
      await navigator.serviceWorker.ready;

      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToBuffer(VAPID_PUBLIC),
        }));

      const json = sub.toJSON();
      const res = await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!res.ok) throw new Error(`subscribe failed: ${res.status}`);
      setStatus("on");
    } catch (err) {
      console.error("[push] enable:", err);
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/admin/push/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch (err) {
      console.error("[push] disable:", err);
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  if (status === "unsupported" || status === "loading") return null;

  const isOn = status === "on";
  const isDenied = status === "denied";
  const title = isDenied
    ? "Notifications bloquées dans le navigateur — autorisez-les depuis l'icône de l'adresse"
    : isOn
      ? "Désactiver les notifications push (onglet fermé)"
      : "Activer les notifications push (recevez-les même onglet fermé)";

  const className = compact
    ? "h-7 w-7 grid place-items-center rounded hover:bg-surface-2 transition disabled:opacity-50 " +
      (isOn ? "text-primary" : isDenied ? "text-amber-400" : "text-foreground-muted hover:text-foreground")
    : "inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-surface-2 hover:bg-primary/10 hover:text-primary transition text-sm disabled:opacity-50 " +
      (isOn ? "text-primary" : "text-foreground");

  return (
    <button
      type="button"
      onClick={isOn ? disable : enable}
      disabled={busy || isDenied}
      title={title}
      aria-label={title}
      className={className}
    >
      {isOn ? <BellRing className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
      {!compact && (
        <span>
          {isOn ? "Push activé" : isDenied ? "Push bloqué" : "Activer push"}
        </span>
      )}
    </button>
  );
}
