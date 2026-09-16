"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dashboardRoute } from "@/modules/iam/application/auth-routing";
import { AuthFormHeader } from "@/modules/iam/ui/auth-form-header";

type OnboardingStep = {
  eyebrow: string;
  title: string;
  description: string;
  points: readonly string[];
};

/**
 * New-role guidance (functional scope §2.7), one decision per screen with a step indicator.
 * M0: static sample content for a site engineer. Real content comes from role definitions
 * once roles are designed (Phase 01/04).
 */
const sampleSteps: readonly OnboardingStep[] = [
  {
    eyebrow: "Yeni rolünüz",
    title: "Saha Mühendisi",
    description: "Size bu rol atandı. Birkaç adımda neler yapacağınızı gösterelim.",
    points: [
      "Sorumlu olduğunuz şantiyeleri görürsünüz.",
      "Ticari bilgiler ve maaşlar bu rolde görünmez.",
    ],
  },
  {
    eyebrow: "Sorumluluklarınız",
    title: "Her gün yapacaklarınız",
    description: "Bu rolün günlük işleri.",
    points: [
      "Şantiyenin günlük kaydını girip koordinatör onayına göndermek.",
      "Zayi kayıtlarında neden ve fotoğraf eklemek.",
      "Size atanan görevleri zamanında kapatmak.",
    ],
  },
  {
    eyebrow: "İlk adımlar",
    title: "Şimdi ne yapmalısınız?",
    description: "Kullanacağınız ekranlar ve zorunlu ilk görevler.",
    points: [
      "Şantiye Kaydı ekranından bugünün kaydını açın.",
      "Görevler ekranında size atanan işleri kontrol edin.",
    ],
  },
];

export function RoleOnboarding() {
  const [stepIndex, setStepIndex] = useState(0);
  const step = sampleSteps[stepIndex];

  if (!step) {
    return null;
  }

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === sampleSteps.length - 1;

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center justify-between gap-2">
        <Stepper count={sampleSteps.length} index={stepIndex} />
        <Badge variant="warning">Örnek içerik</Badge>
      </div>

      <div className="mt-8">
        <AuthFormHeader description={step.description} eyebrow={step.eyebrow} title={step.title} />
      </div>

      <ul className="mt-6 flex flex-col gap-2">
        {step.points.map((point) => (
          <li
            className="rounded-md border border-border/70 bg-background/40 px-3 py-2 text-sm"
            key={point}
          >
            {point}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-between gap-2">
        <Button
          disabled={isFirst}
          onClick={() => setStepIndex((index) => index - 1)}
          type="button"
          variant="ghost"
        >
          <ArrowLeftIcon aria-hidden="true" />
          Geri
        </Button>
        {isLast ? (
          <Button render={<Link href={dashboardRoute} />} size="lg">
            Panele git
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        ) : (
          <Button onClick={() => setStepIndex((index) => index + 1)} size="lg" type="button">
            İleri
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}

function Stepper({ count, index }: { count: number; index: number }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
      <span aria-live="polite">
        Adım {String(index + 1).padStart(2, "0")} / {count}
      </span>
      <span className="flex items-center gap-1.5">
        {sampleSteps.map((step, position) => (
          <span
            aria-hidden="true"
            className={cn(
              "h-1.5 rounded-full transition-all",
              position === index ? "w-5 bg-foreground" : "w-1.5",
              position < index ? "bg-foreground/70" : position > index ? "bg-foreground/20" : "",
            )}
            key={step.title}
          />
        ))}
      </span>
    </div>
  );
}
