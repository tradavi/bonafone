import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ph = (color: string, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' fill='${color}'/><text x='50%' y='50%' fill='white' font-family='Arial' font-size='28' font-weight='bold' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`,
  )}`;

async function main() {
  console.log("🌱 Seed Bonafone…");

  // ========== Comptes de test (admin + client) ==========
  const adminPwd = await bcrypt.hash("admin1234", 12);
  await prisma.user.upsert({
    where: { email: "admin@bonafone.com" },
    update: {},
    create: {
      email: "admin@bonafone.com",
      passwordHash: adminPwd,
      firstName: "Admin",
      lastName: "Bonafone",
      role: "ADMIN",
    },
  });
  const clientPwd = await bcrypt.hash("client1234", 12);
  const clientUser = await prisma.user.upsert({
    where: { email: "client@example.com" },
    update: {},
    create: {
      email: "client@example.com",
      passwordHash: clientPwd,
      firstName: "Client",
      lastName: "Test",
      role: "CLIENT",
      loyalty: { create: { points: 120 } },
    },
  });

  // ========== Marques ==========
  const brands = await Promise.all(
    [
      { name: "Apple", slug: "apple" },
      { name: "Samsung", slug: "samsung" },
      { name: "Huawei", slug: "huawei" },
      { name: "Xiaomi", slug: "xiaomi" },
      { name: "Google", slug: "google" },
      { name: "OnePlus", slug: "oneplus" },
      { name: "Oppo", slug: "oppo" },
      { name: "Anker", slug: "anker" },
    ].map((b) =>
      prisma.brand.upsert({
        where: { slug: b.slug },
        update: {},
        create: b,
      }),
    ),
  );
  const byName = Object.fromEntries(brands.map((b) => [b.name, b]));

  // ========== Produits ==========
  const products = [
    {
      slug: "iphone-15-pro-256",
      name: "iPhone 15 Pro 256 Go",
      description:
        "Le smartphone le plus puissant d'Apple avec puce A17 Pro, châssis titane et triple capteur 48 Mpx.",
      category: "SMARTPHONE",
      condition: "RECONDITIONNE",
      brandId: byName.Apple.id,
      price: 1229,
      stock: 8,
      isFeatured: true,
      badge: "Top vente",
      primaryImage: ph("#1f2937", "iPhone 15 Pro"),
    },
    {
      slug: "samsung-galaxy-s24",
      name: "Samsung Galaxy S24 128 Go",
      description: "Galaxy AI, écran Dynamic AMOLED 2X 6.2\", Snapdragon 8 Gen 3.",
      category: "SMARTPHONE",
      condition: "RECONDITIONNE",
      brandId: byName.Samsung.id,
      price: 899,
      originalPrice: 999,
      stock: 12,
      isFeatured: true,
      badge: "Promo",
      primaryImage: ph("#0066ff", "Galaxy S24"),
    },
    {
      slug: "ipad-air-m2",
      name: "iPad Air M2 128 Go Wi-Fi",
      description: "iPad Air avec puce M2, écran Liquid Retina 11\", compatible Apple Pencil Pro.",
      category: "TABLETTE",
      condition: "RECONDITIONNE",
      brandId: byName.Apple.id,
      price: 719,
      stock: 5,
      isFeatured: true,
      primaryImage: ph("#374151", "iPad Air M2"),
    },
    {
      slug: "iphone-13-occasion-grade-a",
      name: "iPhone 13 128 Go - Reconditionné",
      description:
        "iPhone 13 reconditionné, grade A : aucune trace d'usure visible. Garantie 12 mois.",
      category: "SMARTPHONE",
      condition: "RECONDITIONNE",
      grade: "A",
      brandId: byName.Apple.id,
      price: 449,
      originalPrice: 829,
      stock: 3,
      warrantyMonths: 12,
      badge: "Derniers articles",
      primaryImage: ph("#7c3aed", "iPhone 13 - A"),
    },
    {
      slug: "airpods-pro-2",
      name: "AirPods Pro 2 (USB-C)",
      description: "Réduction de bruit active, audio spatial, jusqu'à 6h d'autonomie.",
      category: "ACCESSOIRE",
      condition: "RECONDITIONNE",
      brandId: byName.Apple.id,
      price: 279,
      stock: 25,
      primaryImage: ph("#f97316", "AirPods Pro 2"),
    },
    {
      slug: "macbook-air-m2-occasion",
      name: "MacBook Air M2 - Occasion",
      description: "MacBook Air M2, 8 Go RAM, 256 Go SSD. Quelques traces d'usure légères.",
      category: "ORDINATEUR_PORTABLE",
      condition: "OCCASION",
      grade: "B",
      brandId: byName.Apple.id,
      price: 899,
      stock: 1,
      warrantyMonths: 6,
      primaryImage: ph("#059669", "MacBook Air"),
    },
    {
      slug: "samsung-tab-s9",
      name: "Galaxy Tab S9 256 Go",
      description: "Tablette premium avec écran AMOLED 11\" et S Pen inclus.",
      category: "TABLETTE",
      condition: "RECONDITIONNE",
      brandId: byName.Samsung.id,
      price: 949,
      stock: 7,
      primaryImage: ph("#0891b2", "Galaxy Tab S9"),
    },
    {
      slug: "chargeur-usb-c-65w",
      name: "Chargeur USB-C 65W",
      description: "Chargeur GaN compact, 3 ports, idéal voyage. Compatible PD 3.0.",
      category: "ACCESSOIRE",
      condition: "RECONDITIONNE",
      brandId: byName.Anker.id,
      price: 39,
      stock: 50,
      badge: "Nouveau",
      primaryImage: ph("#1e40af", "Chargeur 65W"),
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  // ========== Avis externes ==========
  const reviewsCount = await prisma.review.count();
  if (reviewsCount === 0) {
    await prisma.review.createMany({
      data: [
        {
          source: "GOOGLE",
          authorName: "Marie L.",
          rating: 5,
          comment:
            "Réparation impeccable de mon iPhone, écran changé en 1h. Très professionnel.",
          isFeatured: true,
        },
        {
          source: "FACEBOOK",
          authorName: "Karim B.",
          rating: 5,
          comment:
            "Boutique de confiance, prix corrects et conseils avisés. Je recommande !",
          isFeatured: true,
        },
        {
          source: "GOOGLE",
          authorName: "Sophie D.",
          rating: 4,
          comment:
            "Bon service, j'ai trouvé un Galaxy S24 reconditionné comme neuf.",
        },
        {
          source: "GOOGLE",
          authorName: "Yann P.",
          rating: 5,
          comment:
            "Diagnostic gratuit, devis honnête, batterie remplacée le jour même.",
          isFeatured: true,
        },
        {
          source: "FACEBOOK",
          authorName: "Aïcha B.",
          rating: 5,
          comment:
            "Service au top, équipe à l'écoute. Mon Galaxy a été réparé en moins de 24h.",
        },
        {
          source: "GOOGLE",
          authorName: "Pierre D.",
          rating: 5,
          comment:
            "Excellent rapport qualité/prix sur un iPhone reconditionné. Aucun défaut.",
        },
      ],
    });
  }

  // ========== Quelques réparations de démo ==========
  const repairsCount = await prisma.repair.count();
  if (repairsCount === 0) {
    await prisma.repair.createMany({
      data: [
        {
          number: "REP-2026-0458",
          userId: clientUser.id,
          customerName: "Client Test",
          customerEmail: "client@example.com",
          customerPhone: "+32 477 11 22 33",
          contactPref: "EMAIL",
          deviceType: "SMARTPHONE",
          brand: "Apple",
          model: "iPhone 14 Pro",
          issueType: "Écran cassé",
          issueDescription:
            "Écran fissuré suite à une chute. Tactile fonctionne mais affichage avec lignes verticales.",
          status: "ATTENTE_PIECE",
          estimatedCost: 219,
          createdAt: new Date("2026-04-15T10:30:00"),
        },
        {
          number: "REP-2026-0457",
          customerName: "Yann Martin",
          customerEmail: "yann.m@example.com",
          customerPhone: "+32 477 22 33 44",
          contactPref: "TELEPHONE",
          deviceType: "SMARTPHONE",
          brand: "Samsung",
          model: "Galaxy S24",
          issueType: "Batterie",
          issueDescription: "Batterie qui se décharge en 2h.",
          status: "EN_REPARATION",
          estimatedCost: 89,
          createdAt: new Date("2026-04-16T14:20:00"),
        },
        {
          number: "REP-2026-0456",
          customerName: "Sophie Durand",
          customerEmail: "sophie.d@example.com",
          customerPhone: "+32 477 33 44 55",
          contactPref: "WHATSAPP",
          deviceType: "TABLETTE",
          brand: "Apple",
          model: "iPad Air M2",
          issueType: "Connecteur",
          issueDescription: "Le connecteur USB-C ne charge plus correctement.",
          status: "DIAGNOSTIC",
          createdAt: new Date("2026-04-17T09:15:00"),
        },
        {
          number: "REP-2026-0455",
          customerName: "Pierre Dupont",
          customerEmail: "pierre.dupont@example.com",
          customerPhone: "+32 477 44 55 66",
          contactPref: "EMAIL",
          deviceType: "ORDINATEUR_PORTABLE",
          brand: "Apple",
          model: "MacBook Pro 14 (2023)",
          issueType: "Clavier",
          issueDescription: "Plusieurs touches qui se bloquent.",
          status: "DEVIS_VALIDE",
          estimatedCost: 350,
          createdAt: new Date("2026-04-14T16:45:00"),
        },
        {
          number: "REP-2026-0454",
          userId: clientUser.id,
          customerName: "Client Test",
          customerEmail: "client@example.com",
          customerPhone: "+32 477 55 66 77",
          contactPref: "EMAIL",
          deviceType: "SMARTPHONE",
          brand: "Apple",
          model: "iPhone 13",
          issueType: "Bouton power",
          issueDescription: "Bouton power difficile à enclencher.",
          status: "TERMINE",
          estimatedCost: 65,
          finalCost: 65,
          createdAt: new Date("2026-04-13T11:00:00"),
        },
      ],
    });

    // Ajouter quelques événements de statut sur le dossier de démo
    const demoRepair = await prisma.repair.findUnique({
      where: { number: "REP-2026-0458" },
    });
    if (demoRepair) {
      await prisma.repairStatusEvent.createMany({
        data: [
          { repairId: demoRepair.id, status: "RECU", comment: "Appareil réceptionné en boutique" },
          { repairId: demoRepair.id, status: "DIAGNOSTIC" },
          { repairId: demoRepair.id, status: "DEVIS_VALIDE", comment: "Devis approuvé par le client" },
          { repairId: demoRepair.id, status: "EN_REPARATION" },
          { repairId: demoRepair.id, status: "ATTENTE_PIECE", comment: "Écran OEM commandé chez le fournisseur — délai 2-3 jours" },
        ],
      });
    }
  }

  console.log("✅ Seed terminé.");
  console.log("");
  console.log("Comptes de test :");
  console.log("  👤 Admin  : admin@bonafone.com  / admin1234");
  console.log("  👤 Client : client@example.com  / client1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
