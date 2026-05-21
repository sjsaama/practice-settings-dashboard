import { valuesAreEqual } from './validationHelpers';

/** Practice default lets the doctor edit this setting. */
export function practiceDefaultIsDoctorEditable(setting) {
  return (setting?.pmLockState || 'unlocked') === 'unlocked';
}

/** PM override value differs from the practice default. */
export function overrideValueDiffersFromDefault(setting, overrideValue) {
  if (!setting) return false;
  return !valuesAreEqual(overrideValue, setting.default);
}

/**
 * Lock states PM may assign on a user override.
 * - Practice editable → tighten only (not editable / hidden), never editable on override.
 * - Practice not editable → may loosen to editable for this user.
 */
export function getAllowedOverrideLockStates(setting, { isLockedVisibleByOps = false } = {}) {
  if (isLockedVisibleByOps) {
    return ['locked-visible', 'locked-hidden'];
  }
  if (practiceDefaultIsDoctorEditable(setting)) {
    return ['locked-visible', 'locked-hidden'];
  }
  return ['unlocked', 'locked-visible', 'locked-hidden'];
}

export function getDefaultOverrideLockState(setting) {
  if (practiceDefaultIsDoctorEditable(setting)) {
    return 'locked-visible';
  }
  return '';
}

/** Coerce illegal override access before persisting. */
export function resolveOverrideLockState(setting, overrideLockState, overrideValue) {
  const allowed = getAllowedOverrideLockStates(setting, {
    isLockedVisibleByOps: setting?.opsLockState === 'locked-visible',
  });
  if (!allowed.includes(overrideLockState)) {
    return allowed[0] || 'locked-visible';
  }
  if (
    practiceDefaultIsDoctorEditable(setting) &&
    overrideLockState === 'unlocked' &&
    overrideValueDiffersFromDefault(setting, overrideValue)
  ) {
    return 'locked-visible';
  }
  return overrideLockState;
}

/** Inline / confirm flow: practice is editable and override value differs → lock doctor out. */
export function shouldForceNotEditableOnValueOverride(setting, newValue) {
  return (
    practiceDefaultIsDoctorEditable(setting) &&
    overrideValueDiffersFromDefault(setting, newValue)
  );
}
