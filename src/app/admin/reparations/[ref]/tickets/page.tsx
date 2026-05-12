import { notFound } from "next/navigation";
import bwipjs from "bwip-js/node";
import { getRepairByNumber } from "@/lib/queries";
import { STORE, formatDateTime } from "@/lib/utils";
import { AutoPrint, PrintButtons } from "@/components/admin/auto-print";

export const metadata = { title: "Tickets" };
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ print?: string }>;
};

const SITE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

async function generateBarcodeSvg(text: string): Promise<string> {
  // Code 128 — universel pour scanners de magasin.
  // Hauteur réduite pour s'adapter au format ticket de caisse 80mm.
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

export default async function TicketsPage({ params, searchParams }: Props) {
  const { ref } = await params;
  const { print } = await searchParams;
  const repair = await getRepairByNumber(ref);
  if (!repair) notFound();

  const barcode = await generateBarcodeSvg(repair.number);

  const trackUrl = `${SITE_URL}/reparations/suivi?ref=${repair.number}`;
  // Fuseau Bruxelles forcé (Vercel tourne en UTC) — sinon décalage 1-2h.
  const dropDate = formatDateTime(repair.depositedAt ?? repair.createdAt);

  return (
    <>
      {print === "1" && <AutoPrint />}

      {/* Styles dédiés impression : format ticket de caisse 80mm
          - Une seule colonne en print
          - Pas de header/footer du site
          - Saut de page entre les deux tickets pour les Zebra/réseau
      */}
      <style>{`
        /* Tickets en gras sur tout — écran et impression */
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
            page-break-after: always;
            font-family: 'Courier New', monospace;
          }
          .ticket:last-of-type { page-break-after: auto; }
          .ticket * { color: black !important; background: transparent !important; border-color: black !important; font-weight: 700 !important; }
          .ticket .barcode svg { width: 100% !important; height: auto !important; }
          /* Mode d'impression sélectif : on cache le ticket non concerné */
          body[data-print-mode="client"] .ticket-store { display: none !important; }
          body[data-print-mode="store"] .ticket-client { display: none !important; }
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

        <div className="mx-auto max-w-3xl space-y-6 print:space-y-0">
          <Ticket
            kind="client"
            repair={repair}
            dropDate={dropDate}
            trackUrl={trackUrl}
            barcodeSvg={barcode}
          />
          <Ticket
            kind="store"
            repair={repair}
            dropDate={dropDate}
            trackUrl={trackUrl}
            barcodeSvg={barcode}
          />
        </div>
      </div>
    </>
  );
}

type RepairForTicket = {
  number: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  deviceType: string;
  brand: string;
  model: string;
  imei: string | null;
  issueType: string;
  issueDescription: string;
  estimatedCost: number | null;
};

function Ticket({
  kind,
  repair,
  dropDate,
  trackUrl,
  barcodeSvg,
}: {
  kind: "client" | "store";
  repair: RepairForTicket;
  dropDate: string;
  trackUrl: string;
  barcodeSvg: string;
}) {
  const isClient = kind === "client";
  return (
    <div
      className={`ticket ${isClient ? "ticket-client" : "ticket-store"} bg-white text-black mx-auto rounded-lg shadow-lg border border-zinc-300 print:rounded-none print:shadow-none print:border-0 font-mono text-[14px] leading-snug`}
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

      {/* Type de ticket */}
      <div className="text-center mb-2">
        <div
          className="inline-block px-2 py-0.5 border border-black text-[12px] font-bold uppercase tracking-wider"
          style={{ borderRadius: 0 }}
        >
          {isClient ? "Reçu client" : "Ticket atelier"}
        </div>
      </div>

      {/* Code-barres */}
      <div className="barcode my-2 text-center" dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
      <div className="text-center text-[18px] font-extrabold tracking-widest mb-3">
        {repair.number}
      </div>

      <div className="border-t border-dashed border-black pt-2 space-y-1">
        <Row label="Date" value={dropDate} />
        <Row label="Client" value={repair.customerName} />
        <Row label="Tél." value={repair.customerPhone} />
        {repair.customerEmail && <Row label="Email" value={repair.customerEmail} />}
      </div>

      <div className="border-t border-dashed border-black mt-2 pt-2 space-y-1">
        <Row label="Marque" value={repair.brand} />
        <Row label="Model" value={repair.model} />
        {repair.imei && <Row label="IMEI/SN" value={repair.imei} />}
        <Row label="Panne" value={repair.issueType} />
      </div>

      {repair.issueDescription && (
        <div className="border-t border-dashed border-black mt-2 pt-2">
          <div className="text-[12px] font-bold uppercase tracking-wider">Description</div>
          <div className="text-[13px] mt-1 whitespace-pre-line">{repair.issueDescription}</div>
        </div>
      )}

      {isClient && repair.estimatedCost !== null && (
        <div className="border-t border-dashed border-black mt-2 pt-2 text-center">
          <div className="text-[12px] uppercase tracking-wider">Devis estimé</div>
          <div className="text-[20px] font-extrabold">
            {repair.estimatedCost.toFixed(2)} €
          </div>
          <div className="text-[11px]">À confirmer après diagnostic</div>
        </div>
      )}

      {isClient ? (
        <div className="border-t border-dashed border-black mt-2 pt-2 text-center text-[12px]">
          <div className="font-bold mb-1">SUIVRE MA RÉPARATION</div>
          <div className="break-all">{trackUrl}</div>
          <div className="mt-2">Conservez ce ticket — il sera demandé à la restitution.</div>
        </div>
      ) : (
        <div className="border-t border-dashed border-black mt-2 pt-2 text-center text-[12px]">
          <div className="font-bold mb-1">⚠ ATTACHER À L&apos;APPAREIL</div>
          <div>Vérifier avant restitution :</div>
          <div className="mt-1 grid grid-cols-2 gap-x-1 text-left text-[12px]">
            <span>☐ État du devis</span>
            <span>☐ Pièce(s) reçue(s)</span>
            <span>☐ Tests OK</span>
            <span>☐ Nettoyage</span>
          </div>
        </div>
      )}

      <div className="text-center text-[11px] mt-3 pt-2 border-t border-dashed border-black">
        Merci de votre confiance · {STORE.hours}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <div className="text-[12px] font-bold uppercase tracking-wider w-14 shrink-0">{label}</div>
      <div className="text-[13px] flex-1 break-words">{value}</div>
    </div>
  );
}
