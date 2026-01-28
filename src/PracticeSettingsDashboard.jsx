/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect } from 'react';
import { Settings, Users, ChevronRight, Search, Shield, X, RotateCcw } from 'lucide-react';
import BlockedAccessScreen from './components/layout/BlockedAccessScreen';
import {
  canLoginAsMasterUser,
  canPMAccess,
  onMasterUserSessionChange
} from './utils/masterUserSession';

// Helper function to generate time options based on timezone
const getTimeOptionsForTimezone = (timezone) => {
  // Timezone offset from Eastern (base is Eastern Time)
  const timezoneOffsets = {
    'Eastern (America/New York)': 0,
    'Central (America/Chicago)': -1,
    'Mountain (America/Denver)': -2,
    'Pacific (America/Los Angeles)': -3
  };

  const offset = timezoneOffsets[timezone] || 0;
  const baseHours = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17];

  return baseHours.map(hour => {
    let adjustedHour = hour + offset;

    // Handle negative hours (wrap to previous day, but keep in 24h range)
    if (adjustedHour < 0) adjustedHour += 24;
    if (adjustedHour >= 24) adjustedHour -= 24;

    const hourPart = Math.floor(adjustedHour);
    const minutePart = (adjustedHour % 1) === 0.5 ? '30' : '00';
    const period = hourPart >= 12 ? 'PM' : 'AM';
    const displayHour = hourPart === 0 ? 12 : hourPart > 12 ? hourPart - 12 : hourPart;

    return `${displayHour}:${minutePart} ${period}`;
  });
};

const PracticeSettingsDashboard = () => {
  // Master User / Role Management
  const MASTER_USER_EMAIL = 'ops@marvix.com';
  const [currentUserEmail, setCurrentUserEmail] = useState('pm@practice.com');

  // Helper to check if current user is master user
  const isMasterUser = () => currentUserEmail === MASTER_USER_EMAIL;

  // ==================== ACCESS CONTROL ====================

  // Check if current user is blocked
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [activeUser, setActiveUser] = useState('');

  // ==================== ALL STATE DECLARATIONS (MUST BE BEFORE ANY CONDITIONAL RETURNS) ====================
  const [currentView, setCurrentView] = useState('settings');
  const [selectedModule, setSelectedModule] = useState('note-settings');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserView, setSelectedUserView] = useState('link-secondary');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [showLinkAccountModal, setShowLinkAccountModal] = useState(false);
  const [showOverrideConfirmModal, setShowOverrideConfirmModal] = useState(false);
  const [pendingSettingChange, setPendingSettingChange] = useState(null);
  const [showAddOverrideModal, setShowAddOverrideModal] = useState(false);
  const [currentOverrideSetting, setCurrentOverrideSetting] = useState(null);
  const [selectedNewUser, setSelectedNewUser] = useState('');
  const [linkStartDate, setLinkStartDate] = useState('');
  const [linkEndDate, setLinkEndDate] = useState('');
  const [showAddUserTypeModal, setShowAddUserTypeModal] = useState(false);
  const [showAddPrimaryAccountModal, setShowAddPrimaryAccountModal] = useState(false);
  const [primaryAccountType, setPrimaryAccountType] = useState(''); // 'request' or 'copy'
  const [copyFromDoctorId, setCopyFromDoctorId] = useState('');
  const [retrieveStartDate, setRetrieveStartDate] = useState('');
  const [retrieveEndDate, setRetrieveEndDate] = useState('');
  const [deletedConsults, setDeletedConsults] = useState([]);
  const [selectedRetrieveDoctor, setSelectedRetrieveDoctor] = useState('');
  const [searchPatientName, setSearchPatientName] = useState('');
  const [selectedConsults, setSelectedConsults] = useState([]);
  const [hipaaAttestationChecked, setHipaaAttestationChecked] = useState(false);
  const [showHipaaEmailConfirm, setShowHipaaEmailConfirm] = useState(false);
  const [hipaaAttestationUser, setHipaaAttestationUser] = useState(null);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [showGoogleSignoutModal, setShowGoogleSignoutModal] = useState(false);
  const [isZoomAppInstalled, setIsZoomAppInstalled] = useState(false);
  const [customDeleteDays, setCustomDeleteDays] = useState('');
  const [futureDays, setFutureDays] = useState(1); // Days for Future appointments
  const [pastDays, setPastDays] = useState(1); // Days for Past appointments
  const [newUserPermissions, setNewUserPermissions] = useState({
    createConsults: true,
    canGenerateNotes: false,
    editGeneratedNotes: false,
    pushToEHR: false
  });
  const [newPrimaryAccount, setNewPrimaryAccount] = useState({
    name: '',
    specialty: '',
    email: ''
  });
  const [showOverrideCleanupModal, setShowOverrideCleanupModal] = useState(false);
  const [overrideCleanupData, setOverrideCleanupData] = useState(null);
  const [userSettingsOverrides, setUserSettingsOverrides] = useState({});
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

  // Initialize moduleSettings with lazy initializer
  // settingsModules is defined later in the component, so we use a function to defer evaluation
  const [moduleSettings, setModuleSettings] = useState(() => {
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
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: ''
          },
          {
            id: 2,
            name: 'Patient Name',
            type: 'dropdown',
            options: ['As Entered', 'Infer from Audio', '"The Patient"'],
            default: 'As Entered',
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
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
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: ''
          },
          {
            id: 4,
            name: 'Default Note View',
            type: 'dropdown',
            options: ['Section View', 'Full Note View'],
            default: 'Full Note View',
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
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
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
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
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
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
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: '',
            required: true
          },
          {
            id: 21,
            name: '2-factor Authentication',
            type: 'toggle',
            options: ['True', 'False'],
            default: 'False',
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
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
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
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
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: '',
            dependency: 22
          },
          {
            id: 24,
            name: 'Play Recording Consent Disclaimer',
            type: 'toggle',
            options: ['True', 'False'],
            default: 'False',
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
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
              'Custom',
              'Never'
            ],
            default: '1 month',
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
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
            name: 'Service Settings',
            type: 'service-settings-combined',
            options: ['Outpatient', 'Inpatient', 'Emergency Services', 'Home Services', 'Nursing Facilities'],
            default: ['Outpatient'],
            defaultService: 'Outpatient',
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'Configure which service settings are available and set the default.'
          },
          {
            id: 43,
            name: 'Enable Preventive Medicine Service',
            type: 'toggle',
            options: ['True', 'False'],
            default: 'False',
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtexts: {
              'True': '',
              'False': 'Enable to see Preventive Visit (eg. Annual check up) as a consult option for E/M codes'
            }
          }
        ]
      },
      'ehr-settings-amd': {
        name: 'EHR Settings - AMD',
        subtitle: 'Settings that control AMD EHR integration and synchronization',
        settings: [
          {
            id: 71,
            name: 'Appointments Range',
            type: 'range-selector',
            options: ['1 day', '3 days', '7 days', '14 days', '21 days', '30 days', '45 days', '60 days', '90 days'],
            default: '30 days',
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'How far in the future should the appointments be pulled from the EHR / PMS / Calendar'
          },
          {
            id: 72,
            name: 'Appointments Order',
            type: 'order-list',
            options: ['Today', 'Future', 'Past', 'Day After Tomorrow'],
            default: ['Today', 'Future', 'Past'],
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'In which order should they show up in the "Link Appointment" popup? Drag to reorder'
          },
          {
            id: 73,
            name: 'Daily appointment sync time',
            type: 'time-multiselect',
            options: [
              '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
              '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
              '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
              '5:00 PM'
            ],
            default: [],
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'Times shown in selected timezone (30min increments). Max 6 times'
          },
          {
            id: 75,
            name: 'Auto-create Consult Cards',
            type: 'toggle',
            options: ['On', 'Off'],
            default: 'On',
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'Automatically create consultation cards for appointments'
          },
          {
            id: 76,
            name: 'Allow repeat note push',
            type: 'toggle',
            options: ['Yes', 'No'],
            default: 'Off',
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'Allow pushing updated notes to EHR more than once'
          },
          {
            id: 77,
            name: 'Push to EHR automatically',
            type: 'toggle',
            options: ['On', 'Off'],
            default: 'Off',
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'Automatically push completed notes to EHR system'
          }
        ]
      },
      'ehr-settings-athena': {
        name: 'EHR Settings - Athena',
        subtitle: 'Settings that control Athena EHR integration and synchronization',
        settings: [
          {
            id: 81,
            name: 'Appointments Range',
            type: 'range-selector',
            options: ['1 day', '3 days', '7 days', '14 days', '21 days', '30 days', '45 days', '60 days', '90 days'],
            default: '30 days',
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'How far in the future should the appointments be pulled from the EHR / PMS / Calendar'
          },
          {
            id: 82,
            name: 'Appointments Order',
            type: 'order-list',
            options: ['Today', 'Future', 'Past', 'Day After Tomorrow'],
            default: ['Today', 'Future', 'Past'],
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'In which order should they show up in the "Link Appointment" popup? Drag to reorder'
          },
          {
            id: 83,
            name: 'Daily appointment sync time',
            type: 'time-multiselect',
            options: [
              '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
              '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
              '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
              '5:00 PM'
            ],
            default: [],
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'Times shown in selected timezone (30min increments). Max 6 times'
          },
          {
            id: 85,
            name: 'Auto-create Consult Cards',
            type: 'toggle',
            options: ['On', 'Off'],
            default: 'On',
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'Automatically create consultation cards for appointments'
          },
          {
            id: 86,
            name: 'Allow repeat note push',
            type: 'toggle',
            options: ['Yes', 'No'],
            default: 'Off',
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'Allow pushing updated notes to EHR more than once'
          },
          {
            id: 87,
            name: 'Push to EHR automatically',
            type: 'toggle',
            options: ['On', 'Off'],
            default: 'Off',
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'Automatically push completed notes to EHR system'
          },
          {
            id: 88,
            name: 'Document Types to Pull From EHR',
            type: 'multiselect',
            options: [
              'Lab Reports',
              'Discharge Summary',
              'Radiology Reports',
              'Pathology Reports',
              'Consultation Notes',
              'Operative Reports',
              'Progress Notes',
              'Medication Lists',
              'Immunization Records',
              'Imaging Studies'
            ],
            default: ['Lab Reports', 'Discharge Summary', 'Radiology Reports'],
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'Select which document types should be automatically pulled from the EHR'
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
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'This option is only visible to users who have signed up for "Google Calendar" as EHR.'
          },
          {
            id: 72,
            name: 'Zoom',
            type: 'zoom-check',
            options: [],
            default: false,
            opsLockState: 'unlocked',
            pmLockState: 'unlocked',
            subtext: 'Connect Marvix app via Zoom marketplace. Consults via Zoom are not linked to an appointment - new consult is created.'
          }
        ]
      }
    };
    return settingsModules;
  });

  // Validate access on mount and when user changes
  useEffect(() => {
    const checkAccess = () => {
      if (isMasterUser()) {
        // Check if another master user is active
        const { canLogin, reason, activeUser: activeMasterUser } = canLoginAsMasterUser(currentUserEmail);

        if (!canLogin) {
          setIsBlocked(true);
          setBlockReason(reason);
          setActiveUser(activeMasterUser);
          return;
        }
      } else {
        // Check if master user is active (blocks PM)
        const { canAccess, reason, activeUser: activeMasterUser } = canPMAccess();

        if (!canAccess) {
          setIsBlocked(true);
          setBlockReason(reason);
          setActiveUser(activeMasterUser);
          return;
        }
      }

      // Access granted
      setIsBlocked(false);
      setBlockReason('');
      setActiveUser('');
    };

    // Check on mount and user change
    checkAccess();

    // Listen for session changes (cross-tab communication)
    const cleanup = onMasterUserSessionChange(() => {
      checkAccess();
    });

    return cleanup;
  }, [currentUserEmail]);

  // Reset user view when user changes
  useEffect(() => {
    if (selectedUser) {
      setSelectedUserView(selectedUser.type === 'secondary' ? 'permissions' : 'link-secondary');
    }
  }, [selectedUser?.id]);

  // If blocked, show blocked access screen
  if (isBlocked) {
    return (
      <BlockedAccessScreen
        reason={blockReason}
        activeUser={activeUser}
        userType={isMasterUser() ? 'ops' : 'pm'}
      />
    );
  }

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

  // Helper function to get all overrides for a specific setting
  const getSettingOverrides = (moduleId, settingId) => {
    const overrides = [];
    Object.keys(userSettingsOverrides).forEach(key => {
      // Match keys that end with -${moduleId}-${settingId}
      const suffix = `-${moduleId}-${settingId}`;
      if (key.endsWith(suffix)) {
        const userId = key.slice(0, -suffix.length);
        const override = userSettingsOverrides[key];
        if (override && override.value !== undefined) {
          const user = allUsers.find(u => u.id.toString() === userId);
          if (user) {
            overrides.push({
              userId,
              userName: user.name,
              value: override.value,
              pmLockState: override.pmLockState || 'unlocked'
            });
          }
        }
      }
    });
    return overrides;
  };

  // Helper function to remove user-specific setting override
  const removeUserSetting = (userId, moduleId, settingId) => {
    const key = `${userId}-${moduleId}-${settingId}`;
    setUserSettingsOverrides(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  // Helper function to detect redundant overrides when default value or lock state changes
  // An override is redundant when BOTH value and lock state match the defaults
  const detectRedundantOverrides = (moduleId, settingId, newDefaultValue, settingType, isLockStateChange = false) => {
    const setting = moduleSettings[moduleId]?.settings.find(s => s.id === settingId);
    if (!setting) return [];

    const redundantOverrides = [];

    // Check all user overrides for this setting
    Object.keys(userSettingsOverrides).forEach(key => {
      const suffix = `-${moduleId}-${settingId}`;
      if (key.endsWith(suffix)) {
        const userId = key.slice(0, -suffix.length);
        const override = userSettingsOverrides[key];
        if (!override) return;

        const user = allUsers.find(u => u.id.toString() === userId);
        if (!user) return;

        // Determine what the new defaults would be after this change
        const newDefaultValueToCheck = isLockStateChange ? setting.default : newDefaultValue;
        const newDefaultLockState = isLockStateChange ? newDefaultValue : setting.pmLockState;

        // Get the override's value and lock state
        const overrideValue = override.value !== undefined ? override.value : setting.default;
        const overrideLockState = override.pmLockState !== undefined ? override.pmLockState : setting.pmLockState;

        // Check if BOTH value and lock state match the new defaults using helper
        const valueMatches = valuesAreEqual(overrideValue, newDefaultValueToCheck);
        const lockStateMatches = overrideLockState === newDefaultLockState;

        // If BOTH match, this override is redundant and should be removed
        if (valueMatches && lockStateMatches) {
          redundantOverrides.push({
            userId,
            userName: user.name,
            value: overrideValue,
            pmLockState: overrideLockState
          });
        }
      }
    });

    return redundantOverrides;
  };

  // Helper function to remove multiple overrides
  // Always removes the entire override since we only keep overrides that differ from BOTH defaults
  const removeMultipleOverrides = (overridesToRemove, moduleId, settingId) => {
    setUserSettingsOverrides(prev => {
      const updated = { ...prev };
      overridesToRemove.forEach(override => {
        const key = `${override.userId}-${moduleId}-${settingId}`;
        delete updated[key];
      });
      return updated;
    });
  };

  // ==================== HELPER FUNCTIONS ====================

  // Helper function to compare values (handles arrays properly)
  const valuesAreEqual = (value1, value2) => {
    if (Array.isArray(value1) && Array.isArray(value2)) {
      return JSON.stringify([...value1].sort()) === JSON.stringify([...value2].sort());
    }
    return value1 === value2;
  };

  // Helper function to format lock state for display
  const formatLockStateDisplay = (lockState) => {
    switch (lockState) {
      case 'unlocked': return 'Unlocked';
      case 'locked-visible': return 'Locked (Visible)';
      case 'locked-hidden': return 'Locked (Hidden)';
      default: return lockState;
    }
  };

  // Helper function to format value for display
  const formatValueDisplay = (value) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  // Helper function to generate the "cannot create matching override" alert message
  const getMatchingOverrideAlertMessage = (value, lockState) => {
    return `Cannot create an override that matches the practice default.

This setting would have:
• Value: ${formatValueDisplay(value)}
• Lock State: ${formatLockStateDisplay(lockState)}

Which is the same as the practice-wide default. An override must differ from the default.`;
  };

  // Helper function to check if an override set matches the default set
  // For service-settings-combined, also pass newDefaultService to check both enabled services and default service
  const doesOverrideMatchDefault = (userId, moduleId, settingId, newValue, newLockState, newDefaultService) => {
    const setting = moduleSettings[moduleId]?.settings.find(s => s.id === settingId);
    if (!setting) return false;

    const currentOverride = getUserSetting(userId, moduleId, settingId);

    // Determine the effective values for this potential override
    const effectiveValue = newValue !== undefined ? newValue : (currentOverride?.value !== undefined ? currentOverride.value : setting.default);
    const effectiveLockState = newLockState !== undefined ? newLockState : (currentOverride?.pmLockState !== undefined ? currentOverride.pmLockState : setting.pmLockState);

    // Check if BOTH value and lock state match the defaults
    const valueMatches = valuesAreEqual(effectiveValue, setting.default);
    const lockStateMatches = effectiveLockState === setting.pmLockState;

    // For service-settings-combined, also check defaultService
    if (setting.type === 'service-settings-combined') {
      const effectiveDefaultService = newDefaultService !== undefined ? newDefaultService : (currentOverride?.defaultService !== undefined ? currentOverride.defaultService : setting.defaultService);
      const defaultServiceMatches = effectiveDefaultService === setting.defaultService;
      return valueMatches && lockStateMatches && defaultServiceMatches;
    }

    return valueMatches && lockStateMatches;
  };

  const updateSettingState = (moduleId, settingId, property, value) => {
    const isLockStateChange = property === 'pmLockState';
    const isDefaultValueChange = property === 'default';

    // If changing the default value or lock state, check for redundant overrides
    if (isDefaultValueChange || isLockStateChange) {
      const setting = moduleSettings[moduleId]?.settings.find(s => s.id === settingId);
      if (setting) {
        const redundantOverrides = detectRedundantOverrides(
          moduleId,
          settingId,
          value,
          setting.type,
          isLockStateChange
        );

        if (redundantOverrides.length > 0) {
          // Show confirmation modal before proceeding
          setOverrideCleanupData({
            moduleId,
            settingId,
            settingName: setting.name,
            settingType: setting.type,
            oldDefault: isLockStateChange ? setting.pmLockState : setting.default,
            newDefault: value,
            redundantOverrides,
            property,
            isLockStateChange
          });
          setShowOverrideCleanupModal(true);
          return; // Don't update yet, wait for user confirmation
        }
      }
    }

    // If no redundant overrides or not changing default/lock state, proceed with update
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
              All our users are following HIPAA and HITECH compliance.
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

  const HipaaEmailConfirmModal = () => (
    showHipaaEmailConfirm && hipaaAttestationUser && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">HIPAA Attestation Confirmed</h3>
            <button onClick={() => {
              setShowHipaaEmailConfirm(false);
              setHipaaAttestationUser(null);
            }} className="text-gray-400 hover:text-gray-600">
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
                    An email has been sent to <strong>{hipaaAttestationUser.email}</strong> informing them that:
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
                  <span>{hipaaAttestationUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{hipaaAttestationUser.email}</span>
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
              onClick={() => {
                setShowHipaaEmailConfirm(false);
                setHipaaAttestationUser(null);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Close
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
                  const propertyToUpdate = pendingSettingChange.isLockStateChange ? 'pmLockState' : 'value';
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

  const OverrideCleanupModal = () => (
    showOverrideCleanupModal && overrideCleanupData && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Override Cleanup Required</h3>
            <button
              onClick={() => {
                setShowOverrideCleanupModal(false);
                setOverrideCleanupData(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            {/* Info Section */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Settings className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 mb-1">
                  {overrideCleanupData.isLockStateChange ? 'Lock State Change Detected' : 'Default Value Change Detected'}
                </p>
                <p className="text-sm text-gray-600">Setting: {overrideCleanupData.settingName}</p>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded mb-4">
              <p className="text-sm text-amber-800 font-medium mb-2">
                {overrideCleanupData.isLockStateChange
                  ? 'Some user overrides now match BOTH default value and lock state'
                  : 'Some user overrides now match BOTH default value and lock state'}
              </p>
              <p className="text-sm text-amber-700 leading-relaxed">
                After this change, the following users will have overrides where BOTH the value and lock state match the practice-wide defaults.
                These redundant overrides will be automatically removed, and these users will inherit the practice-wide settings.
              </p>
              <p className="text-sm text-amber-700 leading-relaxed mt-2">
                <strong>Note:</strong> An override only exists when it differs from the default. Since both properties now match, the override is no longer needed.
              </p>
            </div>

            {/* Value Change Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {overrideCleanupData.isLockStateChange ? 'Current Lock State:' : 'Current Default:'}
                </span>
                <span className="text-sm text-gray-900 font-medium">
                  {overrideCleanupData.isLockStateChange
                    ? overrideCleanupData.oldDefault === 'unlocked'
                      ? 'Unlocked'
                      : overrideCleanupData.oldDefault === 'locked-visible'
                        ? 'Locked (Visible)'
                        : 'Locked (Hidden)'
                    : Array.isArray(overrideCleanupData.oldDefault)
                      ? overrideCleanupData.oldDefault.join(', ')
                      : overrideCleanupData.oldDefault}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {overrideCleanupData.isLockStateChange ? 'New Lock State:' : 'New Default:'}
                </span>
                <span className="text-sm text-blue-700 font-medium">
                  {overrideCleanupData.isLockStateChange
                    ? overrideCleanupData.newDefault === 'unlocked'
                      ? 'Unlocked'
                      : overrideCleanupData.newDefault === 'locked-visible'
                        ? 'Locked (Visible)'
                        : 'Locked (Hidden)'
                    : Array.isArray(overrideCleanupData.newDefault)
                      ? overrideCleanupData.newDefault.join(', ')
                      : overrideCleanupData.newDefault}
                </span>
              </div>
            </div>

            {/* Affected Users List */}
            {overrideCleanupData.redundantOverrides.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-900 mb-3">
                  Overrides to be removed ({overrideCleanupData.redundantOverrides.length} user{overrideCleanupData.redundantOverrides.length !== 1 ? 's' : ''}):
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {overrideCleanupData.redundantOverrides.map((override, index) => (
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
                          <p className="text-xs text-gray-600">
                            Lock: {override.pmLockState === 'unlocked'
                              ? 'Unlocked'
                              : override.pmLockState === 'locked-visible'
                                ? 'Locked (Visible)'
                                : 'Locked (Hidden)'}
                          </p>
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

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowOverrideCleanupModal(false);
                setOverrideCleanupData(null);
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (overrideCleanupData) {
                  // Remove redundant overrides (entire override removed)
                  removeMultipleOverrides(
                    overrideCleanupData.redundantOverrides,
                    overrideCleanupData.moduleId,
                    overrideCleanupData.settingId
                  );

                  // Now proceed with updating the default value or lock state
                  setModuleSettings(prev => ({
                    ...prev,
                    [overrideCleanupData.moduleId]: {
                      ...prev[overrideCleanupData.moduleId],
                      settings: prev[overrideCleanupData.moduleId].settings.map(setting =>
                        setting.id === overrideCleanupData.settingId
                          ? { ...setting, [overrideCleanupData.property]: overrideCleanupData.newDefault }
                          : setting
                      )
                    }
                  }));
                }
                setShowOverrideCleanupModal(false);
                setOverrideCleanupData(null);
              }}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Confirm & Remove Overrides
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

  const AddOverrideModal = () => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [overrideValue, setOverrideValue] = useState('');
    const [overrideLockState, setOverrideLockState] = useState('unlocked');
    const [overrideDefaultService, setOverrideDefaultService] = useState('');
    const [validationError, setValidationError] = useState('');

    // Initialize values for service-settings-combined when modal opens
    React.useEffect(() => {
      if (showAddOverrideModal && currentOverrideSetting) {
        const { settingType, defaultValue } = currentOverrideSetting;
        if (settingType === 'service-settings-combined' && overrideValue === '') {
          const enabledServices = defaultValue.default || defaultValue;
          setOverrideValue(JSON.stringify(enabledServices));
          setOverrideDefaultService(defaultValue.defaultService || enabledServices[0]);
        }
      }
    }, [showAddOverrideModal, currentOverrideSetting, overrideValue]);

    // Clear validation error when user makes changes
    React.useEffect(() => {
      if (validationError) {
        setValidationError('');
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [overrideValue, overrideLockState, overrideDefaultService]);

    if (!showAddOverrideModal || !currentOverrideSetting) return null;

    const { moduleId, settingId, settingName, settingType, settingOptions, defaultValue } = currentOverrideSetting;

    // Get users who don't already have an override for this setting
    const existingOverrides = getSettingOverrides(moduleId, settingId);
    const existingUserIds = existingOverrides.map(o => o.userId);
    const availableUsers = allUsers.filter(u => !existingUserIds.includes(u.id.toString()));

    const handleSave = () => {
      if (!selectedUserId) {
        alert('Please select a user');
        return;
      }

      // If locked-hidden, no need to set an override value
      if (overrideLockState !== 'locked-hidden' && overrideValue === '') {
        alert('Please set an override value');
        return;
      }

      // Check if this is Send Note on Email being enabled (setting ID 22 and value is 'True')
      const isSendNoteEmailEnabled = settingId === 22 && overrideValue === 'True';
      if (isSendNoteEmailEnabled && !hipaaAttestationChecked) {
        alert('Please attest for HIPAA compliance on behalf of the user before enabling Send Note on Email');
        return;
      }

      // For locked-hidden, use the default value if no override value is set
      let valueToSet = overrideValue === '' ? defaultValue : overrideValue;

      // Parse JSON strings for array-based settings
      if (settingType === 'order-list' || settingType === 'time-multiselect' || settingType === 'multiselect' || settingType === 'service-settings-combined') {
        if (typeof valueToSet === 'string' && valueToSet !== '') {
          try {
            valueToSet = JSON.parse(valueToSet);
          } catch (e) {
            // If parse fails, keep as string
          }
        }
      }

      // VALIDATION: Check if the override would match BOTH default value and lock state
      // For service-settings-combined, also pass the defaultService
      const wouldMatchDefault = doesOverrideMatchDefault(selectedUserId, moduleId, settingId, valueToSet, overrideLockState, overrideDefaultService);

      if (wouldMatchDefault) {
        setValidationError(getMatchingOverrideAlertMessage(valueToSet, overrideLockState));
        return;
      }

      setUserSetting(selectedUserId, moduleId, settingId, 'value', valueToSet);
      setUserSetting(selectedUserId, moduleId, settingId, 'pmLockState', overrideLockState);

      // For service-settings-combined, also save the default service
      if (settingType === 'service-settings-combined' && overrideDefaultService) {
        setUserSetting(selectedUserId, moduleId, settingId, 'defaultService', overrideDefaultService);
      }

      // If Send Note on Email was enabled, show email confirmation modal
      if (isSendNoteEmailEnabled) {
        const user = allUsers.find(u => u.id.toString() === selectedUserId);
        setHipaaAttestationUser(user);
        setShowHipaaEmailConfirm(true);
      }

      setShowAddOverrideModal(false);
      setCurrentOverrideSetting(null);
      setSelectedUserId('');
      setOverrideValue('');
      setOverrideLockState('unlocked');
      setOverrideDefaultService('');
      setHipaaAttestationChecked(false);
      setValidationError('');
    };

    const handleCancel = () => {
      setShowAddOverrideModal(false);
      setCurrentOverrideSetting(null);
      setSelectedUserId('');
      setOverrideValue('');
      setOverrideLockState('unlocked');
      setOverrideDefaultService('');
      setHipaaAttestationChecked(false);
      setValidationError('');
    };

    // Initialize override value when user is selected
    const handleUserSelect = (userId) => {
      setSelectedUserId(userId);
      // Don't auto-set the override value, let user choose explicitly
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Add User Override</h3>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
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
                  : (Array.isArray(defaultValue) ? defaultValue.join(', ') : defaultValue)
                }
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Select User:</label>
              <select
                value={selectedUserId}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select a user --</option>
                {availableUsers.map(user => (
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
                    {settingOptions.map(option => (
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
                {settingType === 'order-list' && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-2">Select items in the order you want them to appear (click to toggle)</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                      {settingOptions.map(option => {
                        const selectedItems = overrideValue ? (typeof overrideValue === 'string' ? JSON.parse(overrideValue) : overrideValue) : [];
                        const isSelected = selectedItems.includes(option);
                        return (
                          <label key={option} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                          }`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                let newItems;
                                if (e.target.checked) {
                                  newItems = [...selectedItems, option];
                                } else {
                                  newItems = selectedItems.filter(item => item !== option);
                                }
                                setOverrideValue(JSON.stringify(newItems));
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        );
                      })}
                    </div>
                    {overrideValue && (() => {
                      const selectedItems = typeof overrideValue === 'string' ? JSON.parse(overrideValue) : overrideValue;
                      return selectedItems.length > 0 && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          Selected order: {selectedItems.join(' → ')}
                        </div>
                      );
                    })()}
                  </div>
                )}
                {settingType === 'time-multiselect' && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-2">Select up to 6 sync times</p>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                      {settingOptions.map(option => {
                        const selectedItems = overrideValue ? (typeof overrideValue === 'string' ? JSON.parse(overrideValue) : overrideValue) : [];
                        const isSelected = selectedItems.includes(option);
                        const canSelect = selectedItems.length < 6 || isSelected;
                        return (
                          <label key={option} className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-100 border border-blue-300 text-blue-700'
                              : canSelect
                                ? 'bg-gray-50 hover:bg-gray-100'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!canSelect && !isSelected}
                              onChange={(e) => {
                                let newItems;
                                if (e.target.checked) {
                                  newItems = [...selectedItems, option];
                                } else {
                                  newItems = selectedItems.filter(item => item !== option);
                                }
                                setOverrideValue(JSON.stringify(newItems));
                              }}
                              className="w-3 h-3"
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                    {overrideValue && (() => {
                      const selectedItems = typeof overrideValue === 'string' ? JSON.parse(overrideValue) : overrideValue;
                      return selectedItems.length > 0 && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          Selected: {selectedItems.join(', ')} ({selectedItems.length}/6)
                        </div>
                      );
                    })()}
                  </div>
                )}
                {settingType === 'multiselect' && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-2">Select services (at least one required)</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                      {settingOptions.map(option => {
                        const selectedItems = overrideValue ? (typeof overrideValue === 'string' ? JSON.parse(overrideValue) : overrideValue) : [];
                        const isSelected = selectedItems.includes(option);
                        return (
                          <label key={option} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                          }`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                let newItems;
                                if (e.target.checked) {
                                  newItems = [...selectedItems, option];
                                } else {
                                  newItems = selectedItems.filter(item => item !== option);
                                }
                                setOverrideValue(JSON.stringify(newItems));
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        );
                      })}
                    </div>
                    {overrideValue && (() => {
                      const selectedItems = typeof overrideValue === 'string' ? JSON.parse(overrideValue) : overrideValue;
                      return selectedItems.length > 0 && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          Selected: {selectedItems.join(', ')}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Service Settings Combined Type */}
                {settingType === 'service-settings-combined' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500 mb-2">Configure enabled services and default service</p>

                    {/* Enabled Services */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Enabled Service Settings</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                        {settingOptions.map(option => {
                          const selectedItems = overrideValue ? (typeof overrideValue === 'string' ? JSON.parse(overrideValue) : overrideValue) : [];
                          const isSelected = selectedItems.includes(option);
                          return (
                            <label key={option} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                            }`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  let newItems;
                                  if (e.target.checked) {
                                    newItems = [...selectedItems, option];
                                  } else {
                                    // Don't allow unchecking if it's the last one
                                    if (selectedItems.length === 1) return;
                                    newItems = selectedItems.filter(item => item !== option);
                                  }
                                  setOverrideValue(JSON.stringify(newItems));

                                  // Update default service state if needed
                                  const currentDefaultService = overrideDefaultService || defaultValue.defaultService;
                                  if (!newItems.includes(currentDefaultService)) {
                                    setOverrideDefaultService(newItems[0]);
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{option}</span>
                            </label>
                          );
                        })}
                      </div>
                      {overrideValue && (() => {
                        const selectedItems = typeof overrideValue === 'string' ? JSON.parse(overrideValue) : overrideValue;
                        return selectedItems.length > 0 && (
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1">
                            Selected: {selectedItems.join(', ')}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Default Service */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Default Service Setting</label>
                      <select
                        value={overrideDefaultService || defaultValue.defaultService}
                        onChange={(e) => setOverrideDefaultService(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {(() => {
                          const enabledServices = overrideValue ? (typeof overrideValue === 'string' ? JSON.parse(overrideValue) : overrideValue) : defaultValue.default;
                          return enabledServices.map(service => (
                            <option key={service} value={service}>{service}</option>
                          ));
                        })()}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Default service must be one of the enabled services
                      </p>
                    </div>
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
                  <button
                    onClick={() => setOverrideLockState('unlocked')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      overrideLockState === 'unlocked'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Unlocked
                  </button>
                  <button
                    onClick={() => setOverrideLockState('locked-visible')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      overrideLockState === 'locked-visible'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Locked Visible
                  </button>
                  <button
                    onClick={() => setOverrideLockState('locked-hidden')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      overrideLockState === 'locked-hidden'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Locked Hidden
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {overrideLockState === 'unlocked' && 'User can change this setting'}
                  {overrideLockState === 'locked-visible' && 'User can see but cannot change this setting'}
                  {overrideLockState === 'locked-hidden' && 'Setting is hidden from user'}
                </p>
              </div>
            )}
          </div>

          {availableUsers.length === 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm text-yellow-800">All users already have overrides for this setting.</p>
            </div>
          )}

          {/* HIPAA Attestation for Send Note on Email */}
          {settingId === 22 && overrideValue === 'True' && selectedUserId && (
            <div className="mb-6 p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-semibold text-purple-900 mb-2">HIPAA Compliance Attestation Required</h4>
                  <p className="text-sm text-purple-800 mb-3">
                    Enabling Send Note on Email for this user requires HIPAA compliance attestation. As the Practice Manager, you are attesting on behalf of the user that their email complies with Privacy and Data Protection laws.
                  </p>
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hipaaAttestationChecked}
                      onChange={(e) => setHipaaAttestationChecked(e.target.checked)}
                      className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-purple-900">
                      <strong>I attest</strong> that enabling Send Note on Email for{' '}
                      {allUsers.find(u => u.id.toString() === selectedUserId)?.name || 'this user'}{' '}
                      complies with HIPAA requirements and that the user's email system meets Privacy and Data Protection standards. An email notification will be sent to the user.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Validation Error Message */}
          {validationError && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-800 whitespace-pre-line">{validationError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedUserId || (overrideLockState !== 'locked-hidden' && overrideValue === '') || availableUsers.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add Override
            </button>
          </div>
        </div>
      </div>
    );
  };

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

  // Add User Type Selection Modal
  const AddUserTypeModal = () => {
    if (!showAddUserTypeModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
            <button onClick={() => setShowAddUserTypeModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">Select the type of account you want to create:</p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setShowAddUserTypeModal(false);
                setShowAddPrimaryAccountModal(true);
              }}
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
              onClick={() => {
                setShowAddUserTypeModal(false);
                setShowAddSecondaryAccountModal(true);
              }}
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
              onClick={() => setShowAddUserTypeModal(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add Primary Account Modal
  const AddPrimaryAccountModal = () => {
    if (!showAddPrimaryAccountModal) return null;

    const primaryDoctors = allUsers.filter(user => user.type === 'primary');

    const handleAddPrimaryAccount = () => {
      if (!newPrimaryAccount.name || !newPrimaryAccount.specialty || !newPrimaryAccount.email) return;

      // Create new primary account
      const newAccount = {
        id: `doctor${Date.now()}`,
        name: newPrimaryAccount.name,
        type: 'primary',
        specialty: newPrimaryAccount.specialty,
        email: newPrimaryAccount.email,
        linkedAccounts: []
      };

      // If copying from another doctor, copy their settings
      if (primaryAccountType === 'copy' && copyFromDoctorId) {
        // Here you would copy all templates and settings from the selected doctor
        console.log(`Copying settings from doctor ${copyFromDoctorId} to new account`);
        // In a real implementation, you'd copy all user-specific overrides
      }

      setAllUsers(prev => [...prev, newAccount]);

      // Reset form
      setShowAddPrimaryAccountModal(false);
      setPrimaryAccountType('');
      setCopyFromDoctorId('');
      setNewPrimaryAccount({
        name: '',
        specialty: '',
        email: ''
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Add Primary Account (Doctor)</h3>
            <button onClick={() => {
              setShowAddPrimaryAccountModal(false);
              setPrimaryAccountType('');
              setCopyFromDoctorId('');
            }} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Account Setup Method *
              </label>
              <div className="space-y-3">
                <button
                  onClick={() => setPrimaryAccountType('request')}
                  className={`w-full flex items-start gap-3 p-4 border-2 rounded-lg transition-all ${
                    primaryAccountType === 'request'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      primaryAccountType === 'request' ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      {primaryAccountType === 'request' && (
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">Request New Account</h4>
                    <p className="text-xs text-gray-600 mt-1">Create a brand new account with default settings and templates</p>
                  </div>
                </button>

                <button
                  onClick={() => setPrimaryAccountType('copy')}
                  className={`w-full flex items-start gap-3 p-4 border-2 rounded-lg transition-all ${
                    primaryAccountType === 'copy'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      primaryAccountType === 'copy' ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      {primaryAccountType === 'copy' && (
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">Copy from Existing Doctor</h4>
                    <p className="text-xs text-gray-600 mt-1">Copy all settings, templates, and configurations from another doctor in your practice</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Copy From Doctor Dropdown - Only show if 'copy' is selected */}
            {primaryAccountType === 'copy' && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Doctor to Copy From *
                </label>
                <select
                  value={copyFromDoctorId}
                  onChange={(e) => setCopyFromDoctorId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%232c3e50' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    paddingRight: '48px'
                  }}
                >
                  <option value="">Select a doctor...</option>
                  {primaryDoctors.map(doctor => (
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

            {/* Doctor Details */}
            {primaryAccountType && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900">Doctor Information</h4>

                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newPrimaryAccount.name}
                    onChange={(e) => setNewPrimaryAccount(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Specialty Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialty *
                  </label>
                  <input
                    type="text"
                    value={newPrimaryAccount.specialty}
                    onChange={(e) => setNewPrimaryAccount(prev => ({ ...prev, specialty: e.target.value }))}
                    placeholder="Enter specialty"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newPrimaryAccount.email}
                    onChange={(e) => setNewPrimaryAccount(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={() => {
                setShowAddPrimaryAccountModal(false);
                setPrimaryAccountType('');
                setCopyFromDoctorId('');
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPrimaryAccount}
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
    const userLockState = userSetting?.pmLockState || setting.pmLockState;
    const effectiveValue = hasUserOverride ? userSetting.value : setting.default;
    
    const getDisplaySubtext = () => {
      if (setting.subtexts && setting.default) {
        return setting.subtexts[setting.default] || setting.subtext || '';
      }
      return setting.subtext || '';
    };

    const renderFormControl = (isUserOverride = false, targetUserId = null) => {
      const value = isUserOverride ? effectiveValue : setting.default;
      // Check if default setting is locked-hidden (disable default controls, but not overrides)
      const isDefaultLockedHidden = !isUserOverride && setting.pmLockState === 'locked-hidden';

      const handleChange = (newValue) => {
        if (isDefaultLockedHidden) return; // Prevent changes to locked-hidden defaults

        if (isUserOverride && targetUserId) {
          // Check if the resulting override would match BOTH default value and lock state
          const wouldMatchDefault = doesOverrideMatchDefault(targetUserId, moduleId, setting.id, newValue, undefined);

          if (wouldMatchDefault) {
            // Cannot create an override that matches the default set
            const currentLockState = getUserSetting(targetUserId, moduleId, setting.id)?.pmLockState || setting.pmLockState;
            alert(getMatchingOverrideAlertMessage(newValue, currentLockState));
            return;
          }

          // Check if this is a new override or if the value is different from practice default
          const currentUserSetting = getUserSetting(targetUserId, moduleId, setting.id);
          const isDifferentFromDefault = !valuesAreEqual(newValue, setting.default);

          if (isDifferentFromDefault) {
            // Value differs from default, show confirmation modal
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
            // Value matches default - check if we should remove the override entirely
            if (currentUserSetting && (currentUserSetting.value !== undefined || currentUserSetting.pmLockState !== undefined)) {
              // User had an override, now setting value back to default
              // If lock state also matches default, remove entire override
              const lockStateMatchesDefault = (currentUserSetting.pmLockState === undefined || currentUserSetting.pmLockState === setting.pmLockState);
              if (lockStateMatchesDefault) {
                // Both match, remove entire override
                removeUserSetting(targetUserId, moduleId, setting.id);
              } else {
                // Lock differs, keep override but update value
                setUserSetting(targetUserId, moduleId, setting.id, 'value', newValue);
              }
            }
            // If no override exists and value = default, do nothing (stay at default)
          }
        } else {
          updateSettingState(moduleId, setting.id, 'default', newValue);
        }
      };
      
      switch (setting.type) {
        case 'toggle':
          const isToggleOn = value === 'True';
          const isToggleDisabled = !isEnabled || isDefaultLockedHidden;
          return (
            <div
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${
                isToggleOn ? 'bg-green-500' : 'bg-gray-300'
              } ${isToggleDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => {
                if (isToggleDisabled) return;

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

                      {/* Show days input for Future and Past */}
                      {(item === 'Future' || item === 'Past') && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={item === 'Future' ? futureDays : pastDays}
                            onChange={(e) => {
                              const days = parseInt(e.target.value) || 1;
                              if (item === 'Future') {
                                setFutureDays(days);
                              } else {
                                setPastDays(days);
                              }
                            }}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                          />
                          <span className="text-xs text-gray-500">days</span>
                        </div>
                      )}

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
                  This order determines how appointments appear in the "Link Appointment" popup. For "Future" and "Past", specify how many days of appointments to display.
                </div>
              </div>
            </div>
          );

        case 'time-multiselect':
          const selectedTimes = Array.isArray(value) ? value : [];
          const maxSelections = 6;

          // For Daily appointment sync time (id 73 or 83), get options dynamically based on timezone
          const timeOptions = (setting.id === 73 || setting.id === 83)
            ? (() => {
                const timezoneSetting = moduleSettings['controls']?.settings.find(s => s.id === 20);
                const timezoneUserSetting = userId ? getUserSetting(userId, 'controls', 20) : null;
                const currentTimezone = timezoneUserSetting?.value || timezoneSetting?.default || 'Eastern (America/New York)';
                return getTimeOptionsForTimezone(currentTimezone);
              })()
            : setting.options;

          return (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-2">
                Select up to {maxSelections} sync times (selected: {selectedTimes.length}/{maxSelections})
                {(setting.id === 73 || setting.id === 83) && (() => {
                  const timezoneSetting = moduleSettings['controls']?.settings.find(s => s.id === 20);
                  const timezoneUserSetting = userId ? getUserSetting(userId, 'controls', 20) : null;
                  const currentTimezone = timezoneUserSetting?.value || timezoneSetting?.default || 'Eastern (America/New York)';
                  const tzLabel = currentTimezone.match(/\((.*?)\)/)?.[1] || currentTimezone;
                  return <span className="ml-2 text-xs text-gray-500">({tzLabel})</span>;
                })()}
              </div>

              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                {timeOptions.map(time => {
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

        case 'service-settings-combined':
          const enabledServices = Array.isArray(value) ? value : (setting.default || []);
          const defaultService = isUserOverride
            ? (userSetting?.defaultService || setting.defaultService)
            : (setting.defaultService || enabledServices[0]);

          const handleEnabledServicesChange = (service, isChecked) => {
            let newEnabledServices;
            if (isChecked) {
              newEnabledServices = [...enabledServices, service];
            } else {
              // Don't allow unchecking if it's the last one or if it's the default
              if (enabledServices.length === 1) return;
              if (service === defaultService) {
                alert('Cannot disable the default service. Please select a different default first.');
                return;
              }
              newEnabledServices = enabledServices.filter(s => s !== service);
            }

            if (isUserOverride && targetUserId) {
              setUserSetting(targetUserId, moduleId, setting.id, 'value', newEnabledServices);
            } else {
              updateSettingState(moduleId, setting.id, 'default', newEnabledServices);
            }
          };

          const handleDefaultServiceChange = (newDefault) => {
            if (isUserOverride && targetUserId) {
              setUserSetting(targetUserId, moduleId, setting.id, 'defaultService', newDefault);
            } else {
              updateSettingState(moduleId, setting.id, 'defaultService', newDefault);
            }
          };

          return (
            <div className="space-y-4">
              {/* Enabled Services Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enabled Service Settings
                </label>
                <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
                  {setting.options.map(service => {
                    const isEnabled = enabledServices.includes(service);
                    const isDefault = service === defaultService;

                    return (
                      <label
                        key={service}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          isEnabled
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-white hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => handleEnabledServicesChange(service, e.target.checked)}
                          disabled={isDefaultLockedHidden || (isDefault && enabledServices.length === 1)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm flex-1">{service}</span>
                        {isDefault && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  At least one service must be enabled. Selected: {enabledServices.length}
                </p>
              </div>

              {/* Default Service Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Service Setting
                </label>
                <select
                  value={defaultService}
                  onChange={(e) => handleDefaultServiceChange(e.target.value)}
                  disabled={isDefaultLockedHidden}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white hover:border-blue-300"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%232c3e50' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    paddingRight: '48px'
                  }}
                >
                  {enabledServices.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Default service must be one of the enabled services
                </p>
              </div>
            </div>
          );

        case 'dropdown':
          const dropdownOptions = setting.dependency === 41 ? availableOptions : setting.options;
          // Ensure the current value is in the available options for dependent dropdowns
          const needsDefaultUpdate = setting.dependency === 41 && !availableOptions.includes(value) && availableOptions.length > 0;

          // Auto-update to first available option if current value is not in available options
          if (needsDefaultUpdate && !isDefaultLockedHidden) {
            handleChange(availableOptions[0]);
          }

          // Check if this is Delete Consults setting and Custom is selected
          const isDeleteConsults = setting.id === 25;
          const isCustomSelected = value === 'Custom' || (value && value.startsWith('Custom:'));

          return (
            <div className="space-y-3">
              <select
                value={isCustomSelected ? 'Custom' : (needsDefaultUpdate ? availableOptions[0] : value)}
                onChange={(e) => {
                  if (e.target.value === 'Custom' && isDeleteConsults) {
                    // Don't change yet, wait for custom input
                    setCustomDeleteDays('');
                  } else {
                    handleChange(e.target.value);
                  }
                }}
                disabled={isDefaultLockedHidden}
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none ${
                  isDefaultLockedHidden ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white hover:border-blue-300'
                }`}
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

              {/* Show custom days input for Delete Consults when Custom is selected */}
              {isDeleteConsults && isCustomSelected && (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter number of days"
                    value={isCustomSelected && value.startsWith('Custom:') ? value.split(':')[1].trim().split(' ')[0] : customDeleteDays}
                    onChange={(e) => setCustomDeleteDays(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isDefaultLockedHidden}
                  />
                  <button
                    onClick={() => {
                      if (customDeleteDays && parseInt(customDeleteDays) > 0) {
                        handleChange(`Custom: ${customDeleteDays} days`);
                      }
                    }}
                    disabled={!customDeleteDays || parseInt(customDeleteDays) <= 0 || isDefaultLockedHidden}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
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
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <p className="text-sm text-blue-800">
                  Connect the Marvix app via <a href="https://marketplace.zoom.us" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-900">Zoom Marketplace</a>
                </p>
              </div>
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
              {(showUserOverride ? userLockState : setting.pmLockState) === 'locked-visible' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                  🔒 Locked by Practice
                </span>
              )}
              {(showUserOverride ? userLockState : setting.pmLockState) === 'locked-hidden' && (
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

          {/* Show lock controls based on view and user role */}
          {(currentView === 'settings' || showUserOverride) && (
            <div className="flex items-center gap-2 ml-6">
              <label className="text-xs font-medium text-gray-600 mr-2">
                {isMasterUser() ? 'Ops Lock:' : 'PM Lock:'}
              </label>
              <select
                value={showUserOverride ? userLockState : (isMasterUser() ? setting.opsLockState : setting.pmLockState)}
                onChange={(e) => {
                  if (showUserOverride && userId) {
                    const newLockState = e.target.value;

                    // Check if the resulting override would match BOTH default value and lock state
                    const wouldMatchDefault = doesOverrideMatchDefault(userId, moduleId, setting.id, undefined, newLockState);

                    if (wouldMatchDefault) {
                      // Cannot create an override that matches the default set
                      const currentValue = getUserSetting(userId, moduleId, setting.id)?.value || setting.default;
                      alert(getMatchingOverrideAlertMessage(currentValue, newLockState));
                      return;
                    }

                    // Check if this is a new override or if the lock state is different from practice default
                    const currentUserSetting = getUserSetting(userId, moduleId, setting.id);
                    const isDifferentFromDefault = newLockState !== setting.pmLockState;

                    if (isDifferentFromDefault) {
                      // Lock state differs from default, show confirmation modal
                      setPendingSettingChange({
                        userId: userId,
                        moduleId,
                        settingId: setting.id,
                        settingName: setting.name,
                        newValue: newLockState,
                        defaultValue: setting.pmLockState,
                        isLockStateChange: true
                      });
                      setShowOverrideConfirmModal(true);
                    } else {
                      // Lock state matches default - check if we should remove the override entirely
                      if (currentUserSetting && (currentUserSetting.value !== undefined || currentUserSetting.pmLockState !== undefined)) {
                        // User had an override, now setting lock state back to default
                        // If value also matches default, remove entire override
                        const currentValue = currentUserSetting.value !== undefined ? currentUserSetting.value : setting.default;
                        const valueMatchesDefault = valuesAreEqual(currentValue, setting.default);

                        if (valueMatchesDefault) {
                          // Both match, remove entire override
                          removeUserSetting(userId, moduleId, setting.id);
                        } else {
                          // Value differs, keep override but update lock state
                          setUserSetting(userId, moduleId, setting.id, 'pmLockState', newLockState);
                        }
                      }
                      // If no override exists and lock state = default, do nothing (stay at default)
                    }
                  } else {
                    // Master user updates opsLockState, PM user updates pmLockState
                    const lockStateProperty = isMasterUser() ? 'opsLockState' : 'pmLockState';
                    updateSettingState(moduleId, setting.id, lockStateProperty, e.target.value);
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

        {/* User Overrides Section - Only show in default settings view (not user-specific view) and not for master user */}
        {!isMasterUser() && !showUserOverride && (moduleId === 'note-settings' || moduleId === 'controls' || moduleId === 'ehr-settings-amd' || moduleId === 'ehr-settings-athena' || moduleId === 'em-settings') && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">User Overrides</h4>
                <p className="text-xs text-gray-500 mt-1">Customize this setting for specific users</p>
              </div>
              <button
                onClick={() => {
                  setCurrentOverrideSetting({ moduleId, settingId: setting.id, settingName: setting.name, settingType: setting.type, settingOptions: setting.options, defaultValue: setting.default });
                  setShowAddOverrideModal(true);
                }}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Add Override
              </button>
            </div>

            {(() => {
              const overrides = getSettingOverrides(moduleId, setting.id);
              return overrides.length > 0 ? (
                <div className="space-y-2">
                  {overrides.map((override) => {
                    const getLockStateColor = (lockState) => {
                      switch (lockState) {
                        case 'unlocked': return 'bg-green-100 text-green-700 border-green-300';
                        case 'locked-visible': return 'bg-orange-100 text-orange-700 border-orange-300';
                        case 'locked-hidden': return 'bg-red-100 text-red-700 border-red-300';
                        default: return 'bg-gray-100 text-gray-700 border-gray-300';
                      }
                    };

                    const getLockStateLabel = (lockState) => {
                      switch (lockState) {
                        case 'unlocked': return 'Unlocked';
                        case 'locked-visible': return 'Locked Visible';
                        case 'locked-hidden': return 'Locked Hidden';
                        default: return 'Unlocked';
                      }
                    };

                    return (
                      <div key={override.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">{override.userName}</p>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getLockStateColor(override.pmLockState)}`}>
                              {getLockStateLabel(override.pmLockState)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            Override value: <span className="font-semibold text-blue-700">
                              {Array.isArray(override.value) ? override.value.join(', ') : override.value}
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove override for ${override.userName}?`)) {
                              removeUserSetting(override.userId, moduleId, setting.id);
                            }
                          }}
                          className="ml-3 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 px-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-sm text-gray-500">No user overrides set for this setting</p>
                </div>
              );
            })()}
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
                  <div className="flex items-center gap-2">
                    <span>{module.name}</span>
                    {key === 'teleconsult-settings' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                        User Only
                      </span>
                    )}
                  </div>
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

          <button
            onClick={() => setCurrentView('retrieve-consults')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'retrieve-consults' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <RotateCcw className="w-5 h-5" />
            Retrieve Deleted Consults
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

  // Retrieve Deleted Consults View Component
  const RetrieveConsultsView = () => (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Retrieve Deleted Consults</h1>
          <p className="text-gray-600 text-lg">Search and retrieve consults deleted by doctors within the last 6 months</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          {/* Information Banner */}
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-900">Important Information</p>
                <p className="text-sm text-amber-800 mt-1">
                  Consults deleted by users are kept for <strong>6 months</strong> before permanent deletion. You can only retrieve consults deleted within this period. This feature is only accessible by Practice Managers.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Step 1: Doctor Selection */}
            <div className="border-l-4 border-blue-400 bg-blue-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-blue-800 mb-4">Step 1: Select Doctor</h4>
              <p className="text-sm text-blue-700 mb-4">
                First, select the doctor whose deleted consults you want to search.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Doctor *
                </label>
                <select
                  value={selectedRetrieveDoctor}
                  onChange={(e) => {
                    setSelectedRetrieveDoctor(e.target.value);
                    // Reset search fields when doctor changes
                    setDeletedConsults([]);
                    setRetrieveStartDate('');
                    setRetrieveEndDate('');
                    setSearchPatientName('');
                    setSelectedConsults([]);
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">-- Select a Doctor --</option>
                  {allUsers.filter(u => u.type === 'primary').map(doctor => (
                    <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Filter Options - Only show after doctor selected */}
            {selectedRetrieveDoctor && (
              <div className="border-l-4 border-green-400 bg-green-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-green-800 mb-4">Step 2: Filter Deleted Consults</h4>
                <p className="text-sm text-green-700 mb-4">
                  Use patient name and/or date range to filter deleted consults.
                </p>

                <div className="space-y-4">
                  {/* Patient Name Filter */}
                  <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={searchPatientName}
                      onChange={(e) => setSearchPatientName(e.target.value)}
                      placeholder="Enter patient name..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>

                  {/* Date Range Filter */}
                  <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                    <h5 className="text-sm font-semibold text-gray-900 mb-3">Date Range (Optional)</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={retrieveStartDate}
                          onChange={(e) => setRetrieveStartDate(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          min={new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={retrieveEndDate}
                          onChange={(e) => setRetrieveEndDate(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          min={retrieveStartDate || new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    // Get selected doctor name
                    const selectedDoctor = allUsers.find(u => u.id.toString() === selectedRetrieveDoctor);
                    const doctorName = selectedDoctor?.name || '';

                    // Mock data - in real app, this would fetch from backend
                    const mockDeletedConsults = [
                      {
                        id: 'CONS-2025-001',
                        consultId: 'CONS-2025-001',
                        patientName: 'John Doe',
                        deletedDate: '2025-10-15',
                        consultDate: '2025-10-10',
                        reason: 'Follow-up consultation',
                        doctorName: doctorName,
                        doctorId: selectedRetrieveDoctor,
                        canRetrieve: true
                      },
                      {
                        id: 'CONS-2025-002',
                        consultId: 'CONS-2025-002',
                        patientName: 'Jane Smith',
                        deletedDate: '2025-09-20',
                        consultDate: '2025-09-18',
                        reason: 'Initial consultation',
                        doctorName: doctorName,
                        doctorId: selectedRetrieveDoctor,
                        canRetrieve: true
                      },
                      {
                        id: 'CONS-2025-003',
                        consultId: 'CONS-2025-003',
                        patientName: 'Robert Johnson',
                        deletedDate: '2025-05-01',
                        consultDate: '2025-04-28',
                        reason: 'Annual checkup',
                        doctorName: doctorName,
                        doctorId: selectedRetrieveDoctor,
                        canRetrieve: false // Beyond 6 months
                      },
                      {
                        id: 'CONS-2025-004',
                        consultId: 'CONS-2025-004',
                        patientName: 'Emily Davis',
                        deletedDate: '2025-10-20',
                        consultDate: '2025-10-15',
                        reason: 'Routine checkup',
                        doctorName: doctorName,
                        doctorId: selectedRetrieveDoctor,
                        canRetrieve: true
                      },
                      {
                        id: 'CONS-2025-005',
                        consultId: 'CONS-2025-005',
                        patientName: 'Michael Brown',
                        deletedDate: '2025-11-01',
                        consultDate: '2025-10-28',
                        reason: 'Physical examination',
                        doctorName: doctorName,
                        doctorId: selectedRetrieveDoctor,
                        canRetrieve: true
                      },
                      {
                        id: 'CONS-2025-006',
                        consultId: 'CONS-2025-006',
                        patientName: 'Sarah Johnson',
                        deletedDate: '2025-11-05',
                        consultDate: '2025-11-02',
                        reason: 'Consultation for lab results',
                        doctorName: doctorName,
                        doctorId: selectedRetrieveDoctor,
                        canRetrieve: true
                      }
                    ];

                    // Filter logic
                    let filtered = mockDeletedConsults.filter(c => {
                      // Always filter by doctor
                      if (c.doctorId !== selectedRetrieveDoctor) return false;

                      // Only show retrievable consults (exclude permanently deleted ones beyond 6 months)
                      if (!c.canRetrieve) return false;

                      let matches = true;

                      // Filter by date range if provided
                      if (retrieveStartDate && retrieveEndDate) {
                        const deletedDate = new Date(c.deletedDate);
                        const start = new Date(retrieveStartDate);
                        const end = new Date(retrieveEndDate);
                        matches = matches && (deletedDate >= start && deletedDate <= end);
                      }

                      // Filter by patient name if provided
                      if (searchPatientName && searchPatientName.trim()) {
                        matches = matches && c.patientName.toLowerCase().includes(searchPatientName.toLowerCase().trim());
                      }

                      return matches;
                    });

                    setDeletedConsults(filtered);
                    setSelectedConsults([]); // Reset selection when new search is performed
                  }}
                  className="mt-4 px-6 py-3 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
              >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Search Deleted Consults
                  </div>
                </button>
              </div>
            )}

            {/* Results Section */}
            {deletedConsults.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-medium text-gray-900">
                    Deleted Consults ({deletedConsults.length} found)
                  </h5>

                  {/* Select All Checkbox */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="selectAll"
                      checked={deletedConsults.length > 0 && deletedConsults.every(c => selectedConsults.includes(c.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Select all consults
                          const allIds = deletedConsults.map(c => c.id);
                          setSelectedConsults(allIds);
                        } else {
                          // Deselect all
                          setSelectedConsults([]);
                        }
                      }}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="selectAll" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Select All
                    </label>
                  </div>
                </div>

                <div className="space-y-4 mb-4">
                  {deletedConsults.map((consult) => (
                    <div
                      key={consult.id}
                      className={`border rounded-lg p-5 ${
                        selectedConsults.includes(consult.id)
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={selectedConsults.includes(consult.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedConsults(prev => [...prev, consult.id]);
                              } else {
                                setSelectedConsults(prev => prev.filter(id => id !== consult.id));
                              }
                            }}
                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h6 className="font-semibold text-gray-900">{consult.patientName}</h6>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><span className="font-medium">Consult ID:</span> {consult.consultId}</p>
                            <p><span className="font-medium">Doctor:</span> {consult.doctorName}</p>
                            <p><span className="font-medium">Consult Date:</span> {new Date(consult.consultDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p><span className="font-medium">Deleted On:</span> {new Date(consult.deletedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p><span className="font-medium">Reason:</span> {consult.reason}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Retrieve Selected Button */}
                {selectedConsults.length > 0 && (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-sm text-gray-700">
                      <span className="font-semibold">{selectedConsults.length}</span> consult{selectedConsults.length !== 1 ? 's' : ''} selected
                    </div>
                    <button
                      onClick={() => {
                        // In real app, this would restore the selected consults
                        const selectedNames = deletedConsults
                          .filter(c => selectedConsults.includes(c.id))
                          .map(c => c.patientName)
                          .join(', ');
                        alert(`Retrieving ${selectedConsults.length} consult(s) for: ${selectedNames}`);

                        // Remove retrieved consults from the list
                        setDeletedConsults(prev => prev.filter(c => !selectedConsults.includes(c.id)));
                        setSelectedConsults([]);
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Retrieve Selected ({selectedConsults.length})
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {deletedConsults.length === 0 && retrieveStartDate && retrieveEndDate && selectedRetrieveDoctor && (
              <div className="border border-gray-200 rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-3">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600 font-medium">No deleted consults found</p>
                <p className="text-sm text-gray-500 mt-2">
                  No consults matching your search criteria were found for the selected doctor during the specified time period.
                </p>
              </div>
            )}
          </div>
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
                onClick={() => setShowAddUserTypeModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Add User
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Practice Management Dashboard</h1>
              <p className="text-sm text-gray-600">Configure settings and manage user access</p>
            </div>
          </div>

          {/* User Role Switcher */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Logged in as:</label>
            <select
              value={currentUserEmail}
              onChange={(e) => setCurrentUserEmail(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pm@practice.com">PM (Practice Manager)</option>
              <option value="ops@marvix.com">Ops (Master User)</option>
            </select>
            {isMasterUser() && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                MASTER
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        <LeftNavigation />
        {currentView === 'settings' ? (
          <SettingsView />
        ) : currentView === 'retrieve-consults' ? (
          <RetrieveConsultsView />
        ) : (
          <UserManagementView />
        )}
      </div>

      <EmailAttestationModal />
      <HipaaEmailConfirmModal />
      <SuspendAccountModal />
      <ResetPinModal />
      <LinkAccountModal />
      <AddUserTypeModal />
      <AddPrimaryAccountModal />
      <AddSecondaryAccountModal />
      <OverrideConfirmModal />
      <OverrideCleanupModal />
      <GoogleSignoutConfirmModal />
      <AddOverrideModal />
    </div>
  );
};

export default PracticeSettingsDashboard;
