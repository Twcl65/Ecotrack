"use client";

import { Check, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { markFeedbackReviewed } from "@/app/dashboard/feedback/actions";
import type { FeedbackRow } from "@/types/database";

type Props = { initialFeedback: FeedbackRow[] };
type FeedbackFilter = "all" | "new" | "reviewed";

export default function FeedbackPageContent({ initialFeedback }: Props) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [filter, setFilter] = useState<FeedbackFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      total: feedback.length,
      new: feedback.filter((item) => item.status === "new").length,
      reviewed: feedback.filter((item) => item.status === "reviewed").length,
    }),
    [feedback]
  );
  const visibleFeedback =
    filter === "all" ? feedback : feedback.filter((item) => item.status === filter);

  async function markReviewed(id: string) {
    setUpdatingId(id);
    setError(null);
    try {
      const result = await markFeedbackReviewed(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setFeedback((items) =>
        items.map((item) => (item.id === id ? { ...item, status: "reviewed" } : item))
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Could not update feedback status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      <div>
        <h2 className="text-base font-bold text-gray-900">User Feedback</h2>
        <p className="mt-1 text-sm text-gray-500">
          Feedback submitted by residents and drivers from the ECOTRACK mobile app.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="All Feedback" value={counts.total} />
        <SummaryCard label="New" value={counts.new} />
        <SummaryCard label="Reviewed" value={counts.reviewed} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          Status
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as FeedbackFilter)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </label>
        <p className="text-sm text-gray-500">{visibleFeedback.length} submissions</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {visibleFeedback.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No feedback submissions to display.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleFeedback.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{item.category}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.status === "new"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {item.status === "new" ? "New" : "Reviewed"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.user_name} · {capitalize(item.user_role)} ·{" "}
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                {item.status === "new" && (
                  <button
                    type="button"
                    onClick={() => void markReviewed(item.id)}
                    disabled={updatingId === item.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-eco-primary px-3 py-1.5 text-sm font-semibold text-eco-primary hover:bg-eco-light disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    {updatingId === item.id ? "Updating..." : "Mark Reviewed"}
                  </button>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">
                {item.message}
              </p>
              {item.rating !== null && (
                <div
                  className="mt-3 flex items-center gap-1"
                  aria-label={`Rated ${item.rating} out of 5 stars`}
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${
                        index < item.rating!
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-xs text-gray-500">{item.rating}/5</span>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
