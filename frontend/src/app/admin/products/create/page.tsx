import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

async function createProduct() {
  await addDoc(collection(db, "products"), {
    title,
    price,
    unit,
    category,
    supplierId,
    downloadURL,
    filePath,
    createdAt: serverTimestamp(),
  });
}
