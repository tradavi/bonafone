import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice, priceBreakdown, VAT_RATE, STORE, formatDate } from "@/lib/utils";
import { LogoImage } from "@/components/ui/logo";
import { PrintButton } from "./print-button";

type Props = { params: Promise<{ ref: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { ref } = await params;
  return { title: `Devis ${ref}` };
}

export default async function DevisPrintPage({ params }: Props) {
  const { ref } = await params;
  const repair = await prisma.repair.findUnique({
    where: { number: ref },
    include: { parts: true },
  });
  if (!repair) notFound();

  // Tous les montants stockés sont TTC — on décompose pour l'affichage légal.
  const partsTotalTtc = repair.parts.reduce((sum, p) => sum + p.cost, 0);
  const totalTtc = repair.estimatedCost ?? 0;
  const laborTtc = Math.max(0, totalTtc - partsTotalTtc);
  const totals = priceBreakdown(totalTtc);
  // Date d'édition du devis — fuseau Bruxelles forcé (Vercel tourne en UTC).
  const today = formatDate(new Date());

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 18mm; }
          body { background: white !important; color: #000 !important; }
          .no-print { display: none !important; }
          .print-page { padding: 0 !important; box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="bg-white text-zinc-900 min-h-screen py-8 px-4 print:bg-white">
        {/* Bouton imprimer (caché à l'impression) */}
        <div className="no-print max-w-[800px] mx-auto mb-4 flex justify-end gap-2">
          <PrintButton />
        </div>

        <div className="print-page max-w-[800px] mx-auto bg-white border border-zinc-200 rounded-lg shadow-sm p-10">
          {/* Header — logo officiel (image PNG incluant wordmark + tagline)
              + adresse a droite, alignes verticalement au centre */}
          <div className="flex items-center justify-between pb-6 border-b-2 border-[#ff2d3a] gap-4 flex-wrap">
            <LogoImage className="h-14 w-auto" />
            <div className="text-right text-xs text-zinc-600 leading-relaxed">
              <div>{STORE.address}</div>
              <div>Tél : {STORE.phone}</div>
              <div>Email : {STORE.email}</div>
            </div>
          </div>

          {/* Title */}
          <div className="flex items-baseline justify-between mt-8 mb-6">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
              DEVIS
            </h1>
            <div className="text-right">
              <div className="font-mono text-lg font-bold text-[#ff2d3a]">
                {repair.number}
              </div>
              <div className="text-xs text-zinc-500">Édité le {today}</div>
            </div>
          </div>

          {/* Client + Appareil */}
          <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">
                Client
              </div>
              <div className="font-semibold">{repair.customerName}</div>
              <div className="text-zinc-600">{repair.customerEmail}</div>
              <div className="text-zinc-600">{repair.customerPhone}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">
                Appareil
              </div>
              <div className="font-semibold">
                {repair.brand} {repair.model}
              </div>
              <div className="text-zinc-600 capitalize">
                {repair.deviceType.toLowerCase().replace(/_/g, " ")}
              </div>
              {repair.imei && (
                <div className="text-zinc-500 text-xs">IMEI : {repair.imei}</div>
              )}
            </div>
          </div>

          {/* Diagnostic */}
          <div className="mb-8">
            <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">
              Diagnostic
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-sm">
              <div className="font-semibold mb-1">{repair.issueType}</div>
              <p className="text-zinc-700 whitespace-pre-line">{repair.issueDescription}</p>
            </div>
          </div>

          {/* Détail des coûts — colonnes HT et TTC, TVA totale en bas */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-zinc-300 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="py-2 font-semibold">Désignation</th>
                <th className="py-2 font-semibold text-right">HT</th>
                <th className="py-2 font-semibold text-right">TTC</th>
              </tr>
            </thead>
            <tbody>
              {repair.parts.length === 0 ? (
                <tr className="border-b border-zinc-200">
                  <td className="py-3">Pièces (à définir)</td>
                  <td className="py-3 text-right text-zinc-400">—</td>
                  <td className="py-3 text-right text-zinc-400">—</td>
                </tr>
              ) : (
                repair.parts.map((p) => {
                  const b = priceBreakdown(p.cost);
                  return (
                    <tr key={p.id} className="border-b border-zinc-200">
                      <td className="py-3">
                        <div className="font-medium">{p.name}</div>
                        {p.supplier && (
                          <div className="text-xs text-zinc-500">{p.supplier}</div>
                        )}
                      </td>
                      <td className="py-3 text-right font-mono">{formatPrice(b.ht)}</td>
                      <td className="py-3 text-right font-mono">{formatPrice(b.ttc)}</td>
                    </tr>
                  );
                })
              )}
              {laborTtc > 0 && (() => {
                const b = priceBreakdown(laborTtc);
                return (
                  <tr className="border-b border-zinc-200">
                    <td className="py-3">
                      <div className="font-medium">Main d&apos;œuvre</div>
                      <div className="text-xs text-zinc-500">
                        Démontage, réparation, tests, remontage
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono">{formatPrice(b.ht)}</td>
                    <td className="py-3 text-right font-mono">{formatPrice(b.ttc)}</td>
                  </tr>
                );
              })()}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-300 text-sm">
                <td className="py-2 font-semibold">Sous-total HT</td>
                <td colSpan={2} className="py-2 text-right font-mono font-semibold">
                  {formatPrice(totals.ht)}
                </td>
              </tr>
              <tr className="text-sm text-zinc-600">
                <td className="py-1.5">TVA {(VAT_RATE * 100).toFixed(0)} %</td>
                <td colSpan={2} className="py-1.5 text-right font-mono">
                  {formatPrice(totals.vat)}
                </td>
              </tr>
              <tr className="border-t-2 border-zinc-400">
                <td className="py-3 font-bold text-base">TOTAL TTC</td>
                <td colSpan={2} className="py-3 text-right text-2xl font-black text-[#ff2d3a] font-mono">
                  {formatPrice(totals.ttc)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Conditions */}
          <div className="mt-8 p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-600 space-y-1">
            <div className="font-semibold text-zinc-700">Conditions</div>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Devis valable 30 jours à compter de la date d&apos;édition.</li>
              <li>Garantie 6 mois sur les pièces et la main d&apos;œuvre.</li>
              <li>
                Si l&apos;appareil est jugé irréparable après diagnostic, aucun frais
                n&apos;est facturé.
              </li>
              <li>
                Le client autorise Bonafone à effectuer la réparation après acceptation
                de ce devis.
              </li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-10 mt-12 pt-6 text-xs">
            <div>
              <div className="font-semibold mb-12 text-zinc-700">
                Bon pour accord — Client
              </div>
              <div className="border-t border-zinc-300 pt-1 text-zinc-500">
                Date et signature
              </div>
            </div>
            <div>
              <div className="font-semibold mb-12 text-zinc-700">Bonafone</div>
              <div className="border-t border-zinc-300 pt-1 text-zinc-500">
                Cachet et signature
              </div>
            </div>
          </div>

          <div className="mt-10 text-center text-[10px] text-zinc-400">
            {STORE.name} · {STORE.address}
          </div>
        </div>
      </div>
    </>
  );
}
