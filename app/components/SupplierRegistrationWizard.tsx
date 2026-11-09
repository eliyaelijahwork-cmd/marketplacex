"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { BUSINESS_TYPES } from "@/app/lib/suppliers/validation";
import { mainCategories, type DirectoryCategory, type DirectorySubcategory } from "@/app/data/directory";
import { getFirebaseAuth } from "@/app/lib/firebase/client";
import { useAuth } from "@/app/contexts/AuthContext";

const inputClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100";
type Fields = { fullName: string; email: string; mobileNumber: string; whatsappNumber: string; businessName: string; businessCategory: string; subcategoryId: string; description: string; country: string; state: string; district: string; city: string; area: string; businessAddress: string; pinCode: string; latitude: string; longitude: string; businessTypes: string[]; gstNumber: string };
const initial: Fields = { fullName: "", email: "", mobileNumber: "", whatsappNumber: "", businessName: "", businessCategory: "", subcategoryId: "", description: "", country: "India", state: "", district: "", city: "", area: "", businessAddress: "", pinCode: "", latitude: "", longitude: "", businessTypes: [], gstNumber: "" };
const stepNames = ["Business information", "Contact information", "Business location", "Business details", "Documents & images", "Review & submit"];
const requiredByStep: Array<(keyof Fields)[]> = [["businessName", "businessCategory", "subcategoryId", "description"], ["fullName", "mobileNumber", "whatsappNumber", "email"], ["country", "state", "district", "city", "businessAddress", "pinCode"], ["businessTypes"], [], []];

export default function SupplierRegistrationWizard() {
  const { user, firebaseReady } = useAuth(); const router = useRouter();
  const [categories, setCategories] = useState<DirectoryCategory[]>(mainCategories);
  const [fields, setFields] = useState<Fields>(initial); const [step, setStep] = useState(0); const [files, setFiles] = useState<{ logo?: File; cover?: File; photos: File[]; document?: File }>({ photos: [] });
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [complete, setComplete] = useState(false);
  useEffect(() => {
    if (user) setFields((old) => ({ ...old, email: user.email ?? old.email, fullName: user.displayName ?? old.fullName, mobileNumber: user.phoneNumber?.replace(/^\+91/, "") ?? old.mobileNumber, whatsappNumber: user.phoneNumber?.replace(/^\+91/, "") ?? old.whatsappNumber }));
    fetch("/api/categories", { cache: "no-store" }).then((response) => response.json()).then((result) => { if (Array.isArray(result.data)) setCategories(result.data); }).catch(() => undefined);
  }, [user]);
  const selectedCategory = useMemo(() => categories.find((category) => category.slug === fields.businessCategory || category.id === fields.businessCategory), [categories, fields.businessCategory]);
  const subcategories = selectedCategory ? flattenSubcategories(selectedCategory.subcategories).filter((item) => item.active) : [];
  function update<K extends keyof Fields>(key: K, value: Fields[K]) { setFields((old) => ({ ...old, [key]: value })); }
  function chooseFiles(event: ChangeEvent<HTMLInputElement>, key: "logo" | "cover" | "photos" | "document") {
    const selected = [...(event.target.files ?? [])];
    if (selected.some((file) => key === "document" ? file.type !== "application/pdf" || file.size > 10 * 1024 * 1024 : !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) { setError(key === "document" ? "Choose a PDF up to 10 MB." : "Choose JPG, PNG, or WebP images up to 5 MB each."); event.target.value = ""; return; }
    setError(""); setFiles((old) => ({ ...old, [key]: key === "photos" ? selected.slice(0, 10) : selected[0] }));
  }
  function validateStep(index: number) {
    const missing = requiredByStep[index].find((key) => Array.isArray(fields[key]) ? !(fields[key] as string[]).length : !String(fields[key] ?? "").trim());
    if (missing) { setError("Complete the required fields before continuing."); return false; }
    if (index === 1 && (!/^[6-9]\d{9}$/.test(fields.mobileNumber.replace(/\D/g, "")) || !/^[6-9]\d{9}$/.test(fields.whatsappNumber.replace(/\D/g, "")) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))) { setError("Enter a valid email and 10-digit Indian mobile and WhatsApp numbers."); return false; }
    if (index === 2 && !/^[1-9]\d{5}$/.test(fields.pinCode)) { setError("Enter a valid 6-digit PIN code."); return false; }
    return true;
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    if (step < 5) { if (validateStep(step)) setStep((current) => current + 1); return; }
    setBusy(true);
    try {
      let identity = user;
      if (!identity) { const provider = new GoogleAuthProvider(); provider.setCustomParameters({ prompt: "select_account" }); identity = (await signInWithPopup(getFirebaseAuth(), provider)).user; }
      await identity.reload();
      if (!identity.emailVerified || !identity.email || identity.email.toLowerCase() !== fields.email.trim().toLowerCase()) throw new Error("Use a verified Google account and enter the same email address.");
      const form = new FormData(); if (files.logo) form.append("logo", files.logo); if (files.cover) form.append("cover", files.cover); files.photos.forEach((file) => form.append("photos", file)); if (files.document) form.append("document", files.document);
      let urls: Record<string, string | string[]> = { photos: [] };
      let paths: Record<string, string> = {};
      if ([...form.keys()].length) { const upload = await fetch("/api/suppliers/uploads", { method: "POST", headers: { Authorization: `Bearer ${await identity.getIdToken(true)}` }, body: form }); const result = await upload.json(); if (!upload.ok) throw new Error(result.error || "Uploads failed."); urls = result.urls; paths = result.paths ?? {}; }
      const payload = { ...fields, latitude: fields.latitude || null, longitude: fields.longitude || null, logoUrl: urls.logo ?? "", coverImageUrl: urls.cover ?? "", businessPhotos: urls.photos ?? [], registrationDocumentUrl: urls.document ?? "", registrationDocumentPath: paths.document ?? "" };
      const registration = await fetch("/api/suppliers/register", { method: "POST", headers: { Authorization: `Bearer ${await identity.getIdToken()}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await registration.json(); if (!registration.ok) throw new Error(result.error || "Registration could not be saved.");
      setComplete(true);
      setNotice("Your supplier profile is active. Registration is free; continue to your dashboard to manage your business.");
      window.setTimeout(() => router.push("/supplier-dashboard"), 1000);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Registration could not be completed."); }
    finally { setBusy(false); }
  }
  function input(key: keyof Fields, label: string, props: { type?: string; required?: boolean; maxLength?: number; pattern?: string; placeholder?: string } = {}) { return <label className="grid gap-1.5" key={key}><span className="text-sm font-bold text-slate-700">{label}{props.required && <span className="text-rose-600"> *</span>}</span><input className={inputClass} type={props.type ?? "text"} required={props.required} maxLength={props.maxLength} pattern={props.pattern} placeholder={props.placeholder} value={fields[key] as string} onChange={(event) => update(key, event.target.value as never)} /></label>; }
  const fileInput = (key: "logo" | "cover" | "photos" | "document", label: string, accept: string, multiple = false) => <label className="grid gap-1.5" key={key}><span className="text-sm font-bold text-slate-700">{label}</span><input className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-cyan-50 file:px-3 file:py-1.5 file:font-bold file:text-cyan-900`} type="file" accept={accept} multiple={multiple} onChange={(event) => chooseFiles(event, key)} /></label>;
  return <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8"><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
    <p className="text-sm font-black uppercase text-cyan-700">Business onboarding</p><h1 className="mt-2 text-3xl font-black text-slate-950">Register your business</h1><p className="mt-3 text-slate-600">Complete six steps to create your MarketPlaceX business profile. Supplier registration is free; approval follows successful authentication and profile submission.</p>
    {!firebaseReady && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Firebase is not configured for this deployment.</p>}
    <ol className="my-7 grid grid-cols-3 gap-2 sm:grid-cols-6">{stepNames.map((name, index)=><li key={name} className={`rounded-md p-2 text-center text-[11px] font-bold sm:text-xs ${index===step ? "bg-cyan-800 text-white" : index<step ? "bg-cyan-50 text-cyan-900" : "bg-slate-100 text-slate-600"}`}><span className="block">{index+1}</span>{name}</li>)}</ol>
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event)=>void submit(event)}>
      {step===0 && <>{input("businessName","Business name",{required:true,maxLength:160})}<label className="grid gap-1.5"><span className="text-sm font-bold">Main category *</span><select className={inputClass} required value={fields.businessCategory} onChange={(e)=>{update("businessCategory",e.target.value);update("subcategoryId","");}}><option value="">Choose category</option>{categories.map((c)=><option key={c.id} value={c.slug}>{c.name}</option>)}</select></label><label className="grid gap-1.5"><span className="text-sm font-bold">Subcategory *</span><select className={inputClass} required value={fields.subcategoryId} onChange={(e)=>update("subcategoryId",e.target.value)} disabled={!selectedCategory}><option value="">Choose subcategory</option>{subcategories.map((s)=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="grid gap-1.5 sm:col-span-2"><span className="text-sm font-bold">Business description *</span><textarea className={inputClass} required maxLength={2000} rows={4} value={fields.description} onChange={(e)=>update("description",e.target.value)}/></label></>}
      {step===1 && <>{input("fullName","Owner name",{required:true,maxLength:120})}{input("mobileNumber","Mobile number",{type:"tel",required:true,maxLength:10,pattern:"[6-9][0-9]{9}"})}{input("whatsappNumber","WhatsApp number",{type:"tel",required:true,maxLength:10,pattern:"[6-9][0-9]{9}"})}{input("email","Email address",{type:"email",required:true,maxLength:180})}</>}
      {step===2 && <>{input("country","Country",{required:true,maxLength:100})}{input("state","State",{required:true,maxLength:120})}{input("district","District",{required:true,maxLength:120})}{input("city","City",{required:true,maxLength:120})}{input("area","Area / locality",{maxLength:120})}{input("pinCode","PIN code",{required:true,maxLength:6,pattern:"[1-9][0-9]{5}"})}<label className="grid gap-1.5 sm:col-span-2"><span className="text-sm font-bold">Full address *</span><textarea className={inputClass} required maxLength={500} rows={3} value={fields.businessAddress} onChange={(e)=>update("businessAddress",e.target.value)}/></label>{input("latitude","Map latitude",{type:"number",maxLength:30,placeholder:"Optional"})}{input("longitude","Map longitude",{type:"number",maxLength:30,placeholder:"Optional"})}</>}
      {step===3 && <fieldset className="sm:col-span-2"><legend className="mb-3 text-sm font-bold text-slate-800">Select all business types that apply *</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{BUSINESS_TYPES.map((type)=><label key={type} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="checkbox" checked={fields.businessTypes.includes(type)} onChange={(e)=>update("businessTypes",e.target.checked ? [...fields.businessTypes,type] : fields.businessTypes.filter((item)=>item!==type))}/>{type}</label>)}</div></fieldset>}
      {step===4 && <>{fileInput("logo","Business logo (JPG, PNG, WebP)","image/jpeg,image/png,image/webp")}{fileInput("cover","Cover image (JPG, PNG, WebP)","image/jpeg,image/png,image/webp")}{fileInput("photos","Business photos (up to 10)","image/jpeg,image/png,image/webp",true)}{input("gstNumber","GST number (optional)",{maxLength:20})}{fileInput("document","Business registration document (optional PDF)","application/pdf")}</>}
      {step===5 && <div className="grid gap-3 sm:col-span-2">{Object.entries({ "Business name": fields.businessName, "Main category": selectedCategory?.name, "Subcategory": subcategories.find((s)=>s.id===fields.subcategoryId)?.name, "Description": fields.description, "Owner": fields.fullName, "Email": fields.email, "Mobile": fields.mobileNumber, "WhatsApp": fields.whatsappNumber, "Country": fields.country, "State": fields.state, "District": fields.district, "City": fields.city, "Area": fields.area, "Address": fields.businessAddress, "Business types": fields.businessTypes.join(", "), "GST number": fields.gstNumber || "Not provided", "Uploads": [files.logo?.name,files.cover?.name,...files.photos.map((f)=>f.name),files.document?.name].filter(Boolean).join(", ") || "None" }).map(([label,value])=><div key={label} className="grid gap-1 border-b border-slate-100 pb-2 sm:grid-cols-[10rem_1fr]"><strong className="text-sm text-slate-700">{label}</strong><span className="break-words text-sm text-slate-600">{value || "—"}</span></div>)}<p className="text-xs leading-5 text-slate-500">You can go back to any step and edit the information before submitting.</p></div>}
      <div className="flex gap-3 sm:col-span-2">{step>0 && !complete && <button className="rounded-md border border-slate-300 px-5 py-3 font-bold" type="button" onClick={()=>{setError("");setStep(step-1);}}>Back</button>}{step<5 && <button className="ml-auto rounded-md bg-cyan-800 px-6 py-3 font-black text-white" type="submit">Continue</button>}{step===5 && !complete && <button className="ml-auto rounded-md bg-cyan-800 px-6 py-3 font-black text-white disabled:opacity-60" disabled={busy||!firebaseReady} type="submit">{busy?"Submitting…":"Submit application"}</button>}{complete && <button className="ml-auto rounded-md bg-cyan-800 px-6 py-3 font-black text-white" type="button" onClick={()=>router.push("/supplier-dashboard")}>Continue to business dashboard</button>}</div>
    </form>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}{notice && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{notice}</p>}
  </section></main>;
}
function flattenSubcategories(rows: DirectorySubcategory[]): DirectorySubcategory[] { return rows.flatMap((row) => [row, ...flattenSubcategories(row.children ?? [])]); }
