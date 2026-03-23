import React, { useEffect, useState } from 'react';
import PracticeSettingsDashboard from './PracticeSettingsDashboard';
import AuthFlow from './components/auth/AuthFlow';
import { clearAuthSession, loadAuthSession } from './utils/authSession';
import { clearMasterUserSession, setMasterUserActive, startHeartbeat, stopHeartbeat } from './utils/masterUserSession';

function App() {
  const [session, setSession] = useState(() => loadAuthSession());

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
    </div>
  );
}

export default App;
