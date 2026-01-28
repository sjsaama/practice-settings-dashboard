/**
 * Master User Session Management
 *
 * Handles exclusive master user access to prevent concurrent operations.
 * When a master user logs in:
 * - All PM users are blocked from accessing the system
 * - All other Ops users are blocked from logging in
 * - Only one master user can be active at a time
 *
 * @module masterUserSession
 */

const MASTER_SESSION_KEY = 'masterUserSession';
const SESSION_CHECK_INTERVAL = 3000; // Check every 3 seconds

/**
 * Master user session structure
 * @typedef {Object} MasterSession
 * @property {boolean} isActive - Whether a master user is currently logged in
 * @property {string} email - Email of the active master user
 * @property {number} startTime - Timestamp when session started
 * @property {number} lastHeartbeat - Last activity timestamp
 */

/**
 * Set master user as active
 * @param {string} email - Master user email
 */
export const setMasterUserActive = (email) => {
  const session = {
    isActive: true,
    email,
    startTime: Date.now(),
    lastHeartbeat: Date.now()
  };

  localStorage.setItem(MASTER_SESSION_KEY, JSON.stringify(session));

  // Dispatch custom event for real-time updates across tabs
  window.dispatchEvent(new CustomEvent('masterUserSessionChange', {
    detail: session
  }));
};

/**
 * Clear master user session
 */
export const clearMasterUserSession = () => {
  localStorage.removeItem(MASTER_SESSION_KEY);

  window.dispatchEvent(new CustomEvent('masterUserSessionChange', {
    detail: { isActive: false }
  }));
};

/**
 * Update master user heartbeat (keep session alive)
 */
export const updateMasterUserHeartbeat = () => {
  const session = getMasterUserSession();
  if (session && session.isActive) {
    session.lastHeartbeat = Date.now();
    localStorage.setItem(MASTER_SESSION_KEY, JSON.stringify(session));
  }
};

/**
 * Get current master user session
 * @returns {MasterSession|null} Current session or null
 */
export const getMasterUserSession = () => {
  const sessionData = localStorage.getItem(MASTER_SESSION_KEY);
  if (!sessionData) return null;

  try {
    const session = JSON.parse(sessionData);

    // Check if session is stale (no heartbeat for 30 seconds)
    const now = Date.now();
    const timeSinceHeartbeat = now - session.lastHeartbeat;
    const STALE_THRESHOLD = 30000; // 30 seconds

    if (timeSinceHeartbeat > STALE_THRESHOLD) {
      // Session is stale, clear it
      clearMasterUserSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error parsing master user session:', error);
    clearMasterUserSession();
    return null;
  }
};

/**
 * Check if master user is currently active
 * @returns {boolean} True if master user is active
 */
export const isMasterUserActive = () => {
  const session = getMasterUserSession();
  return session?.isActive === true;
};

/**
 * Check if current user can login as master user
 * @param {string} email - User email attempting to login
 * @returns {Object} { canLogin: boolean, reason: string, activeUser: string|null }
 */
export const canLoginAsMasterUser = (email) => {
  const session = getMasterUserSession();

  if (!session || !session.isActive) {
    return { canLogin: true, reason: null, activeUser: null };
  }

  if (session.email === email) {
    // Same user, can continue
    return { canLogin: true, reason: null, activeUser: null };
  }

  // Another master user is active
  return {
    canLogin: false,
    reason: 'Another Ops user is currently active',
    activeUser: session.email
  };
};

/**
 * Check if PM user can access system
 * @returns {Object} { canAccess: boolean, reason: string, activeUser: string|null }
 */
export const canPMAccess = () => {
  const session = getMasterUserSession();

  if (!session || !session.isActive) {
    return { canAccess: true, reason: null, activeUser: null };
  }

  // Master user is active, PM cannot access
  return {
    canAccess: false,
    reason: 'System maintenance in progress',
    activeUser: session.email
  };
};

/**
 * Start heartbeat interval to keep session alive
 * @returns {number} Interval ID
 */
export const startHeartbeat = () => {
  return setInterval(() => {
    updateMasterUserHeartbeat();
  }, SESSION_CHECK_INTERVAL);
};

/**
 * Stop heartbeat interval
 * @param {number} intervalId - Interval ID to clear
 */
export const stopHeartbeat = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
  }
};

/**
 * Listen for master user session changes
 * @param {Function} callback - Callback function to call on session change
 * @returns {Function} Cleanup function to remove listener
 */
export const onMasterUserSessionChange = (callback) => {
  const handleChange = (event) => {
    callback(event.detail);
  };

  window.addEventListener('masterUserSessionChange', handleChange);

  // Also listen for storage changes from other tabs
  const handleStorageChange = (event) => {
    if (event.key === MASTER_SESSION_KEY) {
      const session = getMasterUserSession();
      callback(session || { isActive: false });
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Return cleanup function
  return () => {
    window.removeEventListener('masterUserSessionChange', handleChange);
    window.removeEventListener('storage', handleStorageChange);
  };
};

/**
 * Get session duration in seconds
 * @returns {number|null} Duration in seconds or null if no active session
 */
export const getSessionDuration = () => {
  const session = getMasterUserSession();
  if (!session || !session.isActive) return null;

  return Math.floor((Date.now() - session.startTime) / 1000);
};

/**
 * Format session duration for display
 * @returns {string|null} Formatted duration (e.g., "2m 30s") or null
 */
export const getFormattedSessionDuration = () => {
  const duration = getSessionDuration();
  if (duration === null) return null;

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};
