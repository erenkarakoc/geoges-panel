"use client";

import { ArrowLeftIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { connectionCounts } from "./map-layout";
import { groupIcons, moduleIcons } from "./presentation-icons";
import {
  businessFlows,
  dailyLogReflections,
  dependencies,
  domainEvents,
  moduleGroups,
  modules,
} from "./presentation-data";
import styles from "./presentation.module.css";

type DetailPanelProps = {
  selected: string | null;
  activeFlow: string | null;
  onSelect: (code: string | null) => void;
};

/**
 * The reading surface next to the section. Nothing is hidden from the page — it is only deferred
 * until the visitor points at something, which is what keeps the section itself uncluttered.
 */
export function DetailPanel({ selected, activeFlow, onSelect }: DetailPanelProps) {
  const selectedModule = modules.find((candidate) => candidate.code === selected);
  const flow = businessFlows.find((candidate) => candidate.id === activeFlow);

  if (selectedModule) {
    const group = moduleGroups.find((candidate) => candidate.id === selectedModule.group);
    const dependsOn = dependencies
      .filter(([from]) => from === selectedModule.code)
      .map(([, to]) => to);
    const usedBy = dependencies
      .filter(([, to]) => to === selectedModule.code)
      .map(([from]) => from);
    const publishes = domainEvents.filter((event) => event.publisher === selectedModule.code);
    const reactsTo = domainEvents.filter((event) => event.reactors.includes(selectedModule.code));
    const inFlows = businessFlows.filter((candidate) =>
      candidate.modules.includes(selectedModule.code),
    );

    return (
      <aside className={styles.panel}>
        <ScrollArea className={styles.panelScroll}>
          <div className={styles.panelInner}>
            <Button
              className={styles.panelBack}
              onClick={() => onSelect(null)}
              size="xs"
              variant="ghost"
            >
              <ArrowLeftIcon aria-hidden="true" />
              Genel bakışa dön
            </Button>

            <p className={styles.panelEyebrow} data-group={selectedModule.group}>
              {group?.name}
            </p>
            <h2 className={styles.panelTitle}>
              <ModuleIcon
                aria-hidden="true"
                className={styles.panelTitleIcon}
                code={selectedModule.code}
              />
              <span className={styles.panelCode}>{selectedModule.code}</span>
              {selectedModule.name}
            </h2>
            <p className={styles.panelLead}>{selectedModule.summary}</p>
            {selectedModule.deferred ? <Badge variant="warning">Sonraya bırakıldı</Badge> : null}

            <PanelStat
              label="Bağlantı"
              value={`${connectionCounts.get(selectedModule.code) ?? 0} modül`}
            />

            <PanelList codes={dependsOn} onSelect={onSelect} title="Neye dayanır" />
            <PanelList codes={usedBy} onSelect={onSelect} title="Onu kim kullanır" />

            {publishes.length > 0 ? (
              <section className={styles.panelSection}>
                <h3 className={styles.panelHeading}>Yaydığı olaylar</h3>
                <ul className={styles.panelEvents}>
                  {publishes.map((event) => (
                    <li key={event.name}>
                      <span className={styles.eventLabel}>{event.label}</span>
                      <span className={styles.eventReactors}>
                        Harekete geçirdiği modüller: {event.reactors.join(", ")}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {reactsTo.length > 0 ? (
              <section className={styles.panelSection}>
                <h3 className={styles.panelHeading}>Tepki verdiği olaylar</h3>
                <ul className={styles.panelEvents}>
                  {reactsTo.map((event) => (
                    <li key={event.name}>
                      <span className={styles.eventLabel}>{event.label}</span>
                      <span className={styles.eventReactors}>
                        {event.publisher} modülünden gelir
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {inFlows.length > 0 ? (
              <section className={styles.panelSection}>
                <h3 className={styles.panelHeading}>Geçtiği iş akışları</h3>
                <ul className={styles.panelFlows}>
                  {inFlows.map((candidate) => (
                    <li key={candidate.id}>
                      {candidate.title}{" "}
                      <span className={styles.panelSource}>{candidate.section}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </ScrollArea>
      </aside>
    );
  }

  if (flow) {
    return (
      <aside className={styles.panel}>
        <ScrollArea className={styles.panelScroll}>
          <div className={styles.panelInner}>
            <p className={styles.panelEyebrow}>İş akışı {flow.section}</p>
            <h2 className={styles.panelTitle}>{flow.title}</h2>
            <p className={styles.panelLead}>{flow.purpose}</p>
            <p className={styles.panelNote}>
              Kesitte {flow.modules.length} modül aydınlanıyor; aşağıdaki adımlar bu sırayla
              işliyor.
            </p>

            <ol className={styles.panelSteps}>
              {flow.steps.map((step, index) => (
                <li key={step}>
                  <span className={styles.stepIndex}>{String(index + 1).padStart(2, "0")}</span>
                  {step}
                </li>
              ))}
            </ol>

            <PanelList codes={flow.modules} onSelect={onSelect} title="Akıştaki modüller" />
          </div>
        </ScrollArea>
      </aside>
    );
  }

  return (
    <aside className={styles.panel}>
      <ScrollArea className={styles.panelScroll}>
        <div className={styles.panelInner}>
          <p className={styles.panelEyebrow}>Genel bakış</p>
          <h2 className={styles.panelTitle}>Sistemin şekli</h2>
          <p className={styles.panelLead}>
            Bir modüle dokunun: neye dayandığı, onu kimin kullandığı ve hangi olayları yaydığı
            burada açılır, kesitte de yalnızca o bağlantılar aydınlanır.
          </p>

          <section className={styles.panelSection}>
            <h3 className={styles.panelHeading}>Katmanlar</h3>
            <ul className={styles.panelGroups}>
              {moduleGroups.map((group) => {
                const GroupIcon = groupIcons[group.id];

                return (
                  <li data-group={group.id} key={group.id}>
                    <span className={styles.groupName}>
                      <GroupIcon aria-hidden="true" className={styles.inlineIcon} />
                      {group.name}
                    </span>
                    <span className={styles.groupNote}>{group.note}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={styles.panelSection}>
            <h3 className={styles.panelHeading}>Tek günlük kayıt nereye düşer</h3>
            <ul className={styles.reflectionList}>
              {dailyLogReflections.map((reflection) => (
                <li key={reflection}>{reflection}</li>
              ))}
            </ul>
            <p className={styles.panelNote}>
              Sahadaki bir kayıt koordinatör onayından geçtikten sonra bu sekiz yere kendiliğinden
              yansır (§9, §13, D-035…D-040).
            </p>
          </section>
        </div>
      </ScrollArea>
    </aside>
  );
}

function ModuleIcon({ code, className }: { code: string; className?: string }) {
  const Icon = moduleIcons[code];

  return Icon ? <Icon aria-hidden="true" className={className} /> : null;
}

function PanelStat({ label, value }: { label: string; value: string }) {
  return (
    <p className={styles.panelStat}>
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function PanelList({
  title,
  codes,
  onSelect,
}: {
  title: string;
  codes: readonly string[];
  onSelect: (code: string) => void;
}) {
  if (codes.length === 0) {
    return null;
  }

  return (
    <section className={styles.panelSection}>
      <h3 className={styles.panelHeading}>{title}</h3>
      <div className={styles.chipRow}>
        {codes.map((code) => (
          <Button key={code} onClick={() => onSelect(code)} size="xs" variant="outline">
            <ModuleIcon aria-hidden="true" code={code} />
            <span className={styles.chipCode}>{code}</span>
            {modules.find((entry) => entry.code === code)?.name ?? code}
          </Button>
        ))}
      </div>
    </section>
  );
}
