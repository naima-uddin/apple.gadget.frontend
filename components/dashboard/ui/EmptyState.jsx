"use client";

export default function EmptyState({
  title = "Nothing here yet",
  description,
  actionLabel,
  onAction,
  icon,
}) {
  return (
    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
      {icon && <div className="flex justify-center mb-3 text-gray-300">{icon}</div>}
      <p className="text-gray-500 font-medium mb-1">{title}</p>
      {description && (
        <p className="text-sm text-gray-400 mb-3 max-w-sm mx-auto">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 bg-[#1D1D1F] text-white text-sm px-4 py-2 rounded-xl hover:bg-black transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
