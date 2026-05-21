import {
  LEGACY_APPOINTMENT_FILTER_PAIRS,
  normalizeAppointmentPullFilter,
  APPOINTMENT_PULL_FILTER_SETTING_NAME,
} from './appointmentPullFilter';

function normalizeEhrAppointmentPullFilters(moduleId, workingSettings) {
  const pair = LEGACY_APPOINTMENT_FILTER_PAIRS[moduleId];
  if (!pair) return { settings: workingSettings, didChange: false };

  const [blocklistId, allowlistId] = pair;
  const blocklistIndex = workingSettings.findIndex((s) => s.id === blocklistId);
  const allowlistIndex = workingSettings.findIndex((s) => s.id === allowlistId);
  const combinedIndex = workingSettings.findIndex((s) => s.type === 'appointment-pull-filter-combined');

  if (combinedIndex >= 0 && blocklistIndex < 0 && allowlistIndex < 0) {
    const combined = workingSettings[combinedIndex];
    const normalizedDefault = normalizeAppointmentPullFilter(combined.default);
    if (JSON.stringify(combined.default) !== JSON.stringify(normalizedDefault)) {
      const next = [...workingSettings];
      next[combinedIndex] = { ...combined, default: normalizedDefault };
      return { settings: next, didChange: true };
    }
    return { settings: workingSettings, didChange: false };
  }

  if (blocklistIndex < 0) return { settings: workingSettings, didChange: false };

  const blocklistSetting = workingSettings[blocklistIndex];
  const allowlistSetting = allowlistIndex >= 0 ? workingSettings[allowlistIndex] : null;

  const alreadyCombined =
    blocklistSetting?.type === 'appointment-pull-filter-combined' &&
    allowlistIndex < 0;
  if (alreadyCombined) return { settings: workingSettings, didChange: false };

  const normalizedDefault = normalizeAppointmentPullFilter(
    blocklistSetting?.type === 'appointment-pull-filter-combined'
      ? blocklistSetting.default
      : null,
    blocklistSetting?.default,
    allowlistSetting?.default
  );

  const normalizedSetting = {
    ...blocklistSetting,
    name: APPOINTMENT_PULL_FILTER_SETTING_NAME,
    type: 'appointment-pull-filter-combined',
    default: normalizedDefault,
    subtext:
      'Filter which appointment types are pulled from EHR. Choose allowlist OR blocklist — not both.',
  };

  let next = [...workingSettings];
  next[blocklistIndex] = normalizedSetting;
  if (allowlistIndex >= 0) {
    next = next.filter((s) => s.id !== allowlistId);
  }

  return { settings: next, didChange: true };
}

export function normalizeDependentSettings(moduleSettings) {
  let didChange = false;

  const next = Object.fromEntries(
    Object.entries(moduleSettings).map(([moduleId, module]) => {
      let workingSettings = Array.isArray(module.settings) ? [...module.settings] : [];

      // Prototype schema normalization:
      // Controls 22 is now a single combined setting with value
      // { sendNote: 'True'|'False', sendTranscript: 'True'|'False' }.
      if (moduleId === 'controls') {
        const emailIndex = workingSettings.findIndex((s) => s.id === 22);
        if (emailIndex >= 0) {
          const emailSetting = workingSettings[emailIndex];
          const defaultValue = emailSetting.default;
          let normalizedDefault = defaultValue;

          if (
            !defaultValue ||
            typeof defaultValue !== 'object' ||
            Array.isArray(defaultValue)
          ) {
            normalizedDefault = {
              sendNote: defaultValue === 'True' ? 'True' : 'False',
              sendTranscript: 'False'
            };
          } else {
            normalizedDefault = {
              sendNote: defaultValue.sendNote === 'True' ? 'True' : 'False',
              sendTranscript: defaultValue.sendTranscript === 'True' ? 'True' : 'False'
            };
          }

          const normalizedEmailSetting = {
            ...emailSetting,
            name: 'Email Delivery',
            type: 'email-delivery-combined',
            default: normalizedDefault,
            subtext: 'Enable only if your email complies with Privacy and Data Protection laws'
          };

          const defaultChanged =
            JSON.stringify(emailSetting.default) !== JSON.stringify(normalizedDefault);
          const changedFromSaved =
            emailSetting.type !== normalizedEmailSetting.type ||
            emailSetting.name !== normalizedEmailSetting.name ||
            defaultChanged ||
            emailSetting.subtext !== normalizedEmailSetting.subtext ||
            emailSetting.dependency !== undefined;

          if (changedFromSaved) {
            didChange = true;
            delete normalizedEmailSetting.dependency;
            workingSettings[emailIndex] = normalizedEmailSetting;
          }
        }

        const filtered = workingSettings.filter((s) => s.id !== 23);
        if (filtered.length !== workingSettings.length) {
          didChange = true;
          workingSettings = filtered;
        }
      }

      // EHR Settings - Athena (84/85) is now a single combined setting.
      // Combined value shape:
      // { enableEmbeddedApp: 'Yes'|'No', autoPullInEmbeddedApp: 'Yes'|'No' }.
      if (moduleId === 'ehr-settings-athena') {
        const parentIndex = workingSettings.findIndex((s) => s.id === 84);
        const childIndex = workingSettings.findIndex((s) => s.id === 85);

        // If both exist, combine and remove child setting.
        if (parentIndex >= 0 && childIndex >= 0) {
          const parentSetting = workingSettings[parentIndex];
          const childSetting = workingSettings[childIndex];

          const enableEmbeddedApp =
            parentSetting?.type === 'athena-embedded-combined' &&
            parentSetting?.default &&
            typeof parentSetting.default === 'object'
              ? parentSetting.default.enableEmbeddedApp === 'Yes' ? 'Yes' : 'No'
              : parentSetting?.default === 'Yes' ? 'Yes' : 'No';
          const autoPullInEmbeddedApp =
            childSetting?.default === 'Yes' ? 'Yes' : 'No';

          const normalizedAthenaSetting = {
            ...parentSetting,
            name: 'Enable Athena Embedded App',
            type: 'athena-embedded-combined',
            options: undefined,
            dependency: undefined,
            default: {
              enableEmbeddedApp,
              autoPullInEmbeddedApp
            },
            subtext: 'Allow users to access the Athena embedded app and optionally auto-pull appointment context.'
          };

          workingSettings[parentIndex] = normalizedAthenaSetting;
          workingSettings = workingSettings.filter((s) => s.id !== 85);
          didChange = true;
        } else if (parentIndex >= 0) {
          // If child exists without the parent being combinable (or the parent already normalized),
          // still remove the legacy child row.
          const filtered = workingSettings.filter((s) => s.id !== 85);
          if (filtered.length !== workingSettings.length) {
            didChange = true;
            workingSettings = filtered;
          }
        }
      }

      if (moduleId.startsWith('ehr-settings-')) {
        const ehrResult = normalizeEhrAppointmentPullFilters(moduleId, workingSettings);
        workingSettings = ehrResult.settings;
        if (ehrResult.didChange) didChange = true;
      }

      const nextSettings = workingSettings.map((setting) => {
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

      const moduleChanged = nextSettings.length !== (module.settings || []).length
        || nextSettings.some((setting, idx) => setting !== (module.settings || [])[idx]);
      return [moduleId, moduleChanged ? { ...module, settings: nextSettings } : module];
    })
  );

  return { next, didChange };
}
