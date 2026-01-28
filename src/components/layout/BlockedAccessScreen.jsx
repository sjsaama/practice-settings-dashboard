/**
 * Blocked Access Screen Component
 *
 * Displayed when:
 * 1. PM user tries to access while master user is active
 * 2. Ops user tries to login while another Ops user is active
 *
 * @module BlockedAccessScreen
 */

import React, { useState, useEffect } from 'react';
import { Shield, Clock, AlertCircle } from 'lucide-react';
import {
  getFormattedSessionDuration,
  onMasterUserSessionChange
} from '../../utils/masterUserSession';

/**
 * Blocked Access Screen Component
 * @param {Object} props
 * @param {string} props.reason - Reason for blocking
 * @param {string} props.activeUser - Email of active master user
 * @param {string} props.userType - Type of blocked user ('pm' or 'ops')
 */
const BlockedAccessScreen = ({ reason, activeUser, userType = 'pm' }) => {
  const [duration, setDuration] = useState(getFormattedSessionDuration());
  const [dots, setDots] = useState('');

  // Update duration every second
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(getFormattedSessionDuration());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Listen for session changes to auto-refresh
  useEffect(() => {
    const cleanup = onMasterUserSessionChange((session) => {
      if (!session.isActive) {
        // Master user logged out, reload the page
        window.location.reload();
      }
    });

    return cleanup;
  }, []);

  const isPM = userType === 'pm';
  const isOps = userType === 'ops';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-20 animate-ping"></div>
            <div className="relative w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              {isPM ? (
                <Shield className="w-10 h-10 text-yellow-600" />
              ) : (
                <AlertCircle className="w-10 h-10 text-yellow-600" />
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {isPM ? 'System Maintenance in Progress' : 'Access Temporarily Unavailable'}
        </h2>

        {/* Reason */}
        <p className="text-gray-600 text-center mb-6">
          {reason}
        </p>

        {/* Active User Info */}
        {activeUser && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {isOps ? 'Another Ops User Active' : 'Operations Team Active'}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {activeUser}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Session Duration */}
        {duration && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Session Duration
                </p>
                <p className="text-sm text-gray-600">
                  {duration}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              {isPM ? 'Waiting for completion' : 'Checking availability'}
              <span className="inline-block w-8 text-left">{dots}</span>
            </span>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {isPM ? (
              <>
                System-wide configuration changes are being made.
                <br />
                This typically takes less than 5 minutes.
                <br />
                <strong>Your session will automatically refresh when complete.</strong>
              </>
            ) : (
              <>
                Only one Operations user can access the system at a time
                <br />
                to prevent configuration conflicts.
                <br />
                <strong>Please try again in a few minutes.</strong>
              </>
            )}
          </p>
        </div>

        {/* Manual Refresh Button */}
        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Check Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockedAccessScreen;
