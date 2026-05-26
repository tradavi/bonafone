// =====================================================
// Catalogue de modeles par marque — pour pre-remplir le champ "Modele"
// du formulaire creation reparation.
// =====================================================
// Le champ reste un input libre (datalist) : si le modele du client
// n'est pas dans la liste, l'admin peut taper le sien.
//
// Liste maintenue manuellement, focalisee sur les modeles courants en
// reparation belge/europeenne (2018-2024). Ajouter de nouveaux modeles
// = juste editer cette constante.

export const MODELS_BY_BRAND: Record<string, string[]> = {
  Apple: [
    // iPhones recents (2023-2024)
    "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
    "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 Mini",
    "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 Mini",
    "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
    "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X",
    "iPhone 8 Plus", "iPhone 8", "iPhone 7 Plus", "iPhone 7",
    "iPhone SE 2022", "iPhone SE 2020", "iPhone SE",
    // iPads
    "iPad Pro 13\" M4", "iPad Pro 11\" M4", "iPad Pro 12.9\" M2", "iPad Pro 11\" M2",
    "iPad Air M2", "iPad Air 5", "iPad Air 4",
    "iPad 10", "iPad 9", "iPad 8",
    "iPad mini 7", "iPad mini 6",
    // Macs portables
    "MacBook Pro 16\" M3", "MacBook Pro 14\" M3", "MacBook Pro 13\" M2",
    "MacBook Air 15\" M3", "MacBook Air 13\" M3", "MacBook Air 13\" M2", "MacBook Air 13\" M1",
  ],

  Samsung: [
    // Galaxy S
    "Galaxy S25 Ultra", "Galaxy S25+", "Galaxy S25",
    "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S24 FE",
    "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23", "Galaxy S23 FE",
    "Galaxy S22 Ultra", "Galaxy S22+", "Galaxy S22",
    "Galaxy S21 Ultra", "Galaxy S21+", "Galaxy S21", "Galaxy S21 FE",
    "Galaxy S20 Ultra", "Galaxy S20+", "Galaxy S20", "Galaxy S20 FE",
    "Galaxy S10+", "Galaxy S10", "Galaxy S10e",
    // Galaxy A
    "Galaxy A55", "Galaxy A35", "Galaxy A25", "Galaxy A15",
    "Galaxy A54", "Galaxy A34", "Galaxy A24", "Galaxy A14",
    "Galaxy A53", "Galaxy A33", "Galaxy A23", "Galaxy A13",
    "Galaxy A52", "Galaxy A32", "Galaxy A22", "Galaxy A12",
    // Galaxy Z (pliables)
    "Galaxy Z Fold 6", "Galaxy Z Flip 6",
    "Galaxy Z Fold 5", "Galaxy Z Flip 5",
    "Galaxy Z Fold 4", "Galaxy Z Flip 4",
    "Galaxy Z Fold 3", "Galaxy Z Flip 3",
    // Galaxy Note
    "Galaxy Note 20 Ultra", "Galaxy Note 20", "Galaxy Note 10+", "Galaxy Note 10",
    // Tablettes
    "Galaxy Tab S10 Ultra", "Galaxy Tab S10+", "Galaxy Tab S9 Ultra", "Galaxy Tab S9+", "Galaxy Tab S9",
    "Galaxy Tab S8 Ultra", "Galaxy Tab S8+", "Galaxy Tab S8",
    "Galaxy Tab A9+", "Galaxy Tab A9", "Galaxy Tab A8",
  ],

  Huawei: [
    "Pura 70 Ultra", "Pura 70 Pro+", "Pura 70 Pro", "Pura 70",
    "P60 Pro", "P60", "P50 Pro", "P50", "P40 Pro+", "P40 Pro", "P40",
    "P30 Pro", "P30", "P20 Pro", "P20",
    "Mate 60 Pro", "Mate 60", "Mate 50 Pro", "Mate 50",
    "Mate 40 Pro", "Mate 30 Pro", "Mate 20 Pro",
    "Nova 12", "Nova 11", "Nova 10", "Nova 9",
    "MatePad Pro 13\"", "MatePad 11\"",
  ],

  Xiaomi: [
    "14 Ultra", "14 Pro", "14",
    "13 Ultra", "13 Pro", "13", "13T Pro", "13T",
    "12 Pro", "12", "12T Pro", "12T",
    "11 Ultra", "11 Pro", "11", "11T Pro", "11T",
    "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi Note 13",
    "Redmi Note 12 Pro+", "Redmi Note 12 Pro", "Redmi Note 12",
    "Redmi Note 11 Pro", "Redmi Note 11",
    "Redmi 13C", "Redmi 12", "Redmi 10",
    "Poco F6 Pro", "Poco F6", "Poco F5", "Poco X6 Pro", "Poco X6",
  ],

  Google: [
    "Pixel 9 Pro XL", "Pixel 9 Pro", "Pixel 9",
    "Pixel 8 Pro", "Pixel 8", "Pixel 8a",
    "Pixel 7 Pro", "Pixel 7", "Pixel 7a",
    "Pixel 6 Pro", "Pixel 6", "Pixel 6a",
    "Pixel 5", "Pixel 4a", "Pixel 4",
    "Pixel Fold",
  ],

  OnePlus: [
    "12", "12R", "11", "10 Pro", "10T", "10R",
    "9 Pro", "9", "9R", "8 Pro", "8T", "8",
    "Nord 4", "Nord 3", "Nord 2T", "Nord CE 3", "Nord CE 2",
  ],

  Oppo: [
    "Find X8 Pro", "Find X8", "Find X7 Ultra", "Find X7", "Find X6 Pro", "Find X5 Pro",
    "Reno 12 Pro", "Reno 12", "Reno 11 Pro", "Reno 11", "Reno 10", "Reno 8", "Reno 7",
    "A98", "A78", "A58", "A38", "A17",
  ],

  Sony: [
    "Xperia 1 VI", "Xperia 1 V", "Xperia 1 IV", "Xperia 1 III",
    "Xperia 5 V", "Xperia 5 IV", "Xperia 5 III",
    "Xperia 10 VI", "Xperia 10 V", "Xperia 10 IV",
  ],

  Nokia: [
    "G42", "G22", "G21", "G11", "C32", "C21",
    "X30", "X20", "8.3", "7.2", "5.4", "3.4",
  ],

  Motorola: [
    "Edge 50 Ultra", "Edge 50 Pro", "Edge 50",
    "Edge 40 Pro", "Edge 40", "Edge 30 Pro",
    "Razr 50 Ultra", "Razr 40 Ultra",
    "G84", "G73", "G53", "G34", "G24",
  ],

  Honor: [
    "Magic 6 Pro", "Magic 6", "Magic 5 Pro", "Magic 5",
    "Magic V3", "Magic Vs3", "Magic V2",
    "200 Pro", "200", "100 Pro",
    "90 Pro", "90", "70",
    "X9b", "X8b", "X7b",
  ],

  Realme: [
    "GT 6", "GT 5 Pro", "GT 5", "GT Neo 6",
    "13 Pro+", "13 Pro", "12 Pro+", "12 Pro", "11 Pro+", "11 Pro",
    "C67", "C55", "C53",
  ],

  // Ordinateurs portables
  ASUS: [
    "ROG Strix G16", "ROG Strix G15", "ROG Zephyrus G14",
    "ZenBook Pro 16X", "ZenBook 14", "ZenBook Duo",
    "VivoBook Pro 15", "VivoBook S15", "VivoBook 14",
    "TUF Gaming A15", "TUF Gaming F15",
  ],

  Lenovo: [
    "ThinkPad X1 Carbon", "ThinkPad T14", "ThinkPad T16", "ThinkPad P16",
    "Legion 7 Pro", "Legion 5 Pro", "Legion Slim 7",
    "Yoga Slim 7", "Yoga Pro 9", "Yoga 7",
    "IdeaPad Slim 5", "IdeaPad 3",
  ],

  HP: [
    "Spectre x360 14", "Spectre x360 16",
    "EliteBook 840 G11", "EliteBook 1040",
    "Pavilion 15", "Pavilion x360",
    "Omen 16", "Omen 17", "Victus 15",
    "ProBook 450", "EliteBook 850",
  ],

  Dell: [
    "XPS 13", "XPS 15", "XPS 17",
    "Inspiron 14", "Inspiron 15", "Inspiron 16",
    "Latitude 5430", "Latitude 7430", "Latitude 9430",
    "Alienware m16", "Alienware m18",
    "Precision 5570", "Precision 7770",
  ],

  Acer: [
    "Aspire 3", "Aspire 5", "Aspire 7",
    "Predator Helios 16", "Predator Triton 14",
    "Swift 14", "Swift Edge 16",
    "Nitro 5", "Nitro 16", "Nitro 17",
  ],

  Microsoft: [
    "Surface Pro 10", "Surface Pro 9", "Surface Pro 8",
    "Surface Laptop 7", "Surface Laptop 6", "Surface Laptop 5", "Surface Laptop Go 3",
    "Surface Book 3",
    "Surface Studio 2+",
  ],

  Alcatel: [
    "1S", "1B", "3L", "3X",
    "1T 7", "1T 10",
  ],

  TCL: [
    "40 SE", "40 XL", "30 SE", "30 XE",
    "TAB 10",
  ],

  Vivo: [
    "X100 Pro", "X100", "X90 Pro", "X90",
    "V40", "V30", "V29",
    "Y36", "Y27", "Y22",
  ],

  Wiko: [
    "T60", "T50", "T10",
    "Y82", "Y62", "Y52",
  ],

  Crosscall: [
    "Stellar X5", "Stellar M5",
    "Action X5", "Action M5",
    "Core X5", "Core M5", "Core T5",
  ],

  Fairphone: [
    "5", "4", "3+", "3",
  ],

  Doro: [
    "8210", "8100", "7100", "780X", "6880", "6660",
  ],
};

/**
 * Renvoie la liste des modeles pour une marque donnee, ou un tableau vide
 * si la marque n'est pas dans le catalogue. La recherche est insensible
 * a la casse pour matcher si l'admin tape "apple" au lieu de "Apple".
 */
export function getModelsForBrand(brand: string): string[] {
  if (!brand) return [];
  const normalized = brand.trim();
  // Match exact d'abord
  if (MODELS_BY_BRAND[normalized]) return MODELS_BY_BRAND[normalized];
  // Match insensible casse
  const matchKey = Object.keys(MODELS_BY_BRAND).find(
    (k) => k.toLowerCase() === normalized.toLowerCase(),
  );
  return matchKey ? MODELS_BY_BRAND[matchKey] : [];
}
