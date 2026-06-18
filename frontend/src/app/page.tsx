type MaterialCategory = {
  name: string;
  description: string;
  priceHint: string;
};

const materialCategories: MaterialCategory[] = [
  {
    name: "Cement",
    description: "Compare trusted cement suppliers for bulk and retail orders.",
    priceHint: "From local warehouses",
  },
  {
    name: "Steel",
    description: "Find structural steel, rebar, and fabrication partners.",
    priceHint: "Wholesale-ready",
  },
  {
    name: "Sand",
    description: "Source clean construction sand from nearby verified sellers.",
    priceHint: "Fast delivery options",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Construction supply marketplace
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
            Buy and sell construction materials with reliable local suppliers.
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            Browse essential building materials, compare sellers, and keep
            projects moving without chasing quotes across scattered channels.
          </p>
        </div>

        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Material</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="Cement, steel, sand"
              type="search"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Location</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="City or ZIP code"
              type="text"
            />
          </label>

          <button className="mt-auto rounded-md bg-emerald-700 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-800">
            Search suppliers
          </button>
        </div>

        <section className="grid gap-6 md:grid-cols-3">
          {materialCategories.map((category) => (
            <article
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              key={category.name}
            >
              <p className="text-sm font-semibold text-emerald-700">
                {category.priceHint}
              </p>
              <h2 className="mt-3 text-2xl font-semibold">{category.name}</h2>
              <p className="mt-3 leading-7 text-slate-700">
                {category.description}
              </p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
