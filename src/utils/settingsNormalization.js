export function normalizeDependentSettings(moduleSettings) {
  let didChange = false;

  const next = Object.fromEntries(
    Object.entries(moduleSettings).map(([moduleId, module]) => {
      const nextSettings = module.settings.map((setting) => {
        if (!setting?.dependency) return setting;

        if (setting.type === 'dropdown' && setting.dependency === 41) {
          const enabledServicesSetting = Object.values(moduleSettings)
            .flatMap((mod) => mod.settings)
            .find((s) => s.id === 41);
          const availableOptions = enabledServicesSetting?.default || [];

          if (
            Array.isArray(availableOptions) &&
            availableOptions.length > 0 &&
            !availableOptions.includes(setting.default) &&
            setting.pmLockState !== 'locked-hidden'
          ) {
            didChange = true;
            return { ...setting, default: availableOptions[0] };
          }
        }

        return setting;
      });

      return [moduleId, nextSettings === module.settings ? module : { ...module, settings: nextSettings }];
    })
  );

  return { next, didChange };
}
