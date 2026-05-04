import React from 'react';
import { canPMEditSetting, canPMSeeSetting } from '../../utils/accessPolicy';
import { getTimeOptionsForTimezone } from '../../utils/timeOptions';
import {
  DELETE_CONSULTS_SETTING_ID,
  EHR_PULL_LOOK_AHEAD_SETTING_ID,
  MAX_WINDOW_DAYS,
  buildDayOptions,
  clampRangeSelectorValue,
  formatDayLabel,
  getCacheWindowBounds,
  normalizeCacheWindowValue,
} from '../../utils/syncWindowRules';

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
  moduleCapabilities,
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
        return 'Shown, not editable';
      case 'locked-hidden':
        return 'Hidden';
      case 'unlocked':
      default:
        return 'Shown, editable';
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
      case 'range-selector': {
        const baseOptions = setting.dependency === 41 ? availableOptions : setting.options;
        const options = Array.isArray(baseOptions) && baseOptions.length > 0
          ? baseOptions
          : buildDayOptions(MAX_WINDOW_DAYS);
        const safeValue = clampRangeSelectorValue(value, options, setting.default);
        const currentIndex = Math.max(0, options.indexOf(safeValue));
        const selectedValue = options[currentIndex] || safeValue;

        return (
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={Math.max(0, options.length - 1)}
              step={1}
              value={currentIndex}
              disabled={isDefaultReadOnly || options.length === 0}
              onChange={(e) => {
                const index = Number(e.target.value);
                const nextValue = options[index];
                if (nextValue !== undefined) {
                  handleChange(nextValue);
                }
              }}
              className="w-full accent-indigo-600"
            />
            <p className="text-lg font-semibold text-indigo-700">{selectedValue}</p>
          </div>
        );
      }
      case 'cache-window-combined': {
        const controlsSettings = moduleSettings.controls?.settings || [];
        const deleteConsultsSetting = controlsSettings.find((s) => s.id === DELETE_CONSULTS_SETTING_ID);
        const ehrLookAheadSetting = controlsSettings.find((s) => s.id === EHR_PULL_LOOK_AHEAD_SETTING_ID);
        const effectiveDeleteConsultsValue = (isUser && targetUserId
          ? getUserSetting(targetUserId, 'controls', DELETE_CONSULTS_SETTING_ID)?.value
          : undefined) || deleteConsultsSetting?.default;
        const effectiveEhrLookAheadValue = (isUser && targetUserId
          ? getUserSetting(targetUserId, 'controls', EHR_PULL_LOOK_AHEAD_SETTING_ID)?.value
          : undefined) || ehrLookAheadSetting?.default;
        const bounds = getCacheWindowBounds({
          deleteConsultsValue: effectiveDeleteConsultsValue,
          ehrLookAheadValue: effectiveEhrLookAheadValue,
          maxDays: MAX_WINDOW_DAYS
        });
        const normalizedValue = normalizeCacheWindowValue(value, bounds);
        const aheadOptions = buildDayOptions(bounds.maxAheadDays);
        const backOptions = buildDayOptions(bounds.maxBackDays);
        const aheadIndex = Math.max(0, aheadOptions.indexOf(normalizedValue.aheadDays));
        const backIndex = Math.max(0, backOptions.indexOf(normalizedValue.backDays));

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">Local cache look ahead</label>
              <input
                type="range"
                min={0}
                max={Math.max(0, aheadOptions.length - 1)}
                step={1}
                value={aheadIndex}
                disabled={isDefaultReadOnly || aheadOptions.length === 0}
                onChange={(e) => {
                  const nextAheadValue = aheadOptions[Number(e.target.value)];
                  if (!nextAheadValue) return;
                  handleChange({
                    ...normalizedValue,
                    aheadDays: nextAheadValue
                  });
                }}
                className="w-full accent-indigo-600"
              />
              <p className="text-lg font-semibold text-indigo-700">{normalizedValue.aheadDays}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">Local cache look back</label>
              <input
                type="range"
                min={0}
                max={Math.max(0, backOptions.length - 1)}
                step={1}
                value={backIndex}
                disabled={isDefaultReadOnly || backOptions.length === 0}
                onChange={(e) => {
                  const nextBackValue = backOptions[Number(e.target.value)];
                  if (!nextBackValue) return;
                  handleChange({
                    ...normalizedValue,
                    backDays: nextBackValue
                  });
                }}
                className="w-full accent-indigo-600"
              />
              <p className="text-lg font-semibold text-indigo-700">{normalizedValue.backDays}</p>
            </div>

            <p className="text-xs text-gray-500">
              EHR limits: ahead up to {formatDayLabel(bounds.maxAheadDays)}, back up to {formatDayLabel(bounds.maxBackDays)}.
            </p>
          </div>
        );
      }
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
          </div>
        );
      }
      case 'text': {
        return (
          <input
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isDefaultReadOnly}
            placeholder="Enter value"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
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
  const currentPmLockState = setting.pmLockState || 'unlocked';
  const isNonPropagatableSetting = setting.nonPropagatable === true;
  const supportsUserOverrides = moduleCapabilities?.supportsUserOverrides === true;
  const usesVisibilityEditabilityUI =
    !showUserOverride &&
    !isNonPropagatableSetting;
  const allowedLockStates = new Set(lockStateOptions);
  const settingVisibility = currentPmLockState === 'locked-hidden' ? 'hidden' : 'shown';
  const settingEditability = currentPmLockState === 'unlocked' ? 'editable' : 'not-editable';
  const canShowEditable = allowedLockStates.has('unlocked');
  const canShowNotEditable = allowedLockStates.has('locked-visible');
  const canHideSetting = allowedLockStates.has('locked-hidden');

  const getShownLockState = () => {
    if (settingEditability === 'editable' && canShowEditable) return 'unlocked';
    if (canShowNotEditable) return 'locked-visible';
    if (canShowEditable) return 'unlocked';
    return currentPmLockState;
  };

  const handleSettingVisibilityChange = (nextVisibility) => {
    if (isDefaultLockStateReadOnly) return;
    if (nextVisibility === 'hidden') {
      if (!canHideSetting) return;
      updateSettingState(moduleId, setting.id, 'pmLockState', 'locked-hidden');
      return;
    }
    if (nextVisibility === 'shown') {
      updateSettingState(moduleId, setting.id, 'pmLockState', getShownLockState());
    }
  };

  const handleSettingEditabilityChange = (nextEditability) => {
    if (isDefaultLockStateReadOnly) return;
    if (nextEditability === 'editable') {
      if (!canShowEditable) return;
      updateSettingState(moduleId, setting.id, 'pmLockState', 'unlocked');
      return;
    }
    if (!canShowNotEditable) return;
    updateSettingState(moduleId, setting.id, 'pmLockState', 'locked-visible');
  };
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
    if (setting.type === 'cache-window-combined' && overrideValue && typeof overrideValue === 'object') {
      const normalized = normalizeCacheWindowValue(overrideValue, {
        maxAheadDays: MAX_WINDOW_DAYS,
        maxBackDays: MAX_WINDOW_DAYS
      });
      return `Ahead: ${normalized.aheadDays}; Back: ${normalized.backDays}`;
    }
    return Array.isArray(overrideValue) ? overrideValue.join(', ') : String(overrideValue);
  };
  const getOpsRestrictionCopy = (lockState) => {
    if (lockState === 'locked-visible') return 'Not editable';
    if (lockState === 'locked-hidden') return 'Hidden';
    return 'Editable';
  };
  const renderInfoTooltip = (text) => (
    <div className="relative group inline-flex items-center ml-2">
      <button
        type="button"
        className="w-4 h-4 rounded-full border border-gray-400 text-[10px] text-gray-600 flex items-center justify-center bg-white cursor-help"
        aria-label={text}
      >
        i
      </button>
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 px-3 py-2 rounded-md bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg">
        {text}
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 mb-5 ${!isEnabled ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{setting.name}</h3>
            {setting.required && <span className="text-red-500 text-sm font-medium">*</span>}
            {isPMDefaultView && !usesVisibilityEditabilityUI && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                {getOpsRestrictionCopy(setting.opsLockState)}
              </span>
            )}
          </div>
          {getDisplaySubtext() && (
            <p className="text-sm text-gray-600 leading-relaxed">{getDisplaySubtext()}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <label className="text-sm font-medium text-gray-700 min-w-16 mt-2">
            {showUserOverride ? 'User Value:' : 'Default:'}
          </label>
          <div className="flex-1">{showUserOverride ? renderFormControl(true, userId) : renderFormControl()}</div>
        </div>
        {usesVisibilityEditabilityUI && !showUserOverride && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <label className="text-sm font-medium text-gray-700 min-w-16 mt-2 inline-flex items-center">
                Visibility:
                {renderInfoTooltip('Decides if this setting will be visible to users')}
              </label>
              <div className="flex-1">
                  <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
                    {(canShowEditable || canShowNotEditable || settingVisibility === 'shown') && (
                      <button
                        type="button"
                        onClick={() => handleSettingVisibilityChange('shown')}
                        disabled={isDefaultLockStateReadOnly}
                        className={`px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          settingVisibility === 'shown' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Show
                      </button>
                    )}
                    {(canHideSetting || settingVisibility === 'hidden') && (
                      <button
                        type="button"
                        onClick={() => handleSettingVisibilityChange('hidden')}
                        disabled={isDefaultLockStateReadOnly}
                        className={`px-4 py-2 text-sm border-l border-gray-300 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          settingVisibility === 'hidden' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Hide
                      </button>
                    )}
                  </div>
              </div>
            </div>

            {settingVisibility === 'shown' && canShowEditable && canShowNotEditable && (
              <div className="flex items-start gap-4">
                <label className="text-sm font-medium text-gray-700 min-w-16 mt-2 inline-flex items-center">
                  Editability:
                  {renderInfoTooltip('Decides if users can edit the value of this setting')}
                </label>
                <div className="flex-1">
                  <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
                    {(canShowEditable || settingEditability === 'editable') && (
                      <button
                        type="button"
                        onClick={() => handleSettingEditabilityChange('editable')}
                        disabled={isDefaultLockStateReadOnly}
                        className={`px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          settingEditability === 'editable' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Editable
                      </button>
                    )}
                    {(canShowNotEditable || settingEditability === 'not-editable') && (
                      <button
                        type="button"
                        onClick={() => handleSettingEditabilityChange('not-editable')}
                        disabled={isDefaultLockStateReadOnly}
                        className={`px-4 py-2 text-sm border-l border-gray-300 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          settingEditability === 'not-editable' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Not editable
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!showUserOverride &&
        !isNonPropagatableSetting &&
        (isMasterUser() || setting.opsLockState !== 'locked-hidden') &&
        supportsUserOverrides && (
        <div className="mt-5 pt-5 border-t border-gray-200">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-gray-900">User-specific access & values</h4>
              <p className="text-xs text-gray-500 mt-1">
                {isMasterUser()
                  ? 'Read-only view. Practice managers handle user-specific updates.'
                  : setting.opsLockState === 'locked-hidden'
                    ? 'Edit not allowed. This setting is hidden and cannot be changed here.'
                    : setting.opsLockState === 'locked-visible'
                      ? 'Edit not allowed for defaults. You can only choose "Shown, not editable" or Hidden per user.'
                      : 'Set a user-specific value and access level for this setting.'}
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
                Customize users
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
                          User value: <span className="font-semibold text-blue-700">{formatOverrideValue(override.value)}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-600">
                          User value: <span className="font-semibold text-blue-700">Use practice value</span>
                        </p>
                      )}
                      {setting.type === 'service-settings-combined' && override.defaultService && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          Default service: <span className="font-semibold text-blue-700">{override.defaultService}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-600 mt-0.5">
                        User access: <span className="font-semibold text-amber-700">{getLockStateLabel(override.pmLockState)}</span>
                      </p>
                    </div>
                    <div className="ml-3 flex flex-col gap-1">
                      {canRestrictOverridesOnly && override.pmLockState !== 'locked-hidden' && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Hide this setting for ${override.userName}?`)) {
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
                            if (window.confirm(`Remove user-specific setting for ${override.userName}?`)) {
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
                <p className="text-sm text-gray-500">No user-specific settings yet.</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
