
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Supplier = {
  id: string;
  supplierName?: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  city?: string;
  address?: string;
  isVerified?: boolean;
  verificationStatus?: string;
};

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState("");

  async function loadSuppliers() {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "users"));

      const data = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Supplier[];

      // Show accounts containing supplier information.
      setSuppliers(
        data.filter(
          (item) =>
            item.companyName ||
            item.supplierName ||
            item.phoneNumber
        )
      );
    } catch (error) {
      console.error("Supplier loading error:", error);
      alert("Could not load suppliers. Check Firebase permissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function updateVerification(
    supplier: Supplier,
    status: "approved" | "rejected"
  ) {
    try {
      setUpdating(supplier.id);

      await updateDoc(doc(db, "users", supplier.id), {
        isVerified: status === "approved",
        verificationStatus: status,
      });

      setSuppliers((previous) =>
        previous.map((item) =>
          item.id === supplier.id
            ? {
                ...item,
                isVerified: status === "approved",
                verificationStatus: status,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Verification update error:", error);
      alert("Update failed. Check Firestore security rules.");
    } finally {
      setUpdating("");
    }
  }

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const text = [
        supplier.supplierName,
        supplier.companyName,
        supplier.email,
        supplier.phoneNumber,
        supplier.city,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "approved" && supplier.isVerified === true) ||
        (filter === "pending" &&
          !supplier.isVerified &&
          supplier.verificationStatus !== "rejected") ||
        (filter === "rejected" &&
          supplier.verificationStatus === "rejected");

      return matchesSearch && matchesFilter;
    });
  }, [suppliers, search, filter]);

  const pending = suppliers.filter(
    (s) => !s.isVerified && s.verificationStatus !== "rejected"
  ).length;

  const approved = suppliers.filter((s) => s.isVerified).length;

  const rejected = suppliers.filter(
    (s) => s.verificationStatus === "rejected"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Supplier Management
            </h1>
            <p className="text-sm text-slate-500">
              Manage and verify MarketPlaceX suppliers.
            </p>
          </div>

          <button
            onClick={loadSuppliers}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white"
          >
            Refresh
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-slate-500">Total suppliers</p>
            <h2 className="text-3xl font-bold">{suppliers.length}</h2>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-amber-600">Pending verification</p>
            <h2 className="text-3xl font-bold">{pending}</h2>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-green-600">Approved suppliers</p>
            <h2 className="text-3xl font-bold">{approved}</h2>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supplier, company, email, phone..."
            className="min-w-0 flex-1 rounded-lg border bg-white px-4 py-3"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border bg-white px-4 py-3"
          >
            <option value="all">All suppliers</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <p className="p-8 text-center">Loading suppliers...</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Company</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-t">
                    <td className="p-4">
                      {supplier.supplierName || "Not provided"}
                      <p className="text-xs text-slate-500">
                        {supplier.email || ""}
                      </p>
                    </td>

                    <td className="p-4">
                      {supplier.companyName || "Not provided"}
                    </td>

                    <td className="p-4">
                      {supplier.phoneNumber || "-"}
                    </td>

                    <td className="p-4">
                      {supplier.city || "-"}
                    </td>

                    <td className="p-4">
                      {supplier.isVerified ? (
                        <span className="font-semibold text-green-600">
                          Approved
                        </span>
                      ) : supplier.verificationStatus === "rejected" ? (
                        <span className="font-semibold text-red-600">
                          Rejected
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-600">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={
                            updating === supplier.id ||
                            supplier.isVerified === true
                          }
                          onClick={() =>
                            updateVerification(supplier, "approved")
                          }
                          className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-40"
                        >
                          Approve
                        </button>

                        <button
                          disabled={
                            updating === supplier.id ||
                            supplier.verificationStatus === "rejected"
                          }
                          onClick={() =>
                            updateVerification(supplier, "rejected")
                          }
                          className="rounded bg-red-600 px-3 py-2 text-white disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      No suppliers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-sm text-slate-500">
          Rejected suppliers: {rejected}
        </p>
      </div>
    </main>
  );
}

