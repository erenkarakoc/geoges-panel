"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";

type OnboardingStep = {
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
    title: "Yeni rolünüz: Saha Mühendisi",
    description: "Size bu rol atandı. Birkaç adımda neler yapacağınızı gösterelim.",
    points: [
      "Sorumlu olduğunuz şantiyeleri görürsünüz.",
      "Ticari bilgiler ve maaşlar bu rolde görünmez.",
    ],
  },
  {
    title: "Temel sorumluluklarınız",
    description: "Bu rolün her gün yaptığı işler.",
    points: [
      "Şantiyenin günlük kaydını girip koordinatör onayına göndermek.",
      "Zayi kayıtlarında neden ve fotoğraf eklemek.",
      "Size atanan görevleri zamanında kapatmak.",
    ],
  },
  {
    title: "İlk yapmanız gerekenler",
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
  const stepNumber = stepIndex + 1;
  const isFirst = stepIndex === 0;
  const isLast = stepNumber === sampleSteps.length;

  if (!step) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Adım {String(stepNumber).padStart(2, "0")} / {sampleSteps.length}
          </p>
          <Badge variant="warning">Örnek içerik</Badge>
        </div>
        <CardTitle render={<h1 />}>{step.title}</CardTitle>
        <CardDescription>{step.description}</CardDescription>
      </CardHeader>
      <CardPanel>
        <ul className="flex list-disc flex-col gap-2 ps-5 text-sm">
          {step.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </CardPanel>
      <CardFooter className="flex justify-between gap-2">
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
          <Button render={<Link href="/dashboard" />}>
            Panele git
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        ) : (
          <Button onClick={() => setStepIndex((index) => index + 1)} type="button">
            İleri
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
