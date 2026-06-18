export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Category = {
  slug: string;
  name: string;
  description: string;
  leadTime: string;
  imagePosition: string;
  iconPath: string;
};

export type SupplierProfile = Coordinates & {
  uid: string;
  supplierName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  whatsappNumber: string;
  profilePhoto: string;
  address: string;
  city: string;
  state: string;
  description: string;
  isVerified: boolean;
  verificationStatus: "pending" | "verified" | "rejected";
  verifiedAt?: string;
  rating: number;
  reviewCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type MaterialListing = Coordinates & {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCompanyName: string;
  supplierPhoneNumber: string;
  supplierWhatsappNumber: string;
  supplierPhoto: string;
  supplierVerified: boolean;
  supplierRating: number;
  duplicateKey: string;
  materialName: string;
  category: string;
  price: number;
  quantity: string;
  unit: string;
  description: string;
  images: string[];
  address: string;
  city: string;
  state: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MaterialFilters = {
  query: string;
  category: string;
  maxDistanceKm: number;
  minPrice: string;
  maxPrice: string;
  location: string;
  minRating: string;
};

export type Supplier = SupplierProfile & {
  id: string;
  name: string;
  location: string;
  reviews: number;
  specialties: string[];
  imagePosition: string;
};

export type Product = MaterialListing & {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  stock: string;
  imagePosition: string;
};

export const heroImage = "/assets/construction-marketplace-hero.png";
export const defaultMaterialImage = heroImage;

export const categories: Category[] = [
  {
    slug: "aggregates",
    name: "Aggregates",
    description: "Graded stone aggregates for concrete, road work, and base layers.",
    leadTime: "Same-day local dispatch",
    imagePosition: "42% 68%",
    iconPath: "M4 18h16M6 18l2-8 4 4 4-6 2 10",
  },
  {
    slug: "sand",
    name: "Sand",
    description: "M-sand, river sand, and plastering sand for site-ready mixes.",
    leadTime: "Bulk loads available",
    imagePosition: "48% 66%",
    iconPath: "M4 17c2-2 4-2 6 0s4 2 6 0 4-2 4-2M4 12c2-2 4-2 6 0s4 2 6 0 4-2 4-2",
  },
  {
    slug: "bricks-blocks",
    name: "Bricks & Blocks",
    description: "Red bricks, AAC blocks, and cement blocks from verified yards.",
    leadTime: "Verified yard stock",
    imagePosition: "62% 64%",
    iconPath: "M4 7h16v10H4V7Zm0 5h16M9 7v5m6 0v5",
  },
  {
    slug: "cement",
    name: "Cement",
    description: "OPC, PPC, and specialty cement from active supplier inventory.",
    leadTime: "Fresh batch supply",
    imagePosition: "64% 26%",
    iconPath: "M7 20h10l2-13H5l2 13Zm1-13 2-3h4l2 3",
  },
  {
    slug: "steel",
    name: "Steel",
    description: "TMT bars, rods, structural steel, and binding wire.",
    leadTime: "Cut-to-order support",
    imagePosition: "72% 44%",
    iconPath: "M5 19 19 5M8 22 22 8M2 16 16 2",
  },
  {
    slug: "electrical-materials",
    name: "Electrical Materials",
    description: "Wires, switches, boards, MCBs, conduits, and site bundles.",
    leadTime: "Project bundle pricing",
    imagePosition: "77% 81%",
    iconPath: "m13 2-8 12h6l-1 8 8-12h-6l1-8Z",
  },
  {
    slug: "hardware-materials",
    name: "Hardware Materials",
    description: "Fasteners, fittings, hinges, and everyday site hardware.",
    leadTime: "Retail and wholesale",
    imagePosition: "88% 89%",
    iconPath: "M14 7 7 14m0-5h.01M15 15h.01M4 20l16-16",
  },
  {
    slug: "plumbing-materials",
    name: "Plumbing Materials",
    description: "Pipes, taps, valves, fittings, and bathroom accessories.",
    leadTime: "Brand alternatives ready",
    imagePosition: "90% 74%",
    iconPath: "M4 9h10a4 4 0 0 1 0 8h-2m-8-4h12M8 5v8m0 4v2",
  },
  {
    slug: "plywood-wood",
    name: "Plywood & Wood",
    description: "Boards, sheets, laminates, and formwork plywood.",
    leadTime: "Sheet-size guidance",
    imagePosition: "90% 35%",
    iconPath: "M5 4h14v16H5V4Zm4 0v16m6-16v16",
  },
];

export const seedSuppliers: Supplier[] = [
  {
    uid: "shree-construction",
    id: "shree-construction",
    supplierName: "Ravi Narayanan",
    companyName: "Shree Construction Supply",
    name: "Shree Construction Supply",
    email: "sales@shreeconstruction.example",
    phoneNumber: "+919876543210",
    whatsappNumber: "+919876543210",
    profilePhoto: heroImage,
    address: "Old Mahabalipuram Road, Perungudi, Chennai, Tamil Nadu",
    city: "Chennai",
    state: "Tamil Nadu",
    latitude: 12.965,
    longitude: 80.2461,
    description:
      "Bulk aggregates, sand, and cement supplier for residential and commercial projects across Chennai.",
    location: "Perungudi, Chennai",
    rating: 4.8,
    reviewCount: 128,
    reviews: 128,
    isVerified: true,
    verificationStatus: "verified",
    verifiedAt: "2026-05-20T08:35:00.000Z",
    specialties: ["Aggregates", "Sand", "Cement"],
    imagePosition: "42% 68%",
    createdAt: "2026-05-20T08:30:00.000Z",
  },
  {
    uid: "sri-venkateshwara-traders",
    id: "sri-venkateshwara-traders",
    supplierName: "Meena Krishnan",
    companyName: "Sri Venkateshwara Traders",
    name: "Sri Venkateshwara Traders",
    email: "orders@svtraders.example",
    phoneNumber: "+919765432109",
    whatsappNumber: "+919765432109",
    profilePhoto: heroImage,
    address: "Poonamallee High Road, Koyambedu, Chennai, Tamil Nadu",
    city: "Chennai",
    state: "Tamil Nadu",
    latitude: 13.0694,
    longitude: 80.1948,
    description:
      "Hardware, plywood, sand, and fast-moving site materials with wholesale dispatch support.",
    location: "Koyambedu, Chennai",
    rating: 4.6,
    reviewCount: 95,
    reviews: 95,
    isVerified: true,
    verificationStatus: "verified",
    verifiedAt: "2026-05-19T10:15:00.000Z",
    specialties: ["Sand", "Plywood", "Hardware"],
    imagePosition: "48% 66%",
    createdAt: "2026-05-19T10:10:00.000Z",
  },
  {
    uid: "karthik-bricks",
    id: "karthik-bricks",
    supplierName: "Karthik Raj",
    companyName: "Karthik Bricks Yard",
    name: "Karthik Bricks Yard",
    email: "hello@karthikbricks.example",
    phoneNumber: "+919654321098",
    whatsappNumber: "+919654321098",
    profilePhoto: heroImage,
    address: "Red Hills Road, Madhavaram, Chennai, Tamil Nadu",
    city: "Chennai",
    state: "Tamil Nadu",
    latitude: 13.1488,
    longitude: 80.2306,
    description:
      "Brick and block yard serving contractors with red bricks, AAC blocks, and cement blocks.",
    location: "Madhavaram, Chennai",
    rating: 4.7,
    reviewCount: 76,
    reviews: 76,
    isVerified: true,
    verificationStatus: "verified",
    verifiedAt: "2026-05-18T13:15:00.000Z",
    specialties: ["Bricks & Blocks", "Aggregates"],
    imagePosition: "62% 64%",
    createdAt: "2026-05-18T13:00:00.000Z",
  },
  {
    uid: "sakthi-steel",
    id: "sakthi-steel",
    supplierName: "Sakthi Vel",
    companyName: "Sakthi Steel Mart",
    name: "Sakthi Steel Mart",
    email: "sales@sakthisteel.example",
    phoneNumber: "+919543210987",
    whatsappNumber: "+919543210987",
    profilePhoto: heroImage,
    address: "SIDCO Industrial Estate, Ambattur, Chennai, Tamil Nadu",
    city: "Chennai",
    state: "Tamil Nadu",
    latitude: 13.0982,
    longitude: 80.1619,
    description:
      "TMT bars, binding wire, and cut-to-order steel supply for structural work.",
    location: "Ambattur, Chennai",
    rating: 4.6,
    reviewCount: 84,
    reviews: 84,
    isVerified: true,
    verificationStatus: "verified",
    verifiedAt: "2026-05-17T09:15:00.000Z",
    specialties: ["Steel", "Binding Wire"],
    imagePosition: "72% 44%",
    createdAt: "2026-05-17T09:00:00.000Z",
  },
  {
    uid: "kaveri-pipes",
    id: "kaveri-pipes",
    supplierName: "Anitha S",
    companyName: "Kaveri Pipes & Electricals",
    name: "Kaveri Pipes & Electricals",
    email: "support@kaveripipes.example",
    phoneNumber: "+919432109876",
    whatsappNumber: "+919432109876",
    profilePhoto: heroImage,
    address: "Arcot Road, Vadapalani, Chennai, Tamil Nadu",
    city: "Chennai",
    state: "Tamil Nadu",
    latitude: 13.0524,
    longitude: 80.2128,
    description:
      "Plumbing and electrical materials for apartments, shops, and contractor projects.",
    location: "Vadapalani, Chennai",
    rating: 4.5,
    reviewCount: 68,
    reviews: 68,
    isVerified: true,
    verificationStatus: "verified",
    verifiedAt: "2026-05-16T11:45:00.000Z",
    specialties: ["Plumbing", "Electrical"],
    imagePosition: "90% 74%",
    createdAt: "2026-05-16T11:30:00.000Z",
  },
];

const seedRows = [
  {
    id: "20mm-aggregate-perungudi",
    supplierId: "shree-construction",
    materialName: "20mm Aggregate",
    category: "aggregates",
    price: 1250,
    quantity: "80 tons",
    unit: "Ton",
    description:
      "Machine-crushed 20mm blue metal aggregate suitable for RCC, concrete batching, and road base work.",
    createdAt: "2026-05-28T09:15:00.000Z",
  },
  {
    id: "m-sand-koyambedu",
    supplierId: "sri-venkateshwara-traders",
    materialName: "Double Washed M-Sand",
    category: "sand",
    price: 1100,
    quantity: "120 tons",
    unit: "Ton",
    description:
      "Washed M-sand with consistent grading for concrete and masonry requirements.",
    createdAt: "2026-05-28T11:05:00.000Z",
  },
  {
    id: "red-bricks-madhavaram",
    supplierId: "karthik-bricks",
    materialName: "First Quality Red Bricks",
    category: "bricks-blocks",
    price: 7.5,
    quantity: "50,000 pieces",
    unit: "Piece",
    description:
      "Kiln-fired red bricks with uniform edges, ready for building walls and compound work.",
    createdAt: "2026-05-27T08:45:00.000Z",
  },
  {
    id: "opc-cement-perungudi",
    supplierId: "shree-construction",
    materialName: "OPC Cement 53 Grade",
    category: "cement",
    price: 370,
    quantity: "900 bags",
    unit: "Bag",
    description:
      "Fresh 53 grade OPC cement bags available for bulk dispatch with batch confirmation.",
    createdAt: "2026-05-27T14:20:00.000Z",
  },
  {
    id: "tmt-bars-ambattur",
    supplierId: "sakthi-steel",
    materialName: "TMT Steel Bars 12mm",
    category: "steel",
    price: 58,
    quantity: "18 tons",
    unit: "Kg",
    description:
      "Fe500 TMT bars with loading support and cut-length coordination for site delivery.",
    createdAt: "2026-05-26T10:30:00.000Z",
  },
  {
    id: "copper-wires-vadapalani",
    supplierId: "kaveri-pipes",
    materialName: "Copper Electrical Wires",
    category: "electrical-materials",
    price: 2450,
    quantity: "240 rolls",
    unit: "Roll",
    description:
      "ISI-marked copper electrical wires for residential wiring and contractor bundles.",
    createdAt: "2026-05-26T12:10:00.000Z",
  },
  {
    id: "pvc-pipes-vadapalani",
    supplierId: "kaveri-pipes",
    materialName: "PVC Pipes 1 Inch",
    category: "plumbing-materials",
    price: 85,
    quantity: "1,200 meters",
    unit: "Meter",
    description:
      "Durable PVC pipes for water lines and drainage with fittings available on request.",
    createdAt: "2026-05-25T16:25:00.000Z",
  },
  {
    id: "plywood-sheets-koyambedu",
    supplierId: "sri-venkateshwara-traders",
    materialName: "Waterproof Plywood Sheets 18mm",
    category: "plywood-wood",
    price: 1650,
    quantity: "340 sheets",
    unit: "Sheet",
    description:
      "18mm waterproof plywood sheets for formwork, interiors, and temporary partitions.",
    createdAt: "2026-05-25T09:00:00.000Z",
  },
  {
    id: "hex-screws-koyambedu",
    supplierId: "sri-venkateshwara-traders",
    materialName: "Hex Screws Bulk Box",
    category: "hardware-materials",
    price: 140,
    quantity: "500 boxes",
    unit: "Box",
    description:
      "Assorted hex screw boxes for fabrication, roofing, and general site hardware use.",
    createdAt: "2026-05-24T10:00:00.000Z",
  },
];

function materialFromSeed(row: (typeof seedRows)[number]): MaterialListing {
  const supplier = seedSuppliers.find((item) => item.uid === row.supplierId) ?? seedSuppliers[0];

  return {
    ...row,
    supplierName: supplier.companyName,
    supplierCompanyName: supplier.companyName,
    supplierPhoneNumber: supplier.phoneNumber,
    supplierWhatsappNumber: supplier.whatsappNumber,
    supplierPhoto: supplier.profilePhoto,
    supplierVerified: supplier.isVerified,
    supplierRating: supplier.rating,
    duplicateKey: createDuplicateKey({
      supplierId: supplier.uid,
      materialName: row.materialName,
      category: row.category,
      city: supplier.city,
    }),
    images: [heroImage],
    address: supplier.address,
    city: supplier.city,
    state: supplier.state,
    latitude: supplier.latitude,
    longitude: supplier.longitude,
  };
}

export const seedMaterials: MaterialListing[] = seedRows.map(materialFromSeed);
export const suppliers = seedSuppliers;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getCategoryName(slug: string) {
  return getCategory(slug)?.name ?? slug;
}

export function getMaterial(id: string, source: MaterialListing[] = seedMaterials) {
  return source.find((material) => material.id === id || slugify(material.materialName) === id);
}

export function getSupplier(id: string) {
  return seedSuppliers.find((supplier) => supplier.uid === id || supplier.id === id) ?? seedSuppliers[0];
}

export function getSupplierFromMaterials(id: string, materials: MaterialListing[]) {
  const seedSupplier = seedSuppliers.find((supplier) => supplier.uid === id || supplier.id === id);
  if (seedSupplier) {
    return seedSupplier;
  }

  const material = materials.find((item) => item.supplierId === id);
  if (!material) {
    return undefined;
  }

  return {
    uid: id,
    id,
    supplierName: material.supplierName,
    companyName: material.supplierCompanyName || material.supplierName,
    name: material.supplierCompanyName || material.supplierName,
    email: "",
    phoneNumber: material.supplierPhoneNumber,
    whatsappNumber: material.supplierWhatsappNumber,
    profilePhoto: material.supplierPhoto || heroImage,
    address: material.address,
    city: material.city,
    state: material.state,
    latitude: material.latitude,
    longitude: material.longitude,
    description: "Verified MarketPlaceX supplier.",
    isVerified: material.supplierVerified,
    verificationStatus: material.supplierVerified ? "verified" : "pending",
    rating: material.supplierRating || 4.4,
    reviewCount: materials.filter((item) => item.supplierId === id).length,
    location: `${material.city}, ${material.state}`,
    reviews: materials.filter((item) => item.supplierId === id).length,
    specialties: [...new Set(materials.filter((item) => item.supplierId === id).map((item) => getCategoryName(item.category)))],
    imagePosition: "50% 50%",
  } satisfies Supplier;
}

export function materialToProduct(material: MaterialListing): Product {
  const category = getCategory(material.category);

  return {
    ...material,
    slug: material.id,
    name: material.materialName,
    categorySlug: material.category,
    categoryName: category?.name ?? material.category,
    stock: material.quantity,
    imagePosition: category?.imagePosition ?? "50% 50%",
  };
}

export const products = seedMaterials.map(materialToProduct);
export const featuredProducts = products.slice(0, 6);

export function getProduct(slug: string) {
  const material = getMaterial(slug, seedMaterials);
  return material ? materialToProduct(material) : undefined;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    style: "currency",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatDate(value?: string) {
  if (!value) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function normalizeIndianPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.startsWith("91")) {
    return digits;
  }
  return digits;
}

export function getWhatsAppUrl(phone: string) {
  return `https://wa.me/${normalizeIndianPhone(phone)}`;
}

export function getTelUrl(phone: string) {
  const digits = normalizeIndianPhone(phone);
  return digits.startsWith("91") ? `tel:+${digits}` : `tel:${phone}`;
}

export function createDuplicateKey({
  supplierId,
  materialName,
  category,
  city,
}: {
  supplierId: string;
  materialName: string;
  category: string;
  city: string;
}) {
  return [supplierId, category, city, materialName]
    .map((value) => slugify(value.trim()))
    .filter(Boolean)
    .join("__");
}

export function distanceInKm(from: Coordinates, to: Coordinates) {
  const radiusKm = 6371;
  const dLat = degreesToRadians(to.latitude - from.latitude);
  const dLon = degreesToRadians(to.longitude - from.longitude);
  const lat1 = degreesToRadians(from.latitude);
  const lat2 = degreesToRadians(to.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function formatDistance(km?: number) {
  if (km === undefined || Number.isNaN(km)) {
    return "Distance unavailable";
  }
  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }
  return `${km.toFixed(km < 10 ? 1 : 0)} km away`;
}

export function sortMaterialsByDistance(
  materials: MaterialListing[],
  location?: Coordinates | null,
) {
  if (!location) {
    return materials;
  }

  return [...materials].sort(
    (a, b) =>
      distanceInKm(location, a) - distanceInKm(location, b) ||
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  );
}

export function filterMaterials(
  materials: MaterialListing[],
  filters: MaterialFilters,
  location?: Coordinates | null,
) {
  const query = filters.query.trim().toLowerCase();
  const requestedCity = filters.location.trim().toLowerCase();
  const minPrice = Number(filters.minPrice);
  const maxPrice = Number(filters.maxPrice);
  const minRating = Number(filters.minRating);

  return sortMaterialsByDistance(
    materials.filter((material) => {
      const distance = location ? distanceInKm(location, material) : undefined;
      const categoryMatches =
        filters.category === "all" || material.category === filters.category;
      const queryMatches =
        !query ||
        material.materialName.toLowerCase().includes(query) ||
        material.supplierName.toLowerCase().includes(query) ||
        getCategoryName(material.category).toLowerCase().includes(query);
      const locationMatches =
        !requestedCity ||
        material.city.toLowerCase().includes(requestedCity) ||
        material.state.toLowerCase().includes(requestedCity) ||
        material.address.toLowerCase().includes(requestedCity);
      const distanceMatches =
        !location || filters.maxDistanceKm >= 500 || (distance ?? Infinity) <= filters.maxDistanceKm;
      const minMatches = !Number.isFinite(minPrice) || minPrice <= 0 || material.price >= minPrice;
      const maxMatches = !Number.isFinite(maxPrice) || maxPrice <= 0 || material.price <= maxPrice;
      const ratingMatches =
        !Number.isFinite(minRating) || minRating <= 0 || material.supplierRating >= minRating;

      return (
        categoryMatches &&
        queryMatches &&
        locationMatches &&
        distanceMatches &&
        minMatches &&
        maxMatches &&
        ratingMatches
      );
    }),
    location,
  );
}
