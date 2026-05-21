import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
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
import {
  normalizeAppointmentPullFilter,
  validateAppointmentPullFilter,
  formatAppointmentPullFilterDisplay,
} from '../../utils/appointmentPullFilter';
import {
  getAllowedOverrideLockStates,
  getDefaultOverrideLockState,
  practiceDefaultIsDoctorEditable,
  resolveOverrideLockState,
} from '../../utils/overrideLockRules';

export default function AddOverrideModal({
  open,
  currentOverrideSetting,
  allUsers,
  isMasterUser,
  isPMReadOnly,
  moduleSettings,
  hipaaAttestationChecked,
  setHipaaAttestationChecked,
  setHipaaAttestationUser,
  setShowHipaaEmailConfirm,
  getSettingOverrides,
  getUserSetting,
  removeUserSetting,
  getMatchingOverrideAlertMessage,
  doesOverrideMatchDefault,
  setUserSetting,
  getModuleCapabilities,
  onClose,
}) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [overrideValue, setOverrideValue] = useState('');
  const [overrideLockState, setOverrideLockState] = useState('');
  const [overrideDefaultService, setOverrideDefaultService] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (open && currentOverrideSetting) {
      const { settingType, defaultValue } = currentOverrideSetting;
      if (settingType === 'service-settings-combined' && overrideValue === '') {
        const enabledServices = defaultValue.default || defaultValue;
        setOverrideValue(JSON.stringify(enabledServices));
        setOverrideDefaultService(defaultValue.defaultService || enabledServices[0]);
      }
      if ((settingType === 'order-list' || settingType === 'time-multiselect' || settingType === 'multiselect') && overrideValue === '') {
        setOverrideValue(JSON.stringify(Array.isArray(defaultValue) ? defaultValue : []));
      }
      if (settingType === 'keyword-list' && overrideValue === '') {
        setOverrideValue(JSON.stringify(Array.isArray(defaultValue) ? defaultValue : []));
      }
      if (settingType === 'appointment-pull-filter-combined' && overrideValue === '') {
        setOverrideValue(JSON.stringify(normalizeAppointmentPullFilter(defaultValue)));
      }
    }
  }, [open, currentOverrideSetting, overrideValue]);

  useEffect(() => {
    if (validationError) setValidationError('');
  }, [overrideValue, overrideLockState, overrideDefaultService, validationError]);

  const { moduleId, settingId, settingName, settingType, settingOptions, defaultValue } = currentOverrideSetting || {};
  const moduleCapabilities = getModuleCapabilities?.(moduleId);
  const usesVisibilityEditabilityUI = moduleCapabilities?.usesVisibilityEditabilityUI === true;
  const setting = moduleSettings[moduleId]?.settings.find((s) => s.id === settingId);
  const isLockedVisibleByOps = setting?.opsLockState === 'locked-visible';
  const isLockedHiddenByOps = setting?.opsLockState === 'locked-hidden';
  const existingOverrides = getSettingOverrides(moduleId, settingId);
  const existingUserIds = existingOverrides.map((o) => o.userId);
  const availableUsers = allUsers.filter((u) => !existingUserIds.includes(u.id.toString()));
  const resetAndClose = () => {
    onClose();
    setSelectedUserId('');
    setOverrideValue('');
    setOverrideLockState('');
    setOverrideDefaultService('');
    setHipaaAttestationChecked(false);
    setValidationError('');
  };

  const getSelectedListValues = () => {
    try {
      const parsed = JSON.parse(overrideValue || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const toggleOnValue = Array.isArray(settingOptions) && settingOptions.length > 0
    ? (settingOptions.includes('True')
      ? 'True'
      : settingOptions.includes('Yes')
        ? 'Yes'
        : settingOptions.includes('On')
          ? 'On'
          : settingOptions[0])
    : 'True';
  const toggleOffValue = Array.isArray(settingOptions) && settingOptions.length > 1
    ? (settingOptions.includes('False')
      ? 'False'
      : settingOptions.includes('No')
        ? 'No'
        : settingOptions.includes('Off')
          ? 'Off'
          : settingOptions[1])
    : 'False';

  const getEffectiveSettingValue = useCallback((targetUserId, targetModuleId, targetSettingId) => {
    const baseSetting = moduleSettings[targetModuleId]?.settings.find((s) => s.id === targetSettingId);
    const override = getUserSetting?.(targetUserId, targetModuleId, targetSettingId);
    return override?.value !== undefined ? override.value : baseSetting?.default;
  }, [getUserSetting, moduleSettings]);

  const isCombinedEmailOverride = moduleId === 'controls' && settingId === 22;
  const isCombinedAthenaOverride = moduleId === 'ehr-settings-athena' && settingId === 84;
  const effectiveDeleteConsultsValue = selectedUserId
    ? getEffectiveSettingValue(selectedUserId, 'controls', DELETE_CONSULTS_SETTING_ID)
    : moduleSettings.controls?.settings.find((s) => s.id === DELETE_CONSULTS_SETTING_ID)?.default;
  const effectiveEhrLookAheadValue = selectedUserId
    ? getEffectiveSettingValue(selectedUserId, 'controls', EHR_PULL_LOOK_AHEAD_SETTING_ID)
    : moduleSettings.controls?.settings.find((s) => s.id === EHR_PULL_LOOK_AHEAD_SETTING_ID)?.default;
  const cacheWindowBounds = getCacheWindowBounds({
    deleteConsultsValue: effectiveDeleteConsultsValue,
    ehrLookAheadValue: effectiveEhrLookAheadValue,
    maxDays: MAX_WINDOW_DAYS
  });
  const rangeSelectorOptions = Array.isArray(settingOptions) && settingOptions.length > 0
    ? settingOptions
    : buildDayOptions(MAX_WINDOW_DAYS);
  const allowedOverrideLockStates = getAllowedOverrideLockStates(setting, {
    isLockedVisibleByOps,
  });
  const practiceEditable = practiceDefaultIsDoctorEditable(setting);
  const overrideVisibility = overrideLockState === 'locked-hidden' ? 'hidden' : 'shown';
  const overrideEditability = overrideLockState === 'unlocked' ? 'editable' : 'not-editable';
  const canSetOverrideEditable = allowedOverrideLockStates.includes('unlocked');
  const canSetOverrideNotEditable = allowedOverrideLockStates.includes('locked-visible');
  const canSetOverrideHidden = allowedOverrideLockStates.includes('locked-hidden');

  useEffect(() => {
    if (!open || !setting || !practiceEditable) return;
    if (overrideLockState === 'unlocked') {
      setOverrideLockState('locked-visible');
    }
  }, [open, setting, practiceEditable, overrideLockState]);
  const ToggleSwitch = ({ checked, onChange, disabled, onLabel, offLabel }) => (
    <div className="flex items-center gap-3">
      <span className={`text-xs ${!checked ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{offLabel}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onChange(!checked);
        }}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-xs ${checked ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{onLabel}</span>
    </div>
  );

  useEffect(() => {
    if (!open || !currentOverrideSetting) return;
    if (!selectedUserId || !isCombinedEmailOverride || overrideValue !== '') return;
    const effectiveEmail = getEffectiveSettingValue(selectedUserId, 'controls', 22);
    if (effectiveEmail && typeof effectiveEmail === 'object') {
      const mode =
        effectiveEmail.sendNote !== 'True'
          ? 'disabled'
          : effectiveEmail.sendTranscript === 'True'
            ? 'note-and-transcript'
            : 'note-only';
      setOverrideValue(mode);
      return;
    }
    if (effectiveEmail === 'True') {
      setOverrideValue('note-only');
      return;
    }
    setOverrideValue('disabled');
  }, [open, currentOverrideSetting, selectedUserId, isCombinedEmailOverride, overrideValue, getEffectiveSettingValue]);

  useEffect(() => {
    if (!open || !currentOverrideSetting) return;
    if (!selectedUserId || !isCombinedAthenaOverride || overrideValue !== '') return;
    const effectiveAthena = getEffectiveSettingValue(selectedUserId, 'ehr-settings-athena', 84);

    if (effectiveAthena && typeof effectiveAthena === 'object' && !Array.isArray(effectiveAthena)) {
      const mode =
        effectiveAthena.enableEmbeddedApp !== 'Yes'
          ? 'disabled'
          : effectiveAthena.autoPullInEmbeddedApp === 'Yes'
            ? 'embedded-and-auto-pull'
            : 'embedded-only';
      setOverrideValue(mode);
      return;
    }

    // Back-compat for legacy shape.
    setOverrideValue(effectiveAthena === 'Yes' ? 'embedded-only' : 'disabled');
  }, [open, currentOverrideSetting, selectedUserId, isCombinedAthenaOverride, overrideValue, getEffectiveSettingValue]);

  useEffect(() => {
    if (!open || !currentOverrideSetting) return;
    if (!selectedUserId || settingType !== 'range-selector' || overrideValue !== '') return;

    const effectiveRangeValue = getEffectiveSettingValue(selectedUserId, moduleId, settingId);
    const normalizedValue = clampRangeSelectorValue(
      effectiveRangeValue,
      rangeSelectorOptions,
      defaultValue
    );
    if (typeof normalizedValue === 'string') {
      setOverrideValue(normalizedValue);
    }
  }, [
    open,
    currentOverrideSetting,
    selectedUserId,
    settingType,
    overrideValue,
    getEffectiveSettingValue,
    moduleId,
    settingId,
    settingOptions,
    rangeSelectorOptions,
    defaultValue
  ]);

  useEffect(() => {
    if (!open || !currentOverrideSetting) return;
    if (!selectedUserId || settingType !== 'cache-window-combined' || overrideValue !== '') return;
    const effectiveWindowValue = getEffectiveSettingValue(selectedUserId, moduleId, settingId);
    const normalized = normalizeCacheWindowValue(effectiveWindowValue, cacheWindowBounds);
    setOverrideValue(JSON.stringify(normalized));
  }, [
    open,
    currentOverrideSetting,
    selectedUserId,
    settingType,
    overrideValue,
    getEffectiveSettingValue,
    moduleId,
    settingId,
    cacheWindowBounds
  ]);

  if (!open || !currentOverrideSetting) return null;

  const setSelectedListValues = (nextValues) => {
    setOverrideValue(JSON.stringify(nextValues));
  };

  const handleSave = () => {
    if (isMasterUser()) {
      alert('Ops users cannot change user-specific settings.');
      return;
    }

    if (!isMasterUser() && isPMReadOnly) {
      alert('Changes are temporarily disabled while an Ops session is active.');
      return;
    }

    if (!isMasterUser() && isLockedHiddenByOps) {
      alert('Edit not allowed. This setting is hidden and cannot be changed here.');
      return;
    }
    if (!selectedUserId) {
      alert('Please select a user');
      return;
    }

    if (!overrideLockState) {
      alert('Choose user access.');
      return;
    }

    if (!allowedOverrideLockStates.includes(overrideLockState)) {
      alert(
        practiceEditable
          ? 'Practice default is editable. Override access must be "Shown, not editable" or Hidden.'
          : 'That access option is not allowed for this setting.'
      );
      return;
    }

    if (!isMasterUser() && isLockedVisibleByOps && !allowedOverrideLockStates.includes(overrideLockState)) {
      alert(
        usesVisibilityEditabilityUI
          ? 'Edit not allowed. You can only choose "Shown, not editable" or Hidden.'
          : 'Edit not allowed. You can only choose "Shown, not editable" or Hidden.'
      );
      return;
    }

    if (overrideLockState !== 'locked-hidden' && overrideValue === '') {
      alert('Please set a user value');
      return;
    }

    const isSendNoteEmailEnabled = settingId === 22 && overrideValue !== 'disabled';
    if (isSendNoteEmailEnabled && !hipaaAttestationChecked) {
      alert('Please attest for HIPAA compliance on behalf of the user before enabling Send Note on Email');
      return;
    }

    let valueToSet = overrideValue === '' ? defaultValue : overrideValue;
    if (
      settingType === 'order-list' ||
      settingType === 'time-multiselect' ||
      settingType === 'multiselect' ||
      settingType === 'keyword-list' ||
      settingType === 'service-settings-combined' ||
      settingType === 'cache-window-combined' ||
      settingType === 'appointment-pull-filter-combined'
    ) {
      if (typeof valueToSet === 'string' && valueToSet !== '') {
        try {
          valueToSet = JSON.parse(valueToSet);
        } catch {
          // keep as-is
        }
      }
    }
    if (settingType === 'cache-window-combined') {
      valueToSet = normalizeCacheWindowValue(valueToSet, cacheWindowBounds);
    }

    if (settingType === 'service-settings-combined' && overrideLockState !== 'locked-hidden') {
      if (!Array.isArray(valueToSet) || valueToSet.length === 0) {
        alert('Please select at least one enabled service');
        return;
      }
      if (!overrideDefaultService) {
        alert('Please select a default service');
        return;
      }
      if (!valueToSet.includes(overrideDefaultService)) {
        alert('Default service must be one of the enabled services');
        return;
      }
    }
    if (isCombinedEmailOverride) {
      valueToSet = {
        sendNote: overrideValue === 'disabled' ? 'False' : 'True',
        sendTranscript: overrideValue === 'note-and-transcript' ? 'True' : 'False'
      };
    }
    if (isCombinedAthenaOverride) {
      valueToSet = {
        enableEmbeddedApp: overrideValue === 'disabled' ? 'No' : 'Yes',
        autoPullInEmbeddedApp: overrideValue === 'embedded-and-auto-pull' ? 'Yes' : 'No'
      };
    }
    if (settingType === 'appointment-pull-filter-combined') {
      valueToSet = normalizeAppointmentPullFilter(valueToSet);
      const validationError = validateAppointmentPullFilter(valueToSet, { strict: true });
      if (validationError) {
        alert(validationError);
        return;
      }
    }

    const wouldMatchDefault = doesOverrideMatchDefault(
      selectedUserId,
      moduleId,
      settingId,
      valueToSet,
      overrideLockState,
      overrideDefaultService
    );

    if (!isMasterUser() && isLockedVisibleByOps) {
      setUserSetting(
        selectedUserId,
        moduleId,
        settingId,
        'pmLockState',
        resolveOverrideLockState(setting, overrideLockState, valueToSet)
      );
      resetAndClose();
      return;
    }

    if (isCombinedEmailOverride || isCombinedAthenaOverride) {
      if (wouldMatchDefault) {
        const label = isCombinedEmailOverride ? 'Send Note + Send Transcript' : 'Athena Embedded Mode';
        setValidationError(getMatchingOverrideAlertMessage(label, overrideLockState));
        return;
      }
      setUserSetting(selectedUserId, moduleId, settingId, 'value', valueToSet);
      setUserSetting(
        selectedUserId,
        moduleId,
        settingId,
        'pmLockState',
        resolveOverrideLockState(setting, overrideLockState, valueToSet)
      );
    } else {
      if (wouldMatchDefault) {
        setValidationError(getMatchingOverrideAlertMessage(valueToSet, overrideLockState));
        return;
      }

      setUserSetting(selectedUserId, moduleId, settingId, 'value', valueToSet);
      setUserSetting(
        selectedUserId,
        moduleId,
        settingId,
        'pmLockState',
        resolveOverrideLockState(setting, overrideLockState, valueToSet)
      );
    }

    if (settingType === 'service-settings-combined' && overrideDefaultService) {
      setUserSetting(selectedUserId, moduleId, settingId, 'defaultService', overrideDefaultService);
    }

    if (isSendNoteEmailEnabled) {
      const user = allUsers.find((u) => u.id.toString() === selectedUserId);
      setHipaaAttestationUser(user);
      setShowHipaaEmailConfirm(true);
    }

    resetAndClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-45 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Customize for a user</h3>
          <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Setting:</p>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{settingName}</p>
          </div>
          {isCombinedEmailOverride && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md">
              <p className="text-sm text-indigo-900">
                This override flow configures both <strong>Send Note on Email</strong> and its dependent
                setting <strong>Send Transcript in Email</strong> together for one user.
              </p>
            </div>
          )}

          <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Practice value:</p>
            <p className="text-sm text-blue-700 font-semibold bg-blue-50 p-3 rounded-md">
              {settingType === 'email-delivery-combined'
                ? `Send Note: ${defaultValue?.sendNote || 'False'} | Send Transcript: ${defaultValue?.sendTranscript || 'False'}`
                : settingType === 'service-settings-combined'
                ? `Enabled: ${defaultValue.default?.join(', ') || defaultValue.join(', ')} | Default: ${defaultValue.defaultService}`
                : settingType === 'athena-embedded-combined'
                ? `Embedded: ${defaultValue?.enableEmbeddedApp || 'No'} | Auto Pull: ${defaultValue?.autoPullInEmbeddedApp || 'No'}`
                : settingType === 'cache-window-combined'
                ? `Ahead: ${defaultValue?.aheadDays || '8 days'} | Back: ${defaultValue?.backDays || '7 days'}`
                : settingType === 'appointment-pull-filter-combined'
                ? formatAppointmentPullFilterDisplay(defaultValue)
                : (Array.isArray(defaultValue) ? defaultValue.join(', ') : defaultValue)}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Select user:</label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                const nextUserId = e.target.value;
                setSelectedUserId(nextUserId);
                if (nextUserId && !overrideLockState) {
                  setOverrideLockState(getDefaultOverrideLockState(setting));
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select a user --</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.type === 'primary' ? `(${user.specialty})` : `(${user.role})`}
                </option>
              ))}
            </select>
          </div>

          {selectedUserId && !isLockedVisibleByOps && overrideLockState !== 'locked-hidden' && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">User value:</label>
              {settingType === 'dropdown' && (
                <select
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select user value --</option>
                  {settingOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}
              {settingType === 'range-selector' && (
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, rangeSelectorOptions.length - 1)}
                    step={1}
                    value={Math.max(
                      0,
                      rangeSelectorOptions.indexOf(
                        clampRangeSelectorValue(
                          overrideValue || defaultValue,
                          rangeSelectorOptions,
                          defaultValue
                        )
                      )
                    )}
                    onChange={(e) => {
                      const nextValue = rangeSelectorOptions[Number(e.target.value)];
                      if (nextValue !== undefined) setOverrideValue(nextValue);
                    }}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-lg font-semibold text-indigo-700">
                    {clampRangeSelectorValue(overrideValue || defaultValue, rangeSelectorOptions, defaultValue)}
                  </p>
                </div>
              )}
              {settingType === 'cache-window-combined' && (
                <div className="space-y-4">
                  {(() => {
                    const normalized = normalizeCacheWindowValue(
                      (() => {
                        try {
                          return overrideValue ? JSON.parse(overrideValue) : defaultValue;
                        } catch {
                          return defaultValue;
                        }
                      })(),
                      cacheWindowBounds
                    );
                    const aheadOptions = buildDayOptions(cacheWindowBounds.maxAheadDays);
                    const backOptions = buildDayOptions(cacheWindowBounds.maxBackDays);
                    const aheadIndex = Math.max(0, aheadOptions.indexOf(normalized.aheadDays));
                    const backIndex = Math.max(0, backOptions.indexOf(normalized.backDays));
                    return (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 block">Local cache look ahead</label>
                          <input
                            type="range"
                            min={0}
                            max={Math.max(0, aheadOptions.length - 1)}
                            step={1}
                            value={aheadIndex}
                            onChange={(e) => {
                              const nextAhead = aheadOptions[Number(e.target.value)];
                              if (!nextAhead) return;
                              setOverrideValue(JSON.stringify({
                                ...normalized,
                                aheadDays: nextAhead
                              }));
                            }}
                            className="w-full accent-indigo-600"
                          />
                          <p className="text-lg font-semibold text-indigo-700">{normalized.aheadDays}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 block">Local cache look back</label>
                          <input
                            type="range"
                            min={0}
                            max={Math.max(0, backOptions.length - 1)}
                            step={1}
                            value={backIndex}
                            onChange={(e) => {
                              const nextBack = backOptions[Number(e.target.value)];
                              if (!nextBack) return;
                              setOverrideValue(JSON.stringify({
                                ...normalized,
                                backDays: nextBack
                              }));
                            }}
                            className="w-full accent-indigo-600"
                          />
                          <p className="text-lg font-semibold text-indigo-700">{normalized.backDays}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          EHR limits: ahead up to {formatDayLabel(cacheWindowBounds.maxAheadDays)}, back up to {formatDayLabel(cacheWindowBounds.maxBackDays)}.
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}
              {settingType === 'toggle' && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setOverrideValue(toggleOnValue)}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      overrideValue === toggleOnValue ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {toggleOnValue}
                  </button>
                  <button
                    onClick={() => setOverrideValue(toggleOffValue)}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      overrideValue === toggleOffValue ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {toggleOffValue}
                  </button>
                </div>
              )}
              {settingType === 'text' && (
                <input
                  type="text"
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  placeholder="Enter user value"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
              {isCombinedEmailOverride && selectedUserId && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Email Delivery Mode:</label>
                  <select
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="disabled">Disabled</option>
                    <option value="note-only">Send note only</option>
                    <option value="note-and-transcript">Send note + transcript</option>
                  </select>
                </div>
              )}
              {isCombinedAthenaOverride && selectedUserId && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Athena Embedded Mode:</label>
                  <select
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="embedded-only">Enable</option>
                    <option value="embedded-and-auto-pull">Enable + Pull</option>
                    <option value="disabled">Disable</option>
                  </select>
                </div>
              )}
              {(settingType === 'multiselect' || settingType === 'time-multiselect') && (
                <div className="space-y-2 max-h-44 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {settingOptions.map((option) => {
                    const selectedValues = getSelectedListValues();
                    const checked = selectedValues.includes(option);
                    return (
                      <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...selectedValues, option]
                              : selectedValues.filter((value) => value !== option);
                            setSelectedListValues(next);
                          }}
                        />
                        {option}
                      </label>
                    );
                  })}
                </div>
              )}
              {settingType === 'appointment-pull-filter-combined' && (() => {
                let parsed = normalizeAppointmentPullFilter(defaultValue);
                try {
                  if (overrideValue) parsed = normalizeAppointmentPullFilter(JSON.parse(overrideValue));
                } catch {
                  // keep default parse
                }
                const setParsed = (next) => setOverrideValue(JSON.stringify(next));
                return (
                  <div className="space-y-3">
                    <select
                      value={parsed.mode}
                      onChange={(e) => {
                        const mode = e.target.value;
                        if (mode === 'none') setParsed({ mode: 'none', types: [] });
                        else setParsed({ mode, types: mode === parsed.mode ? parsed.types : [] });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="none">No filter</option>
                      <option value="allowlist">Allowlist</option>
                      <option value="blocklist">Blocklist</option>
                    </select>
                    {parsed.mode !== 'none' && (
                      <textarea
                        value={parsed.types.join('\n')}
                        onChange={(e) => {
                          const types = e.target.value
                            .split(/[\n,;]/g)
                            .map((t) => t.trim())
                            .filter(Boolean);
                          setParsed({ ...parsed, types });
                        }}
                        placeholder="One appointment type per line"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm min-h-[88px]"
                      />
                    )}
                  </div>
                );
              })()}
              {settingType === 'keyword-list' && (
                <div className="space-y-2">
                  <textarea
                    value={getSelectedListValues().join('\n')}
                    onChange={(e) => {
                      const next = e.target.value
                        .split(/[\n,;]/g)
                        .map((token) => token.trim())
                        .filter(Boolean);
                      setSelectedListValues([...new Set(next)]);
                    }}
                    rows={6}
                    placeholder="Enter one value per line (or comma separated)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    You can enter values line-by-line, comma-separated, or semicolon-separated.
                  </p>
                </div>
              )}
              {settingType === 'service-settings-combined' && (
                <div className="space-y-3">
                  <div className="space-y-2 max-h-44 overflow-y-auto border border-gray-200 rounded-md p-3">
                    {settingOptions.map((service) => {
                      const selectedValues = getSelectedListValues();
                      const checked = selectedValues.includes(service);
                      return (
                        <label key={service} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...selectedValues, service]
                                : selectedValues.filter((value) => value !== service);
                              if (next.length > 0) {
                                setSelectedListValues(next);
                                if (!next.includes(overrideDefaultService)) {
                                  setOverrideDefaultService(next[0]);
                                }
                              }
                            }}
                          />
                          {service}
                        </label>
                      );
                    })}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Default Service:</label>
                    <select
                      value={overrideDefaultService}
                      onChange={(e) => setOverrideDefaultService(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select default service --</option>
                      {getSelectedListValues().map((service) => (
                        <option key={service} value={service}>{service}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {settingType === 'order-list' && (
                <div className="space-y-2">
                  {getSelectedListValues().map((item, index, items) => (
                    <div key={`${item}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <span className="text-sm text-gray-800">{item}</span>
                      <div className="flex gap-1">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...items];
                              [next[index], next[index - 1]] = [next[index - 1], next[index]];
                              setSelectedListValues(next);
                            }}
                            className="px-2 text-sm"
                          >
                            ↑
                          </button>
                        )}
                        {index < items.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...items];
                              [next[index], next[index + 1]] = [next[index + 1], next[index]];
                              setSelectedListValues(next);
                            }}
                            className="px-2 text-sm"
                          >
                            ↓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedUserId && isLockedVisibleByOps && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-xs text-amber-800">
                Edit not allowed: only &quot;Shown, not editable&quot; or Hidden are allowed.
              </p>
            </div>
          )}

          {selectedUserId && practiceEditable && !isLockedVisibleByOps && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-900">
                Practice default is editable for doctors. Overrides for this user can only be{' '}
                <strong>not editable</strong> or <strong>hidden</strong> so they cannot change the value themselves.
              </p>
            </div>
          )}

          {selectedUserId && !practiceEditable && !isLockedVisibleByOps && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-xs text-green-900">
                Practice default is not editable. You may make this setting <strong>editable</strong> for this user only.
              </p>
            </div>
          )}

          {selectedUserId && overrideLockState === 'locked-hidden' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This setting will be hidden for this user. No user value is required when hidden.
              </p>
            </div>
          )}

          {selectedUserId && (
            <div>
              {usesVisibilityEditabilityUI ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Visibility:</label>
                    <ToggleSwitch
                      checked={overrideVisibility === 'shown'}
                      onChange={(isShown) => {
                        if (!isShown) {
                          setOverrideLockState('locked-hidden');
                          return;
                        }
                        setOverrideLockState(
                          canSetOverrideEditable && overrideEditability === 'editable'
                            ? 'unlocked'
                            : 'locked-visible'
                        );
                      }}
                      disabled={!canSetOverrideHidden && overrideVisibility === 'shown'}
                      onLabel="Shown"
                      offLabel="Hidden"
                    />
                  </div>

                  {overrideVisibility === 'shown' && canSetOverrideEditable && canSetOverrideNotEditable && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Editability:</label>
                      <ToggleSwitch
                        checked={overrideEditability === 'editable'}
                        onChange={(isEditable) => setOverrideLockState(isEditable ? 'unlocked' : 'locked-visible')}
                        disabled={false}
                        onLabel="Editable"
                        offLabel="Not editable"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <label className="text-sm font-medium text-gray-700 block mb-2">User access:</label>
                  <div className={`grid gap-2 ${allowedOverrideLockStates.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {allowedOverrideLockStates.map((lock) => (
                      <button
                        key={lock}
                        onClick={() => setOverrideLockState(lock)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          overrideLockState === lock
                            ? lock === 'unlocked'
                              ? 'bg-green-600 text-white'
                              : lock === 'locked-visible'
                                ? 'bg-orange-600 text-white'
                                : 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {lock === 'unlocked' ? 'Shown, editable' : lock === 'locked-visible' ? 'Shown, not editable' : 'Hidden'}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {!overrideLockState && (
                <p className="text-xs text-amber-700 mt-2">
                  Choose user access.
                </p>
              )}
            </div>
          )}

        </div>

        {availableUsers.length === 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">All users already have user-specific settings for this item.</p>
          </div>
        )}

        {settingId === 22 && overrideValue !== 'disabled' && selectedUserId && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-md">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={hipaaAttestationChecked}
                onChange={(e) => setHipaaAttestationChecked(e.target.checked)}
                className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-purple-900">
                <strong>I attest</strong> compliance for this user and acknowledge email notification.
              </span>
            </label>
          </div>
        )}

        {validationError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 whitespace-pre-line">{validationError}</p>
          </div>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={resetAndClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedUserId || !overrideLockState || (overrideLockState !== 'locked-hidden' && overrideValue === '') || availableUsers.length === 0}
            className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save user setting
          </button>
        </div>
      </div>
    </div>
  );
}
