'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase/client';

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';

import { ref, deleteObject } from 'firebase/storage';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  price: number;
  unit: string;
  imageUrl: string;   // for display
  imagePath: string;  // for delete (IMPORTANT FIX)
  supplierId: string;
  category: string;
  createdAt: Timestamp;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const q = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Product[];

      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (product: Product) => {
    const confirmDelete = confirm(
      'Are you sure you want to delete this product?'
    );
    if (!confirmDelete) return;

    try {
      // 1. Delete image from Firebase Storage (SAFE WAY)
      if (product.imagePath) {
        const imageRef = ref(storage, product.imagePath);
        await deleteObject(imageRef);
      }

      // 2. Delete Firestore document
      await deleteDoc(doc(db, 'products', product.id));

      // 3. Update UI
      setProducts((prev) =>
        prev.filter((p) => p.id !== product.id)
      );

      alert('Product deleted successfully');
    } catch (error) {
      console.error(error);
      alert('Error deleting product');
    }
  };

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">
        Product Moderation
      </h2>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 p-4 bg-white shadow rounded"
            >
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  width={80}
                  height={80}
                  className="w-20 h-20 object-cover rounded"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 flex items-center justify-center">
                  📦
                </div>
              )}

              <div className="flex-1">
                <p className="font-bold">{product.title}</p>
                <p className="text-sm text-gray-500">
                  ₹{product.price} / {product.unit}
                </p>
                <p className="text-xs text-gray-400">
                  {product.category}
                </p>
                <p className="text-xs text-gray-400">
                  Added:{' '}
                  {product.createdAt
                    ?.toDate()
                    .toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => removeProduct(product)}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}