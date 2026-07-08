"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Kanban", href: "/leads" },
  { label: "Calendário", href: "/leads/calendar" },
  { label: "Dashboard", href: "/leads/dashboard" },
];

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="CRM"
        description="Acompanhe o funil comercial de leads em andamento."
        actions={<LeadFormDialog />}
      />
      <div className="mb-4 flex gap-1 border-b">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "text-muted-foreground border-b-2 border-transparent px-3 pb-2 text-sm font-medium transition-colors",
              pathname === tab.href && "border-primary text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
