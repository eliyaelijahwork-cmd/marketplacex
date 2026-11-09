function slugify(value: string) { return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

export type DirectoryCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  iconPath: string;
  image: string;
  seoTitle: string;
  seoDescription: string;
  displayOrder: number;
  active: boolean;
  subcategories: DirectorySubcategory[];
};

export type DirectorySubcategory = {
  id: string;
  slug: string;
  name: string;
  parentCategoryId: string;
  parentSubcategoryId?: string | null;
  description?: string;
  level?: number;
  displayOrder: number;
  active: boolean;
  children?: DirectorySubcategory[];
};

const definitions: Array<[string, string, string, string]> = [
  ["Construction & Contractors", "Construction teams and specialists for projects of every size.", "🏗️", "Building contractors|Civil contractors|Residential construction|Commercial construction|Architects|Structural engineers|Road contractors|Renovation|Roofing|Painting|Flooring|Waterproofing|Demolition|Fabrication|Excavation|Precast construction"],
  ["Building Materials", "Compare trusted suppliers of building and finishing materials.", "🧱", "Cement|OPC cement|PPC cement|White cement|M-Sand|P-Sand|River sand|Crusher sand|Aggregates|10mm aggregate|20mm aggregate|40mm aggregate|TMT steel|Structural steel|Bricks|Fly ash bricks|AAC blocks|CLC blocks|Concrete blocks|Paver blocks|Granite|Marble|Tiles|Plywood|Timber|Glass|Toughened glass|ACP sheets|WPC panels|PVC pipes|CPVC pipes|HDPE pipes|Paints|Putty|Hardware|Sanitaryware|Construction chemicals"],
  ["Real Estate", "Find property for sale, rent, investment, or commercial use.", "🏠", "Residential plots|Commercial plots|Apartments|Villas|Independent houses|Agricultural land|Industrial land|Rental properties|Commercial buildings|Office spaces|PG accommodation|Property consultants"],
  ["Interior & Home Decor", "Interior design, furniture, décor, and fit-out professionals.", "🛋️", "Interior designers|Modular kitchens|Wardrobes|Home furniture|Office furniture|Lighting|Curtains & blinds|Wallpapers|Home décor|False ceiling|Home renovation|Turnkey interiors"],
  ["Industrial Machinery", "New and used machinery, equipment, parts, and service providers.", "⚙️", "CNC machines|Lathe machines|Drilling machines|Hydraulic machines|Welding machines|Cutting machines|Compressors|Generators|Pumps|Conveyor systems|Used machinery|Industrial spare parts"],
  ["Stone Crusher & Mining", "Crusher plants, quarry machinery, installation, and maintenance.", "⛏️", "Jaw crushers|Cone crushers|VSI crushers|Impact crushers|Screening plants|Sand washing plants|M-Sand plants|Mobile crushers|Quarry machinery|Crusher spare parts|Plant installation|Crusher maintenance"],
  ["Granite & Marble", "Stone slabs, processing machinery, fabrication, and exporters.", "🪨", "Granite slabs|Marble slabs|Granite blocks|Gang saw machines|Multi-wire saws|Block cutting machines|Slab cutting machines|Edge cutting machines|Polishing machines|CNC stone machines|Stone processing|Stone exporters"],
  ["Electrical & Electronics", "Electrical products, components, installations, and repair.", "🔌", "Electrical wires & cables|Switches & sockets|Lighting fixtures|Circuit breakers|Panels & switchgear|Transformers|Motors & drives|Home appliances|Industrial electronics|CCTV & surveillance|Electrical contractors|Electronics repair"],
  ["Solar & Renewable Energy", "Solar power systems, renewable equipment, and services.", "☀️", "Solar panels|Solar inverters|Solar batteries|Rooftop solar|Solar pumps|Solar street lights|Solar water heaters|Commercial solar EPC|Wind energy equipment|Energy storage|Solar maintenance|Renewable energy consultants"],
  ["Plumbing & Sanitation", "Plumbing supplies, bathroom fittings, and installation services.", "🚰", "PVC pipes & fittings|CPVC pipes & fittings|HDPE pipes & fittings|Pumps & motors|Water tanks|Bathroom fittings|Sanitaryware|Water heaters|Waterproofing|Plumbers|Drainage systems|Water treatment"],
  ["Automobile", "Vehicle sales, parts, repairs, rentals, and related services.", "🚗", "Cars|Two-wheelers|Commercial vehicles|Auto spare parts|Tyres & batteries|Vehicle servicing|Auto body shops|Car rentals|Vehicle accessories|EV vehicles & chargers|Driving schools|Used vehicles"],
  ["Transport & Logistics", "Freight, delivery, warehousing, and fleet services.", "🚚", "Packers & movers|Road freight|Truck transport|Courier services|Warehousing|Cold chain logistics|Cargo handling|Container transport|Last-mile delivery|Fleet rentals|International shipping|Logistics consultants"],
  ["Agriculture & Farming", "Farm inputs, machinery, produce, and agricultural services.", "🌾", "Seeds & seedlings|Fertilizers|Pesticides|Farm machinery|Tractors & implements|Irrigation systems|Animal feed|Organic farming|Fresh produce|Dairy farming|Poultry farming|Agricultural consultants"],
  ["Manufacturing", "Manufacturers, fabrication units, and contract production partners.", "🏭", "Metal fabrication|Plastic products|Textile manufacturing|Food processing|Machined components|Industrial fabrication|Rubber products|Furniture manufacturing|Electrical manufacturing|OEM production|Contract manufacturing|Quality testing"],
  ["Chemicals & Industrial Supplies", "Industrial chemicals, safety products, and process supplies.", "🧪", "Industrial chemicals|Adhesives & sealants|Lubricants & oils|Water treatment chemicals|Paints & coatings|Laboratory chemicals|Industrial gases|Safety equipment|PPE supplies|Welding consumables|Bearings & power transmission|Valves & fittings"],
  ["Packaging & Printing", "Packaging materials, printing services, and labeling solutions.", "📦", "Corrugated boxes|Flexible packaging|Paper bags|Plastic packaging|Labels & stickers|Offset printing|Digital printing|Screen printing|Packaging machinery|Food packaging|Industrial packaging|Promotional printing"],
  ["Hardware & Tools", "Hand tools, power tools, fasteners, and workshop supplies.", "🔧", "Hand tools|Power tools|Cutting tools|Fasteners|Locks & security hardware|Welding tools|Measuring tools|Ladders & scaffolding|Workshop equipment|Safety tools|Garden tools|Tool repair"],
  ["Wholesale & Distribution", "Wholesale suppliers and distributors across product sectors.", "🏬", "FMCG wholesalers|Building goods distributors|Electronics wholesalers|Textile wholesalers|Food distributors|Pharmaceutical distributors|Industrial distributors|Import distributors|Retail supply|Bulk trading|Franchise distributors|Wholesale marketplaces"],
  ["Healthcare & Hospitals", "Hospitals, clinics, diagnostic centers, and care providers.", "🏥", "Multi-speciality hospitals|Clinics|Dental clinics|Diagnostic laboratories|Imaging centers|Pharmacies|Home healthcare|Physiotherapy centers|Nursing homes|Ambulance services|Mental health clinics|Specialist doctors"],
  ["Medical Equipment", "Medical devices, hospital equipment, and maintenance services.", "🩺", "Patient monitors|Imaging equipment|Surgical instruments|Hospital beds|Laboratory equipment|Dental equipment|Rehabilitation devices|Medical furniture|Oxygen equipment|Medical consumables|Equipment rental|Biomedical equipment service"],
  ["Beauty & Personal Care", "Salons, personal care products, and beauty professionals.", "💄", "Beauty salons|Barber shops|Spas|Skin care clinics|Cosmetics|Hair care products|Makeup artists|Nail studios|Beauty equipment|Bridal beauty|Tattoo studios|Personal care services"],
  ["Fitness & Wellness", "Fitness centers, wellness practitioners, and health programs.", "💪", "Gyms|Yoga studios|Personal trainers|Pilates studios|Wellness retreats|Nutritionists|Sports therapy|Meditation classes|Fitness equipment|Weight management|Corporate wellness|Recovery and mobility"],
  ["Restaurants & Food", "Restaurants, caterers, food makers, and hospitality suppliers.", "🍽️", "Restaurants|Caterers|Bakeries|Cafes|Cloud kitchens|Food manufacturers|Catering equipment|Commercial kitchens|Food ingredients|Food delivery|Sweet shops|Food safety services"],
  ["Grocery & Supermarkets", "Grocery stores, bulk food suppliers, and supermarket services.", "🛒", "Supermarkets|Grocery stores|Wholesale groceries|Fresh fruits & vegetables|Dairy products|Meat & seafood|Packaged foods|Organic groceries|Beverage suppliers|Institutional groceries|Convenience stores|Grocery delivery"],
  ["Education & Training", "Schools, learning centers, coaching, and professional training.", "🎓", "Schools|Colleges|Coaching centers|Vocational training|Language classes|Online learning|IT training|Corporate training|Test preparation|Arts & music classes|Special education|Study abroad consultants"],
  ["IT & Software", "Software development, IT support, cloud, and technology services.", "💻", "Custom software development|Web development|Mobile apps|Cloud services|IT support|Cybersecurity|ERP & CRM|Networking|Data analytics|AI & automation|Managed IT services|Software testing"],
  ["Digital Marketing & Advertising", "Digital campaigns, creative services, and advertising partners.", "📣", "SEO services|Social media marketing|Paid advertising|Content marketing|Graphic design|Brand strategy|Video production|Influencer marketing|Email marketing|Web analytics|Outdoor advertising|Marketing agencies"],
  ["Financial Services", "Financial advisors, accounting, insurance, and lending services.", "💳", "Chartered accountants|Bookkeeping|Tax consultants|Business loans|Insurance agents|Wealth management|Financial planning|Auditors|Payment services|Investment advisors|Company accounting|Loan consultants"],
  ["Legal Services", "Legal advice, representation, documentation, and compliance.", "⚖️", "Corporate lawyers|Property lawyers|Civil advocates|Criminal lawyers|Family lawyers|Intellectual property|Legal documentation|Company registration|Tax law|Labour law|Mediation services|Legal consultants"],
  ["Recruitment & Manpower", "Recruitment agencies, staffing, and workforce solutions.", "👥", "Executive search|Permanent recruitment|Temporary staffing|Industrial manpower|IT recruitment|Payroll services|Security staffing|Facility staffing|Overseas recruitment|HR consultants|Background verification|Contract staffing"],
  ["Travel & Tourism", "Travel agencies, tour operators, stays, and transport bookings.", "✈️", "Travel agencies|Tour operators|Hotels & resorts|Homestays|Flight booking|Bus & rail booking|Car rentals|Adventure tourism|Pilgrimage tours|Corporate travel|Visa services|Travel insurance"],
  ["Wedding & Events", "Event planners, venues, catering, and celebration services.", "💍", "Wedding planners|Event venues|Wedding photography|Decorators|Caterers|Sound & lighting|Event rentals|Invitation designers|Makeup & styling|Corporate events|Exhibition organizers|Entertainment acts"],
  ["Fashion & Clothing", "Apparel, tailoring, fashion design, and textile businesses.", "👗", "Men's clothing|Women's clothing|Kids clothing|Uniform suppliers|Tailors|Fashion designers|Textile fabrics|Ethnic wear|Footwear|Fashion accessories|Garment manufacturers|Laundry & dry cleaning"],
  ["Jewellery & Gifts", "Jewellery stores, gift makers, and custom keepsakes.", "🎁", "Gold jewellery|Silver jewellery|Diamond jewellery|Imitation jewellery|Jewellery manufacturers|Custom jewellery|Watches|Corporate gifts|Personalized gifts|Handicrafts|Gift shops|Jewellery repair"],
  ["Home Maintenance", "Repairs, home improvement, and property maintenance providers.", "🪛", "Electricians|Plumbers|Carpenters|Appliance repair|AC repair|Painting services|Roof repairs|Pest-proofing|Home renovation|Handyman services|Door & window repair|Home inspection"],
  ["Cleaning & Pest Control", "Residential, commercial, and industrial cleaning services.", "🧹", "House cleaning|Office cleaning|Deep cleaning|Sofa & carpet cleaning|Pest control|Termite treatment|Disinfection services|Facade cleaning|Industrial cleaning|Kitchen exhaust cleaning|Water tank cleaning|Waste removal"],
  ["Security Services", "Security guards, access systems, and protection services.", "🛡️", "Security guards|CCTV installation|Access control|Alarm systems|Event security|Residential security|Industrial security|Fire safety systems|Security equipment|Monitoring services|Executive protection|Security consulting"],
  ["Pets & Veterinary", "Veterinary care, pet supplies, boarding, and grooming.", "🐾", "Veterinary clinics|Pet hospitals|Pet food|Pet grooming|Pet boarding|Pet training|Pet accessories|Livestock veterinary|Animal diagnostics|Pet adoption|Aquarium supplies|Mobile veterinary care"],
  ["Entertainment & Recreation", "Venues, performers, leisure activities, and recreation services.", "🎭", "Theatres|Live music|Amusement parks|Gaming centers|Artists & performers|Production studios|Party venues|Bowling & indoor games|Cultural events|Recreation clubs|Audio visual rental|Cinema services"],
  ["Other Services", "Local and specialist services that span multiple industries.", "✨", "Consulting services|Repair services|Translation services|Research services|Local business services|Equipment rental|Business support|Personal services|Technical services|Inspection services|Custom services|Miscellaneous providers"],
  ["Government & Public Services", "Public offices, civic services, and approved citizen support.", "🏛️", "Municipal services|Public utilities|Citizen service centers|Government offices|Public transport|Public health services|Public education|Licensing offices|Community services|Public works|Emergency services|Civic information"],
  ["Education Supplies", "Books, classroom materials, furniture, and learning equipment.", "📚", "School books|Stationery|School uniforms|Classroom furniture|Laboratory supplies|Smart classroom systems|Sports equipment|Art supplies|Educational toys|Library supplies|Exam materials|School transport supplies"],
  ["Water & Environment", "Water management, environmental services, and sustainability.", "💧", "Water purification|Water testing|Wastewater treatment|Rainwater harvesting|Borewell services|Environmental consulting|Recycling services|Solid waste management|Air quality monitoring|Effluent treatment|Water tankers|Sustainability audits"],
  ["Building Equipment Rental", "Rental equipment for construction sites and building projects.", "🚜", "Excavators|Cranes|Concrete mixers|Scaffolding|Earthmoving equipment|Boom lifts|Generators|Road equipment|Compactors|Construction hoists|Safety equipment rental|Site cabins"],
  ["Jobs & Careers", "Job openings, career guidance, and employment services.", "💼", "Construction jobs|Engineering jobs|Manufacturing jobs|IT jobs|Healthcare jobs|Sales jobs|Driver jobs|Apprenticeships|Career counseling|Resume services|Job placement|Internships"],
  ["Professional Consultants", "Specialist advice for business, engineering, and operations.", "🧑‍💼", "Management consultants|Civil consultants|Structural consultants|Architectural consultants|Environmental consultants|Quality consultants|Business strategy|Project management|Process improvement|Valuation consultants|Technical advisors|Compliance consultants"],
  ["Export & Import", "Importers, exporters, freight partners, and trade compliance.", "🌐", "Export houses|Import agents|Customs brokers|Export documentation|Import documentation|Trade compliance|Freight forwarding|Export finance|Sourcing agents|International distributors|Inspection services|Trade consultants"],
  ["Industrial Services", "Maintenance, testing, and support for industrial operations.", "🏗️", "Industrial maintenance|Plant installation|Machine repair|Electrical maintenance|Welding services|Calibration|Non-destructive testing|Industrial automation|Factory cleaning|Boiler services|Shutdown maintenance|Equipment inspection"],
  ["Security & Investigation", "Licensed investigation, verification, and specialist security.", "🔎", "Private investigators|Background checks|Corporate investigations|Asset tracing|Due diligence|Fraud investigation|Surveillance services|Forensic consultants|Employee verification|Security audits|Cyber investigations|Risk assessment"],
  ["Sports & Outdoor", "Sports equipment, outdoor activities, and recreation providers.", "⚽", "Sports goods|Outdoor gear|Camping equipment|Bicycle shops|Sports academies|Swimming pools|Adventure activities|Team uniforms|Playground equipment|Outdoor furniture|Trekking guides|Sports event services"],
];

const descriptions: Record<string, string> = {
  "Construction & Contractors": "Building contractors, civil contractors, residential construction, commercial construction, architects, structural engineers, road contractors, renovation, roofing, painting, flooring, waterproofing, demolition, fabrication, excavation, precast construction.",
  "Building Materials": "Cement, OPC cement, PPC cement, white cement, M-Sand, P-Sand, river sand, crusher sand, aggregates, graded aggregates, TMT steel, structural steel, bricks, AAC blocks, concrete blocks, paver blocks, granite, marble, tiles, plywood, timber, glass, ACP, pipes, paints, hardware, sanitaryware, construction chemicals.",
  "Real Estate": "Residential and commercial property for sale or rent, land, offices, accommodation, and property consultants.",
  "Industrial Machinery": "Find new and used industrial machines, production equipment, spare parts, and machinery service providers.",
  "Stone Crusher & Mining": "Compare crushers, screening and washing plants, quarry equipment, spare parts, installation, and maintenance.",
  "Granite & Marble": "Source granite and marble slabs, blocks, stone processing machinery, fabrication, and export services.",
};

const iconPaths = [
  "M4 18h16M6 18l2-8 4 4 4-6 2 10", "M4 7h16v10H4zM4 12h16", "M4 20V9l8-6 8 6v11", "M3 12h18M5 7h14v12H5z", "M4 18h16M6 18V6h12v12", "M4 20l5-16 4 8 3-5 4 13", "M4 18h16M5 6h14v12H5z", "m13 2-8 12h6l-1 8 8-12h-6z", "M4 12h16M12 4v16", "M5 17h14l-2-7H7zM8 17v3m8-3v3", "M3 14h18M6 14V7h12v7", "M3 15h18l-3-6H7zM6 15v3m12-3v3", "M4 19h16M7 19V8l5-4 5 4v11", "M5 5h14v14H5zM8 9h8M8 13h8", "M7 20h10l2-13H5z", "M4 7h16v10H4zM7 7v10", "M3 8h18v10H3zM7 8V5h10v3", "M4 5h16v14H4zM8 9h8", "M6 5h12v14H6zM9 8v8m6-8v8", "M4 18h16M5 6h14v12H5z", "M5 20c0-7 4-12 7-16 3 4 7 9 7 16z", "M4 8h16v10H4zM7 8V5h10v3", "M6 4h12v16H6zM9 8h6", "M4 18h16M5 6h14v12H5z", "M7 4h10v16H7z", "M4 20 20 4M4 8h5V3", "M3 8h18v12H3zM7 4h10v4", "M5 19V6h14v13zM8 9h8", "M4 12h16M12 4v16", "M5 5h14v14H5z", "M4 19h16M7 19V8l5-4 5 4v11", "M4 7h16v10H4zM8 7V4h8v3", "M5 20V8l7-4 7 4v12", "M4 6h16v12H4zM7 9h10", "M4 19h16M7 19V7h10v12", "M5 4h14v16H5z", "M3 19h18M6 19V7l6-4 6 4v12", "M6 4h12v16H6zM9 8h6", "M4 5h16v14H4z", "M4 18h16M6 18V7h12v11", "M4 8h16v12H4zM7 5h10v3", "M5 20h14M7 20V9h10v11", "M4 6h16v12H4zM8 10h8", "M4 20h16M6 20V7l6-4 6 4v13", "M4 8h16v12H4z", "M5 19h14M7 19V6h10v13", "M4 18h16M6 18V6h12v12", "M4 7h16v12H4z", "M4 19h16M6 19V8h12v11",
];

const usedSubcategorySlugs = new Set<string>();
export const mainCategories: DirectoryCategory[] = definitions.map(([name, description, icon, rawSubs], index) => {
  const slug = slugify(name);
  const id = slug;
  const image = index < 7 || index === 43 ? "/assets/construction-marketplace-hero.png" : "";
  const legacyNames: Record<string, string> = { aggregates: "Aggregates", sand: "Sand", "bricks-blocks": "Bricks & Blocks", cement: "Cement", steel: "Steel", "electrical-materials": "Electrical Materials", "hardware-materials": "Hardware Materials", "plumbing-materials": "Plumbing Materials", "plywood-wood": "Plywood & Wood" };
  const legacyIdsByName = Object.fromEntries(Object.entries(legacyNames).map(([legacyId, legacyName]) => [legacyName.toLowerCase(), legacyId]));
  const subcategories = rawSubs.split("|").map((label, subIndex) => {
    const slugBase = slugify(label);
    let childSlug = slugBase;
    if (usedSubcategorySlugs.has(childSlug)) childSlug = `${slugBase}-${slug}`;
    let duplicate = 2;
    while (usedSubcategorySlugs.has(childSlug)) childSlug = `${slugBase}-${slug}-${duplicate++}`;
    usedSubcategorySlugs.add(childSlug);
    return {
    id: legacyIdsByName[label.toLowerCase()] ?? `${slug}-${childSlug}`,
    slug: childSlug,
    name: label,
    parentCategoryId: id,
    displayOrder: subIndex + 1,
    active: true,
  }; });
  // Legacy material IDs remain stable and become first-class Building Materials children.
  if (name === "Building Materials") {
    const legacy = Object.keys(legacyNames);
    for (const legacyId of legacy) {
      if (!subcategories.some((item) => item.id === legacyId || item.name.toLowerCase() === legacyNames[legacyId].toLowerCase())) subcategories.push({
        id: legacyId, slug: legacyId, name: legacyNames[legacyId],
        parentCategoryId: id, displayOrder: 100 + legacy.indexOf(legacyId), active: true,
      });
      usedSubcategorySlugs.add(legacyId);
    }
  }
  return {
    id, slug, name, description: descriptions[name] ?? description, icon,
    image, seoTitle: `${name} Businesses, Suppliers & Services | MarketPlaceX`,
    seoDescription: `Find and compare ${name.toLowerCase()} businesses, suppliers, products, and services on MarketPlaceX.`,
    displayOrder: index + 1, active: true, subcategories,
    iconPath: iconPaths[index] ?? "M4 7h16v10H4z",
  };
});

export function findDirectoryCategory(slug: string) {
  return mainCategories.find((item) => item.slug === slug || item.id === slug);
}
