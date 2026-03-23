import React from 'react';
import { X } from 'lucide-react';

const secondaryRoleOptions = ['Nurse', 'Lab Technician', 'Medical Assistant', 'Phlebotomist', 'Radiology Technician'];

export function AddSecondaryAccountModal({
  open,
  newSecondaryAccount,
  onClose,
  onFieldChange,
  onTogglePermission,
  isPermissionEnabled,
  onAddAccount
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add Secondary Account</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Account Cost Information</p>
              <p className="text-sm text-blue-800 mt-1">
                Each secondary account costs <strong>$50 per month</strong>. This will be added to your monthly subscription.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <input
              type="text"
              value={newSecondaryAccount.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              placeholder="Enter full name"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
            <input
              type="text"
              list="role-suggestions"
              value={newSecondaryAccount.role}
              onChange={(e) => onFieldChange('role', e.target.value)}
              placeholder="Enter or select a role"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <datalist id="role-suggestions">
              {secondaryRoleOptions.map((role) => (
                <option key={role} value={role} />
              ))}
            </datalist>
            <p className="text-xs text-gray-500 mt-2">Select from suggestions or enter a custom role</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={newSecondaryAccount.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              placeholder="Enter email address"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h6 className="font-medium text-gray-800 text-sm">Account Permissions</h6>

            {[
              ['mergeAndLinkAppointments', 'Merge and Link Appointments', 'Can merge duplicate appointments and link consults to appointments.'],
              ['createConsults', 'Create Consults', 'Create consult cards. Create recordings and upload docs.'],
              ['canGenerateNotes', 'Can Generate Notes', 'Can generate notes from consults'],
              ['editGeneratedNotes', 'Edit Generated Notes', 'Can Modify Generated notes'],
              ['pushToEHR', 'Push to EHR', 'Can push generated notes to EHR']
            ].map(([key, label, desc]) => {
              const enabled = isPermissionEnabled(key);
              const checked = newSecondaryAccount.permissions[key];
              return (
                <div key={key} className={`flex items-center justify-between ${enabled ? '' : 'opacity-50'}`}>
                  <div>
                    <p className="font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <div
                    className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${
                      enabled
                        ? `cursor-pointer ${checked ? 'bg-green-500' : 'bg-gray-300'}`
                        : 'cursor-not-allowed bg-gray-300'
                    }`}
                    onClick={() => enabled && onTogglePermission(key, !checked)}
                  >
                    <div
                      className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                        checked && enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </div>
              );
            })}

            <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
              <strong>Dependencies:</strong> Edit Generated Notes requires "Can Generate Notes". Push to EHR requires both "Can Generate Notes" and "Edit Generated Notes".
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={onAddAccount}
            disabled={!newSecondaryAccount.name || !newSecondaryAccount.role || !newSecondaryAccount.email}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              newSecondaryAccount.name && newSecondaryAccount.role && newSecondaryAccount.email
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Add Account
          </button>
        </div>
      </div>
    </div>
  );
}

export function AddPrimaryAccountModal({
  open,
  allUsers,
  primaryAccountType,
  copyFromDoctorId,
  newPrimaryAccount,
  onClose,
  onAccountTypeChange,
  onCopyFromDoctorChange,
  onPrimaryFieldChange,
  onAddDoctor
}) {
  if (!open) return null;
  const primaryDoctors = allUsers.filter((user) => user.type === 'primary');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add Primary Account (Doctor)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Account Setup Method *</label>
            <div className="space-y-3">
              {[
                ['request', 'Request New Account', 'Create a brand new account with default settings and templates'],
                ['copy', 'Copy from Existing Doctor', 'Copy all settings, templates, and configurations from another doctor in your practice']
              ].map(([key, label, desc]) => (
                <button
                  key={key}
                  onClick={() => onAccountTypeChange(key)}
                  className={`w-full flex items-start gap-3 p-4 border-2 rounded-lg transition-all ${
                    primaryAccountType === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      primaryAccountType === key ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      {primaryAccountType === key && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                    </div>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">{label}</h4>
                    <p className="text-xs text-gray-600 mt-1">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {primaryAccountType === 'copy' && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor to Copy From *</label>
              <select
                value={copyFromDoctorId}
                onChange={(e) => onCopyFromDoctorChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
              >
                <option value="">Select a doctor...</option>
                {primaryDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialty}
                  </option>
                ))}
              </select>
              <p className="text-xs text-blue-700 mt-2">
                All settings, templates, and configurations will be copied from the selected doctor to the new account.
              </p>
            </div>
          )}

          {primaryAccountType && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900">Doctor Information</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={newPrimaryAccount.name}
                  onChange={(e) => onPrimaryFieldChange('name', e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialty *</label>
                <input
                  type="text"
                  value={newPrimaryAccount.specialty}
                  onChange={(e) => onPrimaryFieldChange('specialty', e.target.value)}
                  placeholder="Enter specialty"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={newPrimaryAccount.email}
                  onChange={(e) => onPrimaryFieldChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={onAddDoctor}
            disabled={
              !primaryAccountType ||
              !newPrimaryAccount.name ||
              !newPrimaryAccount.specialty ||
              !newPrimaryAccount.email ||
              (primaryAccountType === 'copy' && !copyFromDoctorId)
            }
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              primaryAccountType &&
              newPrimaryAccount.name &&
              newPrimaryAccount.specialty &&
              newPrimaryAccount.email &&
              (primaryAccountType !== 'copy' || copyFromDoctorId)
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Add Doctor
          </button>
        </div>
      </div>
    </div>
  );
}
