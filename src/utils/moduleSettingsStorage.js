export const MODULE_SETTINGS_STORAGE_KEY = 'practiceSettingsDashboard.moduleSettings';

export function loadModuleSettingsFromStorage() {
  try {
    const saved = localStorage.getItem(MODULE_SETTINGS_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === 'object') return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveModuleSettingsToStorage(moduleSettings) {
  try {
    localStorage.setItem(MODULE_SETTINGS_STORAGE_KEY, JSON.stringify(moduleSettings));
  } catch {
    // ignore
  }
}

