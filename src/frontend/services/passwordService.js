// Module: Password Service
// Purpose: Handle password update flow via the REST API (PostgreSQL backend).
import { api } from '../../api/client.js';
import { PASSWORD_MIN_LENGTH } from '../constants/passwordPolicy.js';

export function validatePasswordChangeInput({ currentPassword, newPassword, confirmPassword }) {
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, message: 'All fields are required.' };
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return {
      success: false,
      message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, message: 'New password and confirm password do not match.' };
  }

  return { success: true, message: 'Validation passed.' };
}

export async function changePasswordForCurrentUser({ currentPassword, newPassword, confirmPassword }) {
  const validation = validatePasswordChangeInput({ currentPassword, newPassword, confirmPassword });
  if (!validation.success) {
    return validation;
  }

  try {
    await api.post('/api/auth/change-password', { currentPassword, newPassword });
    return { success: true, message: 'Password changed successfully.' };
  } catch (error) {
    if (error.statusCode === 401) {
      return { success: false, message: 'Current password is incorrect.', error };
    }
    return { success: false, message: error.message || 'Failed to change password. Please try again.', error };
  }
}

