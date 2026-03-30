import React, { useEffect, useState } from 'react';
import PracticeSettingsDashboard from './PracticeSettingsDashboard';
import AuthFlow from './components/auth/AuthFlow';
import { clearAuthSession, loadAuthSession } from './utils/authSession';
import { clearMasterUserSession, setMasterUserActive, startHeartbeat, stopHeartbeat } from './utils/masterUserSession';

function App() {
  const [session, setSession] = useState(() => loadAuthSession());

  const hardResetClientState = () => {
    clearAuthSession();
    clearMasterUserSession();
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      // Ignore storage access errors in restricted environments.
    }
    setSession(null);
    window.location.reload();
  };

  useEffect(() => {
    let heartbeatInterval;

    if (session?.role === 'ops') {
      setMasterUserActive(session.email);
      heartbeatInterval = startHeartbeat();
    } else {
      clearMasterUserSession();
    }

    return () => {
      if (heartbeatInterval) stopHeartbeat(heartbeatInterval);
    };
  }, [session?.role, session?.email]);

  useEffect(() => {
    let escapePressCount = 0;
    let resetTimer;

    const onKeyDown = (event) => {
      if (event.key !== 'Escape') {
        escapePressCount = 0;
        if (resetTimer) clearTimeout(resetTimer);
        return;
      }

      escapePressCount += 1;
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        escapePressCount = 0;
      }, 1200);

      // Keyboard fallback for cases where pointer interactions are blocked.
      if (escapePressCount >= 5) {
        hardResetClientState();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    clearMasterUserSession();
    setSession(null);
  };

  return (
    <div className="App">
      {session ? (
        <PracticeSettingsDashboard
          authSession={session}
          practiceId={session.practiceId}
          practiceName={session.practiceName}
          onLogout={handleLogout}
        />
      ) : (
        <AuthFlow onAuthenticated={setSession} />
      )}
      <button
        type="button"
        onClick={hardResetClientState}
        className="fixed bottom-4 right-4 z-[2147483647] px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded-md shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
        title="If UI is frozen, click to clear local state and reload"
      >
        Reset UI
      </button>
    </div>
  );
}

export default App;
