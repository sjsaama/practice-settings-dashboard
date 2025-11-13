import React, { useState, useEffect } from 'react';
import { Settings, Users, ChevronRight, Search, Shield, X } from 'lucide-react';

const PracticeSettingsDashboard = () => {
  const [currentView, setCurrentView] = useState('settings');
  const [selectedModule, setSelectedModule] = useState('note-settings');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserView, setSelectedUserView] = useState('settings');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [showLinkAccountModal, setShowLinkAccountModal] = useState(false);
  const [showOverrideConfirmModal, setShowOverrideConfirmModal] = useState(false);
  const [pendingSettingChange, setPendingSettingChange] = useState(null);
  const [selectedNewUser, setSelectedNewUser] = useState('');
  const [linkStartDate, setLinkStartDate] = useState('');
  const [linkEndDate, setLinkEndDate] = useState('');
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [showGoogleSignoutModal, setShowGoogleSignoutModal] = useState(false);
  const [isZoomAppInstalled, setIsZoomAppInstalled] = useState(false);
  const [newUserPermissions, setNewUserPermissions] = useState({
    createConsults: true,
    canGenerateNotes: false,
    editGeneratedNotes: false,
    pushToEHR: false
  });

  // User-specific settings overrides - stores custom settings per user per setting
  const [userSettingsOverrides, setUserSettingsOverrides] = useState({});

  // Helper function to get user-specific setting or default
  const getUserSetting = (userId, moduleId, settingId) => {
    const key = `${userId}-${moduleId}-${settingId}`;
    return userSettingsOverrides[key];
  };

  // Helper function to set user-specific setting
  const setUserSetting = (userId, moduleId, settingId, property, value) => {
    const key = `${userId}-${moduleId}-${settingId}`;
    setUserSettingsOverrides(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [property]: value
      }
    }));
  };

  // Linked accounts state with permissions
  const [linkedAccounts, setLinkedAccounts] = useState([
    {
      id: 'lisa_parker',
      name: 'Lisa Parker, RN',
      role: 'Cardiology Nurse',
      email: 'lisa.parker@clinic.com',
      permissions: {
        createConsults: true,
        canGenerateNotes: false,
        editGeneratedNotes: false,
        pushToEHR: false
      }
    },
    {
      id: 'jennifer_walsh',
      name: 'Jennifer Walsh',
      role: 'Medical Assistant',
      email: 'jennifer.walsh@clinic.com',
      permissions: {
        createConsults: true,
        canGenerateNotes: true,
        editGeneratedNotes: true,
        pushToEHR: false
      }
    }
  ]);

  // Settings data structure - Complete with all settings
  const settingsModules = {
    'note-settings': {
      name: 'Note Settings',
      subtitle: 'Settings that affect your notes and other documents',
      settings: [
        {
          id: 1,
          name: 'Default Patient Pronoun',
          type: 'dropdown',
          options: ['He', 'She', 'They'],
          default: 'They',
          lockState: 'unlocked',
          subtext: ''
        },
        {
          id: 2,
          name: 'Patient Name',
          type: 'dropdown',
          options: ['As Entered', 'Infer from Audio', '"The Patient"'],
          default: 'As Entered',
          lockState: 'unlocked',
          subtexts: {
            'As Entered': 'AI will use the entered patient name',
            'Infer from Audio': 'AI will infer the patient name from the audio',
            '"The Patient"': 'AI will refer to the patient as "The patient"'
          }
        },
        {
          id: 3,
          name: 'Default Visit Type',
          type: 'dropdown',
          options: ['First Visit', 'Follow up'],
          default: 'Follow up',
          lockState: 'unlocked',
          subtext: ''
        },
        {
          id: 4,
          name: 'Default Note View',
          type: 'dropdown',
          options: ['Section View', 'Full Note View'],
          default: 'Full Note View',
          lockState: 'unlocked',
          subtexts: {
            'Section View': 'By default, notes will open in Section View, each section in its own text box',
            'Full Note View': 'By default, notes will open in Full Note View, everything in a single text box'
          }
        },
        {
          id: 5,
          name: 'Capture Dictation Separately',
          type: 'toggle',
          options: ['True', 'False'],
          default: 'False',
          lockState: 'unlocked',
          subtexts: {
            'True': 'A new section "Verbatim Dictation" will be inserted in the note',
            'False': 'Enable to insert a new section "Verbatim Dictation" to capture all dictation'
          }
        },
        {
          id: 6,
          name: 'Skip empty sections in Note',
          type: 'toggle',
          options: ['True', 'False'],
          default: 'True',
          lockState: 'unlocked',
          subtexts: {
            'True': '',
            'False': 'Enable to hide empty sections in your notes'
          }
        }
      ]
    },
    'controls': {
      name: 'Controls',
      subtitle: 'Settings that affect app behaviour',
      settings: [
        {
          id: 20,
          name: 'Timezone',
          type: 'dropdown',
          options: [
            'Eastern (America/New York)', 
            'Central (America/Chicago)', 
            'Mountain (America/Denver)', 
            'Pacific (America/Los Angeles)'
          ],
          default: 'Eastern (America/New York)',
          lockState: 'unlocked',
          subtext: '',
          required: true
        },
        {
          id: 21,
          name: '2-factor Authentication',
          type: 'toggle',
          options: ['True', 'False'],
          default: 'False',
          lockState: 'unlocked',
          subtexts: {
            'True': 'You will receive an OTP on email for every login in addition to your access code',
            'False': 'Enable to receive an OTP on email for every login in addition to your access code'
          }
        },
        {
          id: 22,
          name: 'Send Note on Email',
          type: 'toggle',
          options: ['True', 'False'],
          default: 'False',
          lockState: 'unlocked',
          subtexts: {
            'True': '',
            'False': 'Enable only if your email complies with Privacy and Data Protection laws'
          },
          requiresAttestation: true
        },
        {
          id: 23,
          name: 'Send Transcript in Email',
          type: 'toggle',
          options: ['True', 'False'],
          default: 'False',
          lockState: 'unlocked',
          subtext: '',
          dependency: 22
        },
        {
          id: 24,
          name: 'Play Recording Consent Disclaimer',
          type: 'toggle',
          options: ['True', 'False'],
          default: 'False',
          lockState: 'unlocked',
          subtexts: {
            'True': 'Recording consent disclaimer will play every time a new consult is started',
            'False': 'Enable to play a recording consent disclaimer before every consult'
          }
        },
        {
          id: 25,
          name: 'Delete Consults',
          type: 'dropdown',
          options: [
            '1 day', '2 days', '3 days', '4 days', '5 days', '6 days',
            '1 week', '2 weeks', '3 weeks',
            '1 month', '2 months', '3 months', '4 months',
            'Never'
          ],
          default: '1 month',
          lockState: 'unlocked',
          subtext: ''
        }
      ]
    },
    'em-settings': {
      name: 'E/M Settings',
      subtitle: 'Settings that affect E/M codes',
      settings: [
        {
          id: 41,
          name: 'Enabled Service Settings',
          type: 'multiselect',
          options: ['Outpatient', 'Inpatient', 'Emergency Services', 'Home Services', 'Nursing Facilities'],
          default: ['Outpatient'],
          lockState: 'unlocked',
          subtext: 'Choose all possible settings in which you may see patients using Marvix AI.'
        },
        {
          id: 42,
          name: 'Default Service Setting',
          type: 'dropdown',
          options: ['Outpatient', 'Inpatient', 'Emergency Services', 'Home Services', 'Nursing Facilities'],
          default: 'Outpatient',
          lockState: 'unlocked',
          subtext: 'This is the service setting that will be chosen by default',
          dependency: 41
        },
        {
          id: 43,
          name: 'Enable Preventive Medicine Service',
          type: 'toggle',
          options: ['True', 'False'],
          default: 'False',
          lockState: 'unlocked',
          subtexts: {
            'True': '',
            'False': 'Enable to see Preventive Visit (eg. Annual check up) as a consult option for E/M codes'
          }
        }
      ]
    },
    'ehr-settings': {
      name: 'EHR Settings',
      subtitle: 'Settings that control EHR integration and synchronization',
      settings: [
        {
          id: 71,
          name: 'Appointments Range',
          type: 'range-selector',
          options: ['1 day', '3 days', '7 days', '14 days', '21 days', '30 days', '45 days', '60 days', '90 days'],
          default: '30 days',
          lockState: 'unlocked',
          subtext: 'How far in the future should the appointments be pulled from the EHR / PMS / Calendar'
        },
        {
          id: 72,
          name: 'Appointments Order',
          type: 'order-list',
          options: ['Today', 'Tomorrow', 'Yesterday', 'Day After Tomorrow'],
          default: ['Today', 'Tomorrow', 'Yesterday'],
          lockState: 'unlocked',
          subtext: 'In which order should they show up in the "Link Appointment" popup? Drag to reorder'
        },
        {
          id: 73,
          name: 'Sync Appointments Daily',
          type: 'time-multiselect',
          options: [
            '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
            '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
            '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
            '5:00 PM'
          ],
          default: [],
          lockState: 'unlocked',
          subtext: '5am - 5pm (30min increments). Max 6 times'
        },
        {
          id: 74,
          name: 'Sync Now',
          type: 'button',
          options: [],
          default: '',
          lockState: 'unlocked',
          subtext: 'Manual sync trigger'
        },
        {
          id: 75,
          name: 'Auto-create Consult Cards',
          type: 'toggle',
          options: ['On', 'Off'],
          default: 'On',
          lockState: 'unlocked',
          subtext: 'Automatically create consultation cards for appointments'
        },
        {
          id: 76,
          name: 'Allow Subsequent Note Push',
          type: 'toggle',
          options: ['Yes', 'No'],
          default: 'Off',
          lockState: 'unlocked',
          subtext: 'Allow pushing updated notes to EHR after initial submission'
        },
        {
          id: 77,
          name: 'Push to EHR automatically',
          type: 'toggle',
          options: ['On', 'Off'],
          default: 'Off',
          lockState: 'unlocked',
          subtext: 'Automatically push completed notes to EHR system'
        }
      ]
    },
    'teleconsult-settings': {
      name: 'Teleconsult Settings',
      subtitle: 'Configure your teleconsult integrations',
      settings: [
        {
          id: 71,
          name: 'Google Calendar',
          type: 'google-signin',
          options: [],
          default: false,
          lockState: 'unlocked',
          subtext: 'This option is only visible to users who have signed up for "Google Calendar" as EHR.'
        },
        {
          id: 72,
          name: 'Zoom',
          type: 'zoom-check',
          options: [],
          default: false,
          lockState: 'unlocked',
          subtext: 'Connect Marvix app via Zoom marketplace. Consults via Zoom are not linked to an appointment - new consult is created.'
        }
      ]
    },
    'miscellaneous': {
      name: 'Miscellaneous',
      subtitle: '',
      settings: [
        {
          id: 61,
          name: 'Terms & Conditions',
          type: 'link',
          options: [],
          default: '',
          lockState: 'unlocked',
          subtext: ''
        },
        {
          id: 62,
          name: 'Privacy Policy',
          type: 'link',
          options: [],
          default: '',
          lockState: 'unlocked',
          subtext: ''
        }
      ]
    }
  };

  // All users data - both primary and secondary accounts
  const [allUsers, setAllUsers] = useState([
    { id: 1, name: 'Dr. Sarah Johnson', type: 'primary', specialty: 'Cardiology', email: 'sarah.johnson@clinic.com', permissions: { createConsults: true, canGenerateNotes: true, editGeneratedNotes: true, pushToEHR: true } },
    { id: 2, name: 'Dr. Michael Chen', type: 'primary', specialty: 'Neurology', email: 'michael.chen@clinic.com', permissions: { createConsults: true, canGenerateNotes: true, editGeneratedNotes: true, pushToEHR: true } },
    { id: 3, name: 'Dr. Emily Rodriguez', type: 'primary', specialty: 'Pediatrics', email: 'emily.rodriguez@clinic.com', permissions: { createConsults: true, canGenerateNotes: true, editGeneratedNotes: true, pushToEHR: true } },
    { id: 4, name: 'Dr. James Wilson', type: 'primary', specialty: 'Orthopedics', email: 'james.wilson@clinic.com', permissions: { createConsults: true, canGenerateNotes: true, editGeneratedNotes: true, pushToEHR: true } },
    { id: 5, name: 'Dr. Lisa Thompson', type: 'primary', specialty: 'Dermatology', email: 'lisa.thompson@clinic.com', permissions: { createConsults: true, canGenerateNotes: true, editGeneratedNotes: true, pushToEHR: true } },
    { id: 'sec1', name: 'Lisa Parker', type: 'secondary', role: 'Nurse', email: 'lisa.parker@clinic.com', permissions: { createConsults: true, canGenerateNotes: false, editGeneratedNotes: false, pushToEHR: false } },
    { id: 'sec2', name: 'Alex Johnson', type: 'secondary', role: 'Lab Technician', email: 'alex.johnson@clinic.com', permissions: { createConsults: true, canGenerateNotes: false, editGeneratedNotes: false, pushToEHR: false } }
  ]);

  const [showAddSecondaryAccountModal, setShowAddSecondaryAccountModal] = useState(false);
  const [newSecondaryAccount, setNewSecondaryAccount] = useState({
    name: '',
    role: '',
    email: '',
    permissions: {
      createConsults: true,
      canGenerateNotes: false,
      editGeneratedNotes: false,
      pushToEHR: false
    }
  });

  const [moduleSettings, setModuleSettings] = useState(settingsModules);

  const updateSettingState = (moduleId, settingId, property, value) => {
    setModuleSettings(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        settings: prev[moduleId].settings.map(setting => 
          setting.id === settingId ? { ...setting, [property]: value } : setting
        )
      }
    }));
  };

  // Helper functions for settings logic
  const getSetting = (moduleId, settingId) => {
    return moduleSettings[moduleId]?.settings.find(s => s.id === settingId);
  };

  const isSettingEnabled = (setting) => {
    if (!setting.dependency) return true;

    const dependentSetting = Object.values(moduleSettings)
      .flatMap(module => module.settings)
      .find(s => s.id === setting.dependency);

    // Handle toggle dependencies (default is 'True' or 'False')
    if (dependentSetting?.default === 'True') return true;

    // Handle multiselect dependencies (default is an array)
    // For setting 42 depending on 41, it's enabled if 41 has at least one option selected
    if (setting.dependency === 41 && Array.isArray(dependentSetting?.default)) {
      return dependentSetting.default.length > 0;
    }

    return false;
  };

  const getAvailableOptions = (setting) => {
    if (setting.dependency === 41) {
      // Get enabled services from setting 41
      const enabledServicesSetting = Object.values(moduleSettings)
        .flatMap(module => module.settings)
        .find(s => s.id === 41);
      return enabledServicesSetting?.default || [];
    }
    return setting.options;
  };

  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.specialty && user.specialty.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Reset user view when user changes
  useEffect(() => {
    if (selectedUser) {
      setSelectedUserView(selectedUser.type === 'secondary' ? 'permissions' : 'settings');
    }
  }, [selectedUser?.id]);

  // Modal Components
  const EmailAttestationModal = () => (
    showEmailModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Email Compliance Attestation</h3>
            <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mb-6">
            <p className="text-sm text-gray-600 leading-relaxed">
              I attest that my email is HIPAA and HITECH Compliant
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowEmailModal(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                updateSettingState('controls', 22, 'default', 'True');
                setShowEmailModal(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              I Attest
            </button>
          </div>
        </div>
      </div>
    )
  );

  const SuspendAccountModal = () => (
    showSuspendModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Account Suspension</h3>
            <button onClick={() => setShowSuspendModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedUser?.name}</p>
                <p className="text-sm text-gray-600">{selectedUser?.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Are you sure you want to suspend this user's account? They will immediately lose access to the system and won't be able to log in until the account is reactivated.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowSuspendModal(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowSuspendModal(false);
                alert('Account suspended successfully!');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Suspend Account
            </button>
          </div>
        </div>
      </div>
    )
  );

  const ResetPinModal = () => (
    showResetPinModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">PIN Reset Confirmation</h3>
            <button onClick={() => setShowResetPinModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">PIN Reset Successful</p>
                <p className="text-sm text-gray-600">{selectedUser?.name}</p>
              </div>
            </div>
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <p className="text-sm text-green-800 leading-relaxed">
                Reset code instructions have been sent to <strong>{selectedUser?.email}</strong>.
                The user will receive a temporary PIN and will be required to set a new PIN on their next login.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setShowResetPinModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  );

  const OverrideConfirmModal = () => (
    showOverrideConfirmModal && pendingSettingChange && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Override Default Setting</h3>
            <button
              onClick={() => {
                setShowOverrideConfirmModal(false);
                setPendingSettingChange(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
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
                  {Array.isArray(pendingSettingChange.defaultValue)
                    ? pendingSettingChange.defaultValue.join(', ')
                    : pendingSettingChange.isLockStateChange
                      ? pendingSettingChange.defaultValue === 'unlocked'
                        ? 'Unlocked'
                        : pendingSettingChange.defaultValue === 'locked-visible'
                          ? 'Locked (Visible)'
                          : 'Locked (Hidden)'
                      : pendingSettingChange.defaultValue}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {pendingSettingChange.isLockStateChange ? 'New Lock State:' : 'New User Value:'}
                </span>
                <span className="text-sm text-blue-700 font-medium">
                  {Array.isArray(pendingSettingChange.newValue)
                    ? pendingSettingChange.newValue.join(', ')
                    : pendingSettingChange.isLockStateChange
                      ? pendingSettingChange.newValue === 'unlocked'
                        ? 'Unlocked'
                        : pendingSettingChange.newValue === 'locked-visible'
                          ? 'Locked (Visible)'
                          : 'Locked (Hidden)'
                      : pendingSettingChange.newValue}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowOverrideConfirmModal(false);
                setPendingSettingChange(null);
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (pendingSettingChange) {
                  const propertyToUpdate = pendingSettingChange.isLockStateChange ? 'lockState' : 'value';
                  setUserSetting(
                    pendingSettingChange.userId,
                    pendingSettingChange.moduleId,
                    pendingSettingChange.settingId,
                    propertyToUpdate,
                    pendingSettingChange.newValue
                  );
                }
                setShowOverrideConfirmModal(false);
                setPendingSettingChange(null);
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Confirm Override
            </button>
          </div>
        </div>
      </div>
    )
  );

  const GoogleSignoutConfirmModal = () => (
    showGoogleSignoutModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Sign Out</h3>
            <button
              onClick={() => setShowGoogleSignoutModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mb-6">
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded mb-4">
              <p className="text-sm text-orange-800 leading-relaxed">
                Are you sure you want to sign out from Google Calendar? This will disconnect the integration and you won't be able to sync calendar events until you sign in again.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowGoogleSignoutModal(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsGoogleSignedIn(false);
                setShowGoogleSignoutModal(false);
                updateSettingState('teleconsult-settings', 71, 'default', false);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  );

  const AddSecondaryAccountModal = () => {
    const roleOptions = ['Nurse', 'Lab Technician', 'Medical Assistant', 'Phlebotomist', 'Radiology Technician'];

    const updateSecondaryPermission = (permission, value) => {
      setNewSecondaryAccount(prev => {
        const updated = { ...prev, permissions: { ...prev.permissions, [permission]: value } };

        // Handle dependencies
        if (permission === 'canGenerateNotes' && !value) {
          updated.permissions.editGeneratedNotes = false;
          updated.permissions.pushToEHR = false;
        } else if (permission === 'editGeneratedNotes' && !value) {
          updated.permissions.pushToEHR = false;
        }

        return updated;
      });
    };

    const isPermissionEnabled = (permission) => {
      switch (permission) {
        case 'createConsults':
          return true;
        case 'canGenerateNotes':
          return true;
        case 'editGeneratedNotes':
          return newSecondaryAccount.permissions.canGenerateNotes;
        case 'pushToEHR':
          return newSecondaryAccount.permissions.canGenerateNotes && newSecondaryAccount.permissions.editGeneratedNotes;
        default:
          return false;
      }
    };

    const handleAddAccount = () => {
      if (!newSecondaryAccount.name || !newSecondaryAccount.role || !newSecondaryAccount.email) {
        alert('Please fill in all fields');
        return;
      }

      const newAccount = {
        id: `sec${Date.now()}`,
        name: newSecondaryAccount.name,
        type: 'secondary',
        role: newSecondaryAccount.role,
        email: newSecondaryAccount.email,
        permissions: { ...newSecondaryAccount.permissions }
      };

      setAllUsers(prev => [...prev, newAccount]);
      setShowAddSecondaryAccountModal(false);
      setNewSecondaryAccount({
        name: '',
        role: '',
        email: '',
        permissions: {
          createConsults: true,
          canGenerateNotes: false,
          editGeneratedNotes: false,
          pushToEHR: false
        }
      });
    };

    if (!showAddSecondaryAccountModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Add Secondary Account</h3>
            <button onClick={() => setShowAddSecondaryAccountModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cost Notification */}
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
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={newSecondaryAccount.name}
                onChange={(e) => setNewSecondaryAccount(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <input
                type="text"
                list="role-suggestions"
                value={newSecondaryAccount.role}
                onChange={(e) => setNewSecondaryAccount(prev => ({ ...prev, role: e.target.value }))}
                placeholder="Enter or select a role"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <datalist id="role-suggestions">
                {roleOptions.map(role => (
                  <option key={role} value={role} />
                ))}
              </datalist>
              <p className="text-xs text-gray-500 mt-2">
                Select from suggestions or enter a custom role
              </p>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={newSecondaryAccount.email}
                onChange={(e) => setNewSecondaryAccount(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Permission Settings */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h6 className="font-medium text-gray-800 text-sm">Account Permissions</h6>

              {/* Create Consults */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Create Consults</p>
                  <p className="text-xs text-gray-500">Create consult cards. Create recordings and upload docs.</p>
                </div>
                <div
                  className={`relative w-12 h-7 rounded-full cursor-pointer transition-colors duration-300 ${
                    newSecondaryAccount.permissions.createConsults ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  onClick={() => updateSecondaryPermission('createConsults', !newSecondaryAccount.permissions.createConsults)}
                >
                  <div
                    className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                      newSecondaryAccount.permissions.createConsults ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </div>

              {/* Can Generate Notes */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Can Generate Notes</p>
                  <p className="text-xs text-gray-500">Can generate notes from consults</p>
                </div>
                <div
                  className={`relative w-12 h-7 rounded-full cursor-pointer transition-colors duration-300 ${
                    newSecondaryAccount.permissions.canGenerateNotes ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  onClick={() => updateSecondaryPermission('canGenerateNotes', !newSecondaryAccount.permissions.canGenerateNotes)}
                >
                  <div
                    className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                      newSecondaryAccount.permissions.canGenerateNotes ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </div>

              {/* Edit Generated Notes */}
              <div className={`flex items-center justify-between ${!isPermissionEnabled('editGeneratedNotes') ? 'opacity-50' : ''}`}>
                <div>
                  <p className="font-medium text-gray-700">Edit Generated Notes</p>
                  <p className="text-xs text-gray-500">Can Modify Generated notes</p>
                </div>
                <div
                  className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${
                    isPermissionEnabled('editGeneratedNotes')
                      ? 'cursor-pointer' + (newSecondaryAccount.permissions.editGeneratedNotes ? ' bg-green-500' : ' bg-gray-300')
                      : 'cursor-not-allowed bg-gray-300'
                  }`}
                  onClick={() => isPermissionEnabled('editGeneratedNotes') && updateSecondaryPermission('editGeneratedNotes', !newSecondaryAccount.permissions.editGeneratedNotes)}
                >
                  <div
                    className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                      newSecondaryAccount.permissions.editGeneratedNotes && isPermissionEnabled('editGeneratedNotes') ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </div>

              {/* Push to EHR */}
              <div className={`flex items-center justify-between ${!isPermissionEnabled('pushToEHR') ? 'opacity-50' : ''}`}>
                <div>
                  <p className="font-medium text-gray-700">Push to EHR</p>
                  <p className="text-xs text-gray-500">Can push generated notes to EHR</p>
                </div>
                <div
                  className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${
                    isPermissionEnabled('pushToEHR')
                      ? 'cursor-pointer' + (newSecondaryAccount.permissions.pushToEHR ? ' bg-green-500' : ' bg-gray-300')
                      : 'cursor-not-allowed bg-gray-300'
                  }`}
                  onClick={() => isPermissionEnabled('pushToEHR') && updateSecondaryPermission('pushToEHR', !newSecondaryAccount.permissions.pushToEHR)}
                >
                  <div
                    className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                      newSecondaryAccount.permissions.pushToEHR && isPermissionEnabled('pushToEHR') ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                <strong>Dependencies:</strong> Edit Generated Notes requires "Can Generate Notes". Push to EHR requires both "Can Generate Notes" and "Edit Generated Notes".
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={() => setShowAddSecondaryAccountModal(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAccount}
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
  };

  const LinkAccountModal = () => {
    const availableUsers = [
      { id: 'nurse1', name: 'Lisa Parker, RN', role: 'Cardiology Nurse', email: 'lisa.parker@clinic.com' },
      { id: 'nurse2', name: 'Michael Torres, RN', role: 'ICU Nurse', email: 'michael.torres@clinic.com' },
      { id: 'nurse3', name: 'Sarah Kim, RN', role: 'Pediatric Nurse', email: 'sarah.kim@clinic.com' },
      { id: 'assistant1', name: 'Jennifer Walsh', role: 'Medical Assistant', email: 'jennifer.walsh@clinic.com' },
      { id: 'assistant2', name: 'David Chen', role: 'Clinical Assistant', email: 'david.chen@clinic.com' },
      { id: 'assistant3', name: 'Maria Rodriguez', role: 'Administrative Assistant', email: 'maria.rodriguez@clinic.com' },
      { id: 'pa1', name: 'Dr. Amanda Foster, PA-C', role: 'Physician Assistant', email: 'amanda.foster@clinic.com' },
      { id: 'np1', name: 'Dr. Robert Taylor, NP', role: 'Nurse Practitioner', email: 'robert.taylor@clinic.com' },
      { id: 'tech1', name: 'Alex Johnson', role: 'Medical Technician', email: 'alex.johnson@clinic.com' },
      { id: 'tech2', name: 'Emily Brown', role: 'Lab Technician', email: 'emily.brown@clinic.com' }
    ];

    const selectedUserData = availableUsers.find(u => u.id === selectedNewUser);

    const updateNewUserPermission = (permission, value) => {
      setNewUserPermissions(prev => {
        const updated = { ...prev, [permission]: value };
        
        // Handle dependencies
        if (permission === 'canGenerateNotes' && !value) {
          // If disabling canGenerateNotes, also disable dependent permissions
          updated.editGeneratedNotes = false;
          updated.pushToEHR = false;
        } else if (permission === 'editGeneratedNotes' && !value) {
          // If disabling editGeneratedNotes, also disable pushToEHR
          updated.pushToEHR = false;
        }
        
        return updated;
      });
    };

    const isPermissionEnabled = (permission) => {
      switch (permission) {
        case 'createConsults':
          return true; // Always available
        case 'canGenerateNotes':
          return true; // Always available
        case 'editGeneratedNotes':
          return newUserPermissions.canGenerateNotes; // Depends on canGenerateNotes
        case 'pushToEHR':
          return newUserPermissions.canGenerateNotes && newUserPermissions.editGeneratedNotes; // Depends on both
        default:
          return false;
      }
    };

    const handleLinkAccount = () => {
      if (!selectedUserData || !linkStartDate || !linkEndDate) return;

      const newAccount = {
        id: selectedUserData.id,
        name: selectedUserData.name,
        role: selectedUserData.role,
        email: selectedUserData.email,
        permissions: { ...newUserPermissions },
        linkedToDoctorId: selectedUser.id,
        linkedToDoctorName: selectedUser.name,
        startDate: linkStartDate,
        endDate: linkEndDate
      };

      setLinkedAccounts(prev => [...prev, newAccount]);
      setShowLinkAccountModal(false);
      setSelectedNewUser('');
      setLinkStartDate('');
      setLinkEndDate('');
      setNewUserPermissions({
        createConsults: true,
        canGenerateNotes: false,
        editGeneratedNotes: false,
        pushToEHR: false
      });
    };

    if (!showLinkAccountModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Link New Secondary Account</h3>
            <button onClick={() => setShowLinkAccountModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select user to link
              </label>
              <select
                value={selectedNewUser}
                onChange={(e) => setSelectedNewUser(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white hover:border-blue-300"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%232c3e50' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                  paddingRight: '48px'
                }}
              >
                <option value="">Select a user...</option>
                {availableUsers
                  .filter(user => !linkedAccounts.some(linked => linked.id === user.id))
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.role}
                    </option>
                  ))}
              </select>
            </div>

            {selectedUserData && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="mb-4">
                  <p className="font-semibold text-gray-900">{selectedUserData.name}</p>
                  <p className="text-sm text-gray-600">{selectedUserData.role} • {selectedUserData.email}</p>
                </div>

                {/* Time Range Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={linkStartDate}
                      onChange={(e) => setLinkStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={linkEndDate}
                      onChange={(e) => setLinkEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={() => setShowLinkAccountModal(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLinkAccount}
              disabled={!selectedUserData || !linkStartDate || !linkEndDate}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedUserData && linkStartDate && linkEndDate
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Link Account
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Setting Row Component
  const SettingRow = ({ setting, moduleId, showUserOverride = false, userId = null }) => {
    const isEnabled = isSettingEnabled(setting);
    const availableOptions = getAvailableOptions(setting);

    // Get user-specific setting if it exists
    const userSetting = userId ? getUserSetting(userId, moduleId, setting.id) : null;
    const hasUserOverride = userSetting && userSetting.value !== undefined;
    const userLockState = userSetting?.lockState || setting.lockState;
    const effectiveValue = hasUserOverride ? userSetting.value : setting.default;
    
    const getDisplaySubtext = () => {
      if (setting.subtexts && setting.default) {
        return setting.subtexts[setting.default] || setting.subtext || '';
      }
      return setting.subtext || '';
    };

    const renderFormControl = (isUserOverride = false, targetUserId = null) => {
      const value = isUserOverride ? effectiveValue : setting.default;

      const handleChange = (newValue) => {
        if (isUserOverride && targetUserId) {
          // Check if this is a new override or if the value is different from practice default
          const currentUserSetting = getUserSetting(targetUserId, moduleId, setting.id);
          const isNewOverride = !currentUserSetting || currentUserSetting.value === undefined;
          const isDifferentFromDefault = newValue !== setting.default;

          if ((isNewOverride || isDifferentFromDefault) && newValue !== setting.default) {
            // Show confirmation modal
            setPendingSettingChange({
              userId: targetUserId,
              moduleId,
              settingId: setting.id,
              settingName: setting.name,
              newValue,
              defaultValue: setting.default
            });
            setShowOverrideConfirmModal(true);
          } else {
            // If setting back to default, just apply it
            setUserSetting(targetUserId, moduleId, setting.id, 'value', newValue);
          }
        } else {
          updateSettingState(moduleId, setting.id, 'default', newValue);
        }
      };
      
      switch (setting.type) {
        case 'toggle':
          const isToggleOn = value === 'True';
          return (
            <div
              className={`relative w-12 h-7 rounded-full cursor-pointer transition-colors duration-300 ${
                isToggleOn ? 'bg-green-500' : 'bg-gray-300'
              } ${!isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!isEnabled) return;

                if (setting.requiresAttestation && !isToggleOn && !isUserOverride) {
                  setShowEmailModal(true);
                } else {
                  const newValue = isToggleOn ? 'False' : 'True';
                  handleChange(newValue);
                }
              }}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                  isToggleOn ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          );

        case 'range-selector':
          return (
            <div className="space-y-4">
              <select
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white hover:border-blue-300"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%232c3e50' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                  paddingRight: '48px'
                }}
              >
                {setting.options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <div className="text-sm text-gray-500">
                Current range: Today to {value === '1 day' ? 'Tomorrow' : `${value} from today`}
              </div>
            </div>
          );

        case 'order-list':
          const orderItems = Array.isArray(value) ? value : setting.default;
          return (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm text-gray-600 mb-3">Drag to reorder appointment display</p>
                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    <div key={item} className="flex items-center gap-3 p-3 bg-white rounded border hover:shadow-sm transition-shadow">
                      <div className="cursor-move text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/>
                        </svg>
                      </div>
                      <span className="flex-1 font-medium">{item}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          #{index + 1}
                        </span>
                        {index > 0 && (
                          <button
                            onClick={() => {
                              const newOrder = [...orderItems];
                              [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                              handleChange(newOrder);
                            }}
                            className="text-gray-400 hover:text-blue-600 p-1"
                            title="Move up"
                          >
                            ↑
                          </button>
                        )}
                        {index < orderItems.length - 1 && (
                          <button
                            onClick={() => {
                              const newOrder = [...orderItems];
                              [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                              handleChange(newOrder);
                            }}
                            className="text-gray-400 hover:text-blue-600 p-1"
                            title="Move down"
                          >
                            ↓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  This order determines how appointments appear in the "Link Appointment" popup
                </div>
              </div>
            </div>
          );

        case 'time-multiselect':
          const selectedTimes = Array.isArray(value) ? value : [];
          const maxSelections = 6;
          
          return (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-2">
                Select up to {maxSelections} sync times (selected: {selectedTimes.length}/{maxSelections})
              </div>
              
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                {setting.options.map(time => {
                  const isSelected = selectedTimes.includes(time);
                  const canSelect = selectedTimes.length < maxSelections || isSelected;
                  
                  return (
                    <label 
                      key={time} 
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                          : canSelect
                            ? 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                            : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (!canSelect && !isSelected) return;
                          
                          let newTimes;
                          if (e.target.checked) {
                            newTimes = [...selectedTimes, time];
                          } else {
                            newTimes = selectedTimes.filter(t => t !== time);
                          }
                          updateSettingState(moduleId, setting.id, 'default', newTimes);
                        }}
                        className="w-3 h-3"
                        disabled={!canSelect && !isSelected}
                      />
                      <span className="text-xs">{time}</span>
                    </label>
                  );
                })}
              </div>
              
              {selectedTimes.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <div className="text-xs text-blue-700">
                    Selected times: {selectedTimes.join(', ')}
                  </div>
                </div>
              )}
            </div>
          );

        case 'button':
          return (
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Simulate sync operation
                  const button = document.querySelector(`#sync-btn-${setting.id}`);
                  if (button) {
                    button.textContent = 'Syncing...';
                    button.disabled = true;
                    setTimeout(() => {
                      button.textContent = 'Sync Now';
                      button.disabled = false;
                      alert('EHR sync completed successfully!');
                    }, 2000);
                  }
                }}
                id={`sync-btn-${setting.id}`}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Now
              </button>
              <div className="text-xs text-gray-500">
                Last sync: Never
              </div>
            </div>
          );
        
        case 'dropdown':
          const dropdownOptions = setting.dependency === 41 ? availableOptions : setting.options;
          // Ensure the current value is in the available options for dependent dropdowns
          const needsDefaultUpdate = setting.dependency === 41 && !availableOptions.includes(value) && availableOptions.length > 0;

          // Auto-update to first available option if current value is not in available options
          if (needsDefaultUpdate) {
            handleChange(availableOptions[0]);
          }

          return (
            <select
              value={needsDefaultUpdate ? availableOptions[0] : value}
              onChange={(e) => handleChange(e.target.value)}
              className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white hover:border-blue-300`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%232c3e50' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                paddingRight: '48px'
              }}
            >
              {dropdownOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        
        case 'multiselect':
          const selectedValues = Array.isArray(value) ? value : [value];
          return (
            <div className="space-y-3">
              {setting.options.map(option => {
                const isChecked = selectedValues.includes(option);
                const canUncheck = selectedValues.length > 1 || !isChecked;
                const isDefault = setting.id === 41 && getSetting(moduleId, 42)?.default === option;
                const isDisabled = !isEnabled || (isDefault && isChecked); // Disable if it's the default option

                return (
                  <label key={option} className={`flex items-center gap-3 ${isDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (!canUncheck && !e.target.checked) {
                          return; // Prevent unchecking last item
                        }
                        if (isDefault && !e.target.checked) {
                          return; // Prevent unchecking default service
                        }

                        let newValues;
                        if (e.target.checked) {
                          newValues = [...selectedValues, option];
                        } else {
                          newValues = selectedValues.filter(v => v !== option);
                        }
                        updateSettingState(moduleId, setting.id, 'default', newValues);
                      }}
                      className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                      disabled={isDisabled}
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                    {isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Default</span>
                    )}
                  </label>
                );
              })}
              {selectedValues.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <div className="text-xs text-blue-700">
                    Selected: {selectedValues.join(', ')}
                  </div>
                </div>
              )}
            </div>
          );
        
        case 'link':
          return (
            <input
              type="url"
              placeholder="Enter URL"
              value={value}
              onChange={(e) => updateSettingState(moduleId, setting.id, 'default', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-blue-300"
            />
          );

        case 'google-signin':
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {isGoogleSignedIn ? (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">Connected to Google Calendar</span>
                    </div>
                    <button
                      onClick={() => setShowGoogleSignoutModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      // Simulate Google sign-in
                      setIsGoogleSignedIn(true);
                      updateSettingState(moduleId, setting.id, 'default', true);
                    }}
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-3 shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </button>
                )}
              </div>
            </div>
          );

        case 'zoom-check':
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {isZoomAppInstalled ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-blue-800">Marvix app is installed on Zoom</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-orange-800">Marvix app not detected on Zoom</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    // Simulate checking Zoom app installation
                    setIsZoomAppInstalled(!isZoomAppInstalled);
                    updateSettingState(moduleId, setting.id, 'default', !isZoomAppInstalled);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {isZoomAppInstalled ? 'Refresh Status' : 'Check Installation'}
                </button>
              </div>
              {!isZoomAppInstalled && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <p className="text-sm text-blue-800">
                    Connect the Marvix app via <a href="https://marketplace.zoom.us" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-900">Zoom Marketplace</a>
                  </p>
                </div>
              )}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8 transition-all duration-200 hover:shadow-md ${
        !isEnabled ? 'opacity-50' : ''
      }`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{setting.name}</h3>
              {setting.required && <span className="text-red-500 text-sm font-medium">*</span>}
              {(showUserOverride ? userLockState : setting.lockState) === 'locked-visible' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                  🔒 Locked by Practice
                </span>
              )}
              {(showUserOverride ? userLockState : setting.lockState) === 'locked-hidden' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                  👁️‍🗨️ Hidden
                </span>
              )}
              {showUserOverride && hasUserOverride && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                  ⚠️ Custom Value
                </span>
              )}
            </div>
          </div>

          {/* Show lock controls based on view */}
          {(currentView === 'settings' || showUserOverride) && (
            <div className="flex items-center gap-2 ml-6">
              <label className="text-xs font-medium text-gray-600 mr-2">Lock:</label>
              <select
                value={showUserOverride ? userLockState : setting.lockState}
                onChange={(e) => {
                  if (showUserOverride && userId) {
                    const newLockState = e.target.value;
                    const currentUserSetting = getUserSetting(userId, moduleId, setting.id);
                    const isNewOverride = !currentUserSetting || currentUserSetting.lockState === undefined;
                    const isDifferentFromDefault = newLockState !== setting.lockState;

                    if ((isNewOverride || isDifferentFromDefault) && newLockState !== setting.lockState) {
                      // Show confirmation modal for lock state change
                      setPendingSettingChange({
                        userId: userId,
                        moduleId,
                        settingId: setting.id,
                        settingName: setting.name,
                        newValue: newLockState,
                        defaultValue: setting.lockState,
                        isLockStateChange: true
                      });
                      setShowOverrideConfirmModal(true);
                    } else {
                      // If setting back to default, just apply it
                      setUserSetting(userId, moduleId, setting.id, 'lockState', newLockState);
                    }
                  } else {
                    updateSettingState(moduleId, setting.id, 'lockState', e.target.value);
                  }
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="unlocked">Unlocked</option>
                <option value="locked-visible">Locked (Visible)</option>
                <option value="locked-hidden">Locked (Hidden)</option>
              </select>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-start gap-4 mb-4">
              <label className="text-sm font-medium text-gray-700 min-w-16 mt-2">{showUserOverride ? "User Value:" : "Default:"}</label>
              <div className="flex-1">
                {showUserOverride ? (
                  <div className="space-y-4">
                    {/* Show default value for reference */}
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Practice Default:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {Array.isArray(setting.default) ? setting.default.join(', ') : setting.default}
                        </span>
                      </div>
                    </div>

                    {/* User override selector */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`override-${setting.id}`}
                          checked={hasUserOverride}
                          onChange={(e) => {
                            if (!e.target.checked) {
                              // Remove override - use default
                              setUserSetting(userId, moduleId, setting.id, 'value', undefined);
                            } else {
                              // Enable override - set to current default value
                              setUserSetting(userId, moduleId, setting.id, 'value', setting.default);
                            }
                          }}
                          disabled={userLockState === 'locked-visible'}
                          className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`override-${setting.id}`} className="text-sm font-medium text-gray-700">
                          Use custom value for this user
                        </label>
                      </div>

                      {hasUserOverride && (
                        <div className="pl-7">
                          <div className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded mb-3">
                            <p className="text-xs text-orange-800 font-medium">
                              ⚠️ You are overriding the practice default for this user
                            </p>
                          </div>
                          <div className="mt-3">
                            {renderFormControl(true, userId)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  renderFormControl()
                )}
              </div>
            </div>
          </div>
        </div>

        {getDisplaySubtext() && (
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
            <p className="text-sm text-blue-800 leading-relaxed">
              {getDisplaySubtext()}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Main Left Navigation Component
  const LeftNavigation = () => (
    <div className="w-72 bg-gray-50 border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Practice Settings</h2>
        <p className="text-sm text-gray-600 mt-1">Manage settings and users</p>
      </div>
      
      <nav className="p-4">
        <div className="space-y-2">
          <button
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'settings' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>

          {currentView === 'settings' && (
            <div className="ml-6 space-y-1 border-l-2 border-gray-200 pl-4">
              {Object.entries(moduleSettings).map(([key, module]) => (
                <button
                  key={key}
                  onClick={() => setSelectedModule(key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedModule === key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <span>{module.name}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setCurrentView('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'users' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" />
            User Management
          </button>
        </div>
      </nav>
    </div>
  );

  // Settings View Component
  const SettingsView = () => (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {moduleSettings[selectedModule]?.name}
              </h1>
              {moduleSettings[selectedModule]?.subtitle && (
                <p className="text-gray-600 text-lg">{moduleSettings[selectedModule].subtitle}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {moduleSettings[selectedModule]?.settings.map(setting => (
            <SettingRow
              key={setting.id}
              setting={setting}
              moduleId={selectedModule}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // User Management View Component
  const UserManagementView = () => {
    const updateUserPermission = (userId, permission, value) => {
      setAllUsers(prev => prev.map(user => {
        if (user.id !== userId) return user;

        const updated = { ...user };
        updated.permissions = { ...user.permissions, [permission]: value };

        // Handle dependencies
        if (permission === 'canGenerateNotes' && !value) {
          updated.permissions.editGeneratedNotes = false;
          updated.permissions.pushToEHR = false;
        } else if (permission === 'editGeneratedNotes' && !value) {
          updated.permissions.pushToEHR = false;
        }

        return updated;
      }));
    };

    if (!selectedUser) {
      return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <button
                onClick={() => setShowAddSecondaryAccountModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Add Secondary Account
              </button>
            </div>

            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by name, specialty, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid gap-6">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg cursor-pointer transition-all duration-200 hover:border-blue-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                        {user.type === 'primary' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Primary
                          </span>
                        )}
                        {user.type === 'secondary' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Secondary
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-blue-600 font-medium">{user.specialty || user.role}</p>
                      <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                    </div>
                    <div className="text-blue-600">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // When user is selected - show user detail view
    return (
      <div className="flex-1 min-h-screen">
        {/* Top Navigation */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
          <div className="mb-6">
            <button
              onClick={() => setSelectedUser(null)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors mb-3"
            >
              ← Back to Users
            </button>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{selectedUser.name}</h3>
              <p className="text-sm text-blue-600 font-medium">{selectedUser.specialty} • {selectedUser.email}</p>
            </div>
          </div>
          
          <nav className="flex space-x-1">
            {selectedUser.type === 'secondary' && (
              <button
                onClick={() => setSelectedUserView('permissions')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedUserView === 'permissions'
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Permissions
                </div>
              </button>
            )}

            {selectedUser.type === 'primary' && (
              <button
                onClick={() => setSelectedUserView('settings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedUserView === 'settings'
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </div>
              </button>
            )}

            <button
              onClick={() => setSelectedUserView('manage-access')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedUserView === 'manage-access'
                  ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Manage Access
              </div>
            </button>

            {selectedUser.type === 'primary' && (
              <button
                onClick={() => setSelectedUserView('link-secondary')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedUserView === 'link-secondary'
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Link Secondary Account
                </div>
              </button>
            )}
          </nav>
        </div>
        
        {/* Content Area */}
        <div className="p-8 bg-gray-50 min-h-screen">
          <div className="max-w-6xl mx-auto">
            {selectedUserView === 'permissions' && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">User Permissions</h3>

                <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                  {/* Create Consults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700 text-lg">Create Consults</p>
                      <p className="text-sm text-gray-500 mt-1">Create consult cards. Create recordings and upload docs.</p>
                    </div>
                    <div
                      className={`relative w-14 h-8 rounded-full cursor-pointer transition-colors duration-300 ${
                        selectedUser.permissions.createConsults ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      onClick={() => updateUserPermission(selectedUser.id, 'createConsults', !selectedUser.permissions.createConsults)}
                    >
                      <div
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                          selectedUser.permissions.createConsults ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Can Generate Notes */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700 text-lg">Can Generate Notes</p>
                      <p className="text-sm text-gray-500 mt-1">Can generate notes from consults</p>
                    </div>
                    <div
                      className={`relative w-14 h-8 rounded-full cursor-pointer transition-colors duration-300 ${
                        selectedUser.permissions.canGenerateNotes ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      onClick={() => updateUserPermission(selectedUser.id, 'canGenerateNotes', !selectedUser.permissions.canGenerateNotes)}
                    >
                      <div
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                          selectedUser.permissions.canGenerateNotes ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Edit Generated Notes */}
                  <div className={`flex items-center justify-between ${!selectedUser.permissions.canGenerateNotes ? 'opacity-50' : ''}`}>
                    <div>
                      <p className="font-medium text-gray-700 text-lg">Edit Generated Notes</p>
                      <p className="text-sm text-gray-500 mt-1">Can modify generated notes</p>
                      {!selectedUser.permissions.canGenerateNotes && (
                        <p className="text-xs text-orange-600 mt-1">Requires "Can Generate Notes" to be enabled</p>
                      )}
                    </div>
                    <div
                      className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                        selectedUser.permissions.canGenerateNotes
                          ? 'cursor-pointer' + (selectedUser.permissions.editGeneratedNotes ? ' bg-green-500' : ' bg-gray-300')
                          : 'cursor-not-allowed bg-gray-300'
                      }`}
                      onClick={() => {
                        if (!selectedUser.permissions.canGenerateNotes) return;
                        updateUserPermission(selectedUser.id, 'editGeneratedNotes', !selectedUser.permissions.editGeneratedNotes);
                      }}
                    >
                      <div
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                          selectedUser.permissions.editGeneratedNotes && selectedUser.permissions.canGenerateNotes ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Push to EHR */}
                  <div className={`flex items-center justify-between ${!selectedUser.permissions.canGenerateNotes || !selectedUser.permissions.editGeneratedNotes ? 'opacity-50' : ''}`}>
                    <div>
                      <p className="font-medium text-gray-700 text-lg">Push to EHR</p>
                      <p className="text-sm text-gray-500 mt-1">Can push generated notes to EHR</p>
                      {(!selectedUser.permissions.canGenerateNotes || !selectedUser.permissions.editGeneratedNotes) && (
                        <p className="text-xs text-orange-600 mt-1">Requires both "Can Generate Notes" and "Edit Generated Notes"</p>
                      )}
                    </div>
                    <div
                      className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                        selectedUser.permissions.canGenerateNotes && selectedUser.permissions.editGeneratedNotes
                          ? 'cursor-pointer' + (selectedUser.permissions.pushToEHR ? ' bg-green-500' : ' bg-gray-300')
                          : 'cursor-not-allowed bg-gray-300'
                      }`}
                      onClick={() => {
                        if (!selectedUser.permissions.canGenerateNotes || !selectedUser.permissions.editGeneratedNotes) return;
                        updateUserPermission(selectedUser.id, 'pushToEHR', !selectedUser.permissions.pushToEHR);
                      }}
                    >
                      <div
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                          selectedUser.permissions.pushToEHR && selectedUser.permissions.canGenerateNotes && selectedUser.permissions.editGeneratedNotes ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mt-6 pt-6 border-t border-gray-300 bg-blue-50 p-4 rounded-lg">
                    <strong className="text-blue-900">Permission Dependencies:</strong>
                    <ul className="mt-2 space-y-1 ml-4 list-disc text-blue-800">
                      <li>"Edit Generated Notes" requires "Can Generate Notes" to be enabled</li>
                      <li>"Push to EHR" requires both "Can Generate Notes" and "Edit Generated Notes" to be enabled</li>
                    </ul>
                  </div>
                </div>

                {/* Linked Doctors Section for Secondary Users */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Linked to Doctors</h3>

                  {linkedAccounts
                    .filter(account => account.id === selectedUser.id)
                    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                    .length > 0 ? (
                    <div className="space-y-4">
                      {linkedAccounts
                        .filter(account => account.id === selectedUser.id)
                        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                        .map((link, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-gray-900 text-lg">{link.linkedToDoctorName}</p>
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Start Date:</span> {new Date(link.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">End Date:</span> {new Date(link.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 bg-blue-100 px-3 py-1 rounded-full">
                                {Math.ceil((new Date(link.endDate) - new Date(link.startDate)) / (1000 * 60 * 60 * 24))} days
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>Not currently linked to any doctors</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedUserView === 'settings' && (
              <div className="space-y-8">
                {Object.entries(moduleSettings).map(([moduleKey, module]) => (
                  <div key={moduleKey} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                      {module.name}
                    </h3>
                    <div className="space-y-6">
                      {module.settings.filter(s => s.lockState !== 'locked-hidden').map(setting => (
                        <SettingRow
                          key={setting.id}
                          setting={setting}
                          moduleId={moduleKey}
                          showUserOverride={true}
                          userId={selectedUser.id}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedUserView === 'manage-access' && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Manage User Access
                  <span className="ml-3 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                </h3>

                <div className="space-y-6">
                  <div className="border-l-4 border-red-400 bg-red-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-red-800 mb-3">Suspend Account</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Temporarily disable this user's access to the system. They won't be able to log in until the account is reactivated.
                    </p>
                    <button
                      onClick={() => setShowSuspendModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Suspend Account
                    </button>
                  </div>

                  <div className="border-l-4 border-orange-400 bg-orange-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-orange-800 mb-3">Reset PIN</h4>
                    <p className="text-sm text-orange-700 mb-4">
                      Reset the user's PIN and send them a new temporary PIN via email. They'll need to set a new PIN on their next login.
                    </p>
                    <button
                      onClick={() => setShowResetPinModal(true)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      Reset PIN
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedUserView === 'link-secondary' && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Link Secondary Account</h3>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-400 bg-blue-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-800 mb-3">Connect Secondary User</h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Link a secondary account (nurse, assistant, etc.) to this primary doctor account. This allows shared access to notes and consultations.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select user to link
                        </label>
                        <select
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white hover:border-blue-300"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%232c3e50' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 16px center',
                            paddingRight: '48px'
                          }}
                        >
                          <option value="">Select a user...</option>
                          <option value="nurse1">Lisa Parker, RN - Cardiology Nurse</option>
                          <option value="nurse2">Michael Torres, RN - ICU Nurse</option>
                          <option value="nurse3">Sarah Kim, RN - Pediatric Nurse</option>
                          <option value="assistant1">Jennifer Walsh - Medical Assistant</option>
                          <option value="assistant2">David Chen - Clinical Assistant</option>
                          <option value="assistant3">Maria Rodriguez - Administrative Assistant</option>
                          <option value="pa1">Dr. Amanda Foster, PA-C - Physician Assistant</option>
                          <option value="np1">Dr. Robert Taylor, NP - Nurse Practitioner</option>
                          <option value="tech1">Alex Johnson - Medical Technician</option>
                          <option value="tech2">Emily Brown - Lab Technician</option>
                        </select>
                      </div>
                      
                      <button 
                        onClick={() => setShowLinkAccountModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Link Account
                      </button>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h5 className="font-medium text-gray-900 mb-4">Currently Linked Accounts</h5>
                    <div className="space-y-6">
                      {linkedAccounts.map((account) => (
                        <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-semibold text-gray-900">{account.name}</p>
                              <p className="text-sm text-gray-600">{account.role} • {account.email}</p>
                            </div>
                            <button 
                              onClick={() => setLinkedAccounts(prev => prev.filter(acc => acc.id !== account.id))}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Unlink
                            </button>
                          </div>

                          {/* Link Date Range */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Start Date:</span>
                                <span className="text-sm text-gray-900">
                                  {new Date(account.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">End Date:</span>
                                <span className="text-sm text-gray-900">
                                  {new Date(account.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                              </div>
                              <div className="pt-2 mt-2 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">Duration:</span>
                                  <span className="text-sm text-blue-700 font-medium">
                                    {Math.ceil((new Date(account.endDate) - new Date(account.startDate)) / (1000 * 60 * 60 * 24))} days
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Main Component Return
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Practice Management Dashboard</h1>
            <p className="text-sm text-gray-600">Configure settings and manage user access</p>
          </div>
        </div>
      </header>

      <div className="flex">
        <LeftNavigation />
        {currentView === 'settings' ? <SettingsView /> : <UserManagementView />}
      </div>

      <EmailAttestationModal />
      <SuspendAccountModal />
      <ResetPinModal />
      <LinkAccountModal />
      <AddSecondaryAccountModal />
      <OverrideConfirmModal />
      <GoogleSignoutConfirmModal />
    </div>
  );
};

export default PracticeSettingsDashboard;
