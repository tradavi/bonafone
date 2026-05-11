import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { getAdminClientById } from "@/lib/queries";
import { updateClientAdmin } from "@/lib/actions/admin";
import { isSyntheticEmail } from "@/lib/synthetic-email";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const client = await getAdminClientById(id);
  const name =
    [client?.firstName, client?.lastName].filter(Boolean).join(" ") || "Client";
  return { title: `Modifier ${name}` };
}

export default async function EditClientPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  const client = await getAdminClientById(id);
  if (!client) notFound();

  const realEmail = isSyntheticEmail(client.email) ? "" : client.email;
  const fullName =
    [client.firstName, client.lastName].filter(Boolean).join(" ") || "Sans nom";

  return (
    <div className="space-y-4 max-w-3xl">
      <Link
        href={`/admin/clients/${client.id}`}
        className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-primary transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la fiche
      </Link>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">
          Modifier {fullName}
        </h1>
        <p className="text-sm text-foreground-muted">
          ID : <span className="font-mono text-xs">{client.id}</span>
        </p>
      </div>

      {error && (
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      <form action={updateClientAdmin} className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <input type="hidden" name="id" value={client.id} />

        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Prénom" name="firstName" required defaultValue={client.firstName ?? ""} />
          <Field label="Nom" name="lastName" required defaultValue={client.lastName ?? ""} />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Field
            label="Email"
            name="email"
            type="email"
            defaultValue={realEmail}
            placeholder="client@exemple.com"
            hint={
              isSyntheticEmail(client.email)
                ? "Aucun email réel — ajoutez-en un pour pouvoir envoyer un mot de passe"
                : undefined
            }
          />
          <Field label="Téléphone" name="phone" type="tel" defaultValue={client.phone ?? ""} />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
              Rôle <span className="text-primary">*</span>
            </span>
            <select name="role" defaultValue={client.role} className={inputCls}>
              <option value="CLIENT">Client</option>
              <option value="TECHNICIEN">Technicien</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href={`/admin/clients/${client.id}`}
            className="px-4 py-2 bg-surface-2 border border-border hover:border-primary rounded-lg text-sm font-semibold transition"
          >
            Annuler
          </Link>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_18px_var(--primary-glow)]"
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle";

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
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
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={inputCls}
      />
      {hint && <span className="text-[11px] text-foreground-subtle mt-1 block">{hint}</span>}
    </label>
  );
}
