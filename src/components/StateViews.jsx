import { HiExclamation, HiInbox } from "react-icons/hi";

// Shared loading / error / empty states for data-driven pages and sections.

export function Spinner({ label = "লোড হচ্ছে… Loading…" }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="loading loading-spinner loading-lg text-primary" aria-hidden="true" />
      {label && <p className="text-sm text-base-content/60">{label}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="max-w-lg mx-auto py-10">
      <div className="card bg-base-200 border border-base-300 p-6 sm:p-8 text-center">
        <HiExclamation className="w-12 h-12 text-warning mx-auto mb-3" aria-hidden="true" />
        <h2 className="text-lg font-bold text-base-content">তথ্য লোড করা যায়নি</h2>
        <p className="text-base-content/60 mt-2">
          {message || "Something went wrong while loading. Please try again."}
        </p>
        {onRetry && (
          <div className="mt-5">
            <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>
              আবার চেষ্টা করুন · Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ message, action }) {
  return (
    <div className="max-w-lg mx-auto py-10">
      <div className="card bg-base-200 border border-base-300 border-dashed p-6 sm:p-8 text-center">
        <HiInbox className="w-12 h-12 text-base-content/30 mx-auto mb-3" aria-hidden="true" />
        <p className="text-base-content/60">{message || "এখানে এখনো কিছু নেই · Nothing here yet."}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}
