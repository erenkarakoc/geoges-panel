import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type AccessPolicy, filterByPermission } from "@/platform/access/access-policy";
import { dashboardWidgetRegistry } from "@/platform/dashboard/dashboard-widget-registry";

/** Owner cockpit (scope §3). M0: empty card skeleton; content is defined in Phase 02. */
export function CockpitOverview({ access }: { access: AccessPolicy }) {
  const widgets = filterByPermission(dashboardWidgetRegistry, access);
  const indicators = widgets.filter((widget) => widget.size === "indicator");
  const wideWidgets = widgets.filter((widget) => widget.size === "wide");

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-semibold">Cockpit</h1>
        <Badge variant="info">Önizleme: veriler Phase 02 sonrası bağlanacak</Badge>
      </div>

      <section aria-label="Üst yönetim göstergeleri">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {indicators.map((widget) => (
            <li key={widget.id}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{widget.title}</CardTitle>
                  <CardDescription>{widget.description}</CardDescription>
                </CardHeader>
                <CardPanel>
                  <Skeleton aria-hidden="true" className="h-7 w-20" />
                </CardPanel>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {wideWidgets.map((widget) => (
          <Card key={widget.id} render={<section aria-label={widget.title} />}>
            <CardHeader>
              <CardTitle>{widget.title}</CardTitle>
              <CardDescription>{widget.description}</CardDescription>
            </CardHeader>
            <CardPanel className="flex flex-col gap-3">
              <Skeleton aria-hidden="true" className="h-5 w-full" />
              <Skeleton aria-hidden="true" className="h-5 w-4/5" />
              <Skeleton aria-hidden="true" className="h-5 w-3/5" />
            </CardPanel>
          </Card>
        ))}
      </div>
    </>
  );
}
