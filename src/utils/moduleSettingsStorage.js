export const MODULE_SETTINGS_STORAGE_KEY = 'practiceSettingsDashboard.moduleSettings';

export function getModuleSettingsStorageKey(practiceId) {
  if (!practiceId) return MODULE_SETTINGS_STORAGE_KEY;
  return `${MODULE_SETTINGS_STORAGE_KEY}.${practiceId}`;
}

export function loadModuleSettingsFromStorage(practiceId) {
  try {
    const key = getModuleSettingsStorageKey(practiceId);
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === 'object') return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveModuleSettingsToStorage(moduleSettings, practiceId) {
  try {
    const key = getModuleSettingsStorageKey(practiceId);
    localStorage.setItem(key, JSON.stringify(moduleSettings));
  } catch {
    // ignore
  }
}

