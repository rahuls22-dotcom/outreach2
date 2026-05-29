"use client";

import { motion } from "framer-motion";

interface PageHeaderProps {
  breadcrumb: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ breadcrumb, title, subtitle, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="mb-8"
    >
      <div className="text-meta text-text-secondary mb-1">{breadcrumb}</div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-text-primary">{title}</h1>
          {subtitle && <p className="text-meta text-text-secondary mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </motion.div>
  );
}
