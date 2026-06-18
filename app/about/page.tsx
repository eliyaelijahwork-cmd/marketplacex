import Image from "next/image";
import Link from "next/link";
import { categories, heroImage } from "../data/marketplace";

const principles = [
  "Verified supplier discovery",
  "Transparent material comparison",
  "Procurement workflows for active jobsites",
];

export default function AboutPage() {
  return (
    <main>
      <section className="bg-white py-12">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              About us
            </p>
            <h1 className="mt-3 text-4xl font-bold text-slate-950">
              Construction procurement made clearer and faster.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              MarketPlaceX connects customers with dependable construction
              material suppliers across the core product groups that keep
              building projects moving.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="rounded-md bg-blue-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-800"
                href="/categories"
              >
                Browse catalog
              </Link>
              <Link
                className="rounded-md border border-slate-300 px-5 py-3 text-center font-semibold text-slate-800 transition hover:border-blue-600 hover:text-blue-700"
                href="/contact"
              >
                Contact team
              </Link>
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-lg bg-slate-100">
            <Image
              alt="Construction materials marketplace warehouse"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              src={heroImage}
            />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {principles.map((principle) => (
            <article
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              key={principle}
            >
              <p className="text-xl font-semibold text-slate-950">{principle}</p>
              <p className="mt-3 leading-7 text-slate-600">
                Built for customers who need accurate product information,
                supplier details, quantity planning, and checkout-ready order
                summaries.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Coverage
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">
            Materials for every stage of construction
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                className="rounded-md border border-slate-200 bg-slate-50 p-4"
                key={category.slug}
              >
                <p className="font-semibold text-slate-950">{category.name}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
