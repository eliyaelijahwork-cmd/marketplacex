import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => {
  const source = require("node:fs").readFileSync(filename, "utf8");
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
};
const { mainCategories } = require("../app/data/directory.ts");

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/^['"]|['"]$/g, "").replace(/\\n/g, "\n");
if (!projectId) throw new Error("Set FIREBASE_ADMIN_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID before seeding.");
if (!getApps().length) initializeApp({ projectId, credential: clientEmail && privateKey ? cert({ projectId, clientEmail, privateKey }) : applicationDefault() });
const db = getFirestore();

async function seedCollection(collectionName, rows) {
  let created = 0;
  for (let offset = 0; offset < rows.length; offset += 400) {
    const group = rows.slice(offset, offset + 400);
    const refs = group.map((row) => db.collection(collectionName).doc(row.id));
    const snapshots = await Promise.all(refs.map((ref) => ref.get()));
    const batch = db.batch(); let writes = 0;
    group.forEach((row, index) => {
      if (snapshots[index].exists) return;
      const data = { ...row };
      delete data.id;
      batch.create(refs[index], { ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      writes += 1;
    });
    if (writes) await batch.commit();
    created += writes;
  }
  return created;
}

const categories = mainCategories.map((category) => ({
  ...Object.fromEntries(Object.entries(category).filter(([key]) => key !== "subcategories")),
  enabled: category.active,
}));
const subcategories = mainCategories.flatMap((category) => category.subcategories.map((subcategory) => ({
  ...subcategory,
  enabled: subcategory.active,
  categorySlug: category.slug,
  parentCategoryId: category.id,
  parentSubcategoryId: null,
  level: 1,
  description: `${subcategory.name} providers and related products or services.`,
  icon: category.icon,
  image: category.image,
  seoTitle: `${subcategory.name} | ${category.name} | MarketPlaceX`,
  seoDescription: `Find ${subcategory.name.toLowerCase()} providers, products, and services on MarketPlaceX.`,
})));

const [categoryCount, subcategoryCount] = await Promise.all([
  seedCollection("categories", categories),
  seedCollection("subcategories", subcategories),
]);
const legacyMaterialIds = ["aggregates", "sand", "bricks-blocks", "cement", "steel", "electrical-materials", "hardware-materials", "plumbing-materials", "plywood-wood"];
let legacyMapped = 0;
for (const id of legacyMaterialIds) {
  const ref = db.collection("categories").doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data()?.legacyMappedTo === "building-materials") continue;
  await ref.update({ active: false, enabled: false, legacyMappedTo: "building-materials", legacySubcategoryId: id, updatedAt: FieldValue.serverTimestamp() });
  legacyMapped += 1;
}
console.log(`Seed complete. Created ${categoryCount} categories and ${subcategoryCount} subcategories; mapped ${legacyMapped} legacy category documents. Existing category content and product references were preserved.`);
