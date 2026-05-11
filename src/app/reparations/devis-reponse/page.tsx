import Link from "next/link";
import { CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifyQuoteToken } from "@/lib/quote-token";
import { respondToQuote } from "@/lib/actions/quote-response";
import { formatPrice } from "@/lib/utils";

// =====================================================
// Page d'atterrissage des boutons "Valider / Refuser" du devis email
// =====================================================
// Conçue pour résister aux pré-fetches (Gmail, Outlook, antivirus) :
// arriver sur la page NE déclenche RIEN. Le client doit cliquer un bouton
// qui POST un server action pour effectuer la transition.

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Réponse à votre devis",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{
    ref?: string;
    t?: string;
    action?: "accept" | "refuse";
    status?:
      | "invalid"
      | "invalid-token"
      | "not-found"
      | "closed"
      | "accepted"
      | "refused"
      | "already-accepted"
      | "already-refused";
  }>;
};

export default async function DevisReponsePage({ searchParams }: Props) {
  const { ref, t, action, status } = await searchParams;

  // Erreurs de lien
  if (status === "invalid" || !ref || !t || !verifyQuoteToken(ref, t)) {
    return (
      <Shell>
        <Card icon={<AlertCircle className="h-10 w-10 text-amber-500" />} title="Lien invalide">
          <p>Ce lien ne semble pas valide ou est incomplet. Vérifiez l&apos;email reçu, ou contactez-nous directement.</p>
          <Back />
        </Card>
      </Shell>
    );
  }
  if (status === "invalid-token") {
    return (
      <Shell>
        <Card icon={<AlertCircle className="h-10 w-10 text-amber-500" />} title="Lien expiré ou modifié">
          <p>Le lien a été altéré ou n&apos;est plus valide. Contactez-nous pour qu&apos;on vous renvoie le devis.</p>
          <Back />
        </Card>
      </Shell>
    );
  }
  if (status === "not-found") {
    return (
      <Shell>
        <Card icon={<AlertCircle className="h-10 w-10 text-amber-500" />} title="Dossier introuvable">
          <p>Nous n&apos;avons pas retrouvé votre dossier de réparation. Contactez-nous pour qu&apos;on vous aide.</p>
          <Back />
        </Card>
      </Shell>
    );
  }

  // États finaux (après action)
  if (status === "accepted") {
    return (
      <Shell>
        <Card icon={<CheckCircle2 className="h-10 w-10 text-emerald-500" />} title="Devis validé">
          <p className="text-zinc-700">
            Merci ! Votre devis <Ref>{ref}</Ref> est validé. Notre atelier va
            commencer la réparation et vous tiendra informé des étapes par
            email.
          </p>
          <Back />
        </Card>
      </Shell>
    );
  }
  if (status === "refused") {
    return (
      <Shell>
        <Card icon={<XCircle className="h-10 w-10 text-rose-500" />} title="Devis refusé">
          <p className="text-zinc-700">
            Votre refus a été enregistré pour le dossier <Ref>{ref}</Ref>.
            Vous pouvez venir récupérer votre appareil non réparé en boutique.
            Aucun frais ne sera facturé.
          </p>
          <Back />
        </Card>
      </Shell>
    );
  }
  if (status === "already-accepted") {
    return (
      <Shell>
        <Card icon={<CheckCircle2 className="h-10 w-10 text-emerald-500" />} title="Devis déjà validé">
          <p className="text-zinc-700">
            Ce devis <Ref>{ref}</Ref> a déjà été validé. La réparation est en cours.
          </p>
          <Back />
        </Card>
      </Shell>
    );
  }
  if (status === "already-refused") {
    return (
      <Shell>
        <Card icon={<XCircle className="h-10 w-10 text-rose-500" />} title="Devis déjà refusé">
          <p className="text-zinc-700">
            Ce devis <Ref>{ref}</Ref> a déjà été refusé. Vous pouvez venir
            récupérer votre appareil en boutique.
          </p>
          <Back />
        </Card>
      </Shell>
    );
  }

  // Status "closed" → le dossier est dans un état qui ne permet plus la
  // réponse (ex: déjà passé en réparation, déjà restitué, etc.)
  if (status === "closed") {
    return (
      <Shell>
        <Card icon={<AlertCircle className="h-10 w-10 text-amber-500" />} title="Dossier déjà traité">
          <p className="text-zinc-700">
            Le dossier <Ref>{ref}</Ref> a déjà avancé et ne peut plus recevoir
            de réponse à ce devis. Contactez-nous si besoin.
          </p>
          <Back />
        </Card>
      </Shell>
    );
  }

  // Confirmation : charge le résumé puis affiche le formulaire avec
  // bouton Valider ou Refuser selon `action`.
  const repair = await prisma.repair.findUnique({
    where: { number: ref },
    select: {
      number: true,
      status: true,
      customerName: true,
      brand: true,
      model: true,
      issueType: true,
      estimatedCost: true,
    },
  });

  if (!repair) {
    return (
      <Shell>
        <Card icon={<AlertCircle className="h-10 w-10 text-amber-500" />} title="Dossier introuvable">
          <p>Nous n&apos;avons pas retrouvé ce dossier.</p>
          <Back />
        </Card>
      </Shell>
    );
  }

  // Si l'utilisateur arrive sur la page sans action → choix entre les deux
  // (cas où l'email a un lien sans &action= ou si l'utilisateur revient ici)
  const showAccept = action === "accept" || !action;
  const showRefuse = action === "refuse" || !action;
  const isAccept = action === "accept";
  const isRefuse = action === "refuse";

  return (
    <Shell>
      <Card
        icon={<FileText className="h-10 w-10 text-[#ff2d3a]" />}
        title={
          isAccept
            ? "Confirmer la validation du devis"
            : isRefuse
              ? "Confirmer le refus du devis"
              : "Votre devis"
        }
      >
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-1 text-sm text-zinc-800 my-4">
          <div>
            <span className="text-zinc-500">Dossier&nbsp;: </span>
            <span className="font-mono font-bold text-[#ff2d3a]">{repair.number}</span>
          </div>
          <div>
            <span className="text-zinc-500">Appareil&nbsp;: </span>
            <span className="font-semibold">{repair.brand} {repair.model}</span>
          </div>
          <div>
            <span className="text-zinc-500">Intervention&nbsp;: </span>
            {repair.issueType}
          </div>
          {repair.estimatedCost != null && (
            <div className="pt-2 mt-2 border-t border-zinc-200">
              <span className="text-zinc-500">Total TTC&nbsp;: </span>
              <span className="font-mono font-bold text-lg text-[#ff2d3a]">
                {formatPrice(repair.estimatedCost)}
              </span>
            </div>
          )}
        </div>

        {isAccept && (
          <>
            <p className="text-sm text-zinc-700">
              En cliquant sur <strong>Confirmer</strong>, vous autorisez Bonafone
              à effectuer la réparation aux conditions du devis. Vous recevrez
              un email à chaque étape (réception, fin, prêt à récupérer).
            </p>
            <form action={respondToQuote} className="mt-5 flex gap-2 flex-wrap">
              <input type="hidden" name="ref" value={ref} />
              <input type="hidden" name="token" value={t} />
              <input type="hidden" name="action" value="accept" />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmer la validation
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-zinc-300 hover:border-zinc-400 text-zinc-700 rounded-lg text-sm font-medium transition"
              >
                Annuler
              </Link>
            </form>
          </>
        )}

        {isRefuse && (
          <>
            <p className="text-sm text-zinc-700">
              En cliquant sur <strong>Confirmer le refus</strong>, vous indiquez
              que vous ne souhaitez pas faire réparer cet appareil. Vous pourrez
              venir le récupérer en boutique aux horaires d&apos;ouverture.
              <br />
              <span className="text-zinc-500 text-xs">Aucun frais ne vous sera facturé pour le diagnostic.</span>
            </p>
            <form action={respondToQuote} className="mt-5 flex gap-2 flex-wrap">
              <input type="hidden" name="ref" value={ref} />
              <input type="hidden" name="token" value={t} />
              <input type="hidden" name="action" value="refuse" />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition"
              >
                <XCircle className="h-4 w-4" />
                Confirmer le refus
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-zinc-300 hover:border-zinc-400 text-zinc-700 rounded-lg text-sm font-medium transition"
              >
                Annuler
              </Link>
            </form>
          </>
        )}

        {/* Pas d'action explicite → on propose les deux choix */}
        {!action && (
          <div className="mt-5 flex gap-2 flex-wrap">
            <a
              href={`/reparations/devis-reponse?ref=${encodeURIComponent(ref)}&t=${encodeURIComponent(t)}&action=accept`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              Valider le devis
            </a>
            <a
              href={`/reparations/devis-reponse?ref=${encodeURIComponent(ref)}&t=${encodeURIComponent(t)}&action=refuse`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition"
            >
              <XCircle className="h-4 w-4" />
              Refuser le devis
            </a>
          </div>
        )}
      </Card>
    </Shell>
  );
}

// --------------------------------------------------------
// UI helpers — design clair pour le client (cohérent avec emails)
// --------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[80vh] bg-zinc-50 py-12 px-4 text-zinc-900">
      <div className="max-w-xl mx-auto">{children}</div>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
          {title}
        </h1>
      </div>
      <div className="space-y-3 text-sm">{children}</div>
    </div>
  );
}

function Ref({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono font-bold text-[#ff2d3a]">{children}</span>
  );
}

function Back() {
  return (
    <div className="pt-4">
      <Link
        href="/"
        className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-zinc-300 hover:border-zinc-400 text-zinc-700 rounded-lg text-sm font-medium transition"
      >
        Retour au site
      </Link>
    </div>
  );
}
