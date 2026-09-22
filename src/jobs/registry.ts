import { admJobs } from "@/modules/adm";
import { docJobs } from "@/modules/doc";
import { iamJobs } from "@/modules/iam";
import {
  dailyDigest,
  exchangeRateAlarm,
  liveSignals,
  overdueAndEscalation,
  phonePush,
  systemWatch,
} from "@/modules/tsk";
import type { JobRegistry } from "@/platform/jobs/types";
import { sendSignal } from "@/platform/signals/hub";
import { processMailSender } from "@/platform/mail/mail";
import { processPushSender } from "@/platform/push/push";
import { processStorage } from "@/platform/storage";
import { createTesseractReader } from "@/platform/text-recognition/text-reader";

const doc = docJobs(processStorage, createTesseractReader());

/**
 * Every module's event subscribers, scheduled jobs and read models, in one place (TASK-0104,
 * D-259). The worker lives in `platform`, which may not import modules; this composition root
 * may, through each module's `index.ts` only.
 */
export const jobRegistry: JobRegistry = {
  subscribers: [
    ...doc.subscribers,
    liveSignals(sendSignal),
    phonePush(processPushSender),
    exchangeRateAlarm(),
  ],
  jobs: [
    ...iamJobs,
    ...admJobs,
    ...doc.jobs,
    dailyDigest(processMailSender),
    overdueAndEscalation(),
    systemWatch(),
  ],
  readModels: [],
};
