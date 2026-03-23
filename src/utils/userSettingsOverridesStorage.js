export const USER_SETTINGS_OVERRIDES_STORAGE_KEY = 'practiceSettingsDashboard.userSettingsOverrides';

export function getUserSettingsOverridesStorageKey(practiceId) {
  if (!practiceId) return USER_SETTINGS_OVERRIDES_STORAGE_KEY;
  return `${USER_SETTINGS_OVERRIDES_STORAGE_KEY}.${practiceId}`;
}

export function loadUserSettingsOverridesFromStorage(practiceId) {
  try {
    const key = getUserSettingsOverridesStorageKey(practiceId);
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === 'object') return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveUserSettingsOverridesToStorage(userSettingsOverrides, practiceId) {
  try {
    const key = getUserSettingsOverridesStorageKey(practiceId);
    localStorage.setItem(key, JSON.stringify(userSettingsOverrides));
  } catch {
    // ignore
  }
}

