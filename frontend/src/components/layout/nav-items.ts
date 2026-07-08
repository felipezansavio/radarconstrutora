import {
  Bot,
  Building2,
  Home,
  KanbanSquare,
  Landmark,
  MapPinned,
  Search,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Buscar oportunidades", href: "/search", icon: Search },
  { label: "Oportunidades", href: "/opportunities", icon: Sparkles },
  { label: "Mapa", href: "/map", icon: MapPinned },
  { label: "Construtoras", href: "/builders", icon: Landmark },
  { label: "Empreendimentos", href: "/projects", icon: Building2 },
  { label: "CRM", href: "/leads", icon: KanbanSquare },
  { label: "Assistente IA", href: "/assistant", icon: Bot },
  { label: "Configurações", href: "/settings/team", icon: Settings },
];
