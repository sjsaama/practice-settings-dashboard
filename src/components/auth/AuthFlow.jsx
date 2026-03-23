import React, { useMemo, useState } from 'react';
import { Shield, KeyRound, Building2, LogIn } from 'lucide-react';
import { practices, opsPracticeAccess, pmPracticeBinding } from '../../data/practices';
import { saveAuthSession } from '../../utils/authSession';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function generateSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function AuthFlow({ onAuthenticated }) {
  const [step, setStep] = useState('login'); // login | mfa | selectPractice

  // Demo-only: allow explicit role selection via tabs
  const [selectedRole, setSelectedRole] = useState('pm'); // pm | ops

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [sentCode, setSentCode] = useState(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const [selectedPracticeId, setSelectedPracticeId] = useState('');

  const role = selectedRole;

  const availablePracticesForOps = useMemo(() => {
    const key = normalizeEmail(email);
    const allowed = opsPracticeAccess[key] || [];
    return practices.filter((p) => allowed.includes(p.id));
  }, [email]);

  const boundPracticeForPm = useMemo(() => {
    const key = normalizeEmail(email);
    const boundId = pmPracticeBinding[key] || null;
    if (!boundId) return null;
    return practices.find((p) => p.id === boundId) || null;
  }, [email]);

  const startMfa = () => {
    const newCode = generateSixDigitCode();
    setSentCode(newCode);
    setCode('');
    setCodeError('');
    setStep('mfa');
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    const normalized = normalizeEmail(email);
    if (!normalized) return setLoginError('Email is required.');
    if (!password) return setLoginError('Password is required.');

    // Demo-only credentials
    if (password !== 'marvix') {
      return setLoginError('Invalid email or password.');
    }

    if (role === 'ops') {
      if (!opsPracticeAccess[normalized]) {
        return setLoginError('Invalid email or password.');
      }
    } else {
      // PM must be auto-bound to a practice; fail on login (not after MFA).
      if (!pmPracticeBinding[normalized]) {
        return setLoginError('No practice assigned to this PM. Please contact an administrator.');
      }
    }

    // Always require MFA for demo
    startMfa();
  };

  const handleResendCode = () => {
    startMfa();
  };

  const completeAuth = ({ practice }) => {
    const session = {
      email: normalizeEmail(email),
      role,
      practiceId: practice?.id || null,
      practiceName: practice?.name || null,
      authenticatedAt: Date.now()
    };
    saveAuthSession(session);
    onAuthenticated?.(session);
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    setCodeError('');

    if (!sentCode) return setCodeError('No code has been sent. Please resend the code.');
    if (String(code).trim() !== String(sentCode)) return setCodeError('Invalid code.');

    if (role === 'ops') {
      if (availablePracticesForOps.length === 1) {
        completeAuth({ practice: availablePracticesForOps[0] });
      } else {
        setStep('selectPractice');
      }
      return;
    }

    // PM: auto-bound to a single practice
    if (!boundPracticeForPm) {
      setCodeError('No practice assigned to this PM. Please contact an administrator.');
      return;
    }
    completeAuth({ practice: boundPracticeForPm });
  };

  const handleSelectPracticeContinue = (e) => {
    e.preventDefault();
    const practice = practices.find((p) => p.id === selectedPracticeId);
    if (!practice) return;
    completeAuth({ practice });
  };

  const cardTitle =
    step === 'login' ? 'Sign in' : step === 'mfa' ? 'Enter code' : 'Select practice';

  const icon =
    step === 'login' ? <LogIn className="w-7 h-7 text-blue-600" /> :
    step === 'mfa' ? <KeyRound className="w-7 h-7 text-purple-600" /> :
    <Building2 className="w-7 h-7 text-emerald-600" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{cardTitle}</h2>
            <p className="text-sm text-slate-600 truncate">
              {step === 'login' ? 'Use your portal credentials.' : normalizeEmail(email)}
            </p>
          </div>
          <div className="ml-auto">
            <Shield className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        {step === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setSelectedRole('pm')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                  selectedRole === 'pm'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                PM
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('ops')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                  selectedRole === 'ops'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Ops
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="name@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Continue
            </button>

            <p className="text-xs text-slate-500">
              Demo: choose PM or Ops above. After Continue, a 6-digit code is “sent”. (We display it on the next screen.)
            </p>
          </form>
        )}

        {step === 'mfa' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              We sent a 6-digit code to your email.
              <div className="mt-1 text-xs text-slate-500">
                Demo code: <span className="font-mono text-slate-700">{sentCode || '------'}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono tracking-widest"
                placeholder="123456"
              />
            </div>

            {codeError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {codeError}
              </div>
            )}

            <button
              type="submit"
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Verify
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              className="w-full px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Resend code
            </button>
          </form>
        )}

        {step === 'selectPractice' && (
          <form onSubmit={handleSelectPracticeContinue} className="space-y-4">
            <div className="text-sm text-slate-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              You’re signed in as Ops. Select the practice you want to manage.
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Practice</label>
              <select
                value={selectedPracticeId}
                onChange={(e) => setSelectedPracticeId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select…</option>
                {availablePracticesForOps.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {role === 'ops' && availablePracticesForOps.length === 0 && (
                <p className="mt-2 text-xs text-red-600">
                  No practices are assigned to this Ops user.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedPracticeId}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

