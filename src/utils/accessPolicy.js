export function getOpsLockLabel(lockState) {
  switch (lockState) {
    case 'unlocked':
      return 'Unlocked';
    case 'locked-visible':
      return 'Locked (Visible)';
    case 'locked-hidden':
      return 'Locked (Hidden)';
    default:
      return 'Unlocked';
  }
}

/**
 * PM visibility rule for settings based on opsLockState.
 */
export function canPMSeeSetting(setting) {
  return setting?.opsLockState !== 'locked-hidden';
}

/**
 * PM edit rule for practice defaults based on opsLockState.
 */
export function canPMEditSetting(setting) {
  return setting?.opsLockState === 'unlocked';
}

/**
 * PM lock-state permissions under Ops lock.
 */
export function canPMSetDefaultLockState(setting, nextLockState) {
  if (!setting || !nextLockState) return false;

  if (setting.opsLockState === 'unlocked') return true;
  if (setting.opsLockState === 'locked-visible') {
    return nextLockState === 'locked-visible' || nextLockState === 'locked-hidden';
  }
  return false;
}

/**
 * PM override lock-state permissions under Ops lock.
 */
export function canPMSetOverrideLockState(setting, nextLockState) {
  if (!setting || !nextLockState) return false;

  if (setting.opsLockState === 'unlocked') return true;
  if (setting.opsLockState === 'locked-visible') {
    return nextLockState === 'locked-visible' || nextLockState === 'locked-hidden';
  }
  return false;
}

