
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, orderBy, limit, startAfter, DocumentData } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
<Link href="/products" className="text-green-700">Products</Link>
interface Product {
  id: string;
  title: string;
  price: number;
  unit: string;
  imageUrl: string;
  category: string;
  location: string;
  supplierId: string;
  availability: string;
  createdAt: string;
}

const categories = ['All', 'Cement', 'Sand', 'Steel', 'Bricks', 'Tiles', 'Granite', 'Paint', 'Electrical', 'Plumbing', 'Hardware', 'Wood', 'Aggregates'];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [lastDoc, setLastDoc] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async (reset = false) => {
    setLoading(true);
    try {
      let q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(12));
      if (reset) {
        q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(12));
        setLastDoc(null);
      } else if (lastDoc) {
        q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(12));
      }
      const snapshot = await getDocs(q);
      const newProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      if (reset) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(newProducts.length === 12);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(true);
  }, []);

  const loadMore = () => {
    if (hasMore && !loading) fetchProducts();
  };

  // Filter products client-side after fetch (for demo simplicity; for production use Algolia/Firestore queries)
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesPrice = p.price >= priceRange.min && p.price <= priceRange.max;
    const matchesSearch = searchTerm === '' || p.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesPrice && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="container mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <h1 className="text-2xl font-bold text-green-800">MarketplaceX</h1>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-2 border rounded-md"
            />
          </div>
          <div className="flex gap-2">
            <Link href="/login" className="text-green-700">Login</Link>
            <Link href="/signup" className="bg-green-700 text-white px-4 py-2 rounded-md">Sell</Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="mb-4">
            <p className="font-semibold mb-2">Categories</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm ${selectedCategory === cat ? 'bg-green-700 text-white' : 'bg-gray-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">Price Range</p>
            <div className="flex gap-4 items-center">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                className="w-24 p-1 border rounded"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                className="w-24 p-1 border rounded"
              />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 && !loading ? (
          <p className="text-center text-gray-500">No products found. Try adjusting filters.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <div className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer">
                  {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.title} width={400} height={200} className="w-full h-48 object-cover rounded-t-lg" />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-t-lg">🖼️</div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-lg truncate">{product.title}</h3>
                    <p className="text-green-700 font-bold mt-1">₹{product.price} / {product.unit}</p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                    {product.availability === 'in_stock' && <span className="text-xs text-green-600">In Stock</span>}
                    {product.availability === 'limited' && <span className="text-xs text-yellow-600">Limited</span>}
                    {product.availability === 'out_of_stock' && <span className="text-xs text-red-600">Out of Stock</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {hasMore && filteredProducts.length === products.length && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              disabled={loading}
              className="bg-green-700 text-white px-6 py-2 rounded-md"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}