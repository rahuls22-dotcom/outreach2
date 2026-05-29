"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Upload,
  FileText,
  Loader2,
  Play,
  Check,
  Settings,
  BookOpen,
  FileEdit,
  FlaskConical,
  Phone,
  List,
} from "lucide-react";
import {
  newVoiceOptions,
  languageOptions,
  defaultSystemPrompt,
  defaultFAQs,
} from "@/lib/voice-agent-data";

/* ------------------------------------------------------------------ */
/*  Animation                                                          */
/* ------------------------------------------------------------------ */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

/* ------------------------------------------------------------------ */
/*  Shared inline helpers                                              */
/* ------------------------------------------------------------------ */

function SectionCard({
  title,
  helper,
  children,
}: {
  title: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-border rounded-card p-5">
      <h3 className="text-[14px] font-semibold text-text-primary mb-1">
        {title}
      </h3>
      {helper && (
        <p className="text-[12px] text-text-secondary mb-4">{helper}</p>
      )}
      {!helper && <div className="mb-4" />}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FieldLabel({ label, helper }: { label: string; helper?: string }) {
  return (
    <div className="mb-1.5">
      <label className="block text-[12px] font-medium text-text-secondary">
        {label}
      </label>
      {helper && (
        <p className="text-[11px] text-text-tertiary mt-0.5">{helper}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface KbFile {
  id: string;
  name: string;
  type: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

/* ------------------------------------------------------------------ */
/*  Wizard steps config                                                */
/* ------------------------------------------------------------------ */

const wizardSteps = [
  { key: "configure", label: "Configure", icon: Settings },
  { key: "knowledge", label: "Knowledge Base", icon: BookOpen },
  { key: "prompt", label: "Prompt & FAQs", icon: FileEdit },
  { key: "test", label: "Test Agent", icon: FlaskConical },
] as const;

/* ------------------------------------------------------------------ */
/*  Tiptap helpers (same as agent-tab.tsx)                             */
/* ------------------------------------------------------------------ */

function extractSections(
  text: string
): { id: string; title: string; startLine: number }[] {
  const lines = text.split("\n");
  const sections: { id: string; title: string; startLine: number }[] = [];
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (
      (trimmed.length > 3 &&
        trimmed === trimmed.toUpperCase() &&
        /[A-Z]/.test(trimmed)) ||
      trimmed.startsWith("##") ||
      trimmed.startsWith("**") ||
      (trimmed.endsWith(":") && trimmed.length < 60 && trimmed.length > 5)
    ) {
      sections.push({
        id: `section-${i}`,
        title: trimmed
          .replace(/^#+\s*/, "")
          .replace(/^\*\*/, "")
          .replace(/\*\*$/, "")
          .replace(/:$/, "")
          .replace(/—.*$/, "")
          .trim(),
        startLine: i,
      });
    }
  });
  return sections;
}

function promptToHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "<p><br></p>";
      if (
        trimmed.length > 3 &&
        trimmed === trimmed.toUpperCase() &&
        /[A-Z]/.test(trimmed)
      ) {
        return `<h3>${trimmed}</h3>`;
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
        return `<li>${trimmed.slice(2)}</li>`;
      }
      return `<p>${trimmed}</p>`;
    })
    .join("")
    .replace(/(<li>.*?<\/li>)+/g, (match) => `<ul>${match}</ul>`);
}

/* ------------------------------------------------------------------ */
/*  Waveform animation component                                       */
/* ------------------------------------------------------------------ */

function VoiceWaveform() {
  return (
    <div className="flex items-end justify-center gap-[3px] h-[18px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-accent animate-pulse"
          style={{
            height: `${[12, 18, 10, 16, 14][i]}px`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: "0.6s",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CreateAgentPage() {
  const router = useRouter();

  /* ---- Navigation ---- */
  const [step, setStep] = useState(0);

  /* ---- Step 1: Configure ---- */
  const [name, setName] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    "English",
  ]);

  const [sttProvider, setSttProvider] = useState("Deepgram");
  const [sttModel, setSttModel] = useState("Nova 3");
  const [sttLanguage, setSttLanguage] = useState("Hindi (hi)");

  const [llmProvider, setLlmProvider] = useState("Groq");
  const [llmModel, setLlmModel] = useState("GPT-OSS 120B");
  const [temperature, setTemperature] = useState(0.2);

  const [timezone, setTimezone] = useState("Asia/Kolkata (IST)");
  const [concurrency, setConcurrency] = useState(2);
  const [speakingSpeed, setSpeakingSpeed] = useState(1.0);

  /* ---- Prompt & FAQs sidebar ---- */
  const [promptSection, setPromptSection] = useState<"prompt" | "faqs">("prompt");

  const selectedVoiceObj = useMemo(
    () => newVoiceOptions.find((v) => v.id === selectedVoice),
    [selectedVoice]
  );

  /* ---- Step 2: Knowledge Base ---- */
  const [files, setFiles] = useState<KbFile[]>([]);
  const [contextText, setContextText] = useState("");

  /* ---- Step 3: Review & Test ---- */
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [generatedFaqs, setGeneratedFaqs] = useState<FaqItem[]>([]);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqSearch, setFaqSearch] = useState("");
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSections, setShowSections] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  /* ---- Creation ---- */
  const [isCreating, setIsCreating] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  Voice play handler                                               */
  /* ---------------------------------------------------------------- */

  const handlePlayVoice = (voiceId: string) => {
    setPlayingVoice(voiceId);
    setTimeout(() => {
      setPlayingVoice(null);
    }, 2500);
  };

  /* ---------------------------------------------------------------- */
  /*  Language toggle                                                   */
  /* ---------------------------------------------------------------- */

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  /* ---------------------------------------------------------------- */
  /*  KB helpers                                                       */
  /* ---------------------------------------------------------------- */

  const addStagedFile = () => {
    setFiles((prev) => [
      ...prev,
      { id: `file-${Date.now()}`, name: "Uploaded_File.pdf", type: "pdf" },
    ]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  /* ---------------------------------------------------------------- */
  /*  FAQ helpers                                                       */
  /* ---------------------------------------------------------------- */

  const filteredFaqs = generatedFaqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const openAddFaq = () => {
    setEditingFaqId(null);
    setNewFaqQ("");
    setNewFaqA("");
    setShowAddFaq(true);
  };

  const openEditFaq = (faq: FaqItem) => {
    setEditingFaqId(faq.id);
    setNewFaqQ(faq.question);
    setNewFaqA(faq.answer);
    setShowAddFaq(true);
  };

  const cancelFaqForm = () => {
    setShowAddFaq(false);
    setEditingFaqId(null);
    setNewFaqQ("");
    setNewFaqA("");
  };

  const saveFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    if (editingFaqId) {
      setGeneratedFaqs((prev) =>
        prev.map((f) =>
          f.id === editingFaqId
            ? { ...f, question: newFaqQ.trim(), answer: newFaqA.trim() }
            : f
        )
      );
    } else {
      setGeneratedFaqs((prev) => [
        ...prev,
        {
          id: `faq-${Date.now()}`,
          question: newFaqQ.trim(),
          answer: newFaqA.trim(),
        },
      ]);
    }
    cancelFaqForm();
  };

  const deleteFaq = (id: string) => {
    setGeneratedFaqs((prev) => prev.filter((f) => f.id !== id));
  };

  /* ---------------------------------------------------------------- */
  /*  Step 3 generation effect                                         */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (step === 2 && !generatedPrompt) {
      setIsGenerating(true);
      const timer = setTimeout(() => {
        setGeneratedPrompt(defaultSystemPrompt);
        setGeneratedFaqs([
          ...defaultFAQs,
          {
            id: "gfaq-1",
            question: "What amenities are available?",
            answer:
              "The project offers a clubhouse, swimming pool, gym, landscaped gardens, children's play area, and 24/7 security.",
          },
          {
            id: "gfaq-2",
            question: "What is the possession timeline?",
            answer:
              "Expected possession is Q4 2027. Construction is progressing as per schedule.",
          },
          {
            id: "gfaq-3",
            question: "Can I schedule a virtual tour?",
            answer:
              "Yes, we offer virtual site tours via video call. Our team can schedule one at your convenience.",
          },
        ]);
        setIsGenerating(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, generatedPrompt]);

  /* ---------------------------------------------------------------- */
  /*  Tiptap editor                                                    */
  /* ---------------------------------------------------------------- */

  const markdownContent = useMemo(() => {
    if (!generatedPrompt) return "";
    return promptToHtml(generatedPrompt);
  }, [generatedPrompt]);

  const sections = useMemo(
    () => extractSections(generatedPrompt),
    [generatedPrompt]
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: markdownContent,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none text-[13px] leading-relaxed text-text-primary [&_h3]:text-[14px] [&_h3]:font-bold [&_h3]:text-text-primary [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:uppercase [&_h3]:tracking-wide [&_p]:mb-2 [&_ul]:mb-3 [&_ul]:pl-4 [&_li]:mb-1 [&_li]:text-text-secondary",
      },
    },
  });

  // Update editor content when generated
  useEffect(() => {
    if (editor && markdownContent) {
      editor.commands.setContent(markdownContent);
    }
  }, [editor, markdownContent]);

  // Toggle editable
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [editor, isEditing]);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const sectionIndex = sections.findIndex((s) => s.id === sectionId);
    if (sectionIndex >= 0 && editor) {
      const headers = document.querySelectorAll(".ProseMirror h3");
      if (headers[sectionIndex]) {
        headers[sectionIndex].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Test call handler                                                */
  /* ---------------------------------------------------------------- */

  const handleTestCall = () => {
    if (!testPhone.trim()) return;
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setTestSuccess(true);
    }, 2000);
  };

  /* ---------------------------------------------------------------- */
  /*  Create handler                                                   */
  /* ---------------------------------------------------------------- */

  const handleCreate = () => {
    if (!name.trim()) return;
    setIsCreating(true);
    setTimeout(() => {
      router.push("/agents-mvp");
    }, 2000);
  };

  /* ---------------------------------------------------------------- */
  /*  Navigation                                                       */
  /* ---------------------------------------------------------------- */

  const goNext = () => setStep((s) => Math.min(s + 1, 3));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp} className="pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => router.push("/agents-mvp")}
          className="p-1 rounded-button text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors duration-150"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <span className="text-meta text-text-secondary">
          Tools &rsaquo; Agents MVP &rsaquo; Create Agent
        </span>
      </div>

      {/* Title */}
      <h1 className="text-page-title text-text-primary mb-6">Create Agent</h1>

      {/* ============================================================ */}
      {/*  Progress Indicator                                           */}
      {/* ============================================================ */}

      <div className="flex items-center justify-center mb-10">
        <div className="flex items-center gap-0">
          {wizardSteps.map((ws, i) => {
            const Icon = ws.icon;
            const isComplete = i < step;
            const isCurrent = i === step;

            return (
              <div key={ws.key} className="flex items-center">
                <button
                  onClick={() => i <= step && setStep(i)}
                  disabled={i > step}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isComplete
                        ? "bg-green-600 text-white"
                        : isCurrent
                        ? "bg-accent text-white ring-4 ring-accent/10"
                        : "bg-surface-secondary text-text-tertiary"
                    } ${i <= step ? "cursor-pointer" : "cursor-not-allowed"}`}
                  >
                    {isComplete ? (
                      <Check size={14} strokeWidth={2.5} />
                    ) : (
                      <Icon size={14} strokeWidth={1.5} />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium transition-colors duration-150 whitespace-nowrap ${
                      isCurrent
                        ? "text-text-primary"
                        : isComplete
                        ? "text-text-secondary"
                        : "text-text-tertiary"
                    }`}
                  >
                    {ws.label}
                  </span>
                </button>

                {i < wizardSteps.length - 1 && (
                  <div
                    className={`w-16 h-[2px] mx-2 mt-[-18px] transition-colors duration-200 ${
                      i < step ? "bg-green-600" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Step Content                                                  */}
      {/* ============================================================ */}

      <div className="max-w-[860px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* ====================================================== */}
            {/*  STEP 1: Configure Agent                                */}
            {/* ====================================================== */}

            {step === 0 && (
              <div className="space-y-6">
                {/* 1. Agent Name */}
                <div>
                  <FieldLabel label="Agent Name *" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Godrej Air Lead Qualifier"
                    className="w-full h-11 px-4 text-[15px] font-medium bg-white border border-border rounded-button text-text-primary placeholder:text-text-tertiary"
                  />
                </div>

                {/* 2. Voice Selection */}
                <SectionCard title="Voice Selection" helper="Choose a voice for your agent">
                  <div className="grid grid-cols-3 gap-3">
                    {newVoiceOptions.map((voice) => (
                      <div
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={`relative p-4 rounded-card border cursor-pointer transition-all duration-150 ${
                          selectedVoice === voice.id
                            ? "border-accent ring-1 ring-accent/20 bg-accent/5"
                            : "border-border bg-white hover:border-border hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-[13px] font-semibold text-text-primary">
                              {voice.name}
                            </p>
                            <span
                              className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-badge ${
                                voice.gender === "Female"
                                  ? "bg-pink-50 text-pink-600"
                                  : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {voice.gender}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayVoice(voice.id);
                            }}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                              playingVoice === voice.id
                                ? "bg-accent text-white"
                                : "bg-surface-secondary text-text-secondary hover:bg-accent/10 hover:text-accent"
                            }`}
                          >
                            {playingVoice === voice.id ? (
                              <VoiceWaveform />
                            ) : (
                              <Play size={12} strokeWidth={2} className="ml-0.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-text-tertiary">
                          {voice.languages.join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* 3. Languages */}
                <SectionCard
                  title="Languages"
                  helper="Select all languages your agent should be able to speak and understand"
                >
                  <div>
                    <FieldLabel label="What languages should your agent interact in?" />
                    <div className="flex flex-wrap gap-2 mt-1">
                      {languageOptions.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => toggleLanguage(lang)}
                          className={`inline-flex items-center text-[12px] font-medium px-3 py-1.5 rounded-badge transition-colors ${
                            selectedLanguages.includes(lang)
                              ? "bg-accent/10 text-accent border border-accent/30"
                              : "bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </SectionCard>

                {/* 4. Speech to Text */}
                <SectionCard
                  title="Speech to Text"
                  helper="Converts the caller's speech to text so the AI can understand and respond"
                >
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <FieldLabel label="Provider" />
                      <select
                        value={sttProvider}
                        onChange={(e) => setSttProvider(e.target.value)}
                        className="w-full h-9 px-3 text-[13px] bg-white border border-border rounded-button text-text-primary appearance-none cursor-pointer"
                      >
                        {["Deepgram", "Google", "AssemblyAI"].map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel label="Model" />
                      <select
                        value={sttModel}
                        onChange={(e) => setSttModel(e.target.value)}
                        className="w-full h-9 px-3 text-[13px] bg-white border border-border rounded-button text-text-primary appearance-none cursor-pointer"
                      >
                        {["Nova 3", "Nova 2", "Whisper"].map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel label="Language" />
                      <select
                        value={sttLanguage}
                        onChange={(e) => setSttLanguage(e.target.value)}
                        className="w-full h-9 px-3 text-[13px] bg-white border border-border rounded-button text-text-primary appearance-none cursor-pointer"
                      >
                        {["Hindi (hi)", "English (en)", "Multi"].map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </SectionCard>

                {/* 5. Agent LLM */}
                <SectionCard
                  title="Agent Intelligence (LLM)"
                  helper="The AI model that powers your agent's conversation abilities and decision-making"
                >
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <FieldLabel label="Provider" />
                      <select
                        value={llmProvider}
                        onChange={(e) => setLlmProvider(e.target.value)}
                        className="w-full h-9 px-3 text-[13px] bg-white border border-border rounded-button text-text-primary appearance-none cursor-pointer"
                      >
                        {["Groq", "OpenAI", "Anthropic"].map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel label="Model" />
                      <select
                        value={llmModel}
                        onChange={(e) => setLlmModel(e.target.value)}
                        className="w-full h-9 px-3 text-[13px] bg-white border border-border rounded-button text-text-primary appearance-none cursor-pointer"
                      >
                        {[
                          "GPT-OSS 120B",
                          "GPT-4o",
                          "GPT-4o-mini",
                          "Claude 3.5 Sonnet",
                        ].map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel label="Temperature" />
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="range"
                          min={0}
                          max={2}
                          step={0.1}
                          value={temperature}
                          onChange={(e) =>
                            setTemperature(parseFloat(e.target.value))
                          }
                          className="flex-1 h-1.5 accent-accent cursor-pointer"
                        />
                        <span className="text-[13px] font-semibold text-accent tabular-nums w-8 text-right">
                          {temperature.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-text-tertiary">
                          Precise
                        </span>
                        <span className="text-[10px] text-text-tertiary">
                          Creative
                        </span>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* 6. Other Configuration */}
                <SectionCard title="Other Configuration">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <FieldLabel label="Timezone" />
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full h-9 px-3 text-[13px] bg-white border border-border rounded-button text-text-primary appearance-none cursor-pointer"
                      >
                        {[
                          "Asia/Kolkata (IST)",
                          "US/Eastern (EST)",
                          "Europe/London (GMT)",
                        ].map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel label="Concurrency" />
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={concurrency}
                        onChange={(e) =>
                          setConcurrency(
                            Math.min(
                              5,
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          )
                        }
                        className="w-full h-9 px-3 text-[13px] bg-white border border-border rounded-button text-text-primary"
                      />
                    </div>
                    <div>
                      <FieldLabel label="Speaking Speed" />
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-text-secondary w-8">
                          Slow
                        </span>
                        <input
                          type="range"
                          min={0.5}
                          max={2}
                          step={0.1}
                          value={speakingSpeed}
                          onChange={(e) =>
                            setSpeakingSpeed(parseFloat(e.target.value))
                          }
                          className="flex-1 h-1.5 accent-accent cursor-pointer"
                        />
                        <span className="text-[11px] text-text-secondary w-8">
                          Fast
                        </span>
                        <span className="text-[13px] font-medium text-text-primary tabular-nums w-10 text-right">
                          {speakingSpeed.toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ====================================================== */}
            {/*  STEP 2: Knowledge Base                                 */}
            {/* ====================================================== */}

            {step === 1 && (
              <div className="space-y-6">
                {/* 1. File Upload */}
                <SectionCard
                  title="Upload Knowledge Base"
                  helper="Upload documents your agent should learn from -- brochures, pricing sheets, product info"
                >
                  {/* Upload area */}
                  <button
                    type="button"
                    onClick={addStagedFile}
                    className="w-full border-2 border-dashed border-border rounded-card p-8 flex flex-col items-center justify-center text-center hover:border-accent/40 transition-colors cursor-pointer bg-transparent"
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center mb-3">
                      <Upload
                        size={18}
                        strokeWidth={1.5}
                        className="text-text-secondary"
                      />
                    </div>
                    <p className="text-[13px] font-medium text-text-primary mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-[12px] text-text-secondary">
                      PDF, DOC, DOCX, TXT, MD allowed
                    </p>
                  </button>

                  {/* Staged files */}
                  {files.length > 0 && (
                    <div>
                      <h4 className="text-[13px] font-semibold text-text-primary mb-3">
                        Staged Files
                      </h4>
                      <div className="space-y-2">
                        {files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 bg-white border border-border rounded-card px-4 py-3"
                          >
                            <div className="w-8 h-8 rounded-[6px] bg-surface-secondary flex items-center justify-center shrink-0">
                              <FileText
                                size={15}
                                strokeWidth={1.5}
                                className="text-text-secondary"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-text-primary truncate">
                                {file.name}
                              </p>
                              <p className="text-[11px] text-text-secondary">
                                Staged for upload
                              </p>
                            </div>
                            <button
                              onClick={() => removeFile(file.id)}
                              className="p-1.5 rounded-button text-text-tertiary hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                              title="Remove"
                            >
                              <X size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* 2. Additional Context */}
                <SectionCard
                  title="Tell your agent about your business"
                >
                  <div>
                    <textarea
                      value={contextText}
                      onChange={(e) => setContextText(e.target.value)}
                      placeholder="Describe your product, target audience, pricing, key selling points, common objections, and any specific instructions for the agent..."
                      rows={8}
                      className="w-full px-4 py-3 text-[13px] bg-white border border-border rounded-button text-text-primary placeholder:text-text-tertiary resize-y"
                    />
                    <p className="text-[11px] text-text-tertiary mt-1.5">
                      This information will be used to generate your agent&apos;s
                      system prompt and FAQs
                    </p>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ====================================================== */}
            {/*  STEP 3: Prompt & FAQs                                 */}
            {/* ====================================================== */}

            {step === 2 && (
              <div className="space-y-6">
                {isGenerating ? (
                  /* Loading state */
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2
                        size={24}
                        strokeWidth={1.5}
                        className="animate-spin text-accent mb-3"
                      />
                      <p className="text-[14px] font-medium text-text-primary">
                        Generating system prompt and FAQs based on your
                        configuration...
                      </p>
                    </div>
                    {/* Skeleton cards */}
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-white border border-border rounded-card p-5"
                      >
                        <div className="h-4 w-40 bg-surface-secondary rounded animate-pulse mb-4" />
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-surface-secondary rounded animate-pulse" />
                          <div className="h-3 w-3/4 bg-surface-secondary rounded animate-pulse" />
                          <div className="h-3 w-5/6 bg-surface-secondary rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-0 min-h-[500px]">
                    {/* Left sidebar */}
                    <div className="w-[150px] shrink-0 border-r border-border pr-0">
                      <button
                        onClick={() => setPromptSection("prompt")}
                        className={`w-full text-left px-4 py-3 text-[13px] font-medium transition-colors ${
                          promptSection === "prompt"
                            ? "text-accent border-l-2 border-l-accent bg-accent/5"
                            : "text-text-secondary hover:text-text-primary hover:bg-surface-page"
                        }`}
                      >
                        System Prompt
                      </button>
                      <button
                        onClick={() => setPromptSection("faqs")}
                        className={`w-full text-left px-4 py-3 text-[13px] font-medium transition-colors ${
                          promptSection === "faqs"
                            ? "text-accent border-l-2 border-l-accent bg-accent/5"
                            : "text-text-secondary hover:text-text-primary hover:bg-surface-page"
                        }`}
                      >
                        FAQs
                      </button>
                    </div>

                    {/* Right content */}
                    <div className="flex-1 pl-5">
                      {promptSection === "prompt" && (
                        <div className="bg-white border border-border rounded-card">
                          {/* Header */}
                          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                            <h3 className="text-[14px] font-semibold text-text-primary">
                              System Prompt
                            </h3>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setShowSections(!showSections)}
                                className={`h-8 px-3 text-[12px] font-medium border rounded-button inline-flex items-center gap-1.5 transition-colors ${
                                  showSections
                                    ? "border-accent bg-accent/5 text-accent"
                                    : "border-border bg-white text-text-secondary hover:bg-surface-page"
                                }`}
                              >
                                <List size={13} strokeWidth={1.5} />
                                Sections{" "}
                                <span className="text-[10px] font-medium px-1 py-0.5 rounded bg-surface-secondary text-text-tertiary">
                                  {sections.length}
                                </span>
                              </button>
                              <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`h-8 px-3 text-[12px] font-medium border rounded-button inline-flex items-center gap-1.5 transition-colors ${
                                  isEditing
                                    ? "border-accent bg-accent/5 text-accent"
                                    : "border-border bg-white text-text-secondary hover:bg-surface-page"
                                }`}
                              >
                                <Pencil size={12} strokeWidth={1.5} />
                                {isEditing ? "Editing" : "Edit"}
                              </button>
                            </div>
                          </div>

                          {/* Section Navigation */}
                          {showSections && (
                            <div className="px-5 py-3 border-b border-border-subtle bg-surface-page/50">
                              <div className="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-2">
                                Navigate Sections
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {sections.map((section) => (
                                  <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={`px-2.5 py-1 text-[11px] font-medium rounded-badge transition-colors ${
                                      activeSection === section.id
                                        ? "bg-accent text-white"
                                        : "bg-white text-text-secondary border border-border hover:border-accent/30 hover:text-text-primary"
                                    }`}
                                  >
                                    {section.title.length > 30
                                      ? section.title.slice(0, 30) + "..."
                                      : section.title}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tiptap Editor */}
                          <div className="p-5">
                            <div className="w-full min-h-[200px] max-h-[400px] overflow-y-auto p-4 bg-surface-page border border-border rounded-card">
                              <EditorContent editor={editor} />
                            </div>
                          </div>
                        </div>
                      )}

                      {promptSection === "faqs" && (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-[16px] font-semibold text-text-primary mb-1">
                                Frequently Asked Questions
                              </h3>
                              <p className="text-[13px] text-text-secondary">
                                Generated FAQs based on your configuration. Edit or
                                add more as needed.
                              </p>
                            </div>
                            <button
                              onClick={openAddFaq}
                              className="h-9 px-4 text-[13px] font-medium bg-accent text-white rounded-button hover:bg-accent-hover transition-colors inline-flex items-center gap-1.5 shrink-0"
                            >
                              <Plus size={14} strokeWidth={1.5} />
                              Add FAQ
                            </button>
                          </div>

                          {/* Search */}
                          <div className="relative">
                            <Search
                              size={14}
                              strokeWidth={1.5}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                            />
                            <input
                              type="text"
                              placeholder="Search FAQs..."
                              value={faqSearch}
                              onChange={(e) => setFaqSearch(e.target.value)}
                              className="w-full h-9 pl-9 pr-3 text-[13px] bg-white border border-border rounded-button text-text-primary placeholder:text-text-tertiary"
                            />
                          </div>

                          {/* Inline Add/Edit Form */}
                          {showAddFaq && (
                            <div className="bg-white border border-border rounded-card p-5 space-y-3">
                              <h4 className="text-[13px] font-semibold text-text-primary">
                                {editingFaqId ? "Edit FAQ" : "Add FAQ"}
                              </h4>
                              <div>
                                <label className="block text-[12px] font-medium text-text-secondary mb-1">
                                  Question
                                </label>
                                <input
                                  type="text"
                                  value={newFaqQ}
                                  onChange={(e) => setNewFaqQ(e.target.value)}
                                  placeholder="Enter the question..."
                                  className="w-full h-9 px-3 text-[13px] bg-white border border-border rounded-button text-text-primary placeholder:text-text-tertiary"
                                />
                              </div>
                              <div>
                                <label className="block text-[12px] font-medium text-text-secondary mb-1">
                                  Answer
                                </label>
                                <textarea
                                  value={newFaqA}
                                  onChange={(e) => setNewFaqA(e.target.value)}
                                  placeholder="Enter the answer..."
                                  rows={3}
                                  className="w-full px-3 py-2 text-[13px] bg-white border border-border rounded-button text-text-primary placeholder:text-text-tertiary resize-none"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={saveFaq}
                                  className="h-8 px-3.5 text-[12px] font-medium bg-accent text-white rounded-button hover:bg-accent-hover transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelFaqForm}
                                  className="h-8 px-3.5 text-[12px] font-medium border border-border rounded-button bg-white text-text-secondary hover:bg-surface-page transition-colors inline-flex items-center gap-1"
                                >
                                  <X size={12} strokeWidth={1.5} />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* FAQ Table */}
                          <div className="bg-white border border-border rounded-card overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider px-5 py-3">
                                    Question &amp; Answer
                                  </th>
                                  <th className="text-right text-[11px] font-semibold text-text-secondary uppercase tracking-wider px-5 py-3 w-[100px]">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredFaqs.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={2}
                                      className="text-center text-[13px] text-text-secondary py-10"
                                    >
                                      No FAQs found.
                                    </td>
                                  </tr>
                                ) : (
                                  filteredFaqs.map((faq) => (
                                    <tr
                                      key={faq.id}
                                      className="border-b border-border last:border-b-0 hover:bg-surface-page/50 transition-colors"
                                    >
                                      <td className="px-5 py-3.5">
                                        <p className="text-[13px] font-medium text-text-primary mb-0.5">
                                          {faq.question}
                                        </p>
                                        <p className="text-[12px] text-text-secondary leading-relaxed">
                                          {faq.answer}
                                        </p>
                                      </td>
                                      <td className="px-5 py-3.5 text-right">
                                        <div className="inline-flex items-center gap-1">
                                          <button
                                            onClick={() => openEditFaq(faq)}
                                            className="p-1.5 rounded-button text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                                            title="Edit"
                                          >
                                            <Pencil size={14} strokeWidth={1.5} />
                                          </button>
                                          <button
                                            onClick={() => deleteFaq(faq.id)}
                                            className="p-1.5 rounded-button text-text-tertiary hover:text-red-600 hover:bg-red-50 transition-colors"
                                            title="Delete"
                                          >
                                            <Trash2 size={14} strokeWidth={1.5} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ====================================================== */}
            {/*  STEP 4: Test Agent                                     */}
            {/* ====================================================== */}

            {step === 3 && (
              <div className="space-y-6">
                {/* Agent Summary Card */}
                <div className="bg-surface-page border border-border-subtle rounded-card p-5">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="block text-[11px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-1">Agent Name</span>
                      <span className="block text-[13px] text-text-primary font-medium">{name || "Untitled Agent"}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-1">Voice</span>
                      <span className="block text-[13px] text-text-primary font-medium">{selectedVoiceObj?.name || "Not selected"}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-1">Languages</span>
                      <span className="block text-[13px] text-text-primary font-medium">{selectedLanguages.join(", ")}</span>
                    </div>
                  </div>
                </div>

                {/* Test Call Card */}
                <div className="bg-white border border-border rounded-card p-6">
                  <h3 className="text-[16px] font-semibold text-text-primary mb-2">Test Your Agent</h3>
                  <p className="text-[12px] text-text-secondary mb-5">Make a test call to verify your agent is working correctly before going live.</p>

                  <div className="flex items-center gap-3 max-w-[400px]">
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-[13px] text-text-secondary shrink-0">+91</span>
                      <input
                        type="tel"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="flex-1 h-10 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary placeholder:text-text-tertiary"
                      />
                    </div>
                    <button
                      onClick={handleTestCall}
                      disabled={!testPhone.trim() || isTesting}
                      className="h-10 px-5 text-[13px] font-medium bg-accent text-white rounded-button hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      {isTesting ? (
                        <>
                          <Loader2
                            size={14}
                            strokeWidth={1.5}
                            className="animate-spin"
                          />
                          Calling...
                        </>
                      ) : (
                        "Make Test Call"
                      )}
                    </button>
                  </div>

                  {testSuccess && (
                    <div className="mt-3 text-[12px] text-[#15803D] font-medium flex items-center gap-1.5">
                      <Check size={13} /> Test call initiated to +91 {testPhone}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ============================================================ */}
      {/*  Sticky Footer                                                */}
      {/* ============================================================ */}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-6 py-3 flex items-center justify-end gap-3 z-30">
        {step > 0 && (
          <button
            onClick={goBack}
            className="h-9 px-5 text-[13px] font-medium border border-border rounded-button bg-white text-text-primary hover:bg-surface-page transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back
          </button>
        )}

        {step === 0 && (
          <button
            onClick={() => router.push("/agents-mvp")}
            className="h-9 px-5 text-[13px] font-medium border border-border rounded-button bg-white text-text-primary hover:bg-surface-page transition-colors"
          >
            Cancel
          </button>
        )}

        {step === 0 && (
          <button
            onClick={goNext}
            className="h-9 px-5 text-[13px] font-medium bg-accent text-white rounded-button hover:bg-accent-hover transition-colors inline-flex items-center gap-1.5"
          >
            Continue to Knowledge Base
            <span className="text-white/70">&rarr;</span>
          </button>
        )}

        {step === 1 && (
          <button
            onClick={goNext}
            className="h-9 px-5 text-[13px] font-medium bg-accent text-white rounded-button hover:bg-accent-hover transition-colors inline-flex items-center gap-1.5"
          >
            Generate Agent
            <span className="text-white/70">&rarr;</span>
          </button>
        )}

        {step === 2 && !isGenerating && (
          <button
            onClick={goNext}
            className="h-9 px-5 text-[13px] font-medium bg-accent text-white rounded-button hover:bg-accent-hover transition-colors inline-flex items-center gap-1.5"
          >
            Continue to Test
            <span className="text-white/70">&rarr;</span>
          </button>
        )}

        {step === 3 && (
          <button
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className="h-9 px-5 text-[13px] font-medium bg-accent text-white rounded-button hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2
                  size={14}
                  strokeWidth={1.5}
                  className="animate-spin"
                />
                Creating Agent...
              </>
            ) : (
              "Create Agent"
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
