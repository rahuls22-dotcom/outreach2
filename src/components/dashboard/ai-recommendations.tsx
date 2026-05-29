"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface Recommendation {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
}

interface AIRecommendationsProps {
  recommendations: Recommendation[];
  onApply?: (id: string) => void;
}

export function AIRecommendations({ recommendations, onApply }: AIRecommendationsProps) {
  const [items, setItems] = useState(recommendations);
  const [toast, setToast] = useState<string | null>(null);

  const handleApply = (id: string) => {
    const item = items.find((r) => r.id === id);
    if (item) {
      setToast(`Applied: ${item.title}`);
      setTimeout(() => setToast(null), 3000);
    }
    onApply?.(id);
  };

  const handleDismiss = (id: string) => {
    setItems((prev) => prev.filter((r) => r.id !== id));
  };

  const activeCount = items.length;

  const priorityStyles = {
    high: {
      border: "border-l-[#E53E3E]",
      bg: "bg-[#FEF8F8]",
      label: { text: "High priority", className: "text-[#B91C1C] bg-[#FEE2E2]" },
    },
    medium: {
      border: "border-l-[#F5A623]",
      bg: "bg-[#FFFBF5]",
      label: { text: "Medium", className: "text-[#92400E] bg-[#FEF3C7]" },
    },
    low: {
      border: "border-l-border-hover",
      bg: "bg-surface-page",
      label: { text: "Low", className: "text-text-tertiary bg-surface-secondary" },
    },
  };

  return (
    <>
      <div className="bg-white border border-border rounded-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} strokeWidth={1.5} className="text-text-secondary" />
            <h2 className="text-section-header text-text-primary">AI recommendations</h2>
            {activeCount > 0 && (
              <span className="text-[12px] font-medium text-text-primary bg-surface-secondary px-2 py-0.5 rounded-badge">
                {activeCount} new
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {items.map((rec) => (
              <motion.div
                key={rec.id}
                layout
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`border-l-[3px] ${priorityStyles[rec.priority].border} ${priorityStyles[rec.priority].bg} rounded-r-card p-4`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${priorityStyles[rec.priority].label.className}`}
                      >
                        {priorityStyles[rec.priority].label.text}
                      </span>
                    </div>
                    <h3 className="text-card-title text-text-primary mb-1">{rec.title}</h3>
                    <p className="text-meta text-text-secondary">{rec.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 pt-5">
                    <button
                      onClick={() => handleApply(rec.id)}
                      className="h-8 px-3 bg-accent text-white text-[12px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => handleDismiss(rec.id)}
                      className="h-8 px-3 text-[12px] font-medium text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary rounded-button transition-colors duration-150"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <div className="text-center py-8 text-meta text-text-tertiary">
              No pending recommendations
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-5 right-5 bg-charcoal text-white text-[13px] px-4 py-2.5 rounded-card shadow-lg z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
