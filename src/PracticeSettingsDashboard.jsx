import React, { useState, useEffect } from 'react';
import { Settings, Users, ChevronRight, Search, Shield, RotateCcw } from 'lucide-react';
import BlockedAccessScreen from './components/layout/BlockedAccessScreen';
import {
  EmailAttestationModal,
  SuspendAccountModal,
  ResetPinModal,
  GoogleSignoutConfirmModal
} from './components/dashboard/CommonModals';
import {
  HipaaEmailConfirmModal,
  OverrideConfirmModal,
  OverrideCleanupModal,
  OpsHideOverridesModal,
  OpsLockVisibleOverridesModal,
} from './components/dashboard/AdvancedModals';
import UserTypeModal from './components/dashboard/UserTypeModal';
import LinkedAssignmentModal from './components/dashboard/LinkedAssignmentModal';
import { AddPrimaryAccountModal, AddSecondaryAccountModal } from './components/dashboard/AccountModals';
import AddOverrideModal from './components/dashboard/AddOverrideModal';
import SettingRow from './components/dashboard/SettingRow';
import { settingsModules as initialSettingsModules } from './data/settingsData';
import { initialLinkedAssignments, initialUsers } from './data/initialData';
import {
  canLoginAsMasterUser,
  canPMAccess,
  onMasterUserSessionChange
} from './utils/masterUserSession';
import { canPMEditSetting } from './utils/accessPolicy';
import {
  getModuleSettingsStorageKey,
  loadModuleSettingsFromStorage,
  saveModuleSettingsToStorage
} from './utils/moduleSettingsStorage';
import {
  getUserSettingsOverridesStorageKey,
  loadUserSettingsOverridesFromStorage,
  saveUserSettingsOverridesToStorage,
} from './utils/userSettingsOverridesStorage';
import {
  loadLinkedAccountsFromStorage,
  saveLinkedAccountsToStorage,
} from './utils/linkedAccountsStorage';
import {
  getAssignmentAssigneeId,
  getAssignmentType,
  getAssignmentAssigneeType,
  isDuplicateAssignment,
  buildLinkedAssignmentCandidates,
  createLinkedAssignmentRecord,
} from './utils/linkedAssignments';
import {
  valuesAreEqual,
  getMatchingOverrideAlertMessage
} from './utils/validationHelpers';
import { normalizeDependentSettings } from './utils/settingsNormalization';
import { seededLinkedAssignmentCandidates } from './data/linkedAssignmentCandidates';

const PracticeSettingsDashboard = ({ authSession, practiceId, practiceName, onLogout }) => {
  // Auth (provided by App)
  const currentUserEmail = authSession?.email || 'pm@practice.com';
  const currentUserRole = authSession?.role || 'pm';
  const isMasterUser = () => currentUserRole === 'ops';

  // ==================== ACCESS CONTROL ====================

  // Check if current user is blocked
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [activeUser, setActiveUser] = useState('');
  const [isPMReadOnly, setIsPMReadOnly] = useState(false);
  const [activeOpsUser, setActiveOpsUser] = useState('');

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
  const [newLinkAssignmentType, setNewLinkAssignmentType] = useState('assistant'); // assistant | coverage
  const [linkDateError, setLinkDateError] = useState('');
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
  const [newUserPermissions, setNewUserPermissions] = useState({
    createConsults: true,
    mergeAndLinkAppointments: false,
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
  const [showCrossTabUpdateBanner, setShowCrossTabUpdateBanner] = useState(false);
  const [pendingCrossTabModuleSettings, setPendingCrossTabModuleSettings] = useState(null);
  const [showCrossTabOverridesBanner, setShowCrossTabOverridesBanner] = useState(false);
  const [pendingCrossTabOverrides, setPendingCrossTabOverrides] = useState(null);
  const [crossTabToast, setCrossTabToast] = useState(null);
  const [showOpsHideOverridesModal, setShowOpsHideOverridesModal] = useState(false);
  const [opsHideOverridesData, setOpsHideOverridesData] = useState(null);
  const [showOpsLockVisibleOverridesModal, setShowOpsLockVisibleOverridesModal] = useState(false);
  const [opsLockVisibleOverridesData, setOpsLockVisibleOverridesData] = useState(null);
  const [userSettingsOverrides, setUserSettingsOverrides] = useState(() => {
    const saved = loadUserSettingsOverridesFromStorage(practiceId);
    return saved || {};
  });
  const [linkedAccounts, setLinkedAccounts] = useState(() => {
    const saved = loadLinkedAccountsFromStorage(practiceId);
    if (saved) return saved;

    // Clone seeded data to keep module constants immutable.
    return initialLinkedAssignments.map((assignment) => ({ ...assignment }));
  });
  const [allUsers, setAllUsers] = useState(() => initialUsers.map((user) => ({ ...user })));

  const [showAddSecondaryAccountModal, setShowAddSecondaryAccountModal] = useState(false);
  const [newSecondaryAccount, setNewSecondaryAccount] = useState({
    name: '',
    role: '',
    email: '',
    permissions: {
      createConsults: true,
      mergeAndLinkAppointments: false,
      canGenerateNotes: false,
      editGeneratedNotes: false,
      pushToEHR: false
    }
  });

  // Initialize moduleSettings with lazy initializer
  const [moduleSettings, setModuleSettings] = useState(() => {
    const saved = loadModuleSettingsFromStorage(practiceId);
    if (saved) return saved;
    // Clone seeded module config so in-component updates don't mutate shared constants.
    return JSON.parse(JSON.stringify(initialSettingsModules));
  });

  // Persist module settings so Ops changes apply to PM sessions/tabs
  useEffect(() => {
    saveModuleSettingsToStorage(moduleSettings, practiceId);
  }, [moduleSettings, practiceId]);

  // Persist user overrides so behavior is consistent across sessions/tabs
  useEffect(() => {
    saveUserSettingsOverridesToStorage(userSettingsOverrides, practiceId);
  }, [userSettingsOverrides, practiceId]);

  // Persist linked secondary accounts per practice
  useEffect(() => {
    saveLinkedAccountsToStorage(linkedAccounts, practiceId);
  }, [linkedAccounts, practiceId]);

  // Normalize dependent settings to avoid invalid defaults (no updates during render)
  useEffect(() => {
    const { next, didChange } = normalizeDependentSettings(moduleSettings);

    if (didChange) {
      setModuleSettings(next);
    }
  }, [moduleSettings]);

  // Cross-tab sync: if Ops changes in another tab, update in this tab
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== getModuleSettingsStorageKey(practiceId)) return;
      if (!event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed && typeof parsed === 'object') {
          const isMidFlow =
            showAddOverrideModal ||
            showOverrideCleanupModal ||
            showOverrideConfirmModal ||
            showAddSecondaryAccountModal ||
            showAddPrimaryAccountModal ||
            showLinkAccountModal ||
            showSuspendModal ||
            showResetPinModal;

          if (isMidFlow) {
            setPendingCrossTabModuleSettings(parsed);
            setShowCrossTabUpdateBanner(true);
            return;
          }

          setModuleSettings(parsed);
          setCrossTabToast('Settings updated in another tab.');
        }
      } catch (e) {
        // Ignore malformed values
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [
    practiceId,
    showAddOverrideModal,
    showOverrideCleanupModal,
    showOverrideConfirmModal,
    showAddSecondaryAccountModal,
    showAddPrimaryAccountModal,
    showLinkAccountModal,
    showSuspendModal,
    showResetPinModal
  ]);

  // Cross-tab sync for user overrides
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== getUserSettingsOverridesStorageKey(practiceId)) return;
      if (!event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue);
        if (!parsed || typeof parsed !== 'object') return;

        const isMidFlow =
          showAddOverrideModal ||
          showOverrideCleanupModal ||
          showOverrideConfirmModal ||
          showAddSecondaryAccountModal ||
          showAddPrimaryAccountModal ||
          showLinkAccountModal ||
          showSuspendModal ||
          showResetPinModal;

        if (isMidFlow) {
          setPendingCrossTabOverrides(parsed);
          setShowCrossTabOverridesBanner(true);
          return;
        }

        setUserSettingsOverrides(parsed);
        setCrossTabToast('Overrides updated in another tab.');
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [
    practiceId,
    showAddOverrideModal,
    showOverrideCleanupModal,
    showOverrideConfirmModal,
    showAddSecondaryAccountModal,
    showAddPrimaryAccountModal,
    showLinkAccountModal,
    showSuspendModal,
    showResetPinModal
  ]);

  // Auto-clear cross-tab toast
  useEffect(() => {
    if (!crossTabToast) return;
    const t = setTimeout(() => setCrossTabToast(null), 3500);
    return () => clearTimeout(t);
  }, [crossTabToast]);

  // Validate access on mount and when user changes
  useEffect(() => {
    const checkAccess = () => {
      if (currentUserRole === 'ops') {
        // Check if another master user is active
        const { canLogin, reason, activeUser: activeMasterUser } = canLoginAsMasterUser(currentUserEmail);

        if (!canLogin) {
          setIsBlocked(true);
          setBlockReason(reason);
          setActiveUser(activeMasterUser);
          setIsPMReadOnly(false);
          setActiveOpsUser('');
          return;
        }
        setIsPMReadOnly(false);
        setActiveOpsUser('');
      } else {
        // PM can access dashboard, but becomes read-only while Ops is active.
        const { canAccess, reason, activeUser: activeMasterUser } = canPMAccess();
        setIsPMReadOnly(!canAccess);
        setActiveOpsUser(!canAccess ? activeMasterUser : '');
        setBlockReason(!canAccess ? reason : '');
      }

      // Access granted
      setIsBlocked(false);
      setActiveUser('');
    };

    // Check on mount and user change
    checkAccess();

    // Listen for session changes (cross-tab communication)
    const cleanup = onMasterUserSessionChange(() => {
      checkAccess();
    });

    return cleanup;
  }, [currentUserEmail, currentUserRole]);

  // Reset user view when user changes
  useEffect(() => {
    if (selectedUser) {
      setSelectedUserView(selectedUser.type === 'secondary' ? 'permissions' : 'link-secondary');
    }
  }, [selectedUser]);

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
    // PM is read-only while Ops session is active.
    if (!isMasterUser() && isPMReadOnly) return;

    // Defense-in-depth: PM can only create/edit overrides when Ops Lock is unlocked for that setting.
    if (!isMasterUser()) {
      const setting = moduleSettings[moduleId]?.settings.find(s => s.id === settingId);
      if (setting && setting.opsLockState !== 'unlocked') return;
    }

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
    if (!isMasterUser() && isPMReadOnly) return;
    if (!isMasterUser()) {
      const setting = moduleSettings[moduleId]?.settings.find((s) => s.id === settingId);
      if (setting && setting.opsLockState !== 'unlocked') return;
    }

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
    if (!isMasterUser() && isPMReadOnly) return;

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
    if (!isMasterUser() && isPMReadOnly) {
      return;
    }

    // Ops inheritance enforcement (source of truth):
    // When Ops locks a setting (locked-visible/locked-hidden), PM must not be able to:
    // - change defaults
    // - change pmLockState
    // - change defaultService (service-settings-combined)
    if (!isMasterUser()) {
      const setting = moduleSettings[moduleId]?.settings.find(s => s.id === settingId);
      const opsLocked = setting && !canPMEditSetting(setting);
      const parentSetting = setting?.dependency ? getSettingById(setting.dependency) : null;
      const parentOpsLocked = parentSetting && !canPMEditSetting(parentSetting);
      const pmAttemptingRestrictedChange =
        property === 'default' || property === 'pmLockState' || property === 'defaultService';

      if ((opsLocked || parentOpsLocked) && pmAttemptingRestrictedChange) {
        return;
      }

      // Dependency enforcement: if the dependency is currently disabled, PM should not be able to change the dependent.
      if (setting?.dependency && !isSettingEnabled(setting) && pmAttemptingRestrictedChange) {
        return;
      }
    }

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
  const getSettingById = (settingId) => {
    return Object.values(moduleSettings)
      .flatMap(module => module.settings)
      .find(s => s.id === settingId);
  };

  const isSettingEnabled = (setting) => {
    if (!setting.dependency) return true;

    const dependentSetting = getSettingById(setting.dependency);

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

  const applySettingProperty = (moduleId, settingId, property, value) => {
    setModuleSettings((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        settings: prev[moduleId].settings.map((setting) =>
          setting.id === settingId ? { ...setting, [property]: value } : setting
        )
      }
    }));
  };

  // Prototype helper: use currently selected module and first setting with overrides for modal demos.
  const getPrototypeOpsTarget = () => {
    const settings = moduleSettings[selectedModule]?.settings || [];
    if (!settings.length) return null;

    const withOverrides = settings.find((s) => getSettingOverrides(selectedModule, s.id).length > 0);
    const target = withOverrides || settings[0];

    return {
      moduleId: selectedModule,
      settingId: target.id,
      settingName: target.name,
      overridesToRemove: getSettingOverrides(selectedModule, target.id),
    };
  };

  const openPrototypeOpsHideFlow = () => {
    const target = getPrototypeOpsTarget();
    if (!target || target.overridesToRemove.length === 0) {
      setCrossTabToast('No overrides found in this module. Add an override to preview this flow.');
      return;
    }
    setOpsHideOverridesData(target);
    setShowOpsHideOverridesModal(true);
  };

  const openPrototypeOpsVisibleFlow = () => {
    const target = getPrototypeOpsTarget();
    if (!target || target.overridesToRemove.length === 0) {
      setCrossTabToast('No overrides found in this module. Add an override to preview this flow.');
      return;
    }
    setOpsLockVisibleOverridesData(target);
    setShowOpsLockVisibleOverridesModal(true);
  };

  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.specialty && user.specialty.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const availableLinkedAssignmentUsers = buildLinkedAssignmentCandidates(
    allUsers,
    selectedUser?.id,
    seededLinkedAssignmentCandidates
  );

  const selectedLinkedAssignmentUser = availableLinkedAssignmentUsers.find(
    (u) => String(u.id) === String(selectedNewUser)
  );

  const handleSaveLinkedAssignment = () => {
    if (!selectedLinkedAssignmentUser) return;

    const hasDuplicateAssignment = isDuplicateAssignment(linkedAccounts, {
      assigneeUserId: selectedLinkedAssignmentUser.id,
      doctorId: selectedUser.id,
      assignmentType: newLinkAssignmentType,
    });

    if (hasDuplicateAssignment) {
      setLinkDateError('This assignment already exists for the selected user and doctor.');
      return;
    }

    const newAccount = createLinkedAssignmentRecord({
      assigneeUser: selectedLinkedAssignmentUser,
      assignmentType: newLinkAssignmentType,
      permissions: newUserPermissions,
      doctorId: selectedUser.id,
      doctorName: selectedUser.name,
    });

    setLinkedAccounts((prev) => [...prev, newAccount]);
    setShowLinkAccountModal(false);
    setSelectedNewUser('');
    setNewLinkAssignmentType('assistant');
    setLinkDateError('');
    setNewUserPermissions({
      createConsults: true,
      mergeAndLinkAppointments: false,
      canGenerateNotes: false,
      editGeneratedNotes: false,
      pushToEHR: false
    });
  };

  const updateSecondaryPermission = (permission, value) => {
    setNewSecondaryAccount((prev) => {
      const updated = { ...prev, permissions: { ...prev.permissions, [permission]: value } };

      if (permission === 'canGenerateNotes' && !value) {
        updated.permissions.editGeneratedNotes = false;
        updated.permissions.pushToEHR = false;
      } else if (permission === 'editGeneratedNotes' && !value) {
        updated.permissions.pushToEHR = false;
      }

      return updated;
    });
  };

  const isSecondaryPermissionEnabled = (permission) => {
    switch (permission) {
      case 'createConsults':
      case 'canGenerateNotes':
      case 'mergeAndLinkAppointments':
        return true;
      case 'editGeneratedNotes':
        return newSecondaryAccount.permissions.canGenerateNotes;
      case 'pushToEHR':
        return newSecondaryAccount.permissions.canGenerateNotes && newSecondaryAccount.permissions.editGeneratedNotes;
      default:
        return false;
    }
  };

  const handleAddSecondaryAccount = () => {
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

    setAllUsers((prev) => [...prev, newAccount]);
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

  const handleAddPrimaryAccount = () => {
    if (!newPrimaryAccount.name || !newPrimaryAccount.specialty || !newPrimaryAccount.email) return;

    const newAccount = {
      id: `doctor${Date.now()}`,
      name: newPrimaryAccount.name,
      type: 'primary',
      specialty: newPrimaryAccount.specialty,
      email: newPrimaryAccount.email,
      linkedAccounts: []
    };

    if (primaryAccountType === 'copy' && copyFromDoctorId) {
      console.log(`Copying settings from doctor ${copyFromDoctorId} to new account`);
    }

    setAllUsers((prev) => [...prev, newAccount]);
    setShowAddPrimaryAccountModal(false);
    setPrimaryAccountType('');
    setCopyFromDoctorId('');
    setNewPrimaryAccount({
      name: '',
      specialty: '',
      email: ''
    });
  };

  // Modal Components

  // Setting row moved to dedicated component


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
        {showCrossTabOverridesBanner && pendingCrossTabOverrides && (
          <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-900">Override updates available</p>
                <p className="text-sm text-emerald-800 mt-1">
                  User overrides were updated in another tab. Apply updates now to stay in sync.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCrossTabOverridesBanner(false);
                    setPendingCrossTabOverrides(null);
                  }}
                  className="px-3 py-2 text-emerald-800 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-medium"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    setUserSettingsOverrides(pendingCrossTabOverrides);
                    setShowCrossTabOverridesBanner(false);
                    setPendingCrossTabOverrides(null);
                    setCrossTabToast('Applied override updates from another tab.');
                  }}
                  className="px-3 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  Apply overrides
                </button>
              </div>
            </div>
          </div>
        )}

        {showCrossTabUpdateBanner && pendingCrossTabModuleSettings && (
          <div className="mb-6 bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-indigo-900">Updates available</p>
                <p className="text-sm text-indigo-800 mt-1">
                  Settings were updated in another tab. Apply updates now to stay in sync.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCrossTabUpdateBanner(false);
                    setPendingCrossTabModuleSettings(null);
                  }}
                  className="px-3 py-2 text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    setModuleSettings(pendingCrossTabModuleSettings);
                    setShowCrossTabUpdateBanner(false);
                    setPendingCrossTabModuleSettings(null);
                    setCrossTabToast('Applied updates from another tab.');
                  }}
                  className="px-3 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Apply updates
                </button>
              </div>
            </div>
          </div>
        )}

        {crossTabToast && (
          <div className="mb-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow">
            <p className="text-sm">{crossTabToast}</p>
          </div>
        )}

        {isMasterUser() && (
          <div className="mb-6 bg-violet-50 border border-violet-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-violet-900">Prototype Flow Triggers (Ops)</p>
            <p className="text-xs text-violet-800 mt-1">
              Use these demo actions to preview modals for Ops lock/override cleanup.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={openPrototypeOpsHideFlow}
                className="px-3 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Preview: Ops Lock Hidden
              </button>
              <button
                onClick={openPrototypeOpsVisibleFlow}
                className="px-3 py-2 text-sm text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Preview: Ops Lock Visible
              </button>
            </div>
          </div>
        )}

        {!isMasterUser() && isPMReadOnly && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900 font-medium">
              Ops is active. Dashboard is currently in read-only mode.
            </p>
            <p className="text-xs text-amber-800 mt-1">
              {activeOpsUser ? `Active Ops user: ${activeOpsUser}. ` : ''}
              You can view settings, but editing is temporarily disabled.
            </p>
          </div>
        )}

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
          {moduleSettings[selectedModule]?.settings
            .filter(setting => {
              // Ops inheritance: PM should never see ops-locked-hidden settings
              if (!isMasterUser() && setting.opsLockState === 'locked-hidden') return false;
              return true;
            })
            .map(setting => (
            <SettingRow
              key={setting.id}
              setting={setting}
              moduleId={selectedModule}
              isSettingEnabled={isSettingEnabled}
              getAvailableOptions={getAvailableOptions}
              isMasterUser={isMasterUser}
              getSettingById={getSettingById}
              getUserSetting={getUserSetting}
              doesOverrideMatchDefault={doesOverrideMatchDefault}
              getMatchingOverrideAlertMessage={getMatchingOverrideAlertMessage}
              valuesAreEqual={valuesAreEqual}
              setPendingSettingChange={setPendingSettingChange}
              setShowOverrideConfirmModal={setShowOverrideConfirmModal}
              removeUserSetting={removeUserSetting}
              setUserSetting={setUserSetting}
              updateSettingState={updateSettingState}
              isPMReadOnly={isPMReadOnly}
              getSettingOverrides={getSettingOverrides}
              setCurrentOverrideSetting={setCurrentOverrideSetting}
              setShowAddOverrideModal={setShowAddOverrideModal}
              moduleSettings={moduleSettings}
              isGoogleSignedIn={isGoogleSignedIn}
              setIsGoogleSignedIn={setIsGoogleSignedIn}
              setShowGoogleSignoutModal={setShowGoogleSignoutModal}
              onRequestAttestation={() => setShowEmailModal(true)}
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
                  Linked Assignments
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
                    .filter(account => getAssignmentAssigneeId(account) === String(selectedUser.id))
                    .length > 0 ? (
                    <div className="space-y-4">
                      {linkedAccounts
                        .filter(account => getAssignmentAssigneeId(account) === String(selectedUser.id))
                        .map((link, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-gray-900 text-lg">{link.linkedToDoctorName}</p>
                                <p className="text-xs text-blue-700 mt-1">
                                  {getAssignmentType(link) === 'coverage' ? 'Coverage Assignment' : 'Assistant Assignment'}
                                  {' • '}
                                  {getAssignmentAssigneeType(link) === 'primary' ? 'Primary Assignee' : 'Secondary Assignee'}
                                </p>
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
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Linked Assignments</h3>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-400 bg-blue-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-800 mb-3">Assign Coverage or Assistant</h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Link a primary or secondary user to this doctor for temporary coverage or assistant support.
                    </p>
                    
                    <div className="space-y-4">
                      <button 
                        onClick={() => setShowLinkAccountModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Add Assignment
                      </button>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h5 className="font-medium text-gray-900 mb-4">Currently Linked Accounts</h5>
                    <div className="space-y-6">
                      {linkedAccounts
                        .filter((account) => account.linkedToDoctorId === selectedUser.id)
                        .map((account) => (
                        <div key={account.linkId || account.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-semibold text-gray-900">{account.name}</p>
                              <p className="text-sm text-gray-600">{account.role} • {account.email}</p>
                              <p className="text-xs text-blue-700 mt-1">
                                {getAssignmentType(account) === 'coverage' ? 'Coverage Assignment' : 'Assistant Assignment'}
                                {' • '}
                                {getAssignmentAssigneeType(account) === 'primary' ? 'Primary Assignee' : 'Secondary Assignee'}
                              </p>
                            </div>
                            <button 
                              onClick={() => setLinkedAccounts(prev => prev.filter(acc => (acc.linkId || acc.id) !== (account.linkId || account.id)))}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Unlink
                            </button>
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
              <h1 className="text-xl font-semibold text-gray-900">
                {practiceName ? `${practiceName} — Practice Management Dashboard` : 'Practice Management Dashboard'}
              </h1>
              <p className="text-sm text-gray-600">Configure settings and manage user access</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {currentUserEmail}
                {isMasterUser() && (
                  <span className="ml-2 px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full align-middle">
                    OPS
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-600">
                Practice: <span className="font-medium text-gray-800">{practiceName || practiceId || '—'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Logout
            </button>
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

      <EmailAttestationModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onAttest={() => {
          updateSettingState('controls', 22, 'default', 'True');
          setShowEmailModal(false);
        }}
      />
      <HipaaEmailConfirmModal
        open={showHipaaEmailConfirm}
        user={hipaaAttestationUser}
        onClose={() => {
          setShowHipaaEmailConfirm(false);
          setHipaaAttestationUser(null);
        }}
      />
      <SuspendAccountModal
        open={showSuspendModal}
        selectedUser={selectedUser}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={() => {
          setShowSuspendModal(false);
          alert('Account suspended successfully!');
        }}
      />
      <ResetPinModal
        open={showResetPinModal}
        selectedUser={selectedUser}
        onClose={() => setShowResetPinModal(false)}
      />
      <LinkedAssignmentModal
        open={showLinkAccountModal}
        availableUsers={availableLinkedAssignmentUsers}
        selectedUserData={selectedLinkedAssignmentUser}
        selectedNewUser={selectedNewUser}
        newLinkAssignmentType={newLinkAssignmentType}
        linkDateError={linkDateError}
        onClose={() => {
          setShowLinkAccountModal(false);
          setLinkDateError('');
        }}
        onSelectedUserChange={(value) => {
          setSelectedNewUser(value);
          setLinkDateError('');
        }}
        onAssignmentTypeChange={(value) => {
          setNewLinkAssignmentType(value);
          setLinkDateError('');
        }}
        onSave={handleSaveLinkedAssignment}
      />
      <UserTypeModal
        open={showAddUserTypeModal}
        onClose={() => setShowAddUserTypeModal(false)}
        onSelectPrimary={() => {
          setShowAddUserTypeModal(false);
          setShowAddPrimaryAccountModal(true);
        }}
        onSelectSecondary={() => {
          setShowAddUserTypeModal(false);
          setShowAddSecondaryAccountModal(true);
        }}
      />
      <AddPrimaryAccountModal
        open={showAddPrimaryAccountModal}
        allUsers={allUsers}
        primaryAccountType={primaryAccountType}
        copyFromDoctorId={copyFromDoctorId}
        newPrimaryAccount={newPrimaryAccount}
        onClose={() => {
          setShowAddPrimaryAccountModal(false);
          setPrimaryAccountType('');
          setCopyFromDoctorId('');
        }}
        onAccountTypeChange={setPrimaryAccountType}
        onCopyFromDoctorChange={setCopyFromDoctorId}
        onPrimaryFieldChange={(field, value) =>
          setNewPrimaryAccount((prev) => ({ ...prev, [field]: value }))
        }
        onAddDoctor={handleAddPrimaryAccount}
      />
      <AddSecondaryAccountModal
        open={showAddSecondaryAccountModal}
        newSecondaryAccount={newSecondaryAccount}
        onClose={() => setShowAddSecondaryAccountModal(false)}
        onFieldChange={(field, value) =>
          setNewSecondaryAccount((prev) => ({ ...prev, [field]: value }))
        }
        onTogglePermission={updateSecondaryPermission}
        isPermissionEnabled={isSecondaryPermissionEnabled}
        onAddAccount={handleAddSecondaryAccount}
      />
      <OverrideConfirmModal
        open={showOverrideConfirmModal}
        pendingSettingChange={pendingSettingChange}
        selectedUser={selectedUser}
        onCancel={() => {
          setShowOverrideConfirmModal(false);
          setPendingSettingChange(null);
        }}
        onConfirm={() => {
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
      />
      <OverrideCleanupModal
        open={showOverrideCleanupModal}
        data={overrideCleanupData}
        onCancel={() => {
          setShowOverrideCleanupModal(false);
          setOverrideCleanupData(null);
        }}
        onConfirm={() => {
          if (overrideCleanupData) {
            removeMultipleOverrides(
              overrideCleanupData.redundantOverrides,
              overrideCleanupData.moduleId,
              overrideCleanupData.settingId
            );

            setModuleSettings((prev) => ({
              ...prev,
              [overrideCleanupData.moduleId]: {
                ...prev[overrideCleanupData.moduleId],
                settings: prev[overrideCleanupData.moduleId].settings.map((setting) =>
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
      />
      <GoogleSignoutConfirmModal
        open={showGoogleSignoutModal}
        onCancel={() => setShowGoogleSignoutModal(false)}
        onConfirm={() => {
          setIsGoogleSignedIn(false);
          setShowGoogleSignoutModal(false);
          updateSettingState('teleconsult-settings', 71, 'default', false);
        }}
      />
      <AddOverrideModal
        open={showAddOverrideModal}
        currentOverrideSetting={currentOverrideSetting}
        allUsers={allUsers}
        isMasterUser={isMasterUser}
        isPMReadOnly={isPMReadOnly}
        moduleSettings={moduleSettings}
        hipaaAttestationChecked={hipaaAttestationChecked}
        setHipaaAttestationChecked={setHipaaAttestationChecked}
        setHipaaAttestationUser={setHipaaAttestationUser}
        setShowHipaaEmailConfirm={setShowHipaaEmailConfirm}
        getSettingOverrides={getSettingOverrides}
        getMatchingOverrideAlertMessage={getMatchingOverrideAlertMessage}
        doesOverrideMatchDefault={doesOverrideMatchDefault}
        setUserSetting={setUserSetting}
        onClose={() => {
          setShowAddOverrideModal(false);
          setCurrentOverrideSetting(null);
        }}
      />
      <OpsHideOverridesModal
        open={showOpsHideOverridesModal}
        data={opsHideOverridesData}
        onCancel={() => {
          setShowOpsHideOverridesModal(false);
          setOpsHideOverridesData(null);
        }}
        onConfirm={() => {
          if (opsHideOverridesData) {
            removeMultipleOverrides(
              opsHideOverridesData.overridesToRemove,
              opsHideOverridesData.moduleId,
              opsHideOverridesData.settingId
            );
            applySettingProperty(opsHideOverridesData.moduleId, opsHideOverridesData.settingId, 'opsLockState', 'locked-hidden');
            setCrossTabToast('Ops Lock set to Locked (Hidden). Overrides removed.');
          }
          setShowOpsHideOverridesModal(false);
          setOpsHideOverridesData(null);
        }}
      />
      <OpsLockVisibleOverridesModal
        open={showOpsLockVisibleOverridesModal}
        data={opsLockVisibleOverridesData}
        onCancel={() => {
          setShowOpsLockVisibleOverridesModal(false);
          setOpsLockVisibleOverridesData(null);
        }}
        onKeepOverrides={() => {
          if (opsLockVisibleOverridesData) {
            applySettingProperty(opsLockVisibleOverridesData.moduleId, opsLockVisibleOverridesData.settingId, 'opsLockState', 'locked-visible');
            setCrossTabToast('Ops Lock set to Locked (Visible). Overrides kept.');
          }
          setShowOpsLockVisibleOverridesModal(false);
          setOpsLockVisibleOverridesData(null);
        }}
        onRemoveAndLock={() => {
          if (opsLockVisibleOverridesData) {
            removeMultipleOverrides(
              opsLockVisibleOverridesData.overridesToRemove,
              opsLockVisibleOverridesData.moduleId,
              opsLockVisibleOverridesData.settingId
            );
            applySettingProperty(opsLockVisibleOverridesData.moduleId, opsLockVisibleOverridesData.settingId, 'opsLockState', 'locked-visible');
            setCrossTabToast('Ops Lock set to Locked (Visible). Overrides removed.');
          }
          setShowOpsLockVisibleOverridesModal(false);
          setOpsLockVisibleOverridesData(null);
        }}
      />
    </div>
  );
};

export default PracticeSettingsDashboard;
