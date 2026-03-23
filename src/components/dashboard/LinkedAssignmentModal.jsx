import React from 'react';
import { X } from 'lucide-react';

export default function LinkedAssignmentModal({
  open,
  availableUsers,
  selectedUserData,
  selectedNewUser,
  newLinkAssignmentType,
  linkDateError,
  onClose,
  onSelectedUserChange,
  onAssignmentTypeChange,
  onSave
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add Linked Assignment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select assignee (Primary or Secondary)
            </label>
            <select
              value={selectedNewUser}
              onChange={(e) => onSelectedUserChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white hover:border-blue-300"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%232c3e50' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                paddingRight: '48px'
              }}
            >
              <option value="">Select a user...</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.role} ({user.type === 'primary' ? 'Primary' : 'Secondary'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment type
            </label>
            <select
              value={newLinkAssignmentType}
              onChange={(e) => onAssignmentTypeChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white hover:border-blue-300"
            >
              <option value="assistant">Acts as MA / Assistant</option>
              <option value="coverage">Doctor Coverage</option>
            </select>
          </div>

          {selectedUserData && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <p className="font-semibold text-gray-900">{selectedUserData.name}</p>
                <p className="text-sm text-gray-600">
                  {selectedUserData.role} • {selectedUserData.email} • {selectedUserData.type === 'primary' ? 'Primary' : 'Secondary'}
                </p>
              </div>
            </div>
          )}
          {linkDateError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {linkDateError}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!selectedUserData}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedUserData
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Save Assignment
          </button>
        </div>
      </div>
    </div>
  );
}
