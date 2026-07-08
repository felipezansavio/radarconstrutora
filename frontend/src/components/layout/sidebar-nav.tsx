"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
          <Radar className="size-4" />
        </div>
        <span className="text-sm font-semibold">Radar Construtora IA</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="text-muted-foreground border-t p-4 text-xs">
        Radar Construtora IA © {new Date().getFullYear()}
      </div>
    </div>
  );
}
