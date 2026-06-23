const inputClass =
  "w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

export default function ContactPage() {
  return (
    <main>
      <section className="border-b border-slate-200 bg-white py-8 sm:py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Contact us
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
            Talk to MarketPlaceX
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Send product requirements, supplier questions, or delivery details
            to the marketplace team.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:px-8">
        <form className="grid gap-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input className={inputClass} required type="text" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Phone</span>
              <input className={inputClass} required type="tel" />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input className={inputClass} required type="email" />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">
              Material requirement
            </span>
            <textarea className={`${inputClass} min-h-36`} required />
          </label>

          <button
            className="w-full rounded-md bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 md:w-auto"
            type="submit"
          >
            Send inquiry
          </button>
        </form>

        <aside className="grid h-fit gap-4">
          {[
            ["Sales", "sales@marketplacex.com"],
            ["Supplier onboarding", "suppliers@marketplacex.com"],
            ["Support", "support@marketplacex.com"],
          ].map(([label, value]) => (
            <article
              className="overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8"
              key={label}
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                {label}
              </p>
              <p className="mt-2 break-words text-lg font-semibold text-slate-950">
                {value}
              </p>
            </article>
          ))}
        </aside>
      </section>
    </main>
  );
}
