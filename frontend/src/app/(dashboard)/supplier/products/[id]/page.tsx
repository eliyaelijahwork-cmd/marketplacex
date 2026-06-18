'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      const docRef = doc(db, 'products', id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const prod = { id: docSnap.id, ...docSnap.data() };
        setProduct(prod);
        // Fetch supplier details
        if (prod.supplierId) {
          const supplierDoc = await getDoc(doc(db, 'users', prod.supplierId));
          if (supplierDoc.exists()) {
            setSupplier({ id: supplierDoc.id, ...supplierDoc.data() });
          }
        }
        // Fetch related products (same category)
        const relatedQuery = query(collection(db, 'products'), where('category', '==', prod.category), where('supplierId', '!=', prod.supplierId));
        const relatedSnap = await getDocs(relatedQuery);
        const related = relatedSnap.docs.slice(0, 4).map(d => ({ id: d.id, ...d.data() }));
        setRelatedProducts(related);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="text-center py-20">Loading product details...</div>;
  if (!product) return <div className="text-center py-20">Product not found.</div>;

  const handleCall = () => {
    if (supplier?.phone) window.location.href = `tel:${supplier.phone}`;
    else alert('Phone number not available');
  };

  const handleWhatsApp = () => {
    if (supplier?.whatsappNumber || supplier?.phone) {
      const number = supplier.whatsappNumber || supplier.phone;
      window.open(`https://wa.me/${number}`, '_blank');
    } else alert('WhatsApp number not available');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-2">
          <div className="bg-gray-100 rounded-lg overflow-hidden h-96 flex items-center justify-center">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.title} className="w-full h-full object-contain" />
            ) : (
              <span className="text-6xl">📦</span>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {product.images?.slice(1).map((img: string, idx: number) => (
              <img key={idx} src={img} className="w-20 h-20 object-cover rounded border" />
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold">{product.title}</h1>
          <p className="text-green-700 text-2xl font-bold mt-2">₹{product.price?.toLocaleString()} / {product.unit}</p>
          <div className="mt-4 flex gap-3">
            <button onClick={handleCall} className="bg-green-600 text-white px-6 py-2 rounded-md">📞 Call Supplier</button>
            <button onClick={handleWhatsApp} className="bg-green-500 text-white px-6 py-2 rounded-md">💬 WhatsApp</button>
          </div>
          <div className="mt-6 border-t pt-4">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="text-gray-700 mt-1">{product.description || 'No description provided.'}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">Category:</span> {product.category}</div>
            <div><span className="font-medium">Subcategory:</span> {product.subcategory || '-'}</div>
            <div><span className="font-medium">Min. Order:</span> {product.minOrderQty} {product.unit}</div>
            <div><span className="font-medium">Location:</span> {product.location}, {product.city}, {product.state}</div>
          </div>
        </div>
      </div>

      {/* Supplier Info Card */}
      {supplier && (
        <div className="mt-10 bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold">Supplier Information</h2>
          <div className="flex items-center gap-4 mt-2">
            {supplier.supplierProfile?.logoUrl && <img src={supplier.supplierProfile.logoUrl} className="w-16 h-16 rounded-full object-cover" />}
            <div>
              <p className="font-medium">{supplier.supplierProfile?.shopName || supplier.name || 'Supplier'}</p>
              <p className="text-sm text-gray-600">{supplier.supplierProfile?.address}</p>
              <p className="text-sm text-gray-600">⭐ {supplier.supplierProfile?.rating || 'New'} • {supplier.supplierProfile?.responseTime || 'Responds in minutes'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Related Materials</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map(p => (
              <Link key={p.id} href={`/products/${p.id}`} className="bg-white rounded shadow p-2">
                <div className="h-32 bg-gray-100 flex items-center justify-center">
                  {p.images?.[0] ? <img src={p.images[0]} className="h-full w-full object-cover" /> : <span>📦</span>}
                </div>
                <p className="font-medium truncate mt-1">{p.title}</p>
                <p className="text-green-700 text-sm">₹{p.price}/{p.unit}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}