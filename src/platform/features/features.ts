/**
 * Feature switches (CONFIGURATION section 5, TASK-0105, D-260): an environment keeps a module
 * that is not ready yet out of sight. `FEATURES_OFF=FIN,HR` hides those modules' menu items and
 * turns their pages into "Bu bölüm henüz açık değil". An engineering setting, never shown on the
 * administration screens; everything is on by default.
 */
export function disabledModules(
  env: Record<string, string | undefined> = process.env,
): Set<string> {
  return new Set(
    (env.FEATURES_OFF ?? "")
      .split(",")
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean),
  );
}

export function isModuleEnabled(
  moduleCode: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  return !disabledModules(env).has(moduleCode.toUpperCase());
}
