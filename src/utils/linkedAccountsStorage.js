export const LINKED_ACCOUNTS_STORAGE_KEY = 'practiceSettingsDashboard.linkedAccounts';

export function getLinkedAccountsStorageKey(practiceId) {
  if (!practiceId) return LINKED_ACCOUNTS_STORAGE_KEY;
  return `${LINKED_ACCOUNTS_STORAGE_KEY}.${practiceId}`;
}

export function loadLinkedAccountsFromStorage(practiceId) {
  try {
    const key = getLinkedAccountsStorageKey(practiceId);
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveLinkedAccountsToStorage(linkedAccounts, practiceId) {
  try {
    const key = getLinkedAccountsStorageKey(practiceId);
    localStorage.setItem(key, JSON.stringify(linkedAccounts));
  } catch {
    // ignore
  }
}
