"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  FileText,
  AlertCircle,
  MessageSquare,
  ShoppingBag,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { PushToggle } from "./push-toggle";

const POLL_INTERVAL_MS = 30_000; // 30 secondes — bon compromis fraîcheur/charge
const MUTE_STORAGE_KEY = "bonafone-admin-notifs-muted";

type ApiItem = {
  id: string;
  kind: "devis" | "repair" | "reclamation" | "message" | "order";
  number: string | null;
  title: string;
  subtitle: string;
  href: string;
  createdAt: string;
};

type ApiResponse = {
  counts: {
    devis: number;
    reclamations: number;
    messages: number;
    orders: number;
    total: number;
  };
  items: ApiItem[];
};

const KIND_META: Record<ApiItem["kind"], { icon: typeof Bell; color: string }> = {
  devis: { icon: FileText, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  repair: { icon: FileText, color: "text-primary bg-primary/10 border-primary/30" },
  reclamation: { icon: AlertCircle, color: "text-primary bg-primary/10 border-primary/30" },
  message: { icon: MessageSquare, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  order: { icon: ShoppingBag, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
};

export function NotificationBell({ initial }: { initial: ApiResponse }) {
  const [data, setData] = useState<ApiResponse>(initial);
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const previousIdsRef = useRef<Set<string>>(new Set(initial.items.map((i) => i.id)));
  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Restore mute preference on mount
  useEffect(() => {
    setMuted(localStorage.getItem(MUTE_STORAGE_KEY) === "1");
  }, []);

  // Click outside → close panel
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Polling
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/admin/notifications", {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const json: ApiResponse = await res.json();
        if (cancelled) return;

        // Détection d'un nouvel item (id inconnu jusque-là) → son
        const previous = previousIdsRef.current;
        const hasNew = json.items.some((i) => !previous.has(i.id));
        if (hasNew && !muted) {
          playChime();
        }
        previousIdsRef.current = new Set(json.items.map((i) => i.id));
        setData(json);
      } catch {
        // silent — réseau down, on retentera au prochain tick
      }
    };
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [muted]);

  // Petit "ding" généré via Web Audio (pas de fichier à servir)
  function playChime() {
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      // 2 notes courtes — "ding-ding"
      const notes = [
        { freq: 880, start: 0, dur: 0.12 },
        { freq: 1175, start: 0.13, dur: 0.18 },
      ];
      for (const n of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(n.freq, now + n.start);
        gain.gain.setValueAtTime(0, now + n.start);
        gain.gain.linearRampToValueAtTime(0.15, now + n.start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + n.start);
        osc.stop(now + n.start + n.dur + 0.02);
      }
    } catch {
      // silent
    }
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(MUTE_STORAGE_KEY, next ? "1" : "0");
  }

  const total = data.counts.total;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative h-9 w-9 grid place-items-center rounded-lg bg-surface-2 hover:bg-primary/10 hover:text-primary border border-border transition"
        aria-label={`Notifications (${total} non traitées)`}
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 grid place-items-center shadow-[0_0_8px_var(--primary-glow)] animate-pulse">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[90vw] bg-surface border border-border rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">Notifications</div>
              <div className="text-[11px] text-foreground-muted">
                {total === 0 ? "Tout est à jour" : `${total} à traiter`}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <PushToggle compact />
              <button
                type="button"
                onClick={toggleMute}
                title={muted ? "Activer le son" : "Couper le son"}
                className="h-7 w-7 grid place-items-center rounded hover:bg-surface-2 text-foreground-muted hover:text-foreground transition"
              >
                {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-7 w-7 grid place-items-center rounded hover:bg-surface-2 text-foreground-muted hover:text-foreground transition"
                aria-label="Fermer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Counters par catégorie */}
          <div className="grid grid-cols-4 gap-1 p-2 bg-surface-2/40 border-b border-border">
            <CounterLink
              href="/admin/devis"
              icon={FileText}
              count={data.counts.devis}
              label="Devis"
              color="text-amber-400"
              onClose={() => setOpen(false)}
            />
            <CounterLink
              href="/admin/reclamations"
              icon={AlertCircle}
              count={data.counts.reclamations}
              label="Récl."
              color="text-primary"
              onClose={() => setOpen(false)}
            />
            <CounterLink
              href="/admin/messages"
              icon={MessageSquare}
              count={data.counts.messages}
              label="Msgs"
              color="text-blue-400"
              onClose={() => setOpen(false)}
            />
            <CounterLink
              href="/admin/commandes"
              icon={ShoppingBag}
              count={data.counts.orders}
              label="Cmds"
              color="text-emerald-400"
              onClose={() => setOpen(false)}
            />
          </div>

          {/* Liste */}
          <div className="max-h-96 overflow-y-auto">
            {data.items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <BellOff className="h-8 w-8 mx-auto text-foreground-subtle mb-2" />
                <div className="text-sm text-foreground-muted">Rien à signaler — bon travail !</div>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {data.items.map((item) => {
                  const meta = KIND_META[item.kind];
                  const Icon = meta.icon;
                  return (
                    <li key={`${item.kind}-${item.id}`}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-surface-2 transition"
                      >
                        <div
                          className={`h-8 w-8 grid place-items-center rounded-lg border shrink-0 ${meta.color}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate">{item.title}</div>
                          <div className="text-xs text-foreground-muted truncate">
                            {item.subtitle}
                          </div>
                          <div className="text-[10px] text-foreground-subtle mt-0.5">
                            {timeAgo(item.createdAt)}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CounterLink({
  href,
  icon: Icon,
  count,
  label,
  color,
  onClose,
}: {
  href: string;
  icon: typeof Bell;
  count: number;
  label: string;
  color: string;
  onClose: () => void;
}) {
  const active = count > 0;
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex flex-col items-center gap-0.5 py-2 rounded hover:bg-surface transition ${active ? "" : "opacity-50"}`}
    >
      <Icon className={`h-4 w-4 ${color}`} />
      <div className={`text-base font-extrabold ${active ? "" : "text-foreground-muted"}`}>
        {count}
      </div>
      <div className="text-[9px] text-foreground-muted uppercase tracking-wider">{label}</div>
    </Link>
  );
}

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
