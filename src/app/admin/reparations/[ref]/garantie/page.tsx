import { notFound } from "next/navigation";
import bwipjs from "bwip-js/node";
import { prisma } from "@/lib/prisma";
import { STORE, formatPrice, priceBreakdown } from "@/lib/utils";
import { AutoPrint, PrintButtons } from "@/components/admin/auto-print";

export const metadata = { title: "Garantie" };
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ print?: string }>;
};

const SITE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

// Durée de garantie standard : 1 an.
const WARRANTY_MONTHS = 12;

async function generateBarcodeSvg(text: string): Promise<string> {
  return bwipjs.toSVG({
    bcid: "code128",
    text,
    scale: 2,
    height: 14,
    includetext: false,
    paddingwidth: 0,
    paddingheight: 0,
  });
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function addMonths(d: Date, months: number): Date {
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
}

export default async function GarantiePage({ params, searchParams }: Props) {
  const { ref } = await params;
  const { print } = await searchParams;

  const repair = await prisma.repair.findUnique({
    where: { number: ref },
    include: {
      statusHistory: { orderBy: { createdAt: "desc" } },
      parts: { orderBy: { orderedAt: "asc" } },
    },
  });
  if (!repair) notFound();

  // Date de restitution = createdAt du dernier event status="RESTITUE".
  // Pas de field dédié dans le schema — on dérive depuis l'historique pour
  // éviter une migration. Si pas encore restitué, on prend la date du jour
  // (utile pour pré-imprimer la garantie au passage en PRET_RECUPERATION).
  const restitutionEvent = repair.statusHistory.find((e) => e.status === "RESTITUE");
  const restitutionDate = restitutionEvent?.createdAt ?? new Date();
  const warrantyEnd = addMonths(restitutionDate, WARRANTY_MONTHS);

  const barcode = await generateBarcodeSvg(repair.number);

  // Montant final TTC : finalCost si défini, sinon estimatedCost.
  const totalTtc = repair.finalCost ?? repair.estimatedCost ?? 0;
  const totals = priceBreakdown(totalTtc);

  // Main d'œuvre = total - somme(pièces). Si négatif (incohérence
  // budget vs pièces), on plafonne à 0.
  const partsTotalTtc = repair.parts.reduce((s, p) => s + p.cost, 0);
  const laborTtc = Math.max(0, totalTtc - partsTotalTtc);

  const trackUrl = `${SITE_URL}/reparations/suivi?ref=${repair.number}`;

  return (
    <>
      {print === "1" && <AutoPrint />}

      <style>{`
        .ticket, .ticket * { font-weight: 700 !important; }

        @media print {
          @page { size: 80mm auto; margin: 0; }
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
          }
          .no-print { display: none !important; }
          .ticket {
            width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            box-shadow: none !important;
            border: none !important;
            color: black !important;
            background: white !important;
            font-family: 'Courier New', monospace;
          }
          .ticket * { color: black !important; background: transparent !important; border-color: black !important; font-weight: 700 !important; }
          .ticket .barcode svg { width: 100% !important; height: auto !important; }
        }
      `}</style>

      <div className="bg-zinc-100 min-h-screen p-6 print:p-0 print:bg-white print:min-h-0">
        <div className="no-print mx-auto max-w-3xl mb-4 flex items-center justify-between">
          <a
            href={`/admin/reparations/${repair.number}`}
            className="text-sm text-foreground-muted hover:text-primary"
          >
            ← Retour au dossier
          </a>
          <PrintButtons />
        </div>

        <div className="mx-auto max-w-3xl">
          <div
            className="ticket bg-white text-black mx-auto rounded-lg shadow-lg border border-zinc-300 print:rounded-none print:shadow-none print:border-0 font-mono text-[14px] leading-snug"
            style={{ width: "80mm", padding: "4mm" }}
          >
            {/* Header magasin */}
            <div className="text-center border-b border-dashed border-black pb-2 mb-2">
              <div className="text-[18px] font-extrabold tracking-tight">{STORE.name}</div>
              <div className="text-[12px]">{STORE.tagline}</div>
              <div className="text-[12px] mt-1">{STORE.address}</div>
              <div className="text-[12px]">
                {STORE.phone} · {STORE.email}
              </div>
            </div>

            {/* Badge GARANTIE */}
            <div className="text-center mb-2">
              <div
                className="inline-block px-2 py-0.5 border border-black text-[12px] font-bold uppercase tracking-wider"
                style={{ borderRadius: 0 }}
              >
                Bon de garantie
              </div>
            </div>

            {/* Code-barres + numéro */}
            <div className="barcode my-2 text-center" dangerouslySetInnerHTML={{ __html: barcode }} />
            <div className="text-center text-[18px] font-extrabold tracking-widest mb-3">
              {repair.number}
            </div>

            {/* Période de garantie — mis en évidence */}
            <div
              className="border-2 border-black p-2 my-2 text-center"
              style={{ borderRadius: 0 }}
            >
              <div className="text-[11px] uppercase tracking-wider">Garantie valable</div>
              <div className="text-[15px] font-extrabold my-0.5">
                1 an
              </div>
              <div className="text-[12px]">
                Du {formatDate(restitutionDate)}
              </div>
              <div className="text-[12px]">
                au {formatDate(warrantyEnd)}
              </div>
            </div>

            {/* Client */}
            <div className="border-t border-dashed border-black pt-2 space-y-1">
              <Row label="Client" value={repair.customerName} />
              <Row label="Tél." value={repair.customerPhone} />
              {repair.customerEmail && <Row label="Email" value={repair.customerEmail} />}
            </div>

            {/* Appareil — sans le type (smartphone/tablette/…), juste marque + modèle */}
            <div className="border-t border-dashed border-black mt-2 pt-2 space-y-1">
              <Row label="Appareil" value={`${repair.brand} ${repair.model}`} />
              {repair.imei && <Row label="IMEI/SN" value={repair.imei} />}
            </div>

            {/* Intervention effectuée */}
            <div className="border-t border-dashed border-black mt-2 pt-2">
              <div className="text-[12px] font-bold uppercase tracking-wider mb-1">
                Intervention
              </div>
              <div className="text-[13px]">{repair.issueType}</div>
            </div>

            {/* Pièces remplacées */}
            {repair.parts.length > 0 && (
              <div className="border-t border-dashed border-black mt-2 pt-2">
                <div className="text-[12px] font-bold uppercase tracking-wider mb-1">
                  Pièces remplacées
                </div>
                <ul className="space-y-0.5">
                  {repair.parts.map((p) => (
                    <li key={p.id} className="flex justify-between gap-2 text-[12px]">
                      <span className="flex-1">• {p.name}</span>
                      <span className="whitespace-nowrap">{formatPrice(p.cost)}</span>
                    </li>
                  ))}
                  {laborTtc > 0 && (
                    <li className="flex justify-between gap-2 text-[12px]">
                      <span className="flex-1">• Main d&apos;œuvre</span>
                      <span className="whitespace-nowrap">{formatPrice(laborTtc)}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Totaux */}
            {totalTtc > 0 && (
              <div className="border-t border-dashed border-black mt-2 pt-2 space-y-0.5">
                <div className="flex justify-between text-[12px]">
                  <span>Sous-total HT</span>
                  <span>{formatPrice(totals.ht)}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span>TVA 21 %</span>
                  <span>{formatPrice(totals.vat)}</span>
                </div>
                <div className="flex justify-between text-[15px] font-extrabold border-t border-black pt-1 mt-1">
                  <span>TOTAL TTC</span>
                  <span>{formatPrice(totals.ttc)}</span>
                </div>
                <div className="text-[10px] text-center mt-1">Payé · TVA incluse</div>
              </div>
            )}

            {/* Date de restitution — phrase complete sur une ligne, leger
                espacement entre le label et la date (pas a l'extreme droite) */}
            <div className="border-t border-dashed border-black mt-2 pt-2 space-y-1">
              <div className="flex items-center gap-4">
                <div className="text-[12px] font-bold uppercase tracking-wider">
                  Restitué le
                </div>
                <div className="text-[13px]">{formatDate(restitutionDate)}</div>
              </div>
              {restitutionEvent?.comment && (
                <div className="text-[11px] mt-1 italic">{restitutionEvent.comment}</div>
              )}
            </div>

            {/* Conditions de garantie */}
            <div className="border-t border-dashed border-black mt-2 pt-2 text-[11px]">
              <div className="font-bold uppercase tracking-wider mb-1">Conditions</div>
              <ul className="space-y-0.5 list-none pl-0">
                <li>• Garantie 1 an sur pièces et main d&apos;œuvre.</li>
                <li>• Couvre les défauts liés à l&apos;intervention listée ci-dessus.</li>
                <li>• Exclus : casse, chute, oxydation post-réparation, usure normale.</li>
                <li>• Présenter ce ticket pour faire valoir la garantie.</li>
              </ul>
            </div>

            {/* Lien suivi */}
            <div className="border-t border-dashed border-black mt-2 pt-2 text-center text-[11px]">
              <div className="font-bold mb-1">SUIVI EN LIGNE</div>
              <div className="break-all">{trackUrl}</div>
            </div>

            {/* Footer */}
            <div className="text-center text-[11px] mt-3 pt-2 border-t border-dashed border-black">
              Merci de votre confiance · {STORE.hours}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="text-[12px] font-bold uppercase tracking-wider w-16 shrink-0">{label}</div>
      <div className="text-[13px] flex-1 break-words">{value}</div>
    </div>
  );
}
