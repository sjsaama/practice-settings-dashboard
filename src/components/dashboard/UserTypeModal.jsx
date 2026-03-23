import React from 'react';
import { Users, X } from 'lucide-react';

export default function UserTypeModal({
  open,
  onClose,
  onSelectPrimary,
  onSelectSecondary
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">Select the type of account you want to create:</p>

        <div className="space-y-3">
          <button
            onClick={onSelectPrimary}
            className="w-full flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <Users className="w-5 h-5 text-blue-600 group-hover:text-white" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-1">Primary Account (Doctor)</h4>
              <p className="text-xs text-gray-600">Add a new doctor to the practice. Request new account or copy settings from existing doctor.</p>
            </div>
          </button>

          <button
            onClick={onSelectSecondary}
            className="w-full flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors">
              <Users className="w-5 h-5 text-purple-600 group-hover:text-white" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-1">Secondary Account (Staff)</h4>
              <p className="text-xs text-gray-600">Add a nurse, assistant, or other staff member with customizable permissions.</p>
            </div>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
