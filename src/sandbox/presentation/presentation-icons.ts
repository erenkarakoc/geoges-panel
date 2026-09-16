import {
  BoxesIcon,
  BriefcaseBusinessIcon,
  BriefcaseIcon,
  CalendarCheckIcon,
  CircleHelpIcon,
  ClipboardCheckIcon,
  CoinsIcon,
  CompassIcon,
  CrownIcon,
  DatabaseIcon,
  EyeIcon,
  EyeOffIcon,
  FactoryIcon,
  FileTextIcon,
  FolderOpenIcon,
  GaugeIcon,
  GitBranchIcon,
  HardHatIcon,
  HistoryIcon,
  LayersIcon,
  LifeBuoyIcon,
  ListChecksIcon,
  type LucideIcon,
  NetworkIcon,
  PlugZapIcon,
  ScaleIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TrendingUpIcon,
  TruckIcon,
  UserCogIcon,
  UsersIcon,
  UsersRoundIcon,
} from "lucide-react";

import type { GroupId } from "./presentation-data";

/**
 * One icon per module, matching the left menu's visual language. Used on the plates in the section
 * and again in the reading panel, so the same module is recognisable in both.
 */
export const moduleIcons: Record<string, LucideIcon> = {
  IAM: ShieldCheckIcon,
  AUD: HistoryIcon,
  DOC: FolderOpenIcon,
  WFL: GitBranchIcon,
  TSK: ListChecksIcon,
  ADM: SlidersHorizontalIcon,
  PRJ: BriefcaseIcon,
  SIT: HardHatIcon,
  INV: BoxesIcon,
  PUR: ShoppingCartIcon,
  FAC: FactoryIcon,
  EQP: TruckIcon,
  CRM: UsersRoundIcon,
  QTE: FileTextIcon,
  FIN: CoinsIcon,
  HR: UserCogIcon,
  CMP: ScaleIcon,
  QHS: ShieldAlertIcon,
  MTG: CalendarCheckIcon,
  SUP: LifeBuoyIcon,
  RPT: GaugeIcon,
  PRF: TrendingUpIcon,
  INT: PlugZapIcon,
  STR: CompassIcon,
  MIG: DatabaseIcon,
};

export const groupIcons: Record<GroupId, LucideIcon> = {
  platform: LayersIcon,
  operations: HardHatIcon,
  commercial: CoinsIcon,
  corporate: ScaleIcon,
  analysis: GaugeIcon,
};

export const panelIcons = {
  connections: NetworkIcon,
  events: SparklesIcon,
  flows: GitBranchIcon,
  roles: UsersRoundIcon,
} as const;

/** One icon per role recorded in the scope (§2.4, §2.5, §13). */
export const roleIcons: Record<string, LucideIcon> = {
  Sahip: CrownIcon,
  "Genel Müdür": BriefcaseBusinessIcon,
  Koordinatör: ClipboardCheckIcon,
  "Saha Mühendisi / Formen": HardHatIcon,
  "İSG Sorumlusu": ShieldAlertIcon,
  "Taşeron Ekip Başı": UsersIcon,
};

/** Whether a role may see a class of data. */
export const visibilityIcons = {
  yes: EyeIcon,
  no: EyeOffIcon,
  open: CircleHelpIcon,
} as const;
