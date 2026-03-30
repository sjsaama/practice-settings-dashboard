export const USER_SETTINGS_OVERRIDES_STORAGE_KEY = 'practiceSettingsDashboard.userSettingsOverrides';
const USER_SETTINGS_OVERRIDES_MIGRATION_VERSION = 'v1';

function getOverridesMigrationKey(practiceId) {
  const base = 'practiceSettingsDashboard.userSettingsOverridesMigration';
  const scope = practiceId || 'global';
  return `${base}.${scope}.${USER_SETTINGS_OVERRIDES_MIGRATION_VERSION}`;
}

export function getUserSettingsOverridesStorageKey(practiceId) {
  if (!practiceId) return USER_SETTINGS_OVERRIDES_STORAGE_KEY;
  return `${USER_SETTINGS_OVERRIDES_STORAGE_KEY}.${practiceId}`;
}

export function loadUserSettingsOverridesFromStorage(practiceId) {
  try {
    const key = getUserSettingsOverridesStorageKey(practiceId);
    const migrationKey = getOverridesMigrationKey(practiceId);
    const hasRunMigration = localStorage.getItem(migrationKey) === 'true';

    // One-time rollout migration: remove legacy override payloads for this practice.
    if (!hasRunMigration) {
      localStorage.setItem(key, JSON.stringify({}));
      localStorage.setItem(migrationKey, 'true');
      return {};
    }

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

