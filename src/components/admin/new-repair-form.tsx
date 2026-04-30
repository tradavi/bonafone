"use client";

import { useEffect, useRef, useState } from "react";
import { Save, UserCheck, X, Search } from "lucide-react";
import { createRepairAdmin } from "@/lib/actions/admin";

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
const COMMON_BRANDS = [
  "Apple",
  "Samsung",
  "Huawei",
  "Xiaomi",
  "Google",
  "OnePlus",
  "Oppo",
  "Sony",
  "Nokia",
  "Motorola",
  "Honor",
  "Realme",
  "ASUS",
  "Lenovo",
  "Microsoft",
  "Acer",
  "HP",
  "Dell",
  "Alcatel",
  "TCL",
  "Vivo",
  "Wiko",
  "Crosscall",
  "Fairphone",
  "Doro",
];

type ClientSuggestion = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
};

export function NewRepairForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedClient, setLinkedClient] = useState<ClientSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autocomplétion : déclenchée à chaque frappe (>= 2 chars), debounce 200ms
  useEffect(() => {
    if (linkedClient) return; // déjà rattaché
    if (name.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/clients/search?q=${encodeURIComponent(name)}`,
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
  }, [name, linkedClient]);

  function pickClient(c: ClientSuggestion) {
    setLinkedClient(c);
    setName(c.fullName);
    setEmail(c.email ?? "");
    setPhone(c.phone ?? "");
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function unlinkClient() {
    setLinkedClient(null);
  }

  return (
    <form action={createRepairAdmin} className="space-y-5">
      {linkedClient && <input type="hidden" name="clientId" value={linkedClient.id} />}

      <Section title="Client">
        {linkedClient ? (
          <div className="flex items-center justify-between gap-3 p-4 bg-emerald-500/5 border border-emerald-500/30 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 grid place-items-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold truncate">{linkedClient.fullName}</div>
                <div className="text-xs text-foreground-muted truncate">
                  {[linkedClient.email, linkedClient.phone].filter(Boolean).join(" · ") ||
                    "Compte client existant"}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={unlinkClient}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border hover:border-primary rounded-lg text-xs font-semibold transition"
            >
              <X className="h-3.5 w-3.5" />
              Détacher
            </button>
          </div>
        ) : (
          <div className="relative">
            <Grid>
              <div className="md:col-span-2 relative">
                <label className="block">
                  <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
                    Nom complet <span className="text-primary">*</span>
                    <span className="text-foreground-subtle font-normal ml-1.5">
                      (recherche dans les comptes clients)
                    </span>
                  </span>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                    <input
                      name="customerName"
                      required
                      autoComplete="off"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => {
                        // léger délai pour permettre le click sur une suggestion
                        setTimeout(() => setShowSuggestions(false), 150);
                      }}
                      placeholder="Tapez le nom du client…"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </label>

                {showSuggestions && suggestions.length > 0 && (
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
                          // mouseDown pour devancer le onBlur
                          e.preventDefault();
                          pickClient(c);
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
                )}
              </div>

              <Field
                label="Téléphone"
                name="customerPhone"
                type="tel"
                required
                value={phone}
                onChange={setPhone}
              />
              <Field
                label="Email (optionnel)"
                name="customerEmail"
                type="email"
                value={email}
                onChange={setEmail}
              />
              <SelectStatic label="Mode de contact" name="contactPref">
                {CONTACT_PREFS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </SelectStatic>
            </Grid>
            <p className="text-xs text-foreground-muted mt-2">
              💡 Si vous tapez un nom déjà connu, sélectionnez-le pour rattacher le dossier au compte.
              L&apos;email reste optionnel — le suivi se fera par téléphone si manquant.
            </p>
          </div>
        )}
      </Section>

      {linkedClient && (
        <Section title="Coordonnées (modifiables)">
          <Grid>
            <Field
              label="Téléphone"
              name="customerPhone"
              type="tel"
              required
              value={phone}
              onChange={setPhone}
            />
            <Field
              label="Email (optionnel)"
              name="customerEmail"
              type="email"
              value={email}
              onChange={setEmail}
            />
            <SelectStatic label="Mode de contact" name="contactPref">
              {CONTACT_PREFS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </SelectStatic>
          </Grid>
        </Section>
      )}

      <Section title="Appareil">
        <Grid>
          <SelectStatic label="Type" name="deviceType" required>
            {DEVICE_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </SelectStatic>
          <FieldStatic label="IMEI / N° de série (optionnel)" name="imei" />
          <FieldStatic label="Marque" name="brand" required listId="brand-list" placeholder="Apple, Samsung…" />
          <datalist id="brand-list">
            {COMMON_BRANDS.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
          <FieldStatic label="Modèle" name="model" required placeholder="iPhone 13, Galaxy S23…" />
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
            label="Devis estimé (€)"
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

      <Section title="Notes internes">
        <TextareaStatic label="Notes (non visibles côté client)" name="internalNotes" rows={3} />
      </Section>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
        >
          <Save className="h-4 w-4" />
          Créer & imprimer les tickets
        </button>
      </div>
    </form>
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

// Champ contrôlé (lié à React state)
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
