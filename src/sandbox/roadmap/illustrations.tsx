import type { ReactElement } from "react";

import type { Illustration } from "./roadmap-data";
import styles from "./roadmap.module.css";

/**
 * Line drawings for each phase (D-299), drawn for this page rather than fetched: they take the
 * app's colours through the page's variables, so they follow the light and dark themes. Strokes are
 * the ink, `soft` fills are a tint of the brand, `accent` marks the one thing the scene is about.
 */

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 2,
} as const;

function Frame({ label, children }: { label: string; children: ReactElement | ReactElement[] }) {
  return (
    <svg aria-label={label} className={styles.illustration} role="img" viewBox="0 0 160 110">
      <rect className={styles.illuGround} height="8" rx="4" width="140" x="10" y="96" />
      {children}
    </svg>
  );
}

const scenes: Record<Illustration, () => ReactElement> = {
  blueprint: () => (
    <Frame label="Plan kağıdı ve cetvel">
      <rect className={styles.soft} height="66" rx="6" width="96" x="20" y="18" />
      <path {...S} d="M20 24a6 6 0 0 1 6-6h84a6 6 0 0 1 6 6v54a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6z" />
      <path {...S} d="M32 34h30v24H32zM62 46h26v24M32 58h56" opacity=".55" />
      <path {...S} className={styles.accent} d="M104 30l26 26-10 10-26-26z" />
      <path {...S} d="M110 44l4-4M116 50l4-4" />
    </Frame>
  ),
  foundation: () => (
    <Frame label="Kilit ve kalkan">
      <path
        {...S}
        className={styles.soft}
        d="M80 14l40 14v26c0 22-17 36-40 42-23-6-40-20-40-42V28z"
      />
      <path {...S} d="M80 14l40 14v26c0 22-17 36-40 42-23-6-40-20-40-42V28z" />
      <rect {...S} className={styles.accent} height="22" rx="4" width="28" x="66" y="48" />
      <path {...S} d="M71 48v-6a9 9 0 0 1 18 0v6M80 57v5" />
    </Frame>
  ),
  flow: () => (
    <Frame label="Kutular ve oklar">
      <rect {...S} className={styles.soft} height="18" rx="4" width="40" x="60" y="10" />
      <rect {...S} className={styles.accent} height="18" rx="4" width="40" x="22" y="48" />
      <rect {...S} height="18" rx="4" width="40" x="98" y="48" />
      <rect {...S} className={styles.soft} height="16" rx="8" width="40" x="60" y="80" />
      <path {...S} d="M80 28v8H42v10M80 36h38v10M42 66v6h38v6M118 66v6H80" />
      <path {...S} d="M38 44l4 4 4-4M114 44l4 4 4-4M76 76l4 4 4-4" />
    </Frame>
  ),
  site: () => (
    <Frame label="Şantiyede istinat duvarı ve vinç">
      <path {...S} d="M28 96V20h4v76M30 20h66M92 20v14" />
      <path {...S} d="M30 20l14 14M44 20L30 34" opacity=".5" />
      <rect {...S} className={styles.accent} height="12" rx="2" width="16" x="84" y="36" />
      <path {...S} className={styles.soft} d="M60 96V62h80v34z" />
      <path {...S} d="M60 96V62h80v34M60 74h80M60 86h80M80 62v34M100 62v34M120 62v34" />
    </Frame>
  ),
  builder: () => (
    <Frame label="Parçalardan form">
      <rect {...S} className={styles.soft} height="74" rx="6" width="62" x="20" y="16" />
      <path {...S} d="M30 30h42M30 44h30M30 58h36M30 72h22" />
      <rect {...S} className={styles.accent} height="16" rx="4" width="40" x="100" y="24" />
      <rect {...S} height="16" rx="4" width="40" x="100" y="48" />
      <rect {...S} height="16" rx="4" width="40" x="100" y="72" />
      <path {...S} d="M96 32H84M96 56H84" strokeDasharray="3 4" />
    </Frame>
  ),
  stock: () => (
    <Frame label="Kantar ve kamyon">
      <path {...S} className={styles.soft} d="M16 84h80V52H16z" />
      <path {...S} d="M16 84V52h80v32M96 62h22l14 12v10H96" />
      <circle {...S} className={styles.accent} cx="36" cy="88" r="7" />
      <circle {...S} className={styles.accent} cx="112" cy="88" r="7" />
      <path {...S} d="M10 96h140M28 40h56M56 40V28M48 28h16" />
    </Frame>
  ),
  money: () => (
    <Frame label="Hakediş ve para">
      <rect {...S} className={styles.soft} height="70" rx="6" width="56" x="22" y="16" />
      <path {...S} d="M32 32h36M32 44h28M32 56h32M32 70h18" />
      <circle {...S} className={styles.accent} cx="112" cy="54" r="26" />
      <path {...S} d="M106 42v24M106 50l12-4M106 58l12-4M104 66c8 0 14-4 14-10" />
    </Frame>
  ),
  crane: () => (
    <Frame label="Vinç ve baret">
      <path {...S} d="M40 96V30h6v66M43 30h60M98 30v24" />
      <path {...S} className={styles.accent} d="M92 54h12v10H92z" />
      <path {...S} className={styles.soft} d="M104 90a18 18 0 0 1 36 0z" />
      <path {...S} d="M104 90a18 18 0 0 1 36 0M100 90h44M122 72v-4" />
    </Frame>
  ),
  handshake: () => (
    <Frame label="Teklif belgesi ve el sıkışma">
      <rect {...S} className={styles.soft} height="66" rx="6" width="50" x="18" y="18" />
      <path {...S} d="M28 32h30M28 44h22M28 56h26" />
      <path {...S} className={styles.accent} d="M78 64l16-14 12 6 16-10 18 16-18 18-12-6-14 8z" />
      <path {...S} d="M94 50l10 12M106 56l10 12" />
    </Frame>
  ),
  shield: () => (
    <Frame label="Sözleşme ve onay işareti">
      <rect {...S} className={styles.soft} height="74" rx="6" width="58" x="24" y="14" />
      <path {...S} d="M34 30h38M34 42h30M34 54h34" />
      <path
        {...S}
        className={styles.accent}
        d="M112 22l24 8v16c0 14-10 22-24 26-14-4-24-12-24-26V30z"
      />
      <path {...S} d="M102 46l7 7 13-13" />
    </Frame>
  ),
  chart: () => (
    <Frame label="Grafik ve arşiv">
      <path {...S} d="M20 88V16M20 88h120" />
      <rect className={styles.soft} height="30" rx="3" width="16" x="32" y="58" />
      <rect className={styles.soft} height="46" rx="3" width="16" x="56" y="42" />
      <rect className={styles.accentFill} height="62" rx="3" width="16" x="80" y="26" />
      <path {...S} className={styles.accent} d="M104 66l10-12 10 6 12-20" />
    </Frame>
  ),
  assistant: () => (
    <Frame label="Konuşma balonu ve panel">
      <path
        {...S}
        className={styles.soft}
        d="M20 22h70a8 8 0 0 1 8 8v28a8 8 0 0 1-8 8H48l-14 12V66h-6a8 8 0 0 1-8-8V30a8 8 0 0 1 8-8z"
      />
      <path {...S} d="M34 38h48M34 50h34" />
      <rect {...S} className={styles.accent} height="46" rx="6" width="40" x="106" y="42" />
      <path {...S} d="M114 56h24M114 66h16M114 76h20" />
    </Frame>
  ),
  rocket: () => (
    <Frame label="Canlıya geçiş">
      <path {...S} className={styles.soft} d="M80 12c16 10 20 30 14 54H66c-6-24-2-44 14-54z" />
      <circle {...S} className={styles.accent} cx="80" cy="38" r="7" />
      <path {...S} d="M66 56l-12 12v10l14-8M94 56l12 12v10l-14-8M72 72l-4 16M88 72l4 16M80 72v20" />
    </Frame>
  ),
};

export function PhaseIllustration({ name }: { name: Illustration }) {
  const Scene = scenes[name];
  return <Scene />;
}
