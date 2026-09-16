"use client";

import { type RefObject, useEffect, useRef, useSyncExternalStore } from "react";

/**
 * Canvas particle field: samples an image and paints each opaque pixel as a dot held on a spring,
 * repelled by the pointer and nudged while the visitor types. Adapted from the devl.dev auth
 * pattern (DESIGN_SYSTEM_RULES §3) — the only approved custom element in the auth screens,
 * because COSS has no decorative canvas primitive. Colour follows `--brand-logo`.
 *
 * Honours `prefers-reduced-motion`: the figure is then painted once, without animation.
 */

type Particle = {
  originX: number;
  originY: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  alpha: number;
  phase: number;
};

type ParticleFieldProps = {
  /** Image URL to sample. Opaque, bright pixels become dots. */
  src: string;
  /** Pixel step when sampling; lower is denser. */
  sampleStep?: number;
  /** Alpha cutoff (0-255) for including a pixel. */
  threshold?: number;
  /** Share of the panel the figure fills. */
  renderScale?: number;
  /** Base dot radius in device pixels. */
  dotSize?: number;
  className?: string;
  /** Typing energy written by the auth forms; decays every frame. */
  typingImpulseRef?: RefObject<number>;
};

const typingImpulseStep = 0.14;
const typingImpulseCap = 1.35;
const submitImpulse = 0.52;
const submitImpulseEchoMs = 120;
const submitImpulseEcho = 0.2;

const mouseForce = 90;
const mouseRadius = 110;
const spring = 0.09;
const damping = 0.86;

/** Share of sampled pixels kept, and how far a dot may sit from its grid cell centre. */
const keepRatio = 0.75;
const jitter = 0.4;

/**
 * Dot size and opacity multiplier for the light theme. Brand blue on a light surface reads much
 * weaker than the light ink on a dark one, so the figure is painted heavier there. Applied while
 * drawing, not while sampling, so switching theme does not rebuild the field.
 */
const lightThemeInkBoost = 1.6;

/** Adds energy to the field (a keystroke, a preset chip, …). */
function addImpulse(impulseRef: RefObject<number>, amount: number): void {
  impulseRef.current = Math.min(impulseRef.current + amount, typingImpulseCap);
}

/** Call from `onKeyDown` on an auth form: one nudge per character typed. */
export function bumpParticleTypingImpulse(
  impulseRef: RefObject<number>,
  event: Pick<KeyboardEvent, "repeat" | "metaKey" | "ctrlKey" | "altKey" | "key">,
): void {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  if (event.key === "Tab" || event.key === "Escape") {
    return;
  }

  addImpulse(impulseRef, typingImpulseStep);
}

/** Two-beat pulse on submit — reads as a soft launch rather than a single hit. */
export function pulseParticleSubmitImpulse(impulseRef: RefObject<number>): void {
  addImpulse(impulseRef, submitImpulse);
  window.setTimeout(() => addImpulse(impulseRef, submitImpulseEcho), submitImpulseEchoMs);
}

function subscribeToTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  return () => observer.disconnect();
}

function useThemeClassName(): string {
  return useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.className,
    () => "",
  );
}

export function ParticleField({
  src,
  sampleStep = 8,
  threshold = 4,
  renderScale = 1.35,
  dotSize = 0.7,
  className,
  typingImpulseRef,
}: ParticleFieldProps) {
  const themeClassName = useThemeClassName();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const fillColorRef = useRef("#0f4c81");
  const inkBoostRef = useRef(1);
  const repaintRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    const context = canvas?.getContext("2d", { alpha: true });

    if (!canvas || !wrapper || !context) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -9999, y: -9999, active: false };

    let particles: Particle[] = [];
    let image: HTMLImageElement | null = null;
    let pixelRatio = 1;
    let width = 0;
    let height = 0;
    let centerX = 0;
    let centerY = 0;
    let time = 0;
    let frameId = 0;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    const resizeCanvas = () => {
      const rect = wrapper.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    const build = (source: HTMLImageElement) => {
      if (!source.width || !source.height) {
        return;
      }

      resizeCanvas();

      const sourceRatio = source.width / source.height;
      const drawWidth = (sourceRatio > width / height ? width : height * sourceRatio) * renderScale;
      const drawHeight = drawWidth / sourceRatio;

      const sampleWidth = Math.max(80, Math.floor(drawWidth / sampleStep));
      const sampleHeight = Math.max(80, Math.floor(drawHeight / sampleStep));

      const offscreen = document.createElement("canvas");
      offscreen.width = sampleWidth;
      offscreen.height = sampleHeight;

      const offscreenContext = offscreen.getContext("2d", { willReadFrequently: true });

      if (!offscreenContext) {
        return;
      }

      offscreenContext.drawImage(source, 0, 0, sampleWidth, sampleHeight);
      const { data } = offscreenContext.getImageData(0, 0, sampleWidth, sampleHeight);

      const cellWidth = drawWidth / sampleWidth;
      const cellHeight = drawHeight / sampleHeight;
      const offsetX = (width - drawWidth) / 2;
      const offsetY = (height - drawHeight) / 2;

      centerX = (offsetX + drawWidth * 0.5) * pixelRatio;
      centerY = (offsetY + drawHeight * 0.48) * pixelRatio;

      particles = [];

      for (let row = 0; row < sampleHeight; row++) {
        for (let column = 0; column < sampleWidth; column++) {
          const index = (row * sampleWidth + column) * 4;
          const alpha = data[index + 3];
          const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;

          if (alpha < 200 || brightness < threshold) {
            continue;
          }

          // The logo is a flat silhouette, so thinning and jitter are what turn the sample grid
          // into a cloud of dots instead of a screen-printed shape.
          if (Math.random() > keepRatio) {
            continue;
          }

          const luminance = brightness / 255;
          const originX =
            (offsetX + (column + 0.5 + (Math.random() - 0.5) * jitter) * cellWidth) * pixelRatio;
          const originY =
            (offsetY + (row + 0.5 + (Math.random() - 0.5) * jitter) * cellHeight) * pixelRatio;

          particles.push({
            originX,
            originY,
            x: originX + (Math.random() - 0.5) * 24,
            y: originY + (Math.random() - 0.5) * 24,
            velocityX: 0,
            velocityY: 0,
            size: (dotSize + luminance * 0.5 * Math.random()) * pixelRatio,
            alpha: (0.35 + luminance * 0.6) * (0.55 + Math.random() * 0.45),
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    const paintStatic = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = fillColorRef.current;

      const boost = inkBoostRef.current;

      for (const particle of particles) {
        context.globalAlpha = Math.min(1, particle.alpha * boost);
        context.beginPath();
        context.arc(particle.originX, particle.originY, particle.size * boost, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
    };

    const renderFrame = () => {
      if (destroyed) {
        return;
      }

      time += 0.016;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = fillColorRef.current;

      const pointerX = pointer.x * pixelRatio;
      const pointerY = pointer.y * pixelRatio;
      const radius = mouseRadius * pixelRatio;
      const radiusSquared = radius * radius;

      const typing = typingImpulseRef?.current ?? 0;

      if (typingImpulseRef && typing > 1e-4) {
        typingImpulseRef.current *= 0.93;
      }

      const typingBoost = 1 + typing * 10;
      const inkBoost = inkBoostRef.current;

      for (const particle of particles) {
        particle.velocityX += (particle.originX - particle.x) * spring;
        particle.velocityY += (particle.originY - particle.y) * spring;

        if (pointer.active) {
          const deltaX = particle.x - pointerX;
          const deltaY = particle.y - pointerY;
          const distanceSquared = deltaX * deltaX + deltaY * deltaY;

          if (distanceSquared < radiusSquared && distanceSquared > 0.0001) {
            const distance = Math.sqrt(distanceSquared);
            const force = (1 - distance / radius) * mouseForce * 0.04;
            particle.velocityX += (deltaX / distance) * force;
            particle.velocityY += (deltaY / distance) * force;
          }
        }

        // Equal drift on both axes: the logo is a sharp shape, and a stronger vertical drift
        // (as in the devl.dev original, tuned for a soft figure) smears the letterforms.
        particle.velocityX += Math.sin(time * 0.8 + particle.phase) * 0.004 * typingBoost;
        particle.velocityY += Math.cos(time * 0.9 + particle.phase) * 0.004 * typingBoost;

        if (typing > 1e-4) {
          particle.velocityX += (Math.random() - 0.5) * typing * 2.8;
          particle.velocityY += (Math.random() - 0.5) * typing * 2.8;

          const rippleX = particle.x - centerX;
          const rippleY = particle.y - centerY;
          const rippleDistance = Math.sqrt(rippleX * rippleX + rippleY * rippleY) + 0.5;
          const ripple = ((typing * 22 * pixelRatio) / rippleDistance) * 0.018;

          particle.velocityX += (rippleX / rippleDistance) * ripple;
          particle.velocityY += (rippleY / rippleDistance) * ripple;
        }

        particle.velocityX *= damping;
        particle.velocityY *= damping;
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;

        const twinkle =
          0.85 + Math.sin(time * (1.4 + typing * 2.2) + particle.phase) * (0.15 + typing * 0.35);

        context.globalAlpha = Math.min(1, particle.alpha * twinkle * inkBoost);
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size * inkBoost, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
      frameId = requestAnimationFrame(renderFrame);
    };

    repaintRef.current = () => {
      if (reducedMotion) {
        paintStatic();
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };

    // Drag-resizing fires continuously; resampling the image is expensive, so debounce it.
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }

      resizeTimer = setTimeout(() => {
        if (image) {
          build(image);
          repaintRef.current?.();
        }
      }, 120);
    });

    const loaded = new Image();
    loaded.decoding = "async";
    loaded.onload = () => {
      if (destroyed) {
        return;
      }

      image = loaded;
      build(loaded);

      if (reducedMotion) {
        paintStatic();
      } else {
        frameId = requestAnimationFrame(renderFrame);
      }
    };
    loaded.src = src;

    resizeObserver.observe(wrapper);

    if (!reducedMotion) {
      wrapper.addEventListener("pointermove", onPointerMove);
      wrapper.addEventListener("pointerleave", onPointerLeave);
    }

    return () => {
      destroyed = true;
      cancelAnimationFrame(frameId);

      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }

      resizeObserver.disconnect();
      wrapper.removeEventListener("pointermove", onPointerMove);
      wrapper.removeEventListener("pointerleave", onPointerLeave);
      repaintRef.current = null;
    };
  }, [src, sampleStep, threshold, renderScale, dotSize, typingImpulseRef]);

  // Colour and weight follow the theme; neither resamples the image.
  useEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) {
      return;
    }

    fillColorRef.current = getComputedStyle(wrapper).color;
    inkBoostRef.current = themeClassName.includes("dark") ? 1 : lightThemeInkBoost;
    repaintRef.current?.();
  }, [themeClassName]);

  return (
    <div
      aria-hidden="true"
      className={className}
      ref={wrapperRef}
      style={{ position: "relative", width: "100%", height: "100%", color: "var(--brand-logo)" }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
