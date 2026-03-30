export const OPS_RESTORE_REQUESTS_STORAGE_KEY = 'practiceSettingsDashboard.opsRestoreRequests';

export function getOpsRestoreRequestsStorageKey(practiceId) {
  if (!practiceId) return OPS_RESTORE_REQUESTS_STORAGE_KEY;
  return `${OPS_RESTORE_REQUESTS_STORAGE_KEY}.${practiceId}`;
}

export function loadOpsRestoreRequestsFromStorage(practiceId) {
  try {
    const key = getOpsRestoreRequestsStorageKey(practiceId);
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveOpsRestoreRequestsToStorage(requests, practiceId) {
  try {
    const key = getOpsRestoreRequestsStorageKey(practiceId);
    localStorage.setItem(key, JSON.stringify(requests));
  } catch {
    // ignore storage write errors
  }
}

