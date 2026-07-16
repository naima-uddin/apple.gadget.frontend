function Icon({ path, className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export default function PolicyHeader({ icon, title, subtitle }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-[#5B21B6] shadow-sm shadow-violet-100">
        <Icon path={icon} className="h-6 w-6" />
      </span>
      <div>
        <h1 className="text-xl font-bold text-[#1F2937] sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-[#6B7280] sm:text-sm">{subtitle}</p>}
      </div>
    </div>
  );
}
