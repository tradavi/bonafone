import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

/**
 * Tags de cache cross-request — invalider via revalidateTag() après mutation.
 * Voir src/lib/actions/* pour les invalidations.
 */
export const CACHE_TAGS = {
  brands: "brands",
  products: "products",
  reviews: "reviews",
} as const;

// =====================================================
// PRODUITS
// =====================================================

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  condition: string;
  grade: string | null;
  price: number;
  originalPrice: number | null;
  stock: number;
  warrantyMonths: number;
  badge: string | null;
  image: string;
};

const PRODUCT_CARD_SELECT = {
  id: true,
  slug: true,
  name: true,
  category: true,
  condition: true,
  grade: true,
  price: true,
  originalPrice: true,
  stock: true,
  warrantyMonths: true,
  badge: true,
  primaryImage: true,
  brand: { select: { name: true } },
} as const;

function mapCard(p: {
  id: string;
  slug: string;
  name: string;
  category: string;
  condition: string;
  grade: string | null;
  price: number;
  originalPrice: number | null;
  stock: number;
  warrantyMonths: number;
  badge: string | null;
  primaryImage: string | null;
  brand: { name: string };
}): ProductCardData {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand.name,
    category: p.category,
    condition: p.condition,
    grade: p.grade,
    price: p.price,
    originalPrice: p.originalPrice,
    stock: p.stock,
    warrantyMonths: p.warrantyMonths,
    badge: p.badge,
    image: p.primaryImage ?? "",
  };
}

export const getFeaturedProducts = unstable_cache(
  async (limit = 8): Promise<ProductCardData[]> => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: PRODUCT_CARD_SELECT,
    });
    return products.map(mapCard);
  },
  ["featured-products"],
  { revalidate: 1800, tags: [CACHE_TAGS.products] },
);

export type ProductFilter = {
  category?: string | string[];
  condition?: string | string[];
  brands?: string[];
  states?: string[]; // "REC_A" | "REC_B" | "REC_C" | "OCC"
  priceBucket?: string; // "lt200" | "200-500" | "500-1000" | "gt1000"
  q?: string;
  sort?: "relevance" | "price-asc" | "price-desc" | "newest";
};

const PRICE_BUCKETS: Record<string, { min?: number; max?: number }> = {
  lt200: { max: 200 },
  "200-500": { min: 200, max: 500 },
  "500-1000": { min: 500, max: 1000 },
  gt1000: { min: 1000 },
};

export async function getProducts(filter: ProductFilter = {}): Promise<ProductCardData[]> {
  const where: Record<string, unknown> = { isActive: true };

  if (filter.category) {
    where.category = Array.isArray(filter.category)
      ? { in: filter.category }
      : filter.category;
  }
  if (filter.condition) {
    where.condition = Array.isArray(filter.condition)
      ? { in: filter.condition }
      : filter.condition;
  }

  // Marques (par nom)
  if (filter.brands && filter.brands.length > 0) {
    where.brand = { name: { in: filter.brands } };
  }

  // États composites : Reconditionné Grade A/B/C ou Occasion
  if (filter.states && filter.states.length > 0) {
    const orClauses: Record<string, unknown>[] = [];
    for (const s of filter.states) {
      if (s === "OCC") orClauses.push({ condition: "OCCASION" });
      else if (s === "REC_A") orClauses.push({ condition: "RECONDITIONNE", grade: "A" });
      else if (s === "REC_B") orClauses.push({ condition: "RECONDITIONNE", grade: "B" });
      else if (s === "REC_C") orClauses.push({ condition: "RECONDITIONNE", grade: "C" });
    }
    if (orClauses.length > 0) where.OR = orClauses;
  }

  // Tranche de prix
  if (filter.priceBucket && PRICE_BUCKETS[filter.priceBucket]) {
    const { min, max } = PRICE_BUCKETS[filter.priceBucket];
    const priceClause: Record<string, number> = {};
    if (min !== undefined) priceClause.gte = min;
    if (max !== undefined) priceClause.lte = max;
    where.price = priceClause;
  }

  // Recherche libre — SQLite n'a pas mode:"insensitive", on fait un AND case-insensitive
  // côté JS pour rester cohérent. Pour une simple feuille de catalogue, le contains
  // de Prisma sur SQLite est déjà case-insensitive par défaut (ICU).
  if (filter.q && filter.q.trim()) {
    const term = filter.q.trim();
    where.AND = [
      ...(Array.isArray(where.AND) ? (where.AND as unknown[]) : []),
      {
        OR: [
          { name: { contains: term } },
          { description: { contains: term } },
          { brand: { name: { contains: term } } },
        ],
      },
    ];
  }

  const orderBy =
    filter.sort === "price-asc"
      ? [{ price: "asc" as const }]
      : filter.sort === "price-desc"
        ? [{ price: "desc" as const }]
        : filter.sort === "newest"
          ? [{ createdAt: "desc" as const }]
          : [{ isFeatured: "desc" as const }, { createdAt: "desc" as const }];

  const products = await prisma.product.findMany({
    where,
    orderBy,
    select: PRODUCT_CARD_SELECT,
  });
  return products.map(mapCard);
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      images: { orderBy: { position: "asc" } },
      specs: { orderBy: { position: "asc" } },
    },
  });
}

export async function getAllProductSlugs() {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export async function getBrands() {
  return prisma.brand.findMany({ orderBy: { name: "asc" } });
}

export const getBrandNames = unstable_cache(
  async (): Promise<string[]> => {
    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    });
    return brands.map((b) => b.name);
  },
  ["brand-names"],
  { revalidate: 3600, tags: [CACHE_TAGS.brands] },
);

// =====================================================
// AVIS
// =====================================================

export type ReviewData = {
  id: string;
  source: string; // INTERNE | GOOGLE | FACEBOOK
  authorName: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

export const getFeaturedReviews = unstable_cache(
  async (limit = 4): Promise<ReviewData[]> => {
    const reviews = await prisma.review.findMany({
      where: { isPublished: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        source: true,
        authorName: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });
    return reviews;
  },
  ["featured-reviews"],
  { revalidate: 1800, tags: [CACHE_TAGS.reviews] },
);

export async function getAllReviews(opts?: {
  rating?: number;
  source?: string;
}): Promise<ReviewData[]> {
  const where: { isPublished: true; rating?: number; source?: string } = {
    isPublished: true,
  };
  if (opts?.rating && opts.rating >= 1 && opts.rating <= 5) {
    where.rating = opts.rating;
  }
  if (opts?.source) {
    where.source = opts.source;
  }
  return prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      source: true,
      authorName: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
  });
}

export const getReviewsStats = unstable_cache(
  async () => {
    const [count, agg] = await Promise.all([
      prisma.review.count({ where: { isPublished: true } }),
      prisma.review.aggregate({
        where: { isPublished: true },
        _avg: { rating: true },
      }),
    ]);
    return {
      count,
      average: agg._avg.rating ?? 0,
    };
  },
  ["reviews-stats"],
  { revalidate: 1800, tags: [CACHE_TAGS.reviews] },
);

// =====================================================
// RÉPARATIONS
// =====================================================

export async function getRepairByNumber(number: string) {
  return prisma.repair.findUnique({
    where: { number },
    include: {
      statusHistory: { orderBy: { createdAt: "asc" } },
      photos: true,
    },
  });
}

export async function getActiveRepairs(limit?: number) {
  return prisma.repair.findMany({
    where: {
      status: { notIn: ["DEMANDE_DEVIS", "RESTITUE", "IRREPARABLE"] },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Réparations actives en attente depuis plus de N heures (par défaut 24h).
 * Utilisé pour l'alerte « à traiter en priorité » sur le dashboard admin.
 */
export async function getStaleActiveRepairs(hoursThreshold = 24) {
  const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);
  return prisma.repair.findMany({
    where: {
      status: { notIn: ["DEMANDE_DEVIS", "RESTITUE", "IRREPARABLE"] },
      createdAt: { lt: cutoff },
    },
    orderBy: { createdAt: "asc" }, // les plus anciennes en premier
    select: {
      id: true,
      number: true,
      customerName: true,
      brand: true,
      model: true,
      issueType: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function getAllRepairs() {
  // Toutes les réparations physiques (exclut les demandes de devis).
  return prisma.repair.findMany({
    where: { status: { not: "DEMANDE_DEVIS" } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllDevisRequests() {
  // Demandes de devis en ligne, en attente de dépôt physique.
  return prisma.repair.findMany({
    where: { status: "DEMANDE_DEVIS" },
    orderBy: { createdAt: "desc" },
  });
}

export async function countDevisRequests() {
  return prisma.repair.count({ where: { status: "DEMANDE_DEVIS" } });
}

// =====================================================
// CLIENTS — gestion back-office
// =====================================================

export async function getAdminAllClients() {
  // Tous les utilisateurs CLIENT/TECHNICIEN — on exclut les ADMIN.
  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true, repairs: true, reviews: true, wishlist: true } },
    },
  });

  // Calcul du CA cumulé par client (orders payées/livrées).
  const ids = users.map((u) => u.id);
  const totals = await prisma.order.groupBy({
    by: ["userId"],
    where: {
      userId: { in: ids },
      status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] },
    },
    _sum: { total: true },
  });
  const totalsByUser = new Map(
    totals.map((t) => [t.userId ?? "", t._sum.total ?? 0]),
  );

  return users.map((u) => ({
    ...u,
    totalSpent: totalsByUser.get(u.id) ?? 0,
  }));
}

export async function getAdminClientById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { id: "asc" }] },
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: { select: { quantity: true, total: true } },
        },
      },
      repairs: {
        orderBy: { createdAt: "desc" },
      },
      wishlist: {
        include: {
          product: {
            select: { id: true, slug: true, name: true, price: true, primaryImage: true, brand: { select: { name: true } } },
          },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { product: { select: { slug: true, name: true } } },
      },
      loyalty: true,
    },
  });
}

// =====================================================
// CLIENTS — recherche pour autocomplétion (back-office)
// =====================================================

export type ClientSuggestion = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
};

export async function searchClients(query: string, limit = 8): Promise<ClientSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  // SQLite ne supporte pas mode: "insensitive" — on fait un AND par token
  // sur les champs concaténés en mémoire, après une requête large.
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

  // On récupère les utilisateurs CLIENT, plus les noms tirés des dossiers Repair (clients
  // sans compte mais déjà connus). Ici on se concentre sur la table User.
  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
    take: 200, // bornage de sécurité
  });

  const matches = users
    .map((u) => {
      const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
      const haystack = [fullName, u.email ?? "", u.phone ?? ""].join(" ").toLowerCase();
      const score = tokens.every((t) => haystack.includes(t)) ? haystack.length : -1;
      return { u, fullName, score };
    })
    .filter((m) => m.score >= 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ u, fullName }) => ({
      id: u.id,
      fullName: fullName || (u.email ? u.email.split("@")[0] : "Client"),
      email: u.email,
      phone: u.phone,
    }));

  return matches;
}

export async function generateNextRepairNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `REP-${year}-`;
  const last = await prisma.repair.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const lastSeq = last ? parseInt(last.number.slice(prefix.length), 10) : 0;
  const next = (lastSeq + 1).toString().padStart(4, "0");
  return `${prefix}${next}`;
}

export async function generateNextReclamationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `REC-${year}-`;
  const last = await prisma.reclamation.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const lastSeq = last ? parseInt(last.number.slice(prefix.length), 10) : 0;
  const next = (lastSeq + 1).toString().padStart(4, "0");
  return `${prefix}${next}`;
}

// =====================================================
// COMMANDES
// =====================================================

export async function generateNextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CMD-${year}-`;
  const last = await prisma.order.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const lastSeq = last ? parseInt(last.number.slice(prefix.length), 10) : 0;
  const next = (lastSeq + 1).toString().padStart(4, "0");
  return `${prefix}${next}`;
}

export async function getOrderByNumber(number: string) {
  return prisma.order.findUnique({
    where: { number },
    include: {
      items: {
        include: {
          product: {
            select: { slug: true, name: true, brand: { select: { name: true } }, primaryImage: true },
          },
        },
      },
    },
  });
}

export async function getOrdersByUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            select: { slug: true, name: true, primaryImage: true },
          },
        },
      },
    },
  });
}

// =====================================================
// ADMIN — KPI
// =====================================================

export async function getAdminKpis() {
  const [orderAgg, ordersCount, activeRepairsCount, productsCount] =
    await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        _avg: { total: true },
        where: { status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } },
      }),
      prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
      prisma.repair.count({
        where: { status: { notIn: ["DEMANDE_DEVIS", "RESTITUE", "IRREPARABLE"] } },
      }),
      prisma.product.count({ where: { isActive: true } }),
    ]);

  return {
    totalRevenue: orderAgg._sum.total ?? 0,
    avgOrderValue: orderAgg._avg.total ?? 0,
    ordersCount,
    activeRepairsCount,
    productsCount,
  };
}

/**
 * KPIs centrés sur les réparations + avis pour le tableau de bord (commerce
 * volontairement exclu, conformément à la directive admin).
 */
export async function getRepairsDashboardKpis() {
  const [
    activeRepairsCount,
    happyClientsCount,
    sadClientsCount,
    repairsAgg,
    repairStatusGroup,
    reviewAgg,
    productsCount,
    pendingReclamations,
    unreadMessages,
  ] = await Promise.all([
    prisma.repair.count({
      where: { status: { notIn: ["DEMANDE_DEVIS", "RESTITUE", "IRREPARABLE"] } },
    }),
    // Clients heureux = réparations terminées et restituées au client
    prisma.repair.count({ where: { status: "RESTITUE" } }),
    // Clients tristes = appareils irréparables
    prisma.repair.count({ where: { status: "IRREPARABLE" } }),
    prisma.repair.aggregate({
      _avg: { finalCost: true },
      _count: true,
    }),
    prisma.repair.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: true,
      where: { isPublished: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.reclamation.count({ where: { status: { in: ["OUVERTE", "EN_COURS"] } } }),
    prisma.contactMessage.count(),
  ]);

  return {
    activeRepairsCount,
    happyClientsCount,
    sadClientsCount,
    totalRepairs: repairsAgg._count,
    avgFinalCost: repairsAgg._avg.finalCost ?? 0,
    repairsByStatus: repairStatusGroup.map((g) => ({
      status: g.status,
      count: g._count._all,
    })),
    reviewsAvg: reviewAgg._avg.rating ?? 0,
    reviewsCount: reviewAgg._count,
    productsCount,
    pendingReclamations,
    unreadMessages,
  };
}

export async function getLowStockProducts(threshold?: number) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, stock: true, lowStockAt: true },
  });
  return products.filter((p) =>
    threshold !== undefined ? p.stock <= threshold : p.stock <= p.lowStockAt,
  );
}

// =====================================================
// ADMIN — listings
// =====================================================

export async function getAdminProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { brand: true },
  });
}

export async function getProductByBarcode(barcode: string) {
  const trimmed = barcode.trim();
  if (!trimmed) return null;
  return prisma.product.findUnique({
    where: { barcode: trimmed },
    include: { brand: { select: { name: true } } },
  });
}

export async function getAdminAllProducts() {
  return prisma.product.findMany({
    include: { brand: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminAllOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      items: { select: { quantity: true, total: true } },
    },
  });
}

export async function getAdminOrderByNumber(number: string) {
  return prisma.order.findUnique({
    where: { number },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      items: {
        include: {
          product: {
            select: { slug: true, name: true, primaryImage: true, brand: { select: { name: true } } },
          },
        },
      },
    },
  });
}

export async function getAdminAllReviews() {
  return prisma.review.findMany({
    orderBy: [{ isPublished: "asc" }, { createdAt: "desc" }],
    include: {
      product: { select: { slug: true, name: true } },
    },
  });
}

export async function getAdminAllReclamations() {
  return prisma.reclamation.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getAdminAllMessages() {
  return prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdvancedKpis() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOf30dAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const [
    totalAgg,
    monthAgg,
    yearAgg,
    last30dAgg,
    repairsAgg,
    repairStatusGroup,
    orderStatusGroup,
    reviewAgg,
    productCount,
    activeRepairCount,
    pendingReclamations,
    unreadMessages,
    topProducts,
    salesByDay,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      _avg: { total: true },
      _count: true,
      where: { status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      _count: true,
      where: {
        status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      _count: true,
      where: {
        status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] },
        createdAt: { gte: startOfYear },
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      _count: true,
      where: {
        status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] },
        createdAt: { gte: startOf30dAgo },
      },
    }),
    prisma.repair.aggregate({ _avg: { finalCost: true }, _count: true }),
    prisma.repair.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: true,
      where: { isPublished: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.repair.count({
      where: { status: { notIn: ["DEMANDE_DEVIS", "RESTITUE", "IRREPARABLE"] } },
    }),
    prisma.reclamation.count({ where: { status: { in: ["OUVERTE", "EN_COURS"] } } }),
    prisma.contactMessage.count(),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.order.findMany({
      where: {
        status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] },
        createdAt: { gte: startOf30dAgo },
      },
      select: { createdAt: true, total: true },
    }),
  ]);

  // Top products names
  const topProductIds = topProducts.map((t) => t.productId);
  const topProductDetails = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, slug: true, brand: { select: { name: true } } },
  });
  const topProductMap = new Map(topProductDetails.map((p) => [p.id, p]));
  const topProductsResolved = topProducts.map((t) => ({
    ...topProductMap.get(t.productId),
    quantity: t._sum.quantity ?? 0,
    revenue: t._sum.total ?? 0,
  }));

  // Bucket sales by day for the last 30 days
  const dayBuckets: { day: string; revenue: number; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    dayBuckets.push({ day: key, revenue: 0, count: 0 });
  }
  const dayIndex = new Map(dayBuckets.map((b, i) => [b.day, i]));
  for (const o of salesByDay) {
    const key = new Date(o.createdAt).toISOString().slice(0, 10);
    const i = dayIndex.get(key);
    if (i !== undefined) {
      dayBuckets[i].revenue += o.total;
      dayBuckets[i].count += 1;
    }
  }

  return {
    revenue: {
      total: totalAgg._sum.total ?? 0,
      avgBasket: totalAgg._avg.total ?? 0,
      ordersCount: totalAgg._count,
      month: monthAgg._sum.total ?? 0,
      monthCount: monthAgg._count,
      year: yearAgg._sum.total ?? 0,
      yearCount: yearAgg._count,
      last30d: last30dAgg._sum.total ?? 0,
      last30dCount: last30dAgg._count,
    },
    repairs: {
      avgFinalCost: repairsAgg._avg.finalCost ?? 0,
      total: repairsAgg._count,
      active: activeRepairCount,
      byStatus: repairStatusGroup.map((g) => ({ status: g.status, count: g._count._all })),
    },
    orders: {
      byStatus: orderStatusGroup.map((g) => ({ status: g.status, count: g._count._all })),
    },
    reviews: {
      avg: reviewAgg._avg.rating ?? 0,
      count: reviewAgg._count,
    },
    counts: {
      products: productCount,
      pendingReclamations,
      unreadMessages,
    },
    topProducts: topProductsResolved,
    salesByDay: dayBuckets,
  };
}
