"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Building2, Plug, FolderKanban } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { StepCompany } from "@/components/onboarding/step-company";
import { StepAdAccount } from "@/components/onboarding/step-ad-account";
import { StepProject } from "@/components/onboarding/step-project";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

const steps = [
  { key: "company", label: "Company", icon: Building2 },
  { key: "ad-account", label: "Ad Account", icon: Plug },
  { key: "project", label: "Project", icon: FolderKanban },
];

interface ImportedCampaign {
  id: string;
  name: string;
  status: string;
  spend: string;
  leads: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { setCompanyProfile, setOnboardingComplete, completeChecklistItem } = useAppStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [importedCampaigns, setImportedCampaigns] = useState<ImportedCampaign[]>([]);

  const finishOnboarding = () => {
    setOnboardingComplete(true);
    router.push("/dashboard");
  };

  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp}>
      {/* Progress bar */}
      <div className="flex items-center justify-center gap-0 mb-10">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === currentStep;
          const isComplete = i < currentStep;
          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? "bg-accent text-white"
                      : isComplete
                      ? "bg-accent/10 text-accent"
                      : "bg-surface-secondary text-text-tertiary"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.5} />
                </div>
                <span
                  className={`mt-1.5 text-[11px] font-medium ${
                    isActive ? "text-text-primary" : "text-text-tertiary"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-16 h-[2px] mx-2 mt-[-14px] ${
                    i < currentStep ? "bg-accent" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {currentStep === 0 && (
        <StepCompany
          onNext={(data) => {
            setCompanyProfile({
              companyName: data.companyName,
              industry: data.industry,
              logoUrl: data.logoFile,
              userName: data.userName,
            });
            completeChecklistItem("company");
            setCurrentStep(1);
          }}
        />
      )}

      {currentStep === 1 && (
        <StepAdAccount
          onNext={(data) => {
            setImportedCampaigns(data.importedCampaigns);
            if (data.accountName) completeChecklistItem("ad_account");
            setCurrentStep(2);
          }}
          onBack={() => setCurrentStep(0)}
        />
      )}

      {currentStep === 2 && (
        <StepProject
          importedCampaigns={importedCampaigns}
          onNext={(data) => {
            if (data.projects.length > 0) {
              completeChecklistItem("project");
            }
            finishOnboarding();
          }}
          onBack={() => setCurrentStep(1)}
        />
      )}
    </motion.div>
  );
}
