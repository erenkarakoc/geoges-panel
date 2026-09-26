"use client";

import {
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";

import "@xyflow/react/dist/base.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ROLE_LABELS, roleCards, searchSamples } from "./roadmap-data";
import styles from "./roadmap.module.css";

/**
 * Small working samples of what is built (D-299). They run on this page's own sample data and
 * write nothing; the real screens are one click away in each section's "Panelde deneyin".
 */

// ---------------------------------------------------------------------------------------------
// Who sees what
// ---------------------------------------------------------------------------------------------

type Seat = keyof typeof ROLE_LABELS;

export function RolesDemo() {
  const [seat, setSeat] = useState<Seat>("owner");
  return (
    <div className={styles.demo}>
      <p className={styles.demoTitle}>Deneyin: bir rol seçin, “Bugün” ekranında ne görür?</p>
      <div className={styles.demoRow}>
        {(Object.keys(ROLE_LABELS) as Seat[]).map((one) => (
          <Button
            key={one}
            onClick={() => setSeat(one)}
            size="sm"
            variant={one === seat ? "default" : "outline"}
          >
            {ROLE_LABELS[one]}
          </Button>
        ))}
      </div>
      <ul className={styles.roleGrid}>
        {roleCards.map((card) => {
          const sees = (card.roles as readonly string[]).includes(seat);
          return (
            <li className={sees ? styles.roleCard : styles.roleCardHidden} key={card.card}>
              <span>{card.card}</span>
              <span className={styles.roleState}>{sees ? "görür" : "hiç gelmez"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Search that does not care how Turkish letters are typed
// ---------------------------------------------------------------------------------------------

const fold = (text: string) =>
  text
    .replaceAll("İ", "i")
    .replaceAll("I", "ı")
    .toLocaleLowerCase("tr")
    .replaceAll("ç", "c")
    .replaceAll("ğ", "g")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ş", "s")
    .replaceAll("ü", "u");

export function SearchDemo() {
  const [words, setWords] = useState("santiye");
  const found = searchSamples.filter((one) =>
    fold(words)
      .split(/\s+/)
      .filter(Boolean)
      .every((word) => fold(one).includes(word)),
  );
  return (
    <div className={styles.demo}>
      <p className={styles.demoTitle}>
        Deneyin: Türkçe harf kullanmadan yazın (“gorev”, “santiye”, “calisma”)
      </p>
      <Input
        aria-label="Arama"
        onChange={(event) => setWords(event.currentTarget.value)}
        value={words}
      />
      <ul className={styles.searchList}>
        {found.length === 0 ? <li className={styles.muted}>Sonuç yok</li> : null}
        {found.map((one) => (
          <li key={one}>{one}</li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// An approval flow, played step by step
// ---------------------------------------------------------------------------------------------

type BoxData = { kind: string; title: string; lit: boolean; passed: boolean };

function Box({ data }: NodeProps) {
  const box = data as unknown as BoxData;
  return (
    <div className={box.lit ? styles.boxLit : box.passed ? styles.boxPassed : styles.box}>
      <Handle className={styles.hidden} position={Position.Top} type="target" />
      <span className={styles.boxKind}>{box.kind}</span>
      <span className={styles.boxTitle}>{box.title}</span>
      <Handle className={styles.hidden} position={Position.Bottom} type="source" />
    </div>
  );
}

const nodeTypes = { box: Box };

const FLOW = [
  { id: "start", kind: "Akış başlar", title: "Satın alma talebi açıldı", x: 110, y: 0 },
  { id: "cond", kind: "Koşul", title: "Tutar 50.000 ₺ üstü mü?", x: 110, y: 90 },
  { id: "gm", kind: "Onay", title: "Genel müdür onayı", x: 0, y: 180 },
  { id: "co", kind: "Onay", title: "Koordinatör onayı", x: 220, y: 180 },
  { id: "task", kind: "Görev", title: "Tedarikçileri karşılaştır", x: 110, y: 270 },
  { id: "end", kind: "Bitiş", title: "Sipariş verildi", x: 110, y: 360 },
];

const LINKS: [string, string, string?][] = [
  ["start", "cond"],
  ["cond", "gm", "evet"],
  ["cond", "co", "hayır"],
  ["gm", "task", "onay"],
  ["co", "task", "onay"],
  ["task", "end"],
];

/** The path a large purchase takes: the "yes" branch. */
const PLAY = ["start", "cond", "gm", "task", "end"];

const REASONS = [
  "Talep açılınca akış kendiliğinden başlar.",
  "Koşul, talebin tutarına bakar: 50.000 ₺ üstü, evet yolu.",
  "Onay genel müdürün kuyruğuna düşer; neden ona geldiği yazar.",
  "Onaylanınca satın almaya görev açılır.",
  "Akış biter; her adımı çalışma günlüğünde durur.",
];

export function FlowDemo() {
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // The last step stops the timer by itself; nothing needs to be switched off.
    if (!playing || step >= PLAY.length - 1) return;
    const timer = setTimeout(() => setStep((now) => now + 1), 1300);
    return () => clearTimeout(timer);
  }, [playing, step]);

  const nodes = useMemo<Node[]>(
    () =>
      FLOW.map((one) => ({
        data: {
          kind: one.kind,
          lit: PLAY[step] === one.id,
          passed: PLAY.indexOf(one.id) > -1 && PLAY.indexOf(one.id) < step,
          title: one.title,
        } satisfies BoxData,
        draggable: false,
        id: one.id,
        position: { x: one.x, y: one.y },
        type: "box",
      })),
    [step],
  );
  const edges = useMemo<Edge[]>(
    () =>
      LINKS.map(([from, to, label]) => ({
        id: `${from}-${to}`,
        label,
        // The library's label is a black box on its own; ours takes the card and the ink.
        labelBgPadding: [4, 2] as [number, number],
        labelBgStyle: { fill: "var(--card)" },
        labelStyle: { fill: "var(--muted-foreground)", fontSize: 11 },
        markerEnd: { color: "var(--muted-foreground)", type: MarkerType.ArrowClosed },
        style: { stroke: "var(--muted-foreground)" },
        source: from,
        target: to,
        type: "smoothstep",
      })),
    [],
  );

  return (
    <div className={styles.demo}>
      <p className={styles.demoTitle}>Deneyin: bir satın alma talebinin yolculuğunu oynatın</p>
      <div className={styles.flowStage}>
        <ReactFlow
          edges={edges}
          elementsSelectable={false}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          nodes={nodes}
          nodesConnectable={false}
          nodesDraggable={false}
          nodeTypes={nodeTypes}
          panOnDrag={false}
          proOptions={{ hideAttribution: true }}
          zoomOnScroll={false}
        />
      </div>
      <div className={styles.demoRow}>
        <Button
          onClick={() => {
            setStep(0);
            setPlaying(true);
          }}
          size="sm"
        >
          {step < 0 ? "Adım adım oynat" : "Baştan oynat"}
        </Button>
        <span className={styles.muted} aria-live="polite">
          {step >= 0 ? `${step + 1}. ${REASONS[step]}` : "Beş adım, yaklaşık yedi saniye."}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The daily target
// ---------------------------------------------------------------------------------------------

export function TargetDemo() {
  const [left, setLeft] = useState("590");
  const [days, setDays] = useState("159");
  const pieces = Number(left.replace(",", "."));
  const workDays = Number(days.replace(",", "."));
  const target = pieces > 0 && workDays > 0 ? Math.ceil(pieces / workDays) : null;
  return (
    <div className={styles.demo}>
      <p className={styles.demoTitle}>Deneyin: kalan işi ve kalan iş gününü değiştirin</p>
      <div className={styles.targetGrid}>
        <label className={styles.field}>
          <span>Kalan panel (adet)</span>
          <Input
            inputMode="numeric"
            onChange={(e) => setLeft(e.currentTarget.value)}
            value={left}
          />
        </label>
        <label className={styles.field}>
          <span>Bitişe kalan iş günü</span>
          <Input
            inputMode="numeric"
            onChange={(e) => setDays(e.currentTarget.value)}
            value={days}
          />
        </label>
        <div className={styles.targetResult}>
          <span className={styles.muted}>Bugünün hedefi</span>
          <strong>{target === null ? "—" : `${target} panel`}</strong>
        </div>
      </div>
      <p className={styles.muted}>
        Adet yukarı yuvarlanır ki iş bitiş tarihine yetişsin. Pazar ve resmî tatile hedef verilmez;
        yetkili kişi bir günü gerekçesiyle düzeltebilir, hesaplanan değer yanında saklanır.
      </p>
    </div>
  );
}
