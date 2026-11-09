"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Row = Record<string, unknown> & { id: string };
type Tab = "suppliers" | "businessRegistrations" | "categories" | "subcategories" | "payments" | "materials" | "services" | "users" | "enquiries" | "reviews" | "featuredListings" | "settings" | "activity";
const tabs: Array<{ id: Tab; label: string }> = [
  { id: "suppliers", label: "Suppliers" }, { id: "businessRegistrations", label: "Registrations" },
  { id: "categories", label: "Categories" }, { id: "subcategories", label: "Subcategories" },
  { id: "materials", label: "Products" }, { id: "services", label: "Services" },
  { id: "users", label: "Users" }, { id: "enquiries", label: "Enquiries" },
  { id: "reviews", label: "Reviews" }, { id: "featuredListings", label: "Featured" },
  { id: "payments", label: "Payments" }, { id: "settings", label: "Approval settings" }, { id: "activity", label: "Activity logs" },
];

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>("suppliers");
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [parentId, setParentId] = useState("");
  const [parentSubcategoryId, setParentSubcategoryId] = useState("");
  const [parentCategories, setParentCategories] = useState<Row[]>([]);
  const router = useRouter();

  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/${tab}`, { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401 || response.status === 403) { router.replace("/admin/login"); return; }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load records.");
      setRows(result.data as Row[]);
      if (tab === "subcategories") {
        const parentResponse = await fetch("/api/admin/categories", { credentials: "same-origin", cache: "no-store" });
        const parentResult = await parentResponse.json(); if (parentResponse.ok) setParentCategories(parentResult.data as Row[]);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load records."); }
    finally { setBusy(false); }
  }, [router, tab]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => rows.filter((row) => {
    if (tab !== "suppliers" || status === "all") return true;
    const current = supplierStatus(row);
    return current === status;
  }), [rows, status, tab]);

  async function moderate(row: Row, action: "suspend" | "reject" | "reactivate") {
    setError("");
    try {
      const response = await fetch("/api/admin/suppliers", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: row.id, action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Moderation action failed.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Moderation action failed."); }
  }

  async function manageRow(row: Row, action: string) {
    setError("");
    try {
      const response = await fetch(`/api/admin/${tab}`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id, action }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "The admin action failed."); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The admin action failed."); }
  }
  async function editCategory(row: Row) {
    const name = window.prompt("Category name", String(row.name ?? "")); if (!name) return;
    const description = window.prompt("Category description", String(row.description ?? "")); if (description === null) return;
    setError("");
    try {
      const response = await fetch(`/api/admin/${tab}`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id, action: "edit", name, description }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not update category."); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update category."); }
  }
  async function updateApproval(autoApproveSuppliers: boolean) {
    setError("");
    try {
      const response = await fetch("/api/admin/settings", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ autoApproveSuppliers }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not update approval settings."); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update approval settings."); }
  }
  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    try {
      const response = await fetch(`/api/admin/${tab}`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", name: newName, parentCategoryId: parentId, parentSubcategoryId, description: `${newName} businesses, suppliers, products, and services.` }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not create category."); setNewName(""); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create category."); }
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE", credentials: "same-origin" });
    router.replace("/admin/login");
  }

  return <main className="mx-auto min-h-[70vh] w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-bold uppercase text-cyan-700">MarketPlaceX administration</p><h1 className="mt-2 text-3xl font-black">Marketplace moderation</h1><p className="mt-2 text-slate-600">Normal supplier registration is free and activated after authentication. Admin tools remain available for moderation.</p></div>
      <button onClick={() => void logout()} className="rounded-md border px-4 py-2 font-bold">Log out</button>
    </header>
    <nav className="my-6 flex gap-2 overflow-x-auto pb-2" aria-label="Admin sections">
      {tabs.map((item) => <button key={item.id} onClick={() => { setTab(item.id); setStatus("all"); }} className={`rounded-md px-4 py-2 font-bold ${tab === item.id ? "bg-slate-950 text-white" : "border bg-white"}`}>{item.label}</button>)}
    </nav>
    {(tab === "categories" || tab === "subcategories") && <form className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => void createCategory(event)}>
      <input required maxLength={120} className="rounded-md border border-slate-300 px-3 py-2" placeholder={tab === "categories" ? "New main category" : "New subcategory"} value={newName} onChange={(event) => setNewName(event.target.value)} />
      {tab === "subcategories" && <><select required className="rounded-md border border-slate-300 px-3 py-2" value={parentId} onChange={(event) => { setParentId(event.target.value); setParentSubcategoryId(""); }}><option value="">Choose parent category</option>{parentCategories.map((row) => <option key={row.id} value={row.id}>{String(row.name ?? row.id)}</option>)}</select><select className="rounded-md border border-slate-300 px-3 py-2" value={parentSubcategoryId} onChange={(event) => setParentSubcategoryId(event.target.value)}><option value="">Top-level subcategory</option>{rows.filter((row) => row.parentCategoryId === parentId).map((row) => <option key={row.id} value={row.id}>{String(row.name ?? row.id)}</option>)}</select></>}
      <button className="rounded-md bg-cyan-800 px-4 py-2 font-bold text-white" type="submit">Add {tab === "categories" ? "category" : "subcategory"}</button>
    </form>}
    {tab === "suppliers" && <label className="mb-4 flex items-center gap-3 text-sm font-bold">Supplier status
      <select className="rounded-md border bg-white px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value)}>
        <option value="all">All suppliers</option><option value="pending_payment">Pending payment</option><option value="active">Approved</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option>
      </select>
    </label>}
    {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {tab === "settings" && rows[0] && <section className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black">Legacy approval setting</h2><p className="mt-1 max-w-2xl text-sm text-slate-600">Newly authenticated suppliers are activated automatically. This setting remains available for legacy records; moderation controls are unchanged.</p></div><button className={`rounded-md px-4 py-2 font-bold ${rows[0].autoApproveSuppliers === true ? "bg-emerald-700 text-white" : "border border-slate-300 bg-white text-slate-800"}`} onClick={() => void updateApproval(rows[0].autoApproveSuppliers !== true)} type="button">{rows[0].autoApproveSuppliers === true ? "Automatic approval on" : "Automatic approval off"}</button></section>}
    {busy ? <p className="rounded-lg border bg-white p-8 text-center">Loading…</p> : <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{columnsFor(tab).map((column) => <th className="p-4" key={column.key}>{column.label}</th>)}{hasActions(tab) && <th className="p-4">Actions</th>}</tr></thead>
        <tbody>{filtered.map((row) => <tr className="border-t align-top" key={row.id}>{columnsFor(tab).map((column) => <td className="max-w-sm p-4" key={column.key}>{formatValue(row[column.key], column.key)}</td>)}{hasActions(tab) && <td className="p-4"><div className="flex flex-wrap gap-3">{renderRowActions(tab, row, moderate, manageRow, editCategory)}</div></td>}</tr>)}{filtered.length === 0 && <tr><td className="p-8 text-center text-slate-500" colSpan={columnsFor(tab).length + (hasActions(tab) ? 1 : 0)}>No records found.</td></tr>}</tbody>
      </table>
    </div>}
    <p className="mt-3 text-sm text-slate-500">{filtered.length} records</p>
  </main>;
}

function columnsFor(tab: Tab) {
  if (tab === "suppliers" || tab === "businessRegistrations") return [{ key: "supplierName", label: "Owner" }, { key: "companyName", label: "Business" }, { key: "email", label: "Email" }, { key: "phoneNumber", label: "Mobile" }, { key: "businessCategory", label: "Category" }, { key: "address", label: "Address" }, { key: "city", label: "City" }, { key: "state", label: "State" }, { key: "registrationDocumentUrl", label: "Registration document" }, { key: "accountStatus", label: "Account status" }, { key: "businessRegistrationStatus", label: "Application" }, { key: "paymentStatus", label: "Payment" }];
  if (tab === "categories") return [{ key: "name", label: "Category" }, { key: "slug", label: "Slug" }, { key: "description", label: "Description" }, { key: "displayOrder", label: "Order" }, { key: "active", label: "Active" }];
  if (tab === "subcategories") return [{ key: "name", label: "Subcategory" }, { key: "parentCategoryId", label: "Parent category" }, { key: "parentSubcategoryId", label: "Parent subcategory" }, { key: "level", label: "Level" }, { key: "active", label: "Active" }];
  if (tab === "payments") return [{ key: "merchantOrderId", label: "Merchant order" }, { key: "uid", label: "Supplier UID" }, { key: "amount", label: "Amount (paise)" }, { key: "currency", label: "Currency" }, { key: "paymentStatus", label: "Status" }, { key: "transactionId", label: "Transaction" }, { key: "createdAt", label: "Created" }, { key: "completedAt", label: "Completed" }];
  if (tab === "materials" || tab === "featuredListings") return [{ key: "materialName", label: "Product" }, { key: "supplierCompanyName", label: "Business" }, { key: "category", label: "Category" }, { key: "price", label: "Price" }, { key: "city", label: "City" }, { key: "isActive", label: "Published" }, { key: "isFeatured", label: "Featured" }, { key: "approvalStatus", label: "Status" }];
  if (tab === "services") return [{ key: "title", label: "Service" }, { key: "businessName", label: "Business" }, { key: "supplierId", label: "Owner" }, { key: "active", label: "Active" }, { key: "status", label: "Status" }];
  if (tab === "users") return [{ key: "uid", label: "UID" }, { key: "email", label: "Email" }, { key: "role", label: "Role" }, { key: "companyName", label: "Business" }, { key: "accountStatus", label: "Status" }];
  if (tab === "enquiries") return [{ key: "name", label: "Customer" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "supplierId", label: "Business" }, { key: "message", label: "Message" }, { key: "createdAt", label: "Received" }];
  if (tab === "reviews") return [{ key: "supplierName", label: "Business" }, { key: "authorName", label: "Reviewer" }, { key: "rating", label: "Rating" }, { key: "text", label: "Review" }, { key: "createdAt", label: "Received" }];
  if (tab === "settings") return [{ key: "autoApproveSuppliers", label: "Automatic approval" }, { key: "requireVerifiedEmail", label: "Require verified email" }, { key: "requireVerifiedPhone", label: "Require verified phone" }];
  return [{ key: "adminEmail", label: "Admin" }, { key: "action", label: "Action" }, { key: "target", label: "Target" }, { key: "createdAt", label: "Time" }];
}
function hasActions(tab: Tab) { return ["suppliers", "businessRegistrations", "categories", "subcategories", "materials", "services", "featuredListings", "enquiries", "reviews"].includes(tab); }
function renderRowActions(tab: Tab, row: Row, moderate: (row: Row, action: "suspend" | "reject" | "reactivate") => Promise<void>, manage: (row: Row, action: string) => Promise<void>, edit: (row: Row) => Promise<void>) {
  if (tab === "suppliers") return <>{supplierStatus(row) === "suspended" && <button className="font-bold text-emerald-700" onClick={() => void moderate(row, "reactivate")}>Reactivate</button>}{!["suspended", "rejected"].includes(supplierStatus(row)) && <><button className="font-bold text-amber-700" onClick={() => void moderate(row, "suspend")}>Suspend</button><button className="font-bold text-rose-700" onClick={() => void moderate(row, "reject")}>Reject</button></>}</>;
  if (tab === "enquiries") return <button className="font-bold text-cyan-800" onClick={() => void manage(row, row.read === true ? "mark-unread" : "mark-read")}>{row.read === true ? "Mark unread" : "Mark read"}</button>;
  if (tab === "reviews") return <button className="font-bold text-amber-700" onClick={() => void manage(row, row.active === false ? "activate" : "deactivate")}>{row.active === false ? "Restore review" : "Hide review"}</button>;
  return <>{(tab === "categories" || tab === "subcategories") && <button className="font-bold text-cyan-800" onClick={() => void edit(row)}>Edit</button>}{tab === "businessRegistrations" ? <><button className="font-bold text-emerald-700" onClick={() => void manage(row, "approve")}>Approve registration</button><button className="font-bold text-rose-700" onClick={() => void manage(row, "reject")}>Reject registration</button></> : <>{row.active === false ? <button className="font-bold text-emerald-700" onClick={() => void manage(row, "activate")}>Activate</button> : <button className="font-bold text-amber-700" onClick={() => void manage(row, "deactivate")}>{tab === "featuredListings" ? "Remove feature" : "Deactivate"}</button>}{["materials", "services", "featuredListings"].includes(tab) && <button className="font-bold text-cyan-800" onClick={() => void manage(row, "approve")}>{tab === "featuredListings" ? "Feature" : "Approve"}</button>}</>}</>;
}
function supplierStatus(row: Row) {
  return String(row.accountStatus ?? (row.verificationStatus === "rejected" ? "rejected" : row.isSuspended ? "suspended" : row.isVerified ? "active" : "pending_payment"));
}
function formatValue(value: unknown, key: string) {
  if (value === null || value === undefined || value === "") return "—";
  if (key.endsWith("At") && typeof value === "string") return new Date(value).toLocaleString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key === "registrationDocumentUrl" && typeof value === "string" && value.startsWith("https://")) return <a className="font-bold text-cyan-800 underline" href={value} rel="noreferrer" target="_blank">Open PDF</a>;
  return String(value);
}
