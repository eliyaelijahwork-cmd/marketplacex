import Link from "next/link";

type BrandLogoProps = {
  inverse?: boolean;
  compact?: boolean;
};

export default function BrandLogo({
  inverse = false,
  compact = false,
}: BrandLogoProps) {
  const primaryText = inverse ? "text-white" : "text-slate-950";
  const mutedText = inverse ? "text-slate-200" : "text-slate-700";
  const fineText = inverse ? "text-slate-300" : "text-slate-500";

  return (
    <Link className="flex min-w-fit items-center gap-3" href="/">
      <span
        className="grid h-16 w-16 shrink-0 place-items-end text-blue-600"
        aria-hidden="true"
      >
        <svg
          className="h-16 w-16"
          fill="none"
          viewBox="0 0 76 70"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 64h70"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path d="M7 44h18v20H7V44Z" fill="currentColor" opacity=".95" />
          <path d="M20 35h18v29H20V35Z" fill="currentColor" />
          <path d="M12 50h4v6h-4v-6Zm8 0h4v6h-4v-6Zm9-8h4v6h-4v-6Zm0 11h4v6h-4v-6Z" fill={inverse ? "#061b33" : "#fff"} opacity=".85" />
          <path
            d="M40 64V37l14-11 14 11v27H40Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path
            d="M36 64V29h22v35M36 29l11-9 12 9"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path
            d="M43 64V47h10v17M57 53h4v11"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <path
            d="M30 24h43M30 24 45 9l28 7v8M45 9v15M69 24v17"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <path
            d="M66 41a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z"
            fill="currentColor"
          />
        </svg>
      </span>

      <span className="min-w-0">
        <span
          className={`block whitespace-nowrap text-3xl font-extrabold leading-none sm:text-4xl ${primaryText}`}
        >
          Market<span className="text-blue-600">PlaceX</span>
        </span>
        {!compact && (
          <>
            <span
              className={`mt-2 block max-w-64 text-base font-extrabold leading-tight sm:max-w-none ${mutedText}`}
            >
              Construction Materials Marketplace
            </span>
            <span
              className={`mt-1 block max-w-64 text-sm font-bold leading-tight sm:max-w-none ${fineText}`}
            >
              Your Trusted Construction Materials Supply Platform
            </span>
          </>
        )}
      </span>
    </Link>
  );
}
