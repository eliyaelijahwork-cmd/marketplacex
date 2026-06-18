'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase/client';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  price: number;
  unit: string;
  imageUrl: string;
  supplierId: string;
  category: string;
  availability: string;
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    setProducts(productList);
    setLoading(false);
  };

  const handleDelete = async (productId: string, imageUrl: string) => {
    if (!confirm('Remove this product?')) return;
    try {
      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }
      await deleteDoc(doc(db, 'products', productId));
      fetchProducts();
      alert('Product removed');
    } catch (error) {
      alert('Error deleting product');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manage Products</h2>
      {products.length === 0 ? (
        <p>No products found</p>
      ) : (
        <div className="space-y-4">
          {products.map(product => (
            <div key={product.id} className="bg-white p-4 rounded-lg shadow flex gap-4 items-center">
              {product.imageUrl && (
                <Image src={product.imageUrl} alt={product.title} width={80} height={80} className="w-20 h-20 object-cover rounded" />
              )}
              <div className="flex-1">
                <h3 className="font-bold">{product.title}</h3>
                <p className="text-sm">₹{product.price} / {product.unit} | {product.category}</p>
                <p className="text-xs text-gray-500">Supplier ID: {product.supplierId}</p>
              </div>
              <button onClick={() => handleDelete(product.id, product.imageUrl)} className="bg-red-600 text-white px-4 py-2 rounded">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}