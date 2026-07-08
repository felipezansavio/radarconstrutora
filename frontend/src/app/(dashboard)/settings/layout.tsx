"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Equipe", href: "/settings/team" },
  { label: "Integrações", href: "/settings/integrations" },
  { label: "Plano e cobrança", href: "/settings/billing" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Gerencie sua empresa, equipe e integrações."
      />
      <div className="mb-6 flex gap-1 border-b">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "text-muted-foreground border-b-2 border-transparent px-3 pb-2 text-sm font-medium transition-colors",
              pathname === tab.href &&
                "border-primary text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
