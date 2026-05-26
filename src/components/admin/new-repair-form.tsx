"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Save,
  UserCheck,
  X,
  Search,
  FileText,
  Wrench,
  Loader2,
  Banknote,
} from "lucide-react";
import { createRepairAdmin } from "@/lib/actions/admin";

type Mode = "repair" | "devis";

const DEVICE_TYPES = [
  { value: "SMARTPHONE", label: "Smartphone" },
  { value: "TABLETTE", label: "Tablette" },
  { value: "ORDINATEUR_PORTABLE", label: "Ordinateur portable" },
  { value: "AUTRE", label: "Autre" },
];

const ISSUE_TYPES = [
  "Écran cassé",
  "Batterie",
  "Connecteur de charge",
  "Caméra",
  "Bouton/Switch",
  "Haut-parleur / micro",
  "Désoxydation",
  "Carte mère",
  "Logiciel / réinitialisation",
  "Autre",
];

const CONTACT_PREFS = [
  { value: "TELEPHONE", label: "Téléphone" },
  { value: "EMAIL", label: "Email" },
  { value: "WHATSAPP", label: "WhatsApp" },
];

// Liste pré-remplie des marques courantes — datalist permet de saisir une marque libre
// Catalogue brands + models pousse en prop par la page serveur (lecture DB).
type Catalog = Array<{
  name: string;
  models: Array<{ name: string; deviceType: string }>;
}>;

type ClientSuggestion = {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
};

type PaymentStatus = "NON_PAYE" | "ACOMPTE" | "PAYE";

export function NewRepairForm({
  mode = "repair",
  catalog = [],
}: {
  mode?: Mode;
  catalog?: Catalog;
}) {
  // Index pour acces rapide aux modeles d'une marque donnee
  const modelsByBrand = useMemo(() => {
    const map = new Map<string, Array<{ name: string; deviceType: string }>>();
    for (const b of catalog) map.set(b.name.toLowerCase(), b.models);
    return map;
  }, [catalog]);
  const brandNames = useMemo(() => catalog.map((b) => b.name), [catalog]);
  // Identite client : 2 modes
  //  - Particulier (defaut) : Prenom + Nom separes
  //  - Entreprise (case cochee) : un seul champ "Denomination"
  // Recompose en customerName cote backend.
  const [isCompany, setIsCompany] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedClient, setLinkedClient] = useState<ClientSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Etat paiement — l'input "Montant verse" s'affiche uniquement si ACOMPTE
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("NON_PAYE");
  // Marque + type d'appareil selectionnes : filtrent le datalist des modeles
  const [brand, setBrand] = useState("");
  const [deviceType, setDeviceType] = useState("SMARTPHONE");

  // Modeles disponibles pour la combinaison (marque + type d'appareil).
  // Si marque inconnue, on liste tous modeles du type pour aider quand meme.
  const filteredModels = useMemo(() => {
    const models = modelsByBrand.get(brand.toLowerCase()) ?? [];
    if (models.length > 0) {
      return models.filter((m) => m.deviceType === deviceType).map((m) => m.name);
    }
    // Fallback : aucun match de marque → tous les modeles de ce type
    const all: string[] = [];
    for (const b of catalog) {
      for (const m of b.models) {
        if (m.deviceType === deviceType) all.push(m.name);
      }
    }
    return all;
  }, [brand, deviceType, modelsByBrand, catalog]);
  // Champ qui a actuellement le focus — sert à afficher la dropdown au bon endroit
  const [activeField, setActiveField] = useState<"firstName" | "lastName" | "email" | "phone" | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autocomplétion : déclenchée à chaque frappe dans firstName/lastName/email/phone.
  // Le backend cherche dans nom + email + téléphone simultanément (haystack).
  // Debounce 200ms pour éviter les requêtes à chaque touche.
  useEffect(() => {
    if (linkedClient) return; // déjà rattaché → pas de recherche
    // On prend la valeur la plus longue parmi les champs identite comme query.
    // Le téléphone : on enlève espaces/tirets pour le matching.
    const identityQuery = isCompany
      ? companyName.trim()
      : `${firstName} ${lastName}`.trim();
    const candidates = [
      identityQuery,
      email.trim(),
      phone.replace(/[\s\-.]/g, "").trim(),
    ].filter((v) => v.length >= 2);
    if (candidates.length === 0) {
      setSuggestions([]);
      return;
    }
    // On envoie celui qui vient d'être modifié (le plus récent = activeField).
    // Sinon le plus long.
    let q = "";
    if (activeField === "firstName" || activeField === "lastName") q = identityQuery;
    else if (activeField === "email") q = email.trim();
    else if (activeField === "phone") q = phone.trim();
    else q = candidates.sort((a, b) => b.length - a.length)[0];
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/clients/search?q=${encodeURIComponent(q)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as ClientSuggestion[];
        setSuggestions(data);
      } catch {
        // silent
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isCompany, companyName, firstName, lastName, email, phone, activeField, linkedClient]);

  function pickClient(c: ClientSuggestion) {
    setLinkedClient(c);
    // Heuristique entreprise : un client sans firstName mais avec lastName
    // ou fullName a probablement ete enregistre comme entreprise. On bascule
    // automatiquement en mode Entreprise pour l'admin.
    const isLikelyCompany = !c.firstName && (c.lastName || c.fullName);
    if (isLikelyCompany) {
      setIsCompany(true);
      setCompanyName(c.lastName ?? c.fullName);
      setFirstName("");
      setLastName("");
    } else if (c.firstName || c.lastName) {
      setIsCompany(false);
      setFirstName(c.firstName ?? "");
      setLastName(c.lastName ?? "");
      setCompanyName("");
    } else {
      // Fallback : split fullName sur le 1er espace
      const parts = c.fullName.split(/\s+/);
      setIsCompany(false);
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" "));
      setCompanyName("");
    }
    setEmail(c.email ?? "");
    setPhone(c.phone ?? "");
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function unlinkClient() {
    setLinkedClient(null);
  }

  const isDevis = mode === "devis";

  return (
    <form action={createRepairAdmin} className="space-y-5">
      <input type="hidden" name="mode" value={mode} />
      {linkedClient && <input type="hidden" name="clientId" value={linkedClient.id} />}

      <Section title="Client">
        {linkedClient && (
          <div className="flex items-center justify-between gap-3 p-3 mb-3 bg-emerald-500/5 border border-emerald-500/30 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 grid place-items-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0 text-sm">
                <span className="font-bold">Rattaché au compte</span>
                <span className="text-foreground-muted"> · {linkedClient.fullName}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={unlinkClient}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-2 border border-border hover:border-primary rounded-lg text-xs font-semibold transition"
            >
              <X className="h-3 w-3" />
              Détacher
            </button>
          </div>
        )}

        {/* Toggle Entreprise — au dessus des champs identite */}
        <div className="mb-3">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="isCompany"
              checked={isCompany}
              onChange={(e) => setIsCompany(e.target.checked)}
              className="h-4 w-4 accent-primary cursor-pointer"
            />
            <span className="text-sm font-semibold">Entreprise (B2B)</span>
            <span className="text-xs text-foreground-muted">
              — coché : un seul champ Dénomination ; sinon : Prénom + Nom
            </span>
          </label>
        </div>

        {isCompany ? (
          // Mode Entreprise : un seul champ Denomination
          <div className="relative">
            <label className="block">
              <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
                Dénomination sociale <span className="text-primary">*</span>
              </span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
                <input
                  name="companyName"
                  required
                  autoComplete="off"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    setActiveField("lastName"); // reutilise la dropdown lastName
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    setActiveField("lastName");
                    setShowSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Ex : Bonafone SRL, ACME SA…"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </label>
            {showSuggestions && activeField === "lastName" && suggestions.length > 0 && (
              <SuggestionsList suggestions={suggestions} onPick={pickClient} />
            )}
          </div>
        ) : null}

        <Grid>
          {/* Champs Prenom + Nom (uniquement en mode Particulier) */}
          {!isCompany && (
          <>
          {/* Prenom — avec dropdown autocomplétion */}
          <div className="relative">
            <label className="block">
              <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
                Prénom <span className="text-primary">*</span>
              </span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
                <input
                  name="firstName"
                  required
                  autoComplete="off"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setActiveField("firstName");
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    setActiveField("firstName");
                    setShowSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Marc"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </label>
            {showSuggestions && activeField === "firstName" && suggestions.length > 0 && (
              <SuggestionsList suggestions={suggestions} onPick={pickClient} />
            )}
          </div>

          {/* Nom de famille */}
          <div className="relative">
            <label className="block">
              <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
                Nom <span className="text-primary">*</span>
              </span>
              <input
                name="lastName"
                required
                autoComplete="off"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setActiveField("lastName");
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  setActiveField("lastName");
                  setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Dupont"
                className={inputCls}
              />
            </label>
            {showSuggestions && activeField === "lastName" && suggestions.length > 0 && (
              <SuggestionsList suggestions={suggestions} onPick={pickClient} />
            )}
          </div>
          </>
          )}

          {/* Téléphone — avec dropdown */}
          <div className="relative">
            <label className="block">
              <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
                Téléphone <span className="text-primary">*</span>
              </span>
              <input
                name="customerPhone"
                type="tel"
                required
                autoComplete="off"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setActiveField("phone");
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  setActiveField("phone");
                  setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="+32 477 …"
                className={inputCls}
              />
            </label>
            {showSuggestions && activeField === "phone" && suggestions.length > 0 && (
              <SuggestionsList suggestions={suggestions} onPick={pickClient} />
            )}
          </div>

          {/* Email — avec dropdown */}
          <div className="relative">
            <label className="block">
              <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
                Email (optionnel)
              </span>
              <input
                name="customerEmail"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setActiveField("email");
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  setActiveField("email");
                  setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="client@exemple.com"
                className={inputCls}
              />
            </label>
            {showSuggestions && activeField === "email" && suggestions.length > 0 && (
              <SuggestionsList suggestions={suggestions} onPick={pickClient} />
            )}
          </div>

          <SelectStatic label="Mode de contact" name="contactPref">
            {CONTACT_PREFS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </SelectStatic>
        </Grid>
        <p className="text-xs text-foreground-muted mt-3">
          💡 Tapez dans n&apos;importe quel champ — si le client existe déjà, sélectionnez-le.
          Sinon, il sera <strong>créé automatiquement</strong> à la soumission du formulaire.
        </p>
      </Section>

      <Section title="Appareil">
        <Grid>
          {/* Type d'appareil — controle car il filtre aussi les modeles */}
          <label className="block">
            <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
              Type <span className="text-primary">*</span>
            </span>
            <select
              name="deviceType"
              required
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className={inputCls}
            >
              {DEVICE_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <FieldStatic label="IMEI / N° de série (optionnel)" name="imei" />

          {/* Marque — controlee pour piloter le datalist des modeles */}
          <label className="block">
            <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
              Marque <span className="text-primary">*</span>
            </span>
            <input
              name="brand"
              type="text"
              required
              autoComplete="off"
              list="brand-list"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder={brandNames[0] ? `Ex : ${brandNames[0]}` : "Apple, Samsung…"}
              className={inputCls}
            />
          </label>
          <datalist id="brand-list">
            {brandNames.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>

          {/* Modele — datalist filtre par (marque + type d'appareil).
              Si la marque n'est pas dans le catalogue, on liste tous les
              modeles du type pour aider quand meme. Champ libre (datalist
              != select), donc admin peut saisir un modele non liste. */}
          <label className="block">
            <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
              Modèle <span className="text-primary">*</span>
              {filteredModels.length > 0 && (
                <span className="text-foreground-subtle font-normal ml-1.5">
                  ({filteredModels.length} suggestion{filteredModels.length > 1 ? "s" : ""}
                  {brand ? ` pour ${brand}` : ""})
                </span>
              )}
            </span>
            <input
              name="model"
              type="text"
              required
              autoComplete="off"
              list="model-list"
              placeholder={
                filteredModels[0] ? `Ex : ${filteredModels[0]}` : "iPhone 15 Pro, Galaxy S24…"
              }
              className={inputCls}
            />
          </label>
          <datalist id="model-list">
            {filteredModels.map((m) => (
              <option key={`${brand}-${deviceType}-${m}`} value={m} />
            ))}
          </datalist>
          {catalog.length === 0 && (
            <p className="text-xs text-amber-500 md:col-span-2">
              Aucun catalogue marques/modèles configuré.{" "}
              <a href="/admin/marques" className="underline">
                Aller dans Marques & modèles
              </a>{" "}
              pour en ajouter.
            </p>
          )}
        </Grid>
      </Section>

      <Section title="Panne">
        <Grid>
          <SelectStatic label="Type de panne" name="issueType" required>
            {ISSUE_TYPES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </SelectStatic>
          <FieldStatic
            label="Devis estimé TTC (€)"
            name="estimatedCost"
            type="number"
            step="0.01"
            min="0"
          />
        </Grid>
        <TextareaStatic
          label="Description (visible côté client)"
          name="issueDescription"
          rows={4}
          required
        />
      </Section>

      <Section title="Paiement">
        <div className="grid md:grid-cols-3 gap-2">
          {(
            [
              { v: "NON_PAYE", l: "Non payé", desc: "À payer à la restitution" },
              { v: "ACOMPTE", l: "Acompte", desc: "Versement partiel" },
              { v: "PAYE", l: "Payé", desc: "Montant total versé" },
            ] as { v: PaymentStatus; l: string; desc: string }[]
          ).map(({ v, l, desc }) => (
            <label
              key={v}
              className={`cursor-pointer rounded-lg border p-3 transition ${
                paymentStatus === v
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface-2 hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="paymentStatus"
                value={v}
                checked={paymentStatus === v}
                onChange={() => setPaymentStatus(v)}
                className="sr-only"
              />
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Banknote className="h-4 w-4 text-primary" />
                {l}
              </div>
              <div className="text-[11px] text-foreground-muted mt-1">{desc}</div>
            </label>
          ))}
        </div>
        {paymentStatus === "ACOMPTE" && (
          <div className="mt-3">
            <FieldStatic
              label="Montant de l'acompte versé (€ TTC)"
              name="paidAmount"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="50.00"
            />
            <p className="text-[11px] text-foreground-muted mt-1.5">
              Le reste à payer (= devis − acompte) sera calculé automatiquement
              et imprimé sur le ticket.
            </p>
          </div>
        )}
      </Section>

      <Section title="Notes internes">
        <TextareaStatic label="Notes (non visibles côté client)" name="internalNotes" rows={3} />
      </Section>

      <div className="flex justify-end">
        <SubmitButton isDevis={isDevis} />
      </div>
    </form>
  );
}

/**
 * Bouton submit avec état "pending" géré par useFormStatus.
 * Pendant la soumission, le bouton est désactivé + affiche un spinner.
 * Critique pour éviter les doublons par double-clic — le bug le plus
 * fréquent en formulaire admin (impatience + connexion lente).
 */
function SubmitButton({ isDevis }: { isDevis: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-strong disabled:bg-primary/60 disabled:cursor-wait text-white rounded-lg font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {isDevis ? "Enregistrement…" : "Création…"}
        </>
      ) : isDevis ? (
        <>
          <FileText className="h-4 w-4" />
          Enregistrer le devis
        </>
      ) : (
        <>
          <Wrench className="h-4 w-4" />
          Créer & imprimer les tickets
        </>
      )}
    </button>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h2 className="font-extrabold tracking-tight mb-4">{title}</h2>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-3">{children}</div>;
}

// Dropdown de suggestions de clients, affichée sous un champ d'input
function SuggestionsList({
  suggestions,
  onPick,
}: {
  suggestions: ClientSuggestion[];
  onPick: (c: ClientSuggestion) => void;
}) {
  return (
    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 bg-surface border border-border rounded-lg shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
      <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-foreground-muted bg-surface-2 border-b border-border font-semibold">
        {suggestions.length} client{suggestions.length > 1 ? "s" : ""} trouvé
        {suggestions.length > 1 ? "s" : ""}
      </div>
      {suggestions.map((c) => (
        <button
          key={c.id}
          type="button"
          onMouseDown={(e) => {
            // mouseDown devance le onBlur pour que le pick aboutisse
            e.preventDefault();
            onPick(c);
          }}
          className="w-full text-left px-3 py-2 hover:bg-surface-2 border-b border-border last:border-b-0 transition flex items-center gap-3"
        >
          <div className="h-8 w-8 grid place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate">{c.fullName}</div>
            <div className="text-xs text-foreground-muted truncate">
              {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// Champ contrôlé (lié à React state) — conservé pour usages futurs
function Field({
  label,
  name,
  type = "text",
  required,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </label>
  );
}

// Champ non contrôlé (uncontrolled, pour les champs sans état)
function FieldStatic({
  label,
  name,
  type = "text",
  required,
  step,
  min,
  placeholder,
  listId,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  step?: string;
  min?: string;
  placeholder?: string;
  listId?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        step={step}
        min={min}
        placeholder={placeholder}
        list={listId}
        className={inputCls}
      />
    </label>
  );
}

function SelectStatic({
  label,
  name,
  required,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      <select name={name} required={required} className={inputCls}>
        {children}
      </select>
    </label>
  );
}

function TextareaStatic({
  label,
  name,
  rows = 3,
  required,
}: {
  label: string;
  name: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block mt-3">
      <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      <textarea name={name} rows={rows} required={required} className={inputCls} />
    </label>
  );
}
