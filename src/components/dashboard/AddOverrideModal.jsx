import React, { useEffect, useState } from 'react';
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

  if (!open || !currentOverrideSetting) return null;

  const { moduleId, settingId, settingName, settingType, settingOptions, defaultValue } = currentOverrideSetting;
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

  const setSelectedListValues = (nextValues) => {
    setOverrideValue(JSON.stringify(nextValues));
  };

  const handleSave = () => {
    if (!isMasterUser() && isPMReadOnly) {
      alert('Editing is temporarily disabled while Ops is active.');
      return;
    }

    const setting = moduleSettings[moduleId]?.settings.find((s) => s.id === settingId);
    if (!isMasterUser() && setting && setting.opsLockState !== 'unlocked') {
      alert('Overrides are only allowed when Ops Lock is set to Unlocked for this setting.');
      return;
    }
    if (settingType === 'service-settings-combined') {
      alert('Overrides are not supported for this setting.');
      return;
    }

    if (!selectedUserId) {
      alert('Please select a user');
      return;
    }

    if (!overrideLockState) {
      alert('Please select a lock state');
      return;
    }

    if (overrideLockState !== 'locked-hidden' && overrideValue === '') {
      alert('Please set an override value');
      return;
    }

    const isSendNoteEmailEnabled = settingId === 22 && overrideValue === 'True';
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

    const wouldMatchDefault = doesOverrideMatchDefault(
      selectedUserId,
      moduleId,
      settingId,
      valueToSet,
      overrideLockState,
      overrideDefaultService
    );
    if (wouldMatchDefault) {
      setValidationError(getMatchingOverrideAlertMessage(valueToSet, overrideLockState));
      return;
    }

    setUserSetting(selectedUserId, moduleId, settingId, 'value', valueToSet);
    setUserSetting(selectedUserId, moduleId, settingId, 'pmLockState', overrideLockState);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add User Override</h3>
          <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Setting:</p>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{settingName}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Practice Default:</p>
            <p className="text-sm text-blue-700 font-semibold bg-blue-50 p-3 rounded-lg">
              {settingType === 'service-settings-combined'
                ? `Enabled: ${defaultValue.default?.join(', ') || defaultValue.join(', ')} | Default: ${defaultValue.defaultService}`
                : (Array.isArray(defaultValue) ? defaultValue.join(', ') : defaultValue)}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Select User:</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select a user --</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.type === 'primary' ? `(${user.specialty})` : `(${user.role})`}
                </option>
              ))}
            </select>
          </div>

          {selectedUserId && overrideLockState !== 'locked-hidden' && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Override Value:</label>
              {(settingType === 'dropdown' || settingType === 'range-selector') && (
                <select
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      overrideValue === 'True' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    True
                  </button>
                  <button
                    onClick={() => setOverrideValue('False')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      overrideValue === 'False' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    False
                  </button>
                </div>
              )}
              {(settingType === 'multiselect' || settingType === 'time-multiselect') && (
                <div className="space-y-2 max-h-44 overflow-y-auto border border-gray-200 rounded-lg p-3">
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

          {selectedUserId && overrideLockState === 'locked-hidden' && (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Setting will be hidden from this user. No override value is required since they won't see this setting.
              </p>
            </div>
          )}

          {selectedUserId && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Lock State:</label>
              <div className="grid grid-cols-3 gap-2">
                {['unlocked', 'locked-visible', 'locked-hidden'].map((lock) => (
                  <button
                    key={lock}
                    onClick={() => setOverrideLockState(lock)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                <p className="text-xs text-amber-700 mt-2">Please choose a lock state.</p>
              )}
            </div>
          )}
        </div>

        {availableUsers.length === 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <p className="text-sm text-yellow-800">All users already have overrides for this setting.</p>
          </div>
        )}

        {settingId === 22 && overrideValue === 'True' && selectedUserId && (
          <div className="mb-6 p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
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
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
            <p className="text-sm text-red-800 whitespace-pre-line">{validationError}</p>
          </div>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={resetAndClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedUserId || !overrideLockState || (overrideLockState !== 'locked-hidden' && overrideValue === '') || availableUsers.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add Override
          </button>
        </div>
      </div>
    </div>
  );
}
