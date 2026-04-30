// Module: Password Security Card
// Purpose: Provide reusable password change UI and behavior across roles.
import { useState } from 'react';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { changePasswordForCurrentUser } from '../../services/passwordService.js';

function PasswordField({ label, value, onChange, isVisible, onToggle, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">{label}</label>
      <div className="relative">
        <input
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="w-full rounded-3xl border border-slate-600 bg-slate-700/50 px-4 py-2.5 pr-11 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
        >
          {isVisible ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );
}

function PasswordSecurityCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const result = await changePasswordForCurrentUser({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      setErrorMessage(result.message);
      setLoading(false);
      return;
    }

    setSuccessMessage(result.message);
    toast.success(result.message);
    clearForm();
    setLoading(false);
  };

  return (
    <div className="max-w-lg">
      <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
        <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-white">
          <FaLock className="text-yellow-400" /> Security
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            isVisible={showCurrent}
            onToggle={() => setShowCurrent((value) => !value)}
            placeholder="Enter current password"
          />

          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            isVisible={showNew}
            onToggle={() => setShowNew((value) => !value)}
            placeholder="Enter new password"
          />

          <PasswordField
            label="Confirm Password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            isVisible={showConfirm}
            onToggle={() => setShowConfirm((value) => !value)}
            placeholder="Confirm new password"
          />

          {errorMessage && (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{errorMessage}</p>
          )}

          {successMessage && (
            <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{successMessage}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PasswordSecurityCard;
