import "server-only";

import { customFieldDefinitions, listCatalogItems, visibleCustomFields } from "@/modules/adm";
import {
  AccessDeniedError,
  COMPANY,
  can,
  canSee,
  readEffectivePermissions,
  signInIdentity,
} from "@/modules/iam";
import {
  insertProject,
  readProject,
  readProjectNames,
  readProjects,
  saveContract,
  setProjectStage,
  updateProject,
} from "@/modules/prj/data/project-store";
import {
  contractInput,
  orderStages,
  projectInput,
  projectMessage,
} from "@/modules/prj/domain/project";

/**
 * Projects (TASK-0123 step 1, SCR-022, SCR-023). A project is opened with a company-wide right to
 * manage projects; after that, whoever manages it in its scope changes it. Who sees a project, and
 * whether the contract value reaches them, the database decides (migration 0064); this answers
 * early and says it in words.
 */

const SEE = [
  "prj.module.view",
  "prj.module.manage",
  "prj.module.own",
  "sit.module.view",
  "sit.module.manage",
  "sit.module.own",
] as const;

async function identity() {
  const signedIn = await signInIdentity();
  if (!signedIn) throw new AccessDeniedError("iam.session");
  return signedIn.identity;
}

/** Whether the person may open the project list at all. */
export async function mayOpenProjects(): Promise<boolean> {
  const snapshot = await readEffectivePermissions();
  return Boolean(snapshot && SEE.some((permission) => can(snapshot, permission)));
}

/** Whether the person may open a new project: a company-wide right to manage projects. */
export async function mayOpenNewProject(): Promise<boolean> {
  const snapshot = await readEffectivePermissions();
  return Boolean(snapshot && can(snapshot, "prj.module.manage", COMPANY));
}

/** Whether a new project's form may ask its contract value: the commercial right company-wide. */
export async function mayEnterContractValue(): Promise<boolean> {
  const snapshot = await readEffectivePermissions();
  return Boolean(snapshot && canSee(snapshot, "prj", "commercial"));
}

async function assertMayOpen() {
  if (!(await mayOpenProjects())) throw new AccessDeniedError("prj.module.view");
}

export async function listProjects(filter: { words?: string | null } = {}) {
  await assertMayOpen();
  return readProjects(await identity(), filter);
}

/** Project names the person may see, by id. */
export async function projectNames(ids: readonly string[]) {
  return readProjectNames(await identity(), ids);
}

/** The stage catalog in its order: code and name, active ones only. */
export async function projectStages() {
  const items = await listCatalogItems("project_stage");
  return orderStages(items.filter((item) => item.status === "active" && item.code)).map((item) => ({
    code: item.code as string,
    name: item.name,
  }));
}

/**
 * The card: the project, its contract value when the person may see it, its stage history, what
 * the person may do here, and the custom values they may see. Null when there is none for them.
 */
export async function projectCard(id: string) {
  await assertMayOpen();
  const found = await readProject(await identity(), id);
  if (!found) return null;
  const [snapshot, definitions, stages] = await Promise.all([
    readEffectivePermissions(),
    customFieldDefinitions("prj.project"),
    projectStages(),
  ]);
  const here = { id, type: "project" as const };
  const canSeeContract = Boolean(snapshot && canSee(snapshot, "prj", "commercial", here));
  const canManage = Boolean(snapshot && can(snapshot, "prj.module.manage", here));
  return {
    ...found,
    canManage,
    canManageSites: canManage || Boolean(snapshot && can(snapshot, "sit.module.manage", here)),
    // The row never comes without the right; this only keeps the screen from asking.
    canSeeContract,
    customFields: visibleCustomFields(definitions, found.project.customFields, (dataClass) =>
      Boolean(snapshot && canSee(snapshot, "prj", dataClass, here)),
    ),
    stageNames: new Map(stages.map((stage) => [stage.code, stage.name])),
    stages: found.stages,
    stageChoices: stages,
  };
}

/** What happened, in a sentence: a refusal the person can act on, or nothing. */
export type ProjectResult = { error: string | null; id?: string | null };

function refusal(error: unknown): string | null {
  if (error instanceof AccessDeniedError) return "Bu projede değişiklik yapma yetkiniz yok.";
  return projectMessage(error as { code?: string; constraint?: string; hint?: string });
}

async function attempt(work: () => Promise<string | boolean>): Promise<ProjectResult> {
  try {
    const done = await work();
    if (done === false) return { error: "Proje bulunamadı ya da değiştirme yetkiniz yok." };
    return { error: null, id: typeof done === "string" ? done : null };
  } catch (error) {
    const said = refusal(error);
    if (said) return { error: said };
    throw error;
  }
}

function firstIssue(issues: readonly { message: string }[]): ProjectResult {
  return { error: issues[0]?.message ?? "Proje bilgileri eksik." };
}

export async function openProject(input: unknown, contract?: unknown): Promise<ProjectResult> {
  const parsed = projectInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  const money = contract === undefined ? null : contractInput.safeParse(contract);
  if (money && !money.success) return firstIssue(money.error.issues);
  if (!(await mayOpenNewProject())) return { error: "Yeni proje açma yetkiniz yok." };
  return attempt(async () =>
    insertProject(await identity(), parsed.data, money?.success ? money.data : null),
  );
}

export async function changeProject(id: string, input: unknown): Promise<ProjectResult> {
  const parsed = projectInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  return attempt(async () => updateProject(await identity(), id, parsed.data));
}

export async function changeContract(id: string, contract: unknown): Promise<ProjectResult> {
  const parsed = contractInput.safeParse(contract);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  return attempt(async () => saveContract(await identity(), id, parsed.data));
}

/** Moves the project to a stage of the catalog; the history and the event are the database's. */
export async function moveProjectStage(id: string, stage: string): Promise<ProjectResult> {
  const known = await projectStages();
  if (!known.some((one) => one.code === stage)) return { error: "Bu aşama tanımlı değil." };
  return attempt(async () => setProjectStage(await identity(), id, stage));
}
