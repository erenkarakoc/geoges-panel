import {
  DAY_PARAM,
  type SiteRoute,
  siteSectionHref,
  siteSections,
} from "@/modules/sit/ui/site-context";
import { ContextBar } from "@/platform/ui/app-shell/context-bar";

/** Context row of an open site: its sections and the day (D-055, D-064). */
export function SiteContextRow({ route }: { route: SiteRoute }) {
  return (
    <ContextBar
      activeSection={route.section.value}
      day={route.day}
      dayParam={DAY_PARAM}
      sections={siteSections.map((section) => ({
        value: section.value,
        label: section.label,
        href: siteSectionHref(route.site.id, section),
      }))}
      title={route.site.name}
      today={route.today}
    />
  );
}
