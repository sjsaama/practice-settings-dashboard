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
  const [keywordDraft, setKeywordDraft] = React.useState('');

  // Keep the token input tidy when switching between default vs user override views.
  React.useEffect(() => {
    setKeywordDraft('');
  }, [setting.id, showUserOverride, userId]);

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
    if (setting.subtexts && typeof setting.default === 'string') {
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
        const toggleOptions = Array.isArray(setting.options) ? setting.options : [];
        const toggleOnValue =
          toggleOptions.includes('True') ? 'True'
            : toggleOptions.includes('Yes') ? 'Yes'
              : toggleOptions.includes('On') ? 'On'
                : toggleOptions[0];
        const toggleOffValue =
          toggleOptions.includes('False') ? 'False'
            : toggleOptions.includes('No') ? 'No'
              : toggleOptions.includes('Off') ? 'Off'
                : toggleOptions[1];

        const isToggleOn = value === toggleOnValue;
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
              if (!toggleOnValue || !toggleOffValue) return;
              handleChange(isToggleOn ? toggleOffValue : toggleOnValue);
            }}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isToggleOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        );
      }
      case 'email-delivery-combined': {
        const normalizedValue = (value && typeof value === 'object')
          ? {
              sendNote: value.sendNote === 'True' ? 'True' : 'False',
              sendTranscript: value.sendTranscript === 'True' ? 'True' : 'False'
            }
          : {
              sendNote: value === 'True' ? 'True' : 'False',
              sendTranscript: 'False'
            };
        const emailMode =
          normalizedValue.sendNote !== 'True'
            ? 'disabled'
            : normalizedValue.sendTranscript === 'True'
              ? 'note-and-transcript'
              : 'note-only';
        const isControlDisabled = !isEnabled || isDefaultReadOnly;
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">Email Delivery Mode</label>
            <select
              value={emailMode}
              disabled={isControlDisabled}
              onChange={(e) => {
                if (isControlDisabled) return;
                const nextMode = e.target.value;
                const nextValue =
                  nextMode === 'note-and-transcript'
                    ? { sendNote: 'True', sendTranscript: 'True' }
                    : nextMode === 'note-only'
                      ? { sendNote: 'True', sendTranscript: 'False' }
                      : { sendNote: 'False', sendTranscript: 'False' };
                if (setting.requiresAttestation && nextValue.sendNote === 'True' && !isUser && normalizedValue.sendNote !== 'True') {
                  onRequestAttestation?.();
                  return;
                }
                handleChange(nextValue);
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="disabled">Disabled</option>
              <option value="note-only">Send note only</option>
              <option value="note-and-transcript">Send note + transcript</option>
            </select>
          </div>
        );
      }
      case 'athena-embedded-combined': {
        const normalizedValue = (value && typeof value === 'object' && !Array.isArray(value))
          ? {
              enableEmbeddedApp: value.enableEmbeddedApp === 'Yes' ? 'Yes' : 'No',
              autoPullInEmbeddedApp: value.autoPullInEmbeddedApp === 'Yes' ? 'Yes' : 'No'
            }
          : {
              enableEmbeddedApp: value === 'Yes' ? 'Yes' : 'No',
              autoPullInEmbeddedApp: 'No'
            };

        const athenaMode =
          normalizedValue.enableEmbeddedApp !== 'Yes'
            ? 'disabled'
            : normalizedValue.autoPullInEmbeddedApp === 'Yes'
              ? 'embedded-and-auto-pull'
              : 'embedded-only';

        const isControlDisabled = !isEnabled || isDefaultReadOnly;
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">Athena Embedded Mode</label>
            <select
              value={athenaMode}
              disabled={isControlDisabled}
              onChange={(e) => {
                if (isControlDisabled) return;
                const nextMode = e.target.value;
                const nextValue =
                  nextMode === 'embedded-and-auto-pull'
                    ? { enableEmbeddedApp: 'Yes', autoPullInEmbeddedApp: 'Yes' }
                    : nextMode === 'embedded-only'
                      ? { enableEmbeddedApp: 'Yes', autoPullInEmbeddedApp: 'No' }
                      : { enableEmbeddedApp: 'No', autoPullInEmbeddedApp: 'No' };
                handleChange(nextValue);
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="embedded-only">Enable</option>
              <option value="embedded-and-auto-pull">Enable + Pull</option>
              <option value="disabled">Disable</option>
            </select>
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
      case 'multiselect': {
        const selectedOptions = Array.isArray(value) ? value : [];
        const options = Array.isArray(setting.options) ? setting.options : [];
        return (
          <div className="grid grid-cols-2 gap-2">
            {options.map((option) => {
              const checked = selectedOptions.includes(option);
              return (
                <label key={option} className="text-sm flex items-center gap-2 p-2 border rounded">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (isDefaultReadOnly) return;
                      const next = e.target.checked
                        ? [...selectedOptions, option]
                        : selectedOptions.filter((item) => item !== option);

                      if (isUser && targetUserId) {
                        setUserSetting(targetUserId, moduleId, setting.id, 'value', next);
                      } else {
                        updateSettingState(moduleId, setting.id, 'default', next);
                      }
                    }}
                  />
                  {option}
                </label>
              );
            })}
          </div>
        );
      }
      case 'keyword-list': {
        const tokens = Array.isArray(value) ? value : [];

        const normalizeDraftIntoTokens = (draft) => {
          if (!draft || typeof draft !== 'string') return [];
          return draft
            .split(/[,;\n]/g)
            .map((t) => t.trim())
            .filter(Boolean);
        };

        const dedupePreserveOrder = (arr) => {
          const out = [];
          const seen = new Set();
          for (const item of arr) {
            if (seen.has(item)) continue;
            seen.add(item);
            out.push(item);
          }
          return out;
        };

        const handleAddFromDraft = () => {
          if (isDefaultReadOnly) return;
          const incomingTokens = normalizeDraftIntoTokens(keywordDraft);
          if (incomingTokens.length === 0) return;

          const next = dedupePreserveOrder([...tokens, ...incomingTokens]);
          handleChange(next);
          setKeywordDraft('');
        };

        const handleRemoveToken = (token) => {
          if (isDefaultReadOnly) return;
          const next = tokens.filter((t) => t !== token);
          handleChange(next);
        };

        return (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <input
                type="text"
                value={keywordDraft}
                onChange={(e) => setKeywordDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFromDraft();
                  }
                }}
                disabled={isDefaultReadOnly}
                placeholder="Type a word/phrase and press Enter"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={handleAddFromDraft}
                disabled={isDefaultReadOnly}
                className="shrink-0 px-4 py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tokens.length > 0 ? (
                tokens.map((token) => (
                  <span
                    key={token}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200"
                  >
                    <span className="text-xs text-gray-900">{token}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveToken(token)}
                      disabled={isDefaultReadOnly}
                      className="text-xs font-medium text-gray-500 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      aria-label={`Remove ${token}`}
                    >
                      x
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-gray-500">No entries. Add words/phrases above.</p>
              )}
            </div>

            <p className="text-[11px] text-gray-500">
              Tip: you can paste multiple values separated by commas, semicolons, or new lines.
            </p>
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
    (!isMasterUser() && (
      isPMReadOnly ||
      setting.opsLockState === 'locked-hidden' ||
      !isEnabled
    ));
  const canManageOverrides = !isMasterUser() && !isPMReadOnly && setting.opsLockState === 'unlocked';
  const canRestrictOverridesOnly = !isMasterUser() && !isPMReadOnly && setting.opsLockState === 'locked-visible';
  const lockStateOptions = (() => {
    if (isMasterUser()) return ['unlocked', 'locked-visible', 'locked-hidden'];
    if (setting.opsLockState === 'unlocked') return ['unlocked', 'locked-visible', 'locked-hidden'];
    if (setting.opsLockState === 'locked-visible') {
      const current = setting.pmLockState || 'unlocked';
      const allowed = ['locked-visible', 'locked-hidden'];
      return allowed.includes(current) ? allowed : [current, ...allowed];
    }
    return [setting.pmLockState || 'unlocked'];
  })();
  const formatOverrideValue = (overrideValue) => {
    if (setting.type === 'email-delivery-combined' && overrideValue && typeof overrideValue === 'object') {
      const sendNote = overrideValue.sendNote === 'True' ? 'True' : 'False';
      const sendTranscript = overrideValue.sendTranscript === 'True' ? 'True' : 'False';
      return `Send Note: ${sendNote}; Send Transcript: ${sendTranscript}`;
    }
    if (setting.type === 'athena-embedded-combined' && overrideValue && typeof overrideValue === 'object') {
      const enableEmbeddedApp = overrideValue.enableEmbeddedApp === 'Yes' ? 'Yes' : 'No';
      const autoPullInEmbeddedApp = overrideValue.autoPullInEmbeddedApp === 'Yes' ? 'Yes' : 'No';
      return `Embedded: ${enableEmbeddedApp}; Auto Pull: ${autoPullInEmbeddedApp}`;
    }
    if (setting.type === 'service-settings-combined' && Array.isArray(overrideValue)) {
      return overrideValue.join(', ');
    }
    return Array.isArray(overrideValue) ? overrideValue.join(', ') : String(overrideValue);
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 mb-5 ${!isEnabled ? 'opacity-60' : ''}`}>
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
            <label className="block text-xs font-medium text-gray-600 mb-1 text-right">Lock state</label>
            <select
              value={setting.pmLockState || 'unlocked'}
              onChange={(e) => updateSettingState(moduleId, setting.id, 'pmLockState', e.target.value)}
              disabled={isDefaultLockStateReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {lockStateOptions.map((lock) => (
                <option key={lock} value={lock}>
                  {lock === 'unlocked' ? 'Unlocked' : lock === 'locked-visible' ? 'Locked Visible' : 'Locked Hidden'}
                </option>
              ))}
            </select>
            {!isMasterUser() && setting.opsLockState === 'locked-visible' && (
              <p className="text-[11px] text-amber-700 mt-1 text-right">
                Ops Lock active: only Locked Visible or Locked Hidden are allowed.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <label className="text-sm font-medium text-gray-700 min-w-16 mt-2">{showUserOverride ? 'User Value:' : 'Default:'}</label>
          <div className="flex-1">{showUserOverride ? renderFormControl(true, userId) : renderFormControl()}</div>
        </div>
      </div>

      {getDisplaySubtext() && (
        <div className="mt-5 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-700 leading-relaxed">{getDisplaySubtext()}</p>
        </div>
      )}

      {!showUserOverride &&
        (isMasterUser() || setting.opsLockState !== 'locked-hidden') &&
        (moduleId === 'note-settings' || moduleId === 'controls' || moduleId === 'ehr-settings-amd' || moduleId === 'ehr-settings-athena' || moduleId === 'em-settings') && (
        <div className="mt-5 pt-5 border-t border-gray-200">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-gray-900">User Overrides</h4>
              <p className="text-xs text-gray-500 mt-1">
                {isMasterUser()
                  ? 'Visible for OPS review only. Override changes are managed by PM.'
                  : setting.opsLockState === 'locked-hidden'
                    ? 'Hidden by Ops. PM cannot manage overrides.'
                    : setting.opsLockState === 'locked-visible'
                      ? 'Overrides are visible, but only lock restrictions are allowed.'
                      : 'Set user-specific values for this setting.'}
              </p>
            </div>
            {(canManageOverrides || canRestrictOverridesOnly) && (
              <button
                onClick={() => {
                  setCurrentOverrideSetting({
                    moduleId,
                    settingId: setting.id,
                    settingName: setting.name,
                    settingType: setting.type,
                    settingOptions: setting.options,
                    defaultValue: setting.type === 'service-settings-combined'
                      ? { default: setting.default, defaultService: setting.defaultService }
                      : setting.default
                  });
                  setShowAddOverrideModal(true);
                }}
                className="shrink-0 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-800 transition-colors font-medium"
              >
                Manage overrides
              </button>
            )}
          </div>
          {(() => {
            const overrides = getSettingOverrides(moduleId, setting.id);
            return overrides.length > 0 ? (
              <div className="space-y-2">
                {overrides.map((override) => (
                  <div key={override.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">{override.userName}</p>
                      </div>
                      {override.value !== undefined ? (
                        <p className="text-xs text-gray-600">
                          Override value: <span className="font-semibold text-blue-700">{formatOverrideValue(override.value)}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-600">
                          Override value: <span className="font-semibold text-blue-700">Inherit default</span>
                        </p>
                      )}
                      {setting.type === 'service-settings-combined' && override.defaultService && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          Default service: <span className="font-semibold text-blue-700">{override.defaultService}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-600 mt-0.5">
                        Lock state: <span className="font-semibold text-amber-700">{getLockStateLabel(override.pmLockState)}</span>
                      </p>
                    </div>
                    <div className="ml-3 flex flex-col gap-1">
                      {canRestrictOverridesOnly && override.pmLockState !== 'locked-hidden' && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Set ${override.userName} override to Locked Hidden?`)) {
                              setUserSetting(override.userId, moduleId, setting.id, 'pmLockState', 'locked-hidden');
                            }
                          }}
                          className="px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 rounded transition-colors"
                        >
                          Hide setting
                        </button>
                      )}
                      {canManageOverrides && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove override for ${override.userName}?`)) {
                              removeUserSetting(override.userId, moduleId, setting.id);
                            }
                          }}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 px-3 bg-gray-50 rounded-md border border-dashed border-gray-300">
                <p className="text-sm text-gray-500">No custom settings yet.</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
