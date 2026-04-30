// Module: Login Page
// Purpose: Authenticate users via email, employee ID, or phone number.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaLock, FaUser } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth.jsx';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const authenticated = await login(identifier, password);
      const destination = {
        admin: '/admin/dashboard',
        supervisor: '/supervisor/dashboard',
        engineer: '/engineer/dashboard',
        project_manager: '/project-manager/dashboard',
      }[authenticated?.role] || '/admin/dashboard';
      
      navigate(destination, { replace: true });
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_35%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(15,23,42,0.7))]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-20">
        <div className="w-full max-w-3xl rounded-[36px] border border-white/10 bg-white/95 p-10 shadow-2xl backdrop-blur-xl text-slate-900">
          <div className="grid gap-10">
            <div>
              <div className="flex flex-col items-center gap-4 px-4 sm:px-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-3xl text-blue-700 shadow-sm">
                  <span className="font-bold">L&T</span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Larsen & Toubro</p>
                  <p className="mt-2 text-sm text-slate-500">AI-Driven Road Safety & Quality Monitoring Platform</p>
                </div>
              </div>
              <div className="mt-8 rounded-[32px] border border-slate-200 bg-slate-50 p-8 shadow-sm">
                <h1 className="text-3xl font-semibold text-slate-900">Welcome to L&T</h1>
                <p className="mt-3 text-sm text-slate-500">Login with your L&T employee credentials.</p>
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>Email / Employee ID / Phone</span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                        <FaUser />
                      </span>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Email, Employee ID, or Phone Number"
                        required
                        className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>Password</span>
                      <button type="button" className="text-sm text-blue-600 transition hover:text-blue-800">Forgot Password?</button>
                    </div>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                        <FaLock />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-12 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-4 flex items-center text-slate-400"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="remember" className="text-sm text-slate-600">Remember me on this device</label>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign In To Dashboard →'}
                  </button>
                  <p className="text-center text-sm text-slate-500">
                    Demo admin: <span className="font-semibold text-slate-900">Madhav</span> | Email: <span className="font-semibold text-slate-900">admin@gmail.com</span> | Password: <span className="font-semibold text-slate-900">Admin@1234</span>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
