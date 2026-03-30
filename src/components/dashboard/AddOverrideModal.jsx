import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';

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
    }
  }, [open, currentOverrideSetting, overrideValue]);

  useEffect(() => {
    if (validationError) setValidationError('');
  }, [overrideValue, overrideLockState, overrideDefaultService, validationError]);

  const { moduleId, settingId, settingName, settingType, settingOptions, defaultValue } = currentOverrideSetting || {};
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

  const getEffectiveSettingValue = useCallback((targetUserId, targetModuleId, targetSettingId) => {
    const baseSetting = moduleSettings[targetModuleId]?.settings.find((s) => s.id === targetSettingId);
    const override = getUserSetting?.(targetUserId, targetModuleId, targetSettingId);
    return override?.value !== undefined ? override.value : baseSetting?.default;
  }, [getUserSetting, moduleSettings]);

  const isCombinedEmailOverride = moduleId === 'controls' && settingId === 22;
  const isCombinedAthenaOverride = moduleId === 'ehr-settings-athena' && settingId === 84;

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

  if (!open || !currentOverrideSetting) return null;

  const setSelectedListValues = (nextValues) => {
    setOverrideValue(JSON.stringify(nextValues));
  };

  const handleSave = () => {
    if (isMasterUser()) {
      alert('OPS can no longer manage user overrides.');
      return;
    }

    if (!isMasterUser() && isPMReadOnly) {
      alert('Changes are temporarily disabled while an Ops session is active.');
      return;
    }

    if (!isMasterUser() && isLockedHiddenByOps) {
      alert('This setting is locked hidden by Ops. PM cannot manage overrides.');
      return;
    }
    if (!selectedUserId) {
      alert('Please select a user');
      return;
    }

    if (!overrideLockState) {
      alert('Choose an access state.');
      return;
    }

    if (!isMasterUser() && isLockedVisibleByOps && !['locked-visible', 'locked-hidden'].includes(overrideLockState)) {
      alert('Under Ops Locked Visible, PM can only set override lock state to Locked Visible or Locked Hidden.');
      return;
    }

    if (overrideLockState !== 'locked-hidden' && overrideValue === '') {
      alert('Please set an override value');
      return;
    }

    const isSendNoteEmailEnabled = settingId === 22 && overrideValue !== 'disabled';
    if (isSendNoteEmailEnabled && !hipaaAttestationChecked) {
      alert('Please attest for HIPAA compliance on behalf of the user before enabling Send Note on Email');
      return;
    }

    let valueToSet = overrideValue === '' ? defaultValue : overrideValue;
    if (settingType === 'order-list' || settingType === 'time-multiselect' || settingType === 'multiselect' || settingType === 'service-settings-combined') {
      if (typeof valueToSet === 'string' && valueToSet !== '') {
        try {
          valueToSet = JSON.parse(valueToSet);
        } catch {
          // keep as-is
        }
      }
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

    const wouldMatchDefault = doesOverrideMatchDefault(
      selectedUserId,
      moduleId,
      settingId,
      valueToSet,
      overrideLockState,
      overrideDefaultService
    );

    if (!isMasterUser() && isLockedVisibleByOps) {
      setUserSetting(selectedUserId, moduleId, settingId, 'pmLockState', overrideLockState);
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
      setUserSetting(selectedUserId, moduleId, settingId, 'pmLockState', overrideLockState);
    } else {
      if (wouldMatchDefault) {
        setValidationError(getMatchingOverrideAlertMessage(valueToSet, overrideLockState));
        return;
      }

      setUserSetting(selectedUserId, moduleId, settingId, 'value', valueToSet);
      setUserSetting(selectedUserId, moduleId, settingId, 'pmLockState', overrideLockState);
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
          <h3 className="text-lg font-semibold text-gray-900">Add custom setting</h3>
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
            <p className="text-sm font-medium text-gray-700 mb-2">Practice default:</p>
            <p className="text-sm text-blue-700 font-semibold bg-blue-50 p-3 rounded-md">
              {settingType === 'email-delivery-combined'
                ? `Send Note: ${defaultValue?.sendNote || 'False'} | Send Transcript: ${defaultValue?.sendTranscript || 'False'}`
                : settingType === 'service-settings-combined'
                ? `Enabled: ${defaultValue.default?.join(', ') || defaultValue.join(', ')} | Default: ${defaultValue.defaultService}`
                : settingType === 'athena-embedded-combined'
                ? `Embedded: ${defaultValue?.enableEmbeddedApp || 'No'} | Auto Pull: ${defaultValue?.autoPullInEmbeddedApp || 'No'}`
                : (Array.isArray(defaultValue) ? defaultValue.join(', ') : defaultValue)}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Select user:</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
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
              <label className="text-sm font-medium text-gray-700 block mb-2">Custom value:</label>
              {(settingType === 'dropdown' || settingType === 'range-selector') && (
                <select
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select override value --</option>
                  {settingOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}
              {settingType === 'toggle' && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setOverrideValue('True')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      overrideValue === 'True' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    True
                  </button>
                  <button
                    onClick={() => setOverrideValue('False')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      overrideValue === 'False' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    False
                  </button>
                </div>
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
                Ops Lock active: only Locked Visible or Locked Hidden are allowed.
              </p>
            </div>
          )}

          {selectedUserId && overrideLockState === 'locked-hidden' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Setting will be hidden from this user. No override value is required since they won't see this setting.
              </p>
            </div>
          )}

          {selectedUserId && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Access state:</label>
              <div className={`grid gap-2 ${isLockedVisibleByOps ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {(isLockedVisibleByOps ? ['locked-visible', 'locked-hidden'] : ['unlocked', 'locked-visible', 'locked-hidden']).map((lock) => (
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
                    {lock === 'unlocked' ? 'Unlocked' : lock === 'locked-visible' ? 'Locked Visible' : 'Locked Hidden'}
                  </button>
                ))}
              </div>
              {!overrideLockState && (
                <p className="text-xs text-amber-700 mt-2">Choose an access state.</p>
              )}
            </div>
          )}

        </div>

        {availableUsers.length === 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">All users already have overrides for this setting.</p>
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
            Save custom setting
          </button>
        </div>
      </div>
    </div>
  );
}
