"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  businessFlows,
  dataClasses,
  type DataClassId,
  modules,
  otherRoles,
  roleConcepts,
  type RoleInfo,
  roles,
  type Visibility,
} from "./presentation-data";
import { roleIcons, visibilityIcons } from "./presentation-icons";
import styles from "./presentation.module.css";

const visibilityLabel: Record<Visibility, string> = {
  yes: "Görür",
  no: "Görmez",
  open: "Phase 01",
};

type Verdict = "yes" | "partial" | "no" | "open";

const verdictLabel: Record<Verdict, string> = {
  yes: "Görür",
  partial: "Kısmen görür",
  no: "Görmez",
  open: "Phase 01'de belli olacak",
};

/**
 * What a role may see is recorded per class of data (§2.4, §2.5), and each module states which
 * classes it carries — so the verdict for "may this role open this module" is derived, never
 * asserted. A module with mixed classes can only be partly visible, which is said plainly.
 */
function verdictFor(role: RoleInfo, carried: readonly DataClassId[]): Verdict {
  const seen = carried.map((id) => role.visibility[id]);

  if (seen.every((value) => value === "yes")) {
    return "yes";
  }

  if (seen.every((value) => value === "no")) {
    return "no";
  }

  if (seen.includes("no")) {
    return "partial";
  }

  return "open";
}

type Subject = { eyebrow: string; title: string; carried: readonly DataClassId[] } | null;

/** A flow is judged on everything its modules carry together, a module on what it carries alone. */
function subjectFor(selected: string | null, activeFlow: string | null): Subject {
  const selectedModule = modules.find((candidate) => candidate.code === selected);

  if (selectedModule) {
    return {
      eyebrow: "Bu modülü kim görür",
      title: selectedModule.name,
      carried: selectedModule.data,
    };
  }

  const flow = businessFlows.find((candidate) => candidate.id === activeFlow);

  if (flow) {
    const carried = new Set<DataClassId>();

    for (const code of flow.modules) {
      const entry = modules.find((candidate) => candidate.code === code);
      entry?.data.forEach((id) => carried.add(id));
    }

    return {
      eyebrow: "Bu akışı kim izleyebilir",
      title: flow.title,
      carried: dataClasses.map((entry) => entry.id).filter((id) => carried.has(id)),
    };
  }

  return null;
}

export function RolePanel({
  selected,
  activeFlow,
}: {
  selected: string | null;
  activeFlow: string | null;
}) {
  const subject = subjectFor(selected, activeFlow);

  return (
    <aside className={`${styles.panel} ${styles.panelLeft}`}>
      <ScrollArea className={styles.panelScroll}>
        <div className={styles.panelInner}>
          {subject ? (
            <>
              <p className={styles.panelEyebrow}>{subject.eyebrow}</p>
              <h2 className={styles.panelTitle}>{subject.title}</h2>

              <section className={styles.panelSection}>
                <h3 className={styles.panelHeading}>Taşıdığı veri</h3>
                <div className={styles.chipRow}>
                  {subject.carried.map((id) => (
                    <Badge key={id} variant="outline">
                      {dataClasses.find((entry) => entry.id === id)?.name ?? id}
                    </Badge>
                  ))}
                </div>
              </section>

              <ul className={styles.roleList}>
                {roles.map((role) => {
                  const verdict = verdictFor(role, subject.carried);
                  const RoleIcon = roleIcons[role.name];
                  const VerdictIcon =
                    visibilityIcons[verdict === "partial" ? "open" : (verdict as Visibility)];

                  return (
                    <li data-verdict={verdict} key={role.name}>
                      <span className={styles.roleName}>
                        {RoleIcon ? (
                          <RoleIcon aria-hidden="true" className={styles.inlineIcon} />
                        ) : null}
                        {role.name}
                      </span>
                      <span className={styles.roleVerdict}>
                        <VerdictIcon aria-hidden="true" className={styles.inlineIcon} />
                        {verdictLabel[verdict]}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <p className={styles.panelNote}>
                Bu sonuç, taşınan veri sınıfı ile rolün kayıtlı görünürlüğünden çıkarılır. Bir
                akışta akıştaki tüm modüllerin verisi birlikte değerlendirilir. Modüllerin veri
                sınıfı önerilmiştir; kesin yetki matrisi Phase 01&apos;de belirlenir.
              </p>
            </>
          ) : (
            <>
              <p className={styles.panelEyebrow}>Roller</p>
              <h2 className={styles.panelTitle}>Kim neyi görür</h2>
              <p className={styles.panelLead}>
                Kapsamda açıkça yazan roller. Bir modül veya iş akışı seçtiğinizde bu liste ona göre
                yanıtlanır.
              </p>

              <ul className={styles.roleList}>
                {roles.map((role) => {
                  const RoleIcon = roleIcons[role.name];

                  return (
                    <li key={role.name}>
                      <span className={styles.roleName}>
                        {RoleIcon ? (
                          <RoleIcon aria-hidden="true" className={styles.inlineIcon} />
                        ) : null}
                        {role.name}
                        <span className={styles.panelSource}>{role.source}</span>
                      </span>
                      <span className={styles.roleNote}>{role.note}</span>
                      <span className={styles.roleMatrix}>
                        {dataClasses.map((dataClass) => {
                          const value = role.visibility[dataClass.id];
                          const VerdictIcon = visibilityIcons[value];

                          return (
                            <span data-visibility={value} key={dataClass.id}>
                              <VerdictIcon aria-hidden="true" className={styles.inlineIcon} />
                              {dataClass.name}: {visibilityLabel[value]}
                            </span>
                          );
                        })}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <section className={styles.panelSection}>
                <h3 className={styles.panelHeading}>Rol kuralları</h3>
                <ul className={styles.panelConcepts}>
                  {roleConcepts.map((concept) => (
                    <li key={concept.title}>
                      <span className={styles.conceptTitle}>{concept.title}</span>
                      <span className={styles.conceptText}>{concept.text}</span>
                      <span className={styles.panelSource}>{concept.source}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <p className={styles.panelNote}>
                Diğer roller ({otherRoles.join(", ")}) ve ayrıntılı yetki matrisi Phase 01&apos;de
                kesinleşir.
              </p>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
