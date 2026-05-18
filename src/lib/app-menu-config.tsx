import type { ReactNode } from "react";
import {
  Calendar,
  Car,
  CreditCard,
  History,
  Settings2,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";

export type AppMenuItem = {
  id: string;
  label: string;
  desc: string;
  href: string;
  icon: ReactNode;
};

export const MOVER_MENU_ITEMS: AppMenuItem[] = [
  {
    id: "perfil",
    label: "Perfil",
    desc: "Nombre, correo y cuenta",
    href: "/pulse/settings/perfil",
    icon: <User className="h-5 w-5" />,
  },
  {
    id: "pago",
    label: "Metodo de pago",
    desc: "Tarjeta, efectivo o billetera",
    href: "/pulse/settings/pago",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: "automaticos",
    label: "Viajes automaticos",
    desc: "Programar rutinas y horarios",
    href: "/pulse/settings/automaticos",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    id: "actividad",
    label: "Actividad",
    desc: "Historial de viajes",
    href: "/pulse/settings/actividad",
    icon: <History className="h-5 w-5" />,
  },
  {
    id: "preferencias",
    label: "Preferencias",
    desc: "Ambiente, confort y pulso",
    href: "/pulse/settings/preferencias",
    icon: <Sparkles className="h-5 w-5" />,
  },
];

export const PILOT_MENU_ITEMS: AppMenuItem[] = [
  {
    id: "perfil",
    label: "Perfil",
    desc: "Nombre, reputacion y cuenta",
    href: "/pilot/settings/perfil",
    icon: <User className="h-5 w-5" />,
  },
  {
    id: "vehiculo",
    label: "Vehiculo y servicios",
    desc: "Tipo de auto, moto o van",
    href: "/pilot/settings/vehiculo",
    icon: <Car className="h-5 w-5" />,
  },
  {
    id: "ganancias",
    label: "Ganancias",
    desc: "Resumen de viajes completados",
    href: "/pilot/settings/ganancias",
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    id: "actividad",
    label: "Actividad",
    desc: "Historial como conductor",
    href: "/pilot/settings/actividad",
    icon: <History className="h-5 w-5" />,
  },
  {
    id: "preferencias",
    label: "Preferencias",
    desc: "Disponibilidad y app",
    href: "/pilot/settings/preferencias",
    icon: <Settings2 className="h-5 w-5" />,
  },
];
