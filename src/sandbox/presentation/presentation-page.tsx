"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

import { RolePanel } from "./role-panel";
import { StructureMap } from "./structure-map";
import { DetailPanel } from "./detail-panel";
import { businessFlows, dependencies, domainEvents, modules } from "./presentation-data";
import styles from "./presentation.module.css";

/**
 * One cross-section, one reading panel. Everything the records hold is on this page; the section
 * stays quiet until the visitor points at a module or picks a flow, which is what keeps it legible.
 */
export function PresentationPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [activeFlow, setActiveFlow] = useState<string | null>(null);

  const selectModule = (code: string | null) => {
    setSelected(code);
    if (code) {
      setActiveFlow(null);
    }
  };

  const selectFlow = (id: string) => {
    setActiveFlow((current) => (current === id ? null : id));
    setSelected(null);
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>GEOGES Panel · Yapı sunumu</span>
          <h1 className={styles.title}>Uygulamanın tamamı tek kesitte</h1>
          <p className={styles.lead}>
            {modules.length} modül, {dependencies.length} bağlantı, {domainEvents.length} olay ve{" "}
            {businessFlows.length} uçtan uca akış.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Badge variant="warning">Yalnız geliştirme · canlıda yok</Badge>
          <Button render={<Link href="/today" />} size="sm" variant="outline">
            <ArrowLeftIcon aria-hidden="true" />
            Panele dön
          </Button>
        </div>
      </header>

      <nav aria-label="İş akışları" className={styles.flowBar}>
        <span className={styles.flowBarLabel}>İş akışını kesitte izle</span>
        <div className={styles.flowChips}>
          {businessFlows.map((flow) => (
            <Toggle
              key={flow.id}
              onPressedChange={() => selectFlow(flow.id)}
              pressed={activeFlow === flow.id}
              size="sm"
            >
              {flow.title}
            </Toggle>
          ))}
        </div>
      </nav>

      <div className={styles.stage}>
        <DetailPanel activeFlow={activeFlow} onSelect={selectModule} selected={selected} />
        <StructureMap activeFlow={activeFlow} onSelect={selectModule} selected={selected} />
        <RolePanel activeFlow={activeFlow} selected={selected} />
      </div>

      <footer className={styles.footer}>
        Kaynaklar: docs/architecture/MODULE_MAP.md, Özellik Yapısı §2, §9, §13, §45 ve kararlar
        D-035…D-040. Bu sayfa D-052 kapsamında geliştirme sunumudur; kayıtlar değişince
        presentation-data.ts güncellenir.
      </footer>
    </div>
  );
}
