 'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase/client';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  price: number;
  unit: string;
  imageUrl: string;
  category: string;
  availability: string;
  createdAt: string;
}

interface Inquiry {
  id: string;
  productId: string;
  productTitle: string;
  customerId: string;
  customerEmail: string;
  customerName?: string;
  message: string;
  createdAt: string;
  status: 'new' | 'read' | 'replied';
}

export default function SupplierDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'products' | 'inquiries'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    price: '',
    unit: 'bag',
    category: 'Cement',
    description: '',
    availability: 'in_stock',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ totalProducts: 0, totalInquiries: 0, profileViews: 0 });

  useEffect(() => {
    if (!loading && (!user || role !== 'supplier')) {
      router.push('/login');
    }
    if (user && role === 'supplier') {
      fetchProducts();
      fetchInquiries();
      fetchStats();
    }
  }, [user, role, loading]);

  const fetchProducts = async () => {
    const q = query(collection(db, 'products'), where('supplierId', '==', user?.uid));
    const querySnapshot = await getDocs(q);
    const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
    setProducts(productList);
    setStats(prev => ({ ...prev, totalProducts: productList.length }));
  };

  const fetchInquiries = async () => {
    const q = query(collection(db, 'inquiries'), where('supplierId', '==', user?.uid), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const inquiryList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Inquiry[];
    setInquiries(inquiryList);
    setStats(prev => ({ ...prev, totalInquiries: inquiryList.length }));
  };

  const fetchStats = async () => {
    // Placeholder – later can count profile views
    setStats(prev => ({ ...prev, profileViews: 120 }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleAddProduct = async () => {
    if (!user) return;
    if (!newProduct.title || !newProduct.price) {
      alert('Please fill title and price');
      return;
    }
    setUploading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      const productData = {
        title: newProduct.title,
        price: parseFloat(newProduct.price),
        unit: newProduct.unit,
        category: newProduct.category,
        description: newProduct.description,
        availability: newProduct.availability,
        imageUrl,
        supplierId: user.uid,
        createdAt: new Date().toISOString(),
        views: 0,
        inquiries: 0,
      };
      const docRef = await addDoc(collection(db, 'products'), productData);
      setProducts([...products, { id: docRef.id, ...productData }]);
      setShowAddForm(false);
      setNewProduct({ title: '', price: '', unit: 'bag', category: 'Cement', description: '', availability: 'in_stock' });
      setImageFile(null);
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert('Error adding product');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (productId: string, imageUrl: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter(p => p.id !== productId));
      fetchProducts();
    } catch (error) {
      alert('Error deleting product');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-green-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Supplier Dashboard</h1>
          {activeTab === 'products' && (
            <button onClick={() => setShowAddForm(true)} className="bg-yellow-500 text-black px-4 py-2 rounded-md">
              + Add Product
            </button>
          )}
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500">Total Products</p>
            <p className="text-2xl font-bold">{stats.totalProducts}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500">Total Inquiries</p>
            <p className="text-2xl font-bold">{stats.totalInquiries}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500">Profile Views</p>
            <p className="text-2xl font-bold">{stats.profileViews}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-2 px-4 ${activeTab === 'products' ? 'border-b-2 border-green-700 text-green-700 font-semibold' : 'text-gray-500'}`}
          >
            My Products
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`pb-2 px-4 ${activeTab === 'inquiries' ? 'border-b-2 border-green-700 text-green-700 font-semibold' : 'text-gray-500'}`}
          >
            Inquiries ({inquiries.length})
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            {products.length === 0 ? (
              <p className="text-gray-500">No products yet. Click "Add Product" to get started.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
                    {product.imageUrl && (
                      <Image src={product.imageUrl} alt={product.title} width={400} height={200} className="w-full h-48 object-cover" />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-lg">{product.title}</h3>
                      <p className="text-green-700 font-bold">₹{product.price} / {product.unit}</p>
                      <p className="text-sm text-gray-500">Category: {product.category}</p>
                      <div className="mt-2 flex justify-between">
                        <button className="text-blue-600">Edit</button>
                        <button onClick={() => handleDeleteProduct(product.id, product.imageUrl)} className="text-red-600">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Inquiries Tab */}
        {activeTab === 'inquiries' && (
          <>
            {inquiries.length === 0 ? (
              <p className="text-gray-500">No inquiries yet. Customers will contact you here.</p>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{inquiry.productTitle}</h3>
                        <p className="text-sm text-gray-500">From: {inquiry.customerEmail}</p>
                        <p className="text-sm text-gray-500">Date: {new Date(inquiry.createdAt).toLocaleString()}</p>
                        <p className="mt-2 bg-gray-100 p-2 rounded">{inquiry.message}</p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`mailto:${inquiry.customerEmail}?subject=Regarding ${inquiry.productTitle}`}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Reply via Email
                        </a>
                        <button
                          onClick={async () => {
                            // Mark as replied (optional)
                            alert('You can reply directly via email or WhatsApp. This inquiry has been noted.');
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Mark Replied
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Product Modal (same as before) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Product</h2>
            <input
              type="text"
              placeholder="Product title"
              value={newProduct.title}
              onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
              className="w-full p-2 border rounded-md mb-3"
            />
            <input
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              className="w-full p-2 border rounded-md mb-3"
            />
            <select
              value={newProduct.unit}
              onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
              className="w-full p-2 border rounded-md mb-3"
            >
              <option value="bag">Bag</option>
              <option value="ton">Ton</option>
              <option value="kg">Kg</option>
              <option value="piece">Piece</option>
              <option value="sqft">Sq.Ft.</option>
              <option value="load">Load</option>
            </select>
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              className="w-full p-2 border rounded-md mb-3"
            >
              <option>Cement</option><option>Sand</option><option>Steel</option><option>Bricks</option>
              <option>Tiles</option><option>Granite</option><option>Paint</option><option>Electrical</option>
              <option>Plumbing</option><option>Hardware</option><option>Wood</option><option>Aggregates</option>
            </select>
            <textarea
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="w-full p-2 border rounded-md mb-3"
              rows={3}
            />
            <select
              value={newProduct.availability}
              onChange={(e) => setNewProduct({ ...newProduct, availability: e.target.value })}
              className="w-full p-2 border rounded-md mb-3"
            >
              <option value="in_stock">In Stock</option>
              <option value="limited">Limited Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            <input type="file" accept="image/*" onChange={handleImageChange} className="mb-3" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border rounded-md">Cancel</button>
              <button onClick={handleAddProduct} disabled={uploading} className="px-4 py-2 bg-green-700 text-white rounded-md">
                {uploading ? 'Uploading...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}