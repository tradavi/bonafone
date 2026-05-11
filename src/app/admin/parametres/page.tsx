import {
  Settings,
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Map,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Save,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Music2,
  Store,
  Share2,
  KeyRound,
  CreditCard,
  Send,
  MessageSquare,
  LogIn,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  getStoreSettings,
  getStoreApiKeysStatus,
} from "@/lib/store-settings";
import { isEncryptionConfigured } from "@/lib/encryption";
import { updateStoreSettings, sendTestEmail, sendTestSms } from "@/lib/actions/settings";
import { auth } from "@/auth";
import { PushTestButton } from "@/components/admin/push-test-button";
import { PushToggle } from "@/components/admin/push-toggle";

export const metadata = { title: "Paramètres" };
export const dynamic = "force-dynamic";

const inputCls =
  "w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle";

type Props = {
  searchParams: Promise<{
    updated?: string;
    error?: string;
    testEmail?: "ok" | "error";
    testSms?: "ok" | "error";
    msg?: string;
    to?: string;
  }>;
};

export default async function AdminSettingsPage({ searchParams }: Props) {
  const { updated, error, testEmail, testSms, msg, to } = await searchParams;
  const settings = await getStoreSettings();
  const keyStatus = await getStoreApiKeysStatus();
  const callbackBase = process.env.AUTH_URL ?? "http://localhost:3000";
  const encryptionOn = isEncryptionConfigured();
  const session = await auth();
  const adminEmail = session?.user?.email ?? "";

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-extrabold tracking-tight">Paramètres</h1>
        </div>
        <p className="text-sm text-foreground-muted">
          Configuration du magasin et clés API des intégrations externes.
        </p>
      </div>

      {error && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-sm flex items-center gap-2 text-primary">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {updated && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-sm flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Paramètres enregistrés.
        </div>
      )}
      {testEmail === "ok" && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-sm flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          ✉️ Email de test envoyé à <strong>{to}</strong>. Vérifie ta boîte de réception (et les spams).
        </div>
      )}
      {testEmail === "error" && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-sm flex items-start gap-2 text-primary">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <strong>Échec de l&apos;envoi email.</strong> {msg ? <span className="text-foreground-muted">{msg}</span> : null}
          </div>
        </div>
      )}
      {testSms === "ok" && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-sm flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          📱 SMS de test envoyé à <strong>{to}</strong>.
        </div>
      )}
      {testSms === "error" && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-sm flex items-start gap-2 text-primary">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <strong>Échec de l&apos;envoi SMS.</strong> {msg ? <span className="text-foreground-muted">{msg}</span> : null}
          </div>
        </div>
      )}

      <form action={updateStoreSettings} className="space-y-5">
        {/* Identité & coordonnées */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-extrabold tracking-tight mb-1 flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            Identité & coordonnées
          </h2>
          <p className="text-xs text-foreground-muted mb-4">
            Ces informations apparaissent dans le footer, le top-bar, la page contact, les emails
            et les tickets.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nom du magasin" name="name" defaultValue={settings.name} />
            <Field label="Slogan" name="tagline" defaultValue={settings.tagline} />
            <Field
              label="Téléphone"
              name="phone"
              defaultValue={settings.phone}
              icon={Phone}
              type="tel"
            />
            <Field
              label="Email"
              name="email"
              defaultValue={settings.email}
              icon={Mail}
              type="email"
            />
            <Field
              label="Adresse"
              name="address"
              defaultValue={settings.address}
              icon={MapPin}
              className="md:col-span-2"
            />
            <Field
              label="Horaires"
              name="hours"
              defaultValue={settings.hours}
              icon={Clock}
              placeholder="Lun-Sam 10h-18h30"
            />
            <Field
              label="WhatsApp (numéro international, sans +)"
              name="whatsapp"
              defaultValue={settings.whatsapp}
              icon={MessageCircle}
              placeholder="32477000000"
            />
            <Field
              label="Lien Google Maps"
              name="gmaps"
              defaultValue={settings.gmaps}
              icon={Map}
              type="url"
              placeholder="https://maps.google.com/..."
              className="md:col-span-2"
            />
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-extrabold tracking-tight mb-1 flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            Réseaux sociaux
          </h2>
          <p className="text-xs text-foreground-muted mb-4">
            Liens visibles dans le footer du site. Laissez vide pour masquer l&apos;icône.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Facebook" name="facebook" defaultValue={settings.facebook} icon={Facebook} type="url" placeholder="https://facebook.com/votrepage" />
            <Field label="Instagram" name="instagram" defaultValue={settings.instagram} icon={Instagram} type="url" placeholder="https://instagram.com/votrepage" />
            <Field label="TikTok" name="tiktok" defaultValue={settings.tiktok} icon={Music2} type="url" placeholder="https://tiktok.com/@votrecompte" />
            <Field label="YouTube" name="youtube" defaultValue={settings.youtube} icon={Youtube} type="url" placeholder="https://youtube.com/@votrechaine" />
            <Field label="LinkedIn" name="linkedin" defaultValue={settings.linkedin} icon={Linkedin} type="url" placeholder="https://linkedin.com/company/..." />
            <Field label="X / Twitter" name="twitter" defaultValue={settings.twitter} icon={Twitter} type="url" placeholder="https://x.com/votrecompte" />
          </div>
        </div>

        {/* Clés API */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-extrabold tracking-tight mb-1 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Clés API & intégrations
          </h2>
          <p className="text-xs text-foreground-muted mb-3">
            Configurées en DB, prioritaires sur les variables d&apos;environnement. Laissez un
            champ <strong>vide pour ne pas modifier</strong> la clé existante. Le champ
            n&apos;affiche jamais la valeur actuelle (sécurité).
          </p>

          {/* Bandeau chiffrement */}
          {encryptionOn ? (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
              <div>
                <div className="font-semibold text-emerald-400">
                  Chiffrement-at-rest actif
                </div>
                <div className="text-xs text-foreground-muted">
                  Les clés sont chiffrées avec AES-256-GCM via{" "}
                  <code className="px-1 rounded bg-surface-2">SECRETS_ENCRYPTION_KEY</code>{" "}
                  avant stockage. Les valeurs déjà en clair seront ré-chiffrées au prochain
                  enregistrement.
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/40 rounded-lg flex items-start gap-2 text-sm">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-amber-400" />
              <div>
                <div className="font-semibold text-amber-400">
                  Chiffrement-at-rest désactivé
                </div>
                <div className="text-xs text-foreground-muted">
                  Les clés sont stockées en clair en DB. Pour activer AES-256-GCM,
                  définissez{" "}
                  <code className="px-1 rounded bg-surface-2">SECRETS_ENCRYPTION_KEY</code>{" "}
                  dans <code className="px-1 rounded bg-surface-2">.env</code>{" "}
                  (32 octets, hex 64 chars / base64 / phrase libre dérivée par scrypt) puis
                  redémarrez. Les clés existantes seront ré-chiffrées au prochain
                  enregistrement.
                </div>
              </div>
            </div>
          )}

          <ApiBlock
            icon={CreditCard}
            title="Stripe (paiement)"
            statusOk={keyStatus.stripeSecretKey}
            description="Sans clé, le checkout passe en mode démo (commande marquée PAID directement)."
          >
            <SecretField
              label="Secret key (sk_…)"
              name="stripeSecretKey"
              hasValue={keyStatus.stripeSecretKey}
            />
            <SecretField
              label="Public key (pk_…)"
              name="stripePublicKey"
              hasValue={keyStatus.stripePublicKey}
            />
            <SecretField
              label="Webhook signing secret (whsec_…)"
              name="stripeWebhookSecret"
              hasValue={keyStatus.stripeWebhookSecret}
            />
          </ApiBlock>

          <ApiBlock
            icon={Send}
            title="Brevo (emails transactionnels)"
            statusOk={keyStatus.brevoApiKey && keyStatus.brevoFromEmail}
            description="Sans clé, les emails sont loggés en console (pas envoyés)."
          >
            <SecretField
              label="API key"
              name="brevoApiKey"
              hasValue={keyStatus.brevoApiKey}
            />
            <Field
              label="Email expéditeur"
              name="brevoFromEmail"
              type="email"
              defaultValue=""
              placeholder={
                keyStatus.brevoFromEmail
                  ? "•••• déjà configuré (laisser vide pour ne pas changer)"
                  : "noreply@bonafone.com"
              }
            />
          </ApiBlock>

          <ApiBlock
            icon={MessageSquare}
            title="Twilio (SMS de suivi)"
            statusOk={
              keyStatus.twilioAccountSid &&
              keyStatus.twilioAuthToken &&
              keyStatus.twilioFromNumber
            }
            description="Sans clés, les SMS sont loggés en console (pas envoyés)."
          >
            <SecretField
              label="Account SID"
              name="twilioAccountSid"
              hasValue={keyStatus.twilioAccountSid}
            />
            <SecretField
              label="Auth token"
              name="twilioAuthToken"
              hasValue={keyStatus.twilioAuthToken}
            />
            <Field
              label="Numéro expéditeur (+32...)"
              name="twilioFromNumber"
              type="tel"
              defaultValue=""
              placeholder={
                keyStatus.twilioFromNumber
                  ? "•••• déjà configuré (laisser vide pour ne pas changer)"
                  : "+32...."
              }
            />
          </ApiBlock>

          <ApiBlock
            icon={Map}
            title="Google Maps (carte page contact)"
            statusOk={keyStatus.googleMapsApiKey}
            description="Sans clé, la carte affiche un placeholder embed. Activez l'API « Maps Embed API » sur votre projet Google Cloud."
          >
            <SecretField
              label="API key"
              name="googleMapsApiKey"
              hasValue={keyStatus.googleMapsApiKey}
            />
          </ApiBlock>

          <ApiBlock
            icon={LogIn}
            title="OAuth Google (connexion sociale)"
            statusOk={keyStatus.googleClientId && keyStatus.googleClientSecret}
            description={`Sans clé, le bouton « Continuer avec Google » est masqué. URL de callback à déclarer côté Google Cloud : ${callbackBase}/api/auth/callback/google`}
          >
            <SecretField
              label="Client ID"
              name="googleClientId"
              hasValue={keyStatus.googleClientId}
            />
            <SecretField
              label="Client Secret"
              name="googleClientSecret"
              hasValue={keyStatus.googleClientSecret}
            />
          </ApiBlock>

          <ApiBlock
            icon={LogIn}
            title="OAuth Facebook (connexion sociale)"
            statusOk={keyStatus.facebookClientId && keyStatus.facebookClientSecret}
            description={`Sans clé, le bouton « Continuer avec Facebook » est masqué. URL de callback à déclarer côté Facebook Developers : ${callbackBase}/api/auth/callback/facebook`}
          >
            <SecretField
              label="App ID"
              name="facebookClientId"
              hasValue={keyStatus.facebookClientId}
            />
            <SecretField
              label="App Secret"
              name="facebookClientSecret"
              hasValue={keyStatus.facebookClientSecret}
            />
          </ApiBlock>

        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-bold transition shadow-[0_0_24px_var(--primary-glow)]"
          >
            <Save className="h-4 w-4" />
            Enregistrer les paramètres
          </button>
        </div>
      </form>

      {/* Tests d'envoi — séparé du form principal pour ne pas déclencher updateStoreSettings */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div>
          <div className="font-extrabold tracking-tight mb-1 flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            Tester les notifications
          </div>
          <p className="text-xs text-foreground-muted">
            Après avoir enregistré les clés, vérifie que l&apos;envoi fonctionne en
            envoyant un email/SMS de test à toi-même.
          </p>
        </div>

        {/* Test email */}
        <form
          action={sendTestEmail}
          className="grid sm:grid-cols-[1fr_auto] gap-2 items-end"
        >
          <div>
            <label className="block text-xs text-foreground-muted mb-1">
              Destinataire de test (email)
            </label>
            <input
              name="testTo"
              type="email"
              defaultValue={adminEmail}
              placeholder="votre@email.com"
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={!keyStatus.brevoApiKey || !keyStatus.brevoFromEmail}
            title={
              !keyStatus.brevoApiKey || !keyStatus.brevoFromEmail
                ? "Configure d'abord Brevo (clé API + email expéditeur)"
                : ""
            }
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_18px_var(--primary-glow)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Send className="h-4 w-4" />
            Envoyer un email test
          </button>
        </form>

        {/* Test SMS */}
        <form
          action={sendTestSms}
          className="grid sm:grid-cols-[1fr_auto] gap-2 items-end"
        >
          <div>
            <label className="block text-xs text-foreground-muted mb-1">
              Destinataire de test (SMS, format +32…)
            </label>
            <input
              name="testTo"
              type="tel"
              placeholder="+32477112233"
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={
              !keyStatus.twilioAccountSid ||
              !keyStatus.twilioAuthToken ||
              !keyStatus.twilioFromNumber
            }
            title={
              !keyStatus.twilioAccountSid ||
              !keyStatus.twilioAuthToken ||
              !keyStatus.twilioFromNumber
                ? "Configure d'abord Twilio (SID + token + numéro)"
                : ""
            }
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-surface-2 border border-border hover:border-primary text-foreground rounded-lg text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MessageSquare className="h-4 w-4" />
            Envoyer un SMS test
          </button>
        </form>

        {/* Test Push — navigateur, indépendant de Brevo/Twilio */}
        <div className="pt-4 mt-2 border-t border-border space-y-2">
          <div className="text-xs text-foreground-muted">
            Notifications navigateur (Web Push) — fonctionnent même onglet fermé,
            sur ordinateur et mobile.
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <PushToggle compact={false} />
            <PushTestButton />
          </div>
        </div>
      </div>

    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  icon: Icon,
  type = "text",
  placeholder,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  icon?: React.ComponentType<{ className?: string }>;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs text-foreground-muted mb-1 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  );
}

function SecretField({
  label,
  name,
  hasValue,
  className = "",
}: {
  label: string;
  name: string;
  hasValue: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs text-foreground-muted mb-1 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5" />
          {label}
        </span>
        {hasValue && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Configurée
          </span>
        )}
      </label>
      <input
        name={name}
        type="password"
        autoComplete="new-password"
        defaultValue=""
        placeholder={
          hasValue
            ? "•••• laisser vide pour ne pas changer"
            : "Coller la clé ici"
        }
        className={inputCls}
      />
    </div>
  );
}

function ApiBlock({
  icon: Icon,
  title,
  statusOk,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  statusOk: boolean;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mt-4 first:mt-0 border rounded-xl p-4 ${
        statusOk
          ? "bg-emerald-500/5 border-emerald-500/30"
          : "bg-surface-2 border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <div className="flex items-center gap-2 font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </div>
        {statusOk ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Activée
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground-muted">
            <XCircle className="h-3.5 w-3.5" />
            Inactive
          </span>
        )}
      </div>
      <p className="text-xs text-foreground-muted mb-3">{description}</p>
      <div className="grid md:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

