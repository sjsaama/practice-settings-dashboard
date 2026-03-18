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

