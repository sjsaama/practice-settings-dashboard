/**
 * Settings Context Module
 *
 * This context provides global state management for the Practice Settings Dashboard.
 * It manages:
 * - Current user and role (Master User vs Practice Manager)
 * - Module settings and their values
 * - User-specific setting overrides
 * - Helper functions for settings logic
 *
 * @module SettingsContext
 */

import React, { createContext, useContext, useState } from 'react';
import { MASTER_USER_EMAIL } from '../constants/userRoles';
import { settingsModules as initialSettingsModules } from '../data/settingsData';
import { initialUsers } from '../data/initialData';

/**
 * Settings Context
 * @type {React.Context}
 */
const SettingsContext = createContext(undefined);

/**
 * Settings Provider Component
 * Wraps the application and provides settings state and functions
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const SettingsProvider = ({ children }) => {
  // ==================== USER & ROLE STATE ====================

  /**
   * Current user's email address
   * Used to determine user role and permissions
   */
  const [currentUserEmail, setCurrentUserEmail] = useState('pm@practice.com');

  /**
   * Check if current user is the master user (Ops)
   * @returns {boolean} True if current user is master user
   */
  const isMasterUser = () => currentUserEmail === MASTER_USER_EMAIL;

  // ==================== SETTINGS STATE ====================

  /**
   * Current state of all module settings
   * Initialized from settingsModules data
   */
  const [moduleSettings, setModuleSettings] = useState(initialSettingsModules);

  /**
   * User-specific settings overrides
   * Key format: "${userId}-${moduleId}-${settingId}"
   * Value: { value, pmLockState, defaultService (for service-settings-combined) }
   */
  const [userSettingsOverrides, setUserSettingsOverrides] = useState({});

  // ==================== OVERRIDE CLEANUP STATE ====================

  /**
   * State for managing override cleanup when defaults change
   */
  const [showOverrideCleanupModal, setShowOverrideCleanupModal] = useState(false);
  const [overrideCleanupData, setOverrideCleanupData] = useState(null);

  // ==================== USER SETTING OVERRIDE FUNCTIONS ====================

  /**
   * Get user-specific setting override
   * @param {string|number} userId - User ID
   * @param {string} moduleId - Module ID
   * @param {number} settingId - Setting ID
   * @returns {Object|undefined} Override object or undefined if no override exists
   */
  const getUserSetting = (userId, moduleId, settingId) => {
    const key = `${userId}-${moduleId}-${settingId}`;
    return userSettingsOverrides[key];
  };

  /**
   * Set user-specific setting override
   * @param {string|number} userId - User ID
   * @param {string} moduleId - Module ID
   * @param {number} settingId - Setting ID
   * @param {string} property - Property to set (e.g., 'value', 'pmLockState', 'defaultService')
   * @param {any} value - New value for the property
   */
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

  /**
   * Get all overrides for a specific setting across all users
   * @param {string} moduleId - Module ID
   * @param {number} settingId - Setting ID
   * @returns {Array<Object>} Array of override objects with user information
   */
  const getSettingOverrides = (moduleId, settingId) => {
    const overrides = [];
    Object.keys(userSettingsOverrides).forEach(key => {
      // Match keys that end with -${moduleId}-${settingId}
      const suffix = `-${moduleId}-${settingId}`;
      if (key.endsWith(suffix)) {
        const userId = key.slice(0, -suffix.length);
        const override = userSettingsOverrides[key];
        if (override && override.value !== undefined) {
          const user = initialUsers.find(u => u.id.toString() === userId);
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

  /**
   * Remove user-specific setting override
   * @param {string|number} userId - User ID
   * @param {string} moduleId - Module ID
   * @param {number} settingId - Setting ID
   */
  const removeUserSetting = (userId, moduleId, settingId) => {
    const key = `${userId}-${moduleId}-${settingId}`;
    setUserSettingsOverrides(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Compare two values (handles arrays properly)
   * @param {any} value1 - First value
   * @param {any} value2 - Second value
   * @returns {boolean} True if values are equal
   */
  const valuesAreEqual = (value1, value2) => {
    if (Array.isArray(value1) && Array.isArray(value2)) {
      return JSON.stringify([...value1].sort()) === JSON.stringify([...value2].sort());
    }
    return value1 === value2;
  };

  /**
   * Format lock state for display
   * @param {string} lockState - Lock state value
   * @returns {string} Formatted lock state
   */
  const formatLockStateDisplay = (lockState) => {
    switch (lockState) {
      case 'unlocked': return 'Unlocked';
      case 'locked-visible': return 'Locked (Visible)';
      case 'locked-hidden': return 'Locked (Hidden)';
      default: return lockState;
    }
  };

  /**
   * Format value for display
   * @param {any} value - Value to format
   * @returns {string} Formatted value
   */
  const formatValueDisplay = (value) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  /**
   * Generate alert message for matching override attempts
   * @param {any} value - Setting value
   * @param {string} lockState - Lock state
   * @returns {string} Alert message
   */
  const getMatchingOverrideAlertMessage = (value, lockState) => {
    return `Cannot create an override that matches the practice default.

This setting would have:
• Value: ${formatValueDisplay(value)}
• Lock State: ${formatLockStateDisplay(lockState)}

Which is the same as the practice-wide default. An override must differ from the default.`;
  };

  /**
   * Check if an override matches the default settings
   * @param {string|number} userId - User ID
   * @param {string} moduleId - Module ID
   * @param {number} settingId - Setting ID
   * @param {any} newValue - New value to check
   * @param {string} newLockState - New lock state to check
   * @param {string} newDefaultService - New default service (for service-settings-combined)
   * @returns {boolean} True if override matches defaults
   */
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

  /**
   * Detect redundant overrides when default value or lock state changes
   * An override is redundant when BOTH value and lock state match the defaults
   *
   * @param {string} moduleId - Module ID
   * @param {number} settingId - Setting ID
   * @param {any} newDefaultValue - New default value
   * @param {string} settingType - Setting type
   * @param {boolean} isLockStateChange - Whether this is a lock state change
   * @returns {Array<Object>} Array of redundant overrides
   */
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

        const user = initialUsers.find(u => u.id.toString() === userId);
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

  /**
   * Remove multiple overrides at once
   * @param {Array<Object>} overridesToRemove - Array of override objects with userId
   * @param {string} moduleId - Module ID
   * @param {number} settingId - Setting ID
   */
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

  // ==================== SETTINGS UPDATE FUNCTION ====================

  /**
   * Update a setting's state (value, lock state, etc.)
   * Handles redundant override detection and cleanup
   *
   * @param {string} moduleId - Module ID
   * @param {number} settingId - Setting ID
   * @param {string} property - Property to update
   * @param {any} value - New value
   */
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

  // ==================== SETTINGS HELPER FUNCTIONS ====================

  /**
   * Get a specific setting
   * @param {string} moduleId - Module ID
   * @param {number} settingId - Setting ID
   * @returns {Object|undefined} Setting object
   */
  const getSetting = (moduleId, settingId) => {
    return moduleSettings[moduleId]?.settings.find(s => s.id === settingId);
  };

  /**
   * Check if a setting is enabled (based on dependencies)
   * @param {Object} setting - Setting object
   * @returns {boolean} True if setting is enabled
   */
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

  /**
   * Get available options for a setting (considering dependencies)
   * @param {Object} setting - Setting object
   * @returns {Array} Available options
   */
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

  // ==================== CONTEXT VALUE ====================

  const value = {
    // User & Role
    currentUserEmail,
    setCurrentUserEmail,
    isMasterUser,

    // Settings State
    moduleSettings,
    setModuleSettings,
    updateSettingState,

    // User Overrides
    userSettingsOverrides,
    setUserSettingsOverrides,
    getUserSetting,
    setUserSetting,
    getSettingOverrides,
    removeUserSetting,
    removeMultipleOverrides,

    // Helper Functions
    valuesAreEqual,
    formatLockStateDisplay,
    formatValueDisplay,
    getMatchingOverrideAlertMessage,
    doesOverrideMatchDefault,
    detectRedundantOverrides,
    getSetting,
    isSettingEnabled,
    getAvailableOptions,

    // Override Cleanup
    showOverrideCleanupModal,
    setShowOverrideCleanupModal,
    overrideCleanupData,
    setOverrideCleanupData
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Custom hook to use the Settings Context
 * @returns {Object} Settings context value
 * @throws {Error} If used outside of SettingsProvider
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
