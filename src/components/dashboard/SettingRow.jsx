import React from 'react';
import { canPMEditSetting, canPMSeeSetting, getOpsLockLabel } from '../../utils/accessPolicy';
import { getTimeOptionsForTimezone } from '../../utils/timeOptions';

export default function SettingRow({
  setting,
  moduleId,
  showUserOverride = false,
  userId = null,
  isSettingEnabled,
  getAvailableOptions,
  isMasterUser,
  getSettingById,
  getUserSetting,
  doesOverrideMatchDefault,
  getMatchingOverrideAlertMessage,
  valuesAreEqual,
  setPendingSettingChange,
  setShowOverrideConfirmModal,
  removeUserSetting,
  setUserSetting,
  updateSettingState,
  isPMReadOnly,
  getSettingOverrides,
  setCurrentOverrideSetting,
  setShowAddOverrideModal,
  moduleSettings,
  isGoogleSignedIn,
  setIsGoogleSignedIn,
  setShowGoogleSignoutModal,
  onRequestAttestation,
}) {
  const isEnabled = isSettingEnabled(setting);
  const availableOptions = getAvailableOptions(setting);

  const isPMDefaultView = !isMasterUser() && !showUserOverride;
  const parentSetting = setting.dependency ? getSettingById(setting.dependency) : null;
  const parentHiddenByOps = isPMDefaultView && parentSetting && !canPMSeeSetting(parentSetting);
  const parentLockedByOps = isPMDefaultView && parentSetting && !canPMEditSetting(parentSetting);

  const isPMHiddenByOps = isPMDefaultView && (!canPMSeeSetting(setting) || parentHiddenByOps);
  const isPMLockedByOps = isPMDefaultView && (!canPMEditSetting(setting) || parentLockedByOps);

  if (isPMHiddenByOps) return null;

  const userSetting = userId ? getUserSetting(userId, moduleId, setting.id) : null;
  const hasUserOverride = userSetting && userSetting.value !== undefined;
  const effectiveValue = hasUserOverride ? userSetting.value : setting.default;

  const getDisplaySubtext = () => {
    if (setting.subtexts && setting.default) {
      return setting.subtexts[setting.default] || setting.subtext || '';
    }
    return setting.subtext || '';
  };

  const getLockStateLabel = (lockState) => {
    switch (lockState) {
      case 'locked-visible':
        return 'Locked Visible';
      case 'locked-hidden':
        return 'Locked Hidden';
      case 'unlocked':
      default:
        return 'Unlocked';
    }
  };

  const renderFormControl = (isUser = false, targetUserId = null) => {
    const value = isUser ? effectiveValue : setting.default;
    const isUserLockedHidden = isUser && userSetting?.pmLockState === 'locked-hidden';
    const isUserLockedByOpsForPM = isUser && !isMasterUser() && setting.opsLockState !== 'unlocked';
    const isUserParentLockedByOpsForPM =
      isUser &&
      !isMasterUser() &&
      parentSetting &&
      !canPMEditSetting(parentSetting);
    const isDefaultLockedByOpsForPM = !isUser && isPMLockedByOps;
    const isDefaultReadOnly =
      isUserLockedHidden ||
      isUserLockedByOpsForPM ||
      isUserParentLockedByOpsForPM ||
      isDefaultLockedByOpsForPM ||
      (!isUser && !isEnabled) ||
      (!isMasterUser() && isPMReadOnly);

    const handleChange = (newValue) => {
      if (!isUser && isPMLockedByOps) return;
      if (isUserLockedHidden) return;
      if (!isUser && !isEnabled) return;

      if (isUser && targetUserId) {
        const wouldMatchDefault = doesOverrideMatchDefault(targetUserId, moduleId, setting.id, newValue, undefined);
        if (wouldMatchDefault) {
          const currentLockState = getUserSetting(targetUserId, moduleId, setting.id)?.pmLockState || setting.pmLockState;
          alert(getMatchingOverrideAlertMessage(newValue, currentLockState));
          return;
        }

        const currentUserSetting = getUserSetting(targetUserId, moduleId, setting.id);
        const isDifferentFromDefault = !valuesAreEqual(newValue, setting.default);
        if (isDifferentFromDefault) {
          setPendingSettingChange({
            userId: targetUserId,
            moduleId,
            settingId: setting.id,
            settingName: setting.name,
            newValue,
            defaultValue: setting.default
          });
          setShowOverrideConfirmModal(true);
        } else if (currentUserSetting && (currentUserSetting.value !== undefined || currentUserSetting.pmLockState !== undefined)) {
          const lockStateMatchesDefault = (currentUserSetting.pmLockState === undefined || currentUserSetting.pmLockState === setting.pmLockState);
          if (lockStateMatchesDefault) {
            removeUserSetting(targetUserId, moduleId, setting.id);
          } else {
            setUserSetting(targetUserId, moduleId, setting.id, 'value', newValue);
          }
        }
      } else {
        updateSettingState(moduleId, setting.id, 'default', newValue);
      }
    };

    switch (setting.type) {
      case 'toggle': {
        const isToggleOn = value === 'True';
        const isToggleDisabled = !isEnabled || isDefaultReadOnly;
        return (
          <div
            className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${
              isToggleOn ? 'bg-green-500' : 'bg-gray-300'
            } ${isToggleDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => {
              if (isToggleDisabled) return;
              if (setting.requiresAttestation && !isToggleOn && !isUser) {
                onRequestAttestation?.();
                return;
              }
              handleChange(isToggleOn ? 'False' : 'True');
            }}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isToggleOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        );
      }
      case 'range-selector':
      case 'dropdown': {
        const options = setting.dependency === 41 ? availableOptions : setting.options;
        return (
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isDefaultReadOnly}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      }
      case 'order-list': {
        const orderItems = Array.isArray(value) ? value : setting.default;
        return (
          <div className="space-y-2">
            {orderItems.map((item, index) => (
              <div key={item} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                <span>{item}</span>
                <div className="flex gap-1">
                  {index > 0 && (
                    <button
                      onClick={() => {
                        if (isDefaultReadOnly) return;
                        const next = [...orderItems];
                        [next[index], next[index - 1]] = [next[index - 1], next[index]];
                        handleChange(next);
                      }}
                      className="px-2"
                    >
                      ↑
                    </button>
                  )}
                  {index < orderItems.length - 1 && (
                    <button
                      onClick={() => {
                        if (isDefaultReadOnly) return;
                        const next = [...orderItems];
                        [next[index], next[index + 1]] = [next[index + 1], next[index]];
                        handleChange(next);
                      }}
                      className="px-2"
                    >
                      ↓
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      }
      case 'time-multiselect': {
        const selectedTimes = Array.isArray(value) ? value : [];
        const timeOptions = (setting.id === 73 || setting.id === 83)
          ? (() => {
              const timezoneSetting = moduleSettings.controls?.settings.find((s) => s.id === 20);
              const timezoneUserSetting = userId ? getUserSetting(userId, 'controls', 20) : null;
              const currentTimezone = timezoneUserSetting?.value || timezoneSetting?.default || 'Eastern (America/New York)';
              return getTimeOptionsForTimezone(currentTimezone);
            })()
          : setting.options;
        return (
          <div className="grid grid-cols-4 gap-2">
            {timeOptions.map((time) => {
              const checked = selectedTimes.includes(time);
              return (
                <label key={time} className="text-xs flex items-center gap-2 p-2 border rounded">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (isDefaultReadOnly) return;
                      const next = e.target.checked ? [...selectedTimes, time] : selectedTimes.filter((t) => t !== time);
                      if (isUser && targetUserId) {
                        setUserSetting(targetUserId, moduleId, setting.id, 'value', next);
                      } else {
                        updateSettingState(moduleId, setting.id, 'default', next);
                      }
                    }}
                  />
                  {time}
                </label>
              );
            })}
          </div>
        );
      }
      case 'service-settings-combined': {
        const enabledServices = Array.isArray(value) ? value : (setting.default || []);
        const defaultService = isUser ? (userSetting?.defaultService || setting.defaultService) : (setting.defaultService || enabledServices[0]);
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              {setting.options.map((service) => {
                const checked = enabledServices.includes(service);
                return (
                  <label key={service} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isDefaultReadOnly}
                      onChange={(e) => {
                        if (isDefaultReadOnly) return;
                        let next = e.target.checked ? [...enabledServices, service] : enabledServices.filter((s) => s !== service);
                        if (!next.length) next = [enabledServices[0]];
                        if (isUser && targetUserId) {
                          setUserSetting(targetUserId, moduleId, setting.id, 'value', next);
                        } else {
                          updateSettingState(moduleId, setting.id, 'default', next);
                        }
                      }}
                    />
                    {service}
                  </label>
                );
              })}
            </div>
            <select
              value={defaultService}
              disabled={isDefaultReadOnly}
              onChange={(e) => {
                if (isDefaultReadOnly) return;
                if (isUser && targetUserId) {
                  setUserSetting(targetUserId, moduleId, setting.id, 'defaultService', e.target.value);
                } else {
                  updateSettingState(moduleId, setting.id, 'defaultService', e.target.value);
                }
              }}
              className="w-full px-3 py-2 border rounded"
            >
              {enabledServices.map((service) => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>
        );
      }
      case 'google-signin':
        return isGoogleSignedIn ? (
          <button onClick={() => setShowGoogleSignoutModal(true)} className="px-4 py-2 bg-red-600 text-white rounded">Sign Out</button>
        ) : (
          <button
            onClick={() => {
              setIsGoogleSignedIn(true);
              updateSettingState(moduleId, setting.id, 'default', true);
            }}
            className="px-4 py-2 border rounded"
          >
            Sign in with Google
          </button>
        );
      case 'zoom-check':
        return <p className="text-sm text-blue-700">Connect via Zoom Marketplace</p>;
      default:
        return null;
    }
  };

  const isDefaultLockStateReadOnly =
    showUserOverride ||
    (!isMasterUser() && (isPMReadOnly || isPMLockedByOps || !isEnabled));

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8 ${!isEnabled ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{setting.name}</h3>
            {setting.required && <span className="text-red-500 text-sm font-medium">*</span>}
            {isPMDefaultView && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                Ops: {getOpsLockLabel(setting.opsLockState)}
              </span>
            )}
          </div>
        </div>
        {!showUserOverride && (
          <div className="min-w-52 ml-4">
            <label className="block text-xs font-medium text-gray-600 mb-1 text-right">Lock State</label>
            <select
              value={setting.pmLockState || 'unlocked'}
              onChange={(e) => updateSettingState(moduleId, setting.id, 'pmLockState', e.target.value)}
              disabled={isDefaultLockStateReadOnly}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="unlocked">Unlocked</option>
              <option value="locked-visible">Locked Visible</option>
              <option value="locked-hidden">Locked Hidden</option>
            </select>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-start gap-4 mb-4">
            <label className="text-sm font-medium text-gray-700 min-w-16 mt-2">{showUserOverride ? 'User Value:' : 'Default:'}</label>
            <div className="flex-1">{showUserOverride ? renderFormControl(true, userId) : renderFormControl()}</div>
          </div>
        </div>
      </div>

      {getDisplaySubtext() && (
        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
          <p className="text-sm text-blue-800 leading-relaxed">{getDisplaySubtext()}</p>
        </div>
      )}

      {!showUserOverride &&
        (isMasterUser() || setting.opsLockState !== 'locked-hidden') &&
        setting.type !== 'service-settings-combined' &&
        (moduleId === 'note-settings' || moduleId === 'controls' || moduleId === 'ehr-settings-amd' || moduleId === 'ehr-settings-athena' || moduleId === 'em-settings') && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">User Overrides</h4>
              <p className="text-xs text-gray-500 mt-1">
                {isMasterUser() || setting.opsLockState === 'unlocked'
                  ? 'Customize this setting for specific users'
                  : 'Overrides are visible but locked while Ops Lock is active'}
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentOverrideSetting({
                  moduleId,
                  settingId: setting.id,
                  settingName: setting.name,
                  settingType: setting.type,
                  settingOptions: setting.options,
                  defaultValue: setting.default
                });
                setShowAddOverrideModal(true);
              }}
              disabled={(!isMasterUser() && isPMReadOnly) || (!isMasterUser() && setting.opsLockState !== 'unlocked')}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              + Add Override
            </button>
          </div>
          {!isMasterUser() && setting.opsLockState !== 'unlocked' && (
            <p className="text-xs text-amber-700 mb-3">
              Ops Lock is active. Overrides are read-only until Ops unlocks this setting.
            </p>
          )}
          {(() => {
            const overrides = getSettingOverrides(moduleId, setting.id);
            return overrides.length > 0 ? (
              <div className="space-y-2">
                {overrides.map((override) => (
                  <div key={override.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">{override.userName}</p>
                      </div>
                      <p className="text-xs text-gray-600">
                        Override value: <span className="font-semibold text-blue-700">{Array.isArray(override.value) ? override.value.join(', ') : override.value}</span>
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Lock state: <span className="font-semibold text-amber-700">{getLockStateLabel(override.pmLockState)}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (!isMasterUser() && setting.opsLockState !== 'unlocked') return;
                        if (window.confirm(`Remove override for ${override.userName}?`)) {
                          removeUserSetting(override.userId, moduleId, setting.id);
                        }
                      }}
                      disabled={!isMasterUser() && setting.opsLockState !== 'unlocked'}
                      className="ml-3 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 px-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-sm text-gray-500">No user overrides set for this setting</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
