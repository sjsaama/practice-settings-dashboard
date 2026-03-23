import React from 'react';
import { Settings, Users, X } from 'lucide-react';
import { formatLockStateDisplay, formatValueDisplay } from '../../utils/validationHelpers';

function formatChangeValue(value, isLockStateChange) {
  if (isLockStateChange) return formatLockStateDisplay(value);
  return formatValueDisplay(value);
}

export function HipaaEmailConfirmModal({ open, user, onClose }) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">HIPAA Attestation Confirmed</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <h4 className="text-center text-xl font-semibold text-gray-900 mb-2">
            Send Note on Email Enabled Successfully
          </h4>

          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Email Notification Sent</p>
                <p className="text-sm text-purple-800 mt-1">
                  An email has been sent to <strong>{user.email}</strong> informing them that:
                </p>
                <ul className="mt-2 text-sm text-purple-800 list-disc list-inside space-y-1">
                  <li>Send Note on Email has been enabled for their account</li>
                  <li>You have attested for HIPAA compliance on their behalf</li>
                  <li>Their notes can now be sent via email to patients</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Details:</h5>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="font-medium">User:</span>
                <span>{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span>{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Setting:</span>
                <span>Send Note on Email</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className="text-green-600 font-semibold">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Attested By:</span>
                <span>Practice Manager</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function OverrideConfirmModal({ open, pendingSettingChange, selectedUser, onCancel, onConfirm }) {
  if (!open || !pendingSettingChange) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Override Default Setting</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{selectedUser?.name}</p>
              <p className="text-sm text-gray-600">Setting: {pendingSettingChange.settingName}</p>
            </div>
          </div>

          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded mb-4">
            <p className="text-sm text-orange-800 font-medium mb-2">
              You are about to change the default setting for this user.
            </p>
            <p className="text-sm text-orange-700 leading-relaxed">
              This will override the practice-wide default setting. The user will have a custom configuration different from other users.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {pendingSettingChange.isLockStateChange ? 'Practice Lock State:' : 'Practice Default:'}
              </span>
              <span className="text-sm text-gray-900 font-medium">
                {formatChangeValue(pendingSettingChange.defaultValue, pendingSettingChange.isLockStateChange)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {pendingSettingChange.isLockStateChange ? 'New Lock State:' : 'New User Value:'}
              </span>
              <span className="text-sm text-blue-700 font-medium">
                {formatChangeValue(pendingSettingChange.newValue, pendingSettingChange.isLockStateChange)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Confirm Override
          </button>
        </div>
      </div>
    </div>
  );
}

export function OverrideCleanupModal({ open, data, onCancel, onConfirm }) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Override Cleanup Required</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 mb-1">
                {data.isLockStateChange ? 'Lock State Change Detected' : 'Default Value Change Detected'}
              </p>
              <p className="text-sm text-gray-600">Setting: {data.settingName}</p>
            </div>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded mb-4">
            <p className="text-sm text-amber-800 font-medium mb-2">
              Some user overrides now match BOTH default value and lock state
            </p>
            <p className="text-sm text-amber-700 leading-relaxed">
              After this change, the following users will have overrides where BOTH the value and lock state match the practice-wide defaults.
              These redundant overrides will be automatically removed, and these users will inherit the practice-wide settings.
            </p>
            <p className="text-sm text-amber-700 leading-relaxed mt-2">
              <strong>Note:</strong> An override only exists when it differs from the default. Since both properties now match, the override is no longer needed.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {data.isLockStateChange ? 'Current Lock State:' : 'Current Default:'}
              </span>
              <span className="text-sm text-gray-900 font-medium">
                {formatChangeValue(data.oldDefault, data.isLockStateChange)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {data.isLockStateChange ? 'New Lock State:' : 'New Default:'}
              </span>
              <span className="text-sm text-blue-700 font-medium">
                {formatChangeValue(data.newDefault, data.isLockStateChange)}
              </span>
            </div>
          </div>

          {data.redundantOverrides.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-900 mb-3">
                Overrides to be removed ({data.redundantOverrides.length} user{data.redundantOverrides.length !== 1 ? 's' : ''}):
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.redundantOverrides.map((override, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{override.userName}</p>
                        <p className="text-xs text-gray-600">
                          Value: {Array.isArray(override.value) ? override.value.join(', ') : override.value}
                        </p>
                        <p className="text-xs text-gray-600">Lock: {formatLockStateDisplay(override.pmLockState)}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      Will be removed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Confirm & Remove Overrides
          </button>
        </div>
      </div>
    </div>
  );
}

export function OpsHideOverridesModal({ open, data, onCancel, onConfirm }) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Confirm: Hide Setting (Overrides Will Be Removed)</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-4">
            <p className="text-sm text-red-900 font-semibold mb-2">
              You are setting Ops Lock to <span className="font-bold">Locked (Hidden)</span>.
            </p>
            <p className="text-sm text-red-800 leading-relaxed">
              This will permanently remove existing doctor overrides for this setting so there are no hidden, still-effective overrides.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Setting:</span>
              <span className="text-sm text-gray-900 font-medium">{data.settingName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Overrides to remove:</span>
              <span className="text-sm text-red-700 font-medium">{data.overridesToRemove.length}</span>
            </div>
          </div>

          {data.overridesToRemove.length > 0 && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <p className="text-sm font-semibold text-red-900 mb-3">Affected doctors/users:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.overridesToRemove.map((o) => (
                  <div key={o.userId} className="flex items-center justify-between bg-white p-3 rounded border border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{o.userName}</p>
                        <p className="text-xs text-gray-600">Override will be removed</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Confirm & Remove Overrides
          </button>
        </div>
      </div>
    </div>
  );
}

export function OpsLockVisibleOverridesModal({ open, data, onCancel, onKeepOverrides, onRemoveAndLock }) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Ops Lock: Locked (Visible)</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
            <p className="text-sm text-amber-900 font-semibold mb-2">
              You are setting Ops Lock to <span className="font-bold">Locked (Visible)</span>.
            </p>
            <p className="text-sm text-amber-800 leading-relaxed">
              PM will still see this setting but cannot change defaults or manage overrides while it is Ops-locked.
              Existing doctor overrides can either be kept (and will reappear if Ops unlocks later) or removed now.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Setting:</span>
              <span className="text-sm text-gray-900 font-medium">{data.settingName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Existing overrides:</span>
              <span className="text-sm text-amber-700 font-medium">{data.overridesToRemove.length}</span>
            </div>
          </div>

          {data.overridesToRemove.length > 0 && (
            <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
              <p className="text-sm font-semibold text-amber-900 mb-3">Affected doctors/users:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.overridesToRemove.map((o) => (
                  <div key={o.userId} className="flex items-center justify-between bg-white p-3 rounded border border-amber-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{o.userName}</p>
                        <p className="text-xs text-gray-600">Override exists for this setting</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onKeepOverrides}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Keep overrides
          </button>
          <button
            onClick={onRemoveAndLock}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Remove overrides & lock
          </button>
        </div>
      </div>
    </div>
  );
}

