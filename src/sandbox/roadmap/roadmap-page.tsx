"use client";

import {
  ArrowLeftIcon,
  CheckIcon,
  CircleIcon,
  ExternalLinkIcon,
  LightbulbIcon,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { FlowDemo, RolesDemo, SearchDemo, TargetDemo } from "./demos";
import { PhaseIllustration } from "./illustrations";
import { phases, STATUS_LABELS, type Phase, type PhaseStatus } from "./roadmap-data";
import styles from "./roadmap.module.css";

/**
 * The roadmap as a presentation for the client (D-299): every phase as a big numbered step, what
 * it means in practice, what is done, a small working sample where one exists, and where in the
 * panel to try it. Development only, like the structure presentation (D-052).
 */

const DEMOS = { flow: FlowDemo, roles: RolesDemo, search: SearchDemo, target: TargetDemo };

const BADGE: Record<PhaseStatus, "success" | "info" | "warning" | "outline"> = {
  done: "success",
  next: "outline",
  now: "warning",
};

function PhaseSection({ phase, index }: { phase: Phase; index: number }) {
  const done = phase.steps.filter((step) => step.done).length;
  return (
    <section aria-labelledby={`${phase.id}-title`} className={styles.phase} id={phase.id}>
      <div className={styles.phaseHead}>
        <span className={styles.phaseIndex} data-status={phase.status}>
          {index + 1}
        </span>
        <div className={styles.phaseHeading}>
          <span className={styles.phaseNumber}>Faz {phase.number}</span>
          <h2 className={styles.phaseTitle} id={`${phase.id}-title`}>
            {phase.title}
          </h2>
          <div className={styles.phaseMeta}>
            <Badge variant={BADGE[phase.status]}>{STATUS_LABELS[phase.status]}</Badge>
            {phase.status !== "next" ? (
              <span className={styles.muted}>
                {done} / {phase.steps.length} adım
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.phaseBody}>
        <div className={styles.phaseText}>
          <p className={styles.summary}>{phase.summary}</p>
          <ol className={styles.steps}>
            {phase.steps.map((step) => (
              <li className={step.done ? styles.stepDone : styles.step} key={step.title}>
                <span aria-hidden="true" className={styles.stepMark}>
                  {step.done ? <CheckIcon /> : <CircleIcon />}
                </span>
                <span>
                  <strong>{step.title}</strong>
                  <span className={styles.muted}> — {step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className={styles.phaseArt}>
          <PhaseIllustration name={phase.illustration} />
        </div>
      </div>

      {phase.demos?.length ? (
        <div className={styles.demos}>
          {phase.demos.map((key) => {
            const Demo = DEMOS[key];
            return <Demo key={key} />;
          })}
        </div>
      ) : null}

      {phase.tryIt ? (
        <div className={styles.tryIt}>
          <p className={styles.tryTitle}>Panelde deneyin</p>
          <ul className={styles.tryList}>
            {phase.tryIt.map((link) => (
              <li key={link.href}>
                <a className={styles.tryLink} href={link.href} rel="noreferrer" target="_blank">
                  {link.label}
                  <ExternalLinkIcon aria-hidden="true" />
                </a>
                <span className={styles.muted}>{link.what}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {phase.note ? (
        <p className={styles.note}>
          <LightbulbIcon aria-hidden="true" />
          <span>{phase.note}</span>
        </p>
      ) : null}
    </section>
  );
}

export function RoadmapPage() {
  const stepsDone = phases.flatMap((phase) => phase.steps).filter((step) => step.done).length;
  const stepsAll = phases.flatMap((phase) => phase.steps).length;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <span className={styles.eyebrow}>GEOGES Panel · Sunum</span>
          <div className={styles.headerActions}>
            <Badge variant="warning">Yalnız geliştirme · canlıda yok</Badge>
            <Button render={<Link href="/today" />} size="sm" variant="outline">
              <ArrowLeftIcon aria-hidden="true" />
              Panele dön
            </Button>
          </div>
        </div>
        <h1 className={styles.title}>Yol haritası: nereden geldik, nereye gidiyoruz</h1>
        <p className={styles.lead}>
          Firmanın bütün işini — projeden şantiyeye, stoktan hakedişe — tek panelde toplayan
          uygulama. Aşağıda her faz büyük bir adım; bitenlerin yanında çalışan küçük örnekler ve
          panelde nerede denenebileceği var.
        </p>
        <div aria-label={`${stepsDone} / ${stepsAll} adım tamamlandı`} className={styles.progress}>
          <span style={{ width: `${(stepsDone / stepsAll) * 100}%` }} />
        </div>
        <p className={styles.muted}>
          {stepsDone} / {stepsAll} adım tamamlandı
        </p>
        <nav aria-label="Fazlar" className={styles.strip}>
          {phases.map((phase, index) => (
            <a
              className={styles.chip}
              data-status={phase.status}
              href={`#${phase.id}`}
              key={phase.id}
            >
              <span className={styles.chipIndex}>{index + 1}</span>
              {phase.title}
            </a>
          ))}
        </nav>
        <ul className={styles.legend}>
          {(["done", "now", "next"] as const).map((status) => (
            <li key={status}>
              <span className={styles.legendDot} data-status={status} />
              {STATUS_LABELS[status]}
            </li>
          ))}
        </ul>
      </header>

      <main className={styles.phases}>
        {phases.map((phase, index) => (
          <PhaseSection index={index} key={phase.id} phase={phase} />
        ))}
      </main>

      <footer className={styles.footer}>
        Bu sayfa yalnız geliştirme ortamında açılan bir sunumdur; içerik yol haritası ve karar
        kayıtlarından derlenir. Örnekler bu sayfanın kendi verisiyle çalışır, hiçbir şey kaydetmez.
      </footer>
    </div>
  );
}
