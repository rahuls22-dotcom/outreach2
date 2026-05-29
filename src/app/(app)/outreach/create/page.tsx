"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  X,
  Rocket,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  voiceAgents,
  outreachPurposes,
  csvPreviewHeaders,
  csvPreviewRows,
} from "@/lib/outreach-data";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CreateOutreachPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [agent, setAgent] = useState("");
  const [purpose, setPurpose] = useState("");
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [startMode, setStartMode] = useState<"immediately" | "schedule">("immediately");
  const [dailyLimit, setDailyLimit] = useState("200");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("19:00");
  const [activeDays, setActiveDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  const [retryEnabled, setRetryEnabled] = useState(true);
  const [maxRetries, setMaxRetries] = useState("2");
  const [retryInterval, setRetryInterval] = useState("4");

  const toggleDay = (day: string) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const contactCount = 487;
  const limit = parseInt(dailyLimit) || 200;
  const daysToComplete = Math.ceil(contactCount / limit);

  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.push("/outreach")}
          className="p-1 rounded-button text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors duration-150"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <span className="text-meta text-text-secondary">
          Lead Generation › Outreach › Create
        </span>
      </div>

      <div className="max-w-[720px]">
        <h1 className="text-page-title text-text-primary mb-1">Create Outreach</h1>
        <p className="text-meta text-text-secondary mb-8">
          Set up a voice agent outreach campaign to call your contacts
        </p>

        {/* Section 1, Basics */}
        <div className="bg-white border border-border rounded-card p-6 mb-5">
          <h2 className="text-card-title text-text-primary mb-4">Basics</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Outreach Name <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Godrej Reflections, Lead Qualification"
                className="w-full h-10 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 placeholder:text-text-tertiary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                  Voice Agent <span className="text-status-error">*</span>
                </label>
                <select
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                  className="w-full h-10 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239B9B9B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                  }}
                >
                  <option value="">Select agent...</option>
                  {voiceAgents.map((va) => (
                    <option key={va.id} value={va.id}>{va.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                  Purpose <span className="text-status-error">*</span>
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full h-10 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239B9B9B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                  }}
                >
                  <option value="">Select purpose...</option>
                  {outreachPurposes.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2, Contacts */}
        <div className="bg-white border border-border rounded-card p-6 mb-5">
          <h2 className="text-card-title text-text-primary mb-4">Contacts</h2>

          {!csvUploaded ? (
            <div
              onClick={() => setCsvUploaded(true)}
              className="border-2 border-dashed border-border rounded-input p-8 text-center cursor-pointer hover:border-border-hover hover:bg-surface-page/50 transition-all duration-150"
            >
              <Upload size={24} strokeWidth={1.5} className="mx-auto text-text-tertiary mb-3" />
              <p className="text-[13px] text-text-secondary">
                Drag & drop your CSV file, or <span className="text-accent font-medium">browse</span>
              </p>
              <p className="text-[11px] text-text-tertiary mt-1">.csv files only</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File info */}
              <div className="flex items-center justify-between bg-surface-page rounded-[6px] px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={16} strokeWidth={1.5} className="text-text-secondary" />
                  <span className="text-[13px] text-text-primary font-medium">
                    godrej_reflections_leads.csv
                  </span>
                </div>
                <button
                  onClick={() => setCsvUploaded(false)}
                  className="text-text-tertiary hover:text-text-primary transition-colors duration-150"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} strokeWidth={2} className="text-status-success" />
                  <span className="text-[12px] text-text-primary font-medium">487 contacts detected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={13} strokeWidth={2} className="text-status-warning" />
                  <span className="text-[12px] text-text-secondary">12 duplicates removed</span>
                </div>
              </div>

              {/* Column mapping */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-page rounded-[6px] px-3 py-2">
                  <div className="text-[11px] text-text-tertiary">Name</div>
                  <div className="text-[12px] text-text-primary font-medium mt-0.5">→ Column A (Name)</div>
                </div>
                <div className="bg-surface-page rounded-[6px] px-3 py-2">
                  <div className="text-[11px] text-text-tertiary">Phone</div>
                  <div className="text-[12px] text-text-primary font-medium mt-0.5">→ Column B (Phone)</div>
                </div>
              </div>

              {/* Preview table */}
              <div className="border border-border-subtle rounded-[6px] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-page border-b border-border-subtle">
                      {csvPreviewHeaders.map((h) => (
                        <th key={h} className="px-3 py-2 text-[10px] font-medium text-text-tertiary uppercase tracking-[0.5px] text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreviewRows.map((row, i) => (
                      <tr key={i} className="border-b border-border-subtle last:border-0">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-1.5 text-[11px] text-text-secondary">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-3 py-1.5 bg-surface-page text-[10px] text-text-tertiary">
                  Showing 5 of 487 rows
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3, Scheduling */}
        <div className="bg-white border border-border rounded-card p-6 mb-6">
          <h2 className="text-card-title text-text-primary mb-4">Scheduling</h2>
          <div className="space-y-5">
            {/* Start mode */}
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">Start</label>
              <div className="flex items-center gap-0.5 bg-surface-secondary rounded-input p-0.5 w-fit">
                {(["immediately", "schedule"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setStartMode(m)}
                    className={`px-4 py-1.5 text-[12px] font-medium rounded-[6px] transition-colors duration-150 capitalize ${
                      startMode === m
                        ? "bg-white text-text-primary shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {m === "immediately" ? "Immediately" : "Schedule"}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily limit */}
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Daily Limit
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="w-[120px] h-10 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 tabular-nums"
                />
                {csvUploaded && (
                  <span className="text-[12px] text-text-tertiary">
                    At {limit}/day, ~{daysToComplete} day{daysToComplete !== 1 ? "s" : ""} to complete
                  </span>
                )}
              </div>
            </div>

            {/* Calling hours */}
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Calling Hours
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-10 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150"
                />
                <span className="text-[12px] text-text-tertiary">to</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-10 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150"
                />
              </div>
            </div>

            {/* Active days */}
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">
                Active Days
              </label>
              <div className="flex items-center gap-1.5">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`w-10 h-9 text-[12px] font-medium rounded-[6px] transition-colors duration-150 ${
                      activeDays.includes(day)
                        ? "bg-accent text-white"
                        : "bg-surface-secondary text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Retry */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-primary">Retry unanswered calls</span>
                <button
                  onClick={() => setRetryEnabled(!retryEnabled)}
                  className={`relative w-9 h-5 rounded-full transition-colors duration-150 ${
                    retryEnabled ? "bg-accent" : "bg-silver-light"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-150 ${
                      retryEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {retryEnabled && (
                <div className="grid grid-cols-2 gap-4 pl-0">
                  <div>
                    <label className="block text-[12px] text-text-secondary mb-1">Max retries</label>
                    <input
                      type="number"
                      value={maxRetries}
                      onChange={(e) => setMaxRetries(e.target.value)}
                      className="w-full h-9 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-text-secondary mb-1">Retry interval (hours)</label>
                    <input
                      type="number"
                      value={retryInterval}
                      onChange={(e) => setRetryInterval(e.target.value)}
                      className="w-full h-9 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 tabular-nums"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pb-8">
          <button className="inline-flex items-center gap-1.5 h-10 px-4 text-[13px] font-medium text-text-secondary border border-border rounded-button bg-white hover:bg-surface-page transition-colors duration-150">
            <Save size={14} strokeWidth={1.5} />
            Save as Draft
          </button>
          <button
            onClick={() => router.push("/outreach/out-1")}
            className="inline-flex items-center gap-2 h-10 px-6 bg-accent text-white text-[13px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150"
          >
            <Rocket size={15} strokeWidth={1.5} />
            Launch Outreach
          </button>
        </div>
      </div>
    </motion.div>
  );
}
