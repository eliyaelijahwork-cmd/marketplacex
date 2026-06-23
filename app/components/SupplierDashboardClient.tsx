"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatCurrency,
  getCategoryName,
  type MaterialListing,
  type SupplierProfile,
} from "@/app/data/marketplace";
import { useAuth } from "@/app/contexts/AuthContext";
import { useMaterials } from "@/app/hooks/useMaterials";
import { deleteMaterialListing, isVerifiedSupplier } from "@/app/lib/firebase/marketplace";
import MaterialForm from "./MaterialForm";
import ProtectedRoute from "./ProtectedRoute";
import SupplierProfileForm from "./SupplierProfileForm";

const tabs = [
  { id: "profile", label: "My Profile" },
  { id: "listings", label: "My Listings" },
  { id: "add", label: "Add Listing" },
  { id: "analytics", label: "Analytics" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function SupplierDashboardClient() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, profile, firebaseReady } = useAuth();
  const { materials, loading } = useMaterials();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialListing | null>(null);
  const [deleteStatus, setDeleteStatus] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const supplierMaterials = useMemo(
    () => materials.filter((material) => material.supplierId === user?.uid),
    [materials, user?.uid],
  );
  const analytics = useMemo(() => getAnalytics(supplierMaterials), [supplierMaterials]);
  const completeProfile = profile ? isProfileComplete(profile) : false;
  const verifiedSupplier = isVerifiedSupplier(profile);

  async function handleDelete(material: MaterialListing) {
    const confirmed = window.confirm(`Delete ${material.materialName}?`);
    if (!confirmed) {
      return;
    }

    setDeleteStatus("");
    setDeleteError("");
    try {
      await deleteMaterialListing(material);
      setDeleteStatus("Listing deleted.");
    } catch (reason) {
      console.error(reason);
      setDeleteError(reason instanceof Error ? reason.message : "Could not delete listing.");
    }
  }

  function selectTab(tabId: TabId) {
    setActiveTab(tabId);
    setSidebarOpen(false);
    if (tabId !== "listings") {
      setEditingMaterial(null);
    }
  }

  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label ?? "Dashboard";

  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8">
          <div>
            <p className="text-sm font-black uppercase text-cyan-700">Supplier dashboard</p>
            <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              Manage profile, listings, and buyer reach.
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Only verified suppliers can post materials. Listing owners can manage their own
              verified stock.
            </p>
          </div>
          <Link
            className="w-full rounded-md bg-cyan-700 px-5 py-3 text-center font-black text-white transition hover:bg-cyan-800 md:w-auto"
            href="/materials"
          >
            View Marketplace
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {!firebaseReady && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            Firebase env values are missing. Add root `.env.local`, then enable Google and Phone
            providers before posting live data.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Active listings" value={String(supplierMaterials.length)} />
          <Stat label="Total inventory value" value={formatCurrency(analytics.inventoryValue)} />
          <Stat label="Categories covered" value={String(analytics.categoryCount)} />
          <Stat
            label="Verification"
            value={verifiedSupplier ? "Verified" : profile?.verificationStatus ?? "Pending"}
          />
        </div>

        {!verifiedSupplier && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            Your profile can be saved now, but posting is locked until MarketPlaceX verifies the
            supplier. This prevents fake or duplicate marketplace listings.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
          <div className="grid gap-3">
            <button
              aria-expanded={sidebarOpen}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-left text-sm font-black text-slate-950 shadow-sm lg:hidden"
              onClick={() => setSidebarOpen((open) => !open)}
              type="button"
            >
              <span>{activeTabLabel}</span>
              <Icon path={sidebarOpen ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} />
            </button>

            <aside
              className={`${
                sidebarOpen ? "grid" : "hidden"
              } gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-40 lg:grid lg:h-fit`}
            >
              {tabs.map((tab) => (
                <button
                  className={`flex w-full items-center justify-between rounded-md px-4 py-3 text-left text-sm font-black transition ${
                    activeTab === tab.id
                      ? "bg-slate-950 text-white"
                      : "text-slate-700 hover:bg-cyan-50 hover:text-cyan-700"
                  }`}
                  key={tab.id}
                  onClick={() => selectTab(tab.id)}
                  type="button"
                >
                  <span>{tab.label}</span>
                  {activeTab === tab.id && <Icon path="m5 12 4 4L19 6" />}
                </button>
              ))}
            </aside>
          </div>

          <div className="min-w-0">
            {activeTab === "profile" && <SupplierProfileForm />}

            {activeTab === "add" && (
              <section className="grid gap-4">
                {!completeProfile && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                    Complete your supplier profile first so listings include contact details and GPS
                    location.
                  </div>
                )}
                {profile && completeProfile ? (
                  verifiedSupplier ? (
                    <MaterialForm supplier={profile} onSaved={() => selectTab("listings")} />
                  ) : (
                    <VerificationLocked />
                  )
                ) : (
                  <SupplierProfileForm />
                )}
              </section>
            )}

            {activeTab === "listings" && (
              <section className="grid gap-5">
                {editingMaterial && profile && verifiedSupplier ? (
                  <div className="grid gap-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <h2 className="text-2xl font-black text-slate-950">
                        Edit {editingMaterial.materialName}
                      </h2>
                      <button
                        className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-black text-slate-700 md:w-auto"
                        onClick={() => setEditingMaterial(null)}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                    <MaterialForm
                      initialMaterial={editingMaterial}
                      onSaved={() => setEditingMaterial(null)}
                      supplier={profile}
                    />
                  </div>
                ) : (
                  <ListingTable
                    loading={loading}
                    materials={supplierMaterials}
                    onDelete={handleDelete}
                    onEdit={setEditingMaterial}
                    canEdit={verifiedSupplier}
                  />
                )}
                {(deleteStatus || deleteError) && (
                  <p
                    className={`rounded-md p-3 text-sm font-semibold ${
                      deleteError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {deleteError || deleteStatus}
                  </p>
                )}
              </section>
            )}

            {activeTab === "analytics" && (
              <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
                <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
                  <h2 className="text-2xl font-black text-slate-950">Category performance</h2>
                  <div className="mt-5 grid gap-3">
                    {analytics.byCategory.map((item) => (
                      <div
                        className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                        key={item.category}
                      >
                        <p className="font-black text-slate-950">{getCategoryName(item.category)}</p>
                        <p className="text-sm font-bold text-cyan-700">
                          {item.count} listings · {formatCurrency(item.value)}
                        </p>
                      </div>
                    ))}
                    {analytics.byCategory.length === 0 && (
                      <p className="text-slate-600">Analytics appear after your first listing.</p>
                    )}
                  </div>
                </article>
                <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
                  <h2 className="text-2xl font-black text-slate-950">Buyer actions tracked</h2>
                  <div className="mt-5 grid gap-3 text-sm font-semibold text-slate-700">
                    <p>Call clicks: ready for analytics integration</p>
                    <p>WhatsApp clicks: ready for analytics integration</p>
                    <p>Listing views: page-level tracking hook can be added here</p>
                  </div>
                </article>
              </section>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function VerificationLocked() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-2xl font-black text-slate-950">Verification required</h2>
      <p className="mt-3 text-slate-600">
        Only verified suppliers can create or edit material listings. Complete your profile and
        wait for verification before posting.
      </p>
    </div>
  );
}

function ListingTable({
  materials,
  loading,
  onEdit,
  onDelete,
  canEdit,
}: {
  materials: MaterialListing[];
  loading: boolean;
  onEdit: (material: MaterialListing) => void;
  onDelete: (material: MaterialListing) => void;
  canEdit: boolean;
}) {
  if (loading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">Loading listings...</div>;
  }

  if (materials.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">No listings yet</h2>
        <p className="mt-3 text-slate-600">Add your first material listing to start receiving calls.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3 font-black">Material</th>
            <th className="px-4 py-3 font-black">Category</th>
            <th className="px-4 py-3 font-black">Price</th>
            <th className="px-4 py-3 font-black">Location</th>
            <th className="px-4 py-3 font-black">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {materials.map((material) => (
            <tr key={material.id}>
              <td className="px-4 py-3 font-black text-slate-950">{material.materialName}</td>
              <td className="px-4 py-3 text-slate-600">{getCategoryName(material.category)}</td>
              <td className="px-4 py-3 text-slate-600">
                {formatCurrency(material.price)} / {material.unit}
              </td>
              <td className="px-4 py-3 text-slate-600">{material.city}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link
                    className="rounded-md border border-slate-300 px-3 py-1.5 font-bold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-700"
                    href={`/materials/${material.id}`}
                  >
                    View
                  </Link>
                  <button
                    className="rounded-md border border-slate-300 px-3 py-1.5 font-bold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-700"
                    disabled={!canEdit}
                    onClick={() => onEdit(material)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-md border border-red-200 px-3 py-1.5 font-bold text-red-700 transition hover:bg-red-50"
                    onClick={() => onDelete(material)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-black uppercase text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
    </article>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function isProfileComplete(profile: SupplierProfile) {
  return Boolean(
    profile.supplierName &&
      profile.companyName &&
      profile.phoneNumber &&
      profile.whatsappNumber &&
      profile.address &&
      profile.city &&
      profile.state &&
      profile.latitude &&
      profile.longitude,
  );
}

function getAnalytics(materials: MaterialListing[]) {
  const byCategory = [...new Set(materials.map((material) => material.category))].map((category) => {
    const categoryMaterials = materials.filter((material) => material.category === category);
    return {
      category,
      count: categoryMaterials.length,
      value: categoryMaterials.reduce((sum, material) => sum + material.price, 0),
    };
  });

  return {
    inventoryValue: materials.reduce((sum, material) => sum + material.price, 0),
    categoryCount: byCategory.length,
    byCategory,
  };
}
