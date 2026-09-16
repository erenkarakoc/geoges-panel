"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";

import { nodeHeight, nodeWidth } from "./map-layout";
import type { GroupId } from "./presentation-data";
import { moduleIcons } from "./presentation-icons";
import styles from "./presentation.module.css";

export type ModuleNodeData = {
  code: string;
  name: string;
  group: GroupId;
  connections: number;
  deferred: boolean;
  state: "idle" | "selected" | "linked" | "muted";
};

/** One module as a plate inside its layer. Wide enough to carry an icon, a code and a name. */
export function ModuleNode({ data }: NodeProps) {
  const plate = data as ModuleNodeData;
  const Icon = moduleIcons[plate.code];

  return (
    <div
      className={`${styles.plate} ${styles[`plate_${plate.state}`]} ${
        plate.deferred ? styles.plateDeferred : ""
      }`}
      data-group={plate.group}
      style={{ width: nodeWidth, height: nodeHeight }}
    >
      {/* Links leave and enter from the band above or below, so only these two anchors exist. */}
      <Handle className={styles.plateHandle} id="top" position={Position.Top} type="source" />
      <Handle className={styles.plateHandle} id="topIn" position={Position.Top} type="target" />
      <Handle className={styles.plateHandle} id="bottom" position={Position.Bottom} type="source" />
      <Handle
        className={styles.plateHandle}
        id="bottomIn"
        position={Position.Bottom}
        type="target"
      />

      <span className={styles.plateHead}>
        {Icon ? <Icon aria-hidden="true" className={styles.plateIcon} /> : null}
        <span className={styles.plateCode}>{plate.code}</span>
        <span className={styles.plateCount}>{plate.connections}</span>
      </span>
      <span className={styles.plateName}>{plate.name}</span>
    </div>
  );
}
