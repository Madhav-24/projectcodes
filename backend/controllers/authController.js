// Module: Auth Controller
// Purpose: Handle authentication HTTP endpoints (login, register, me, change-password).
import { sendSuccess } from '../utils/apiResponse.js';
import AppError from '../utils/AppError.js';

export function createAuthController({ authService }) {
  async function login(req, res) {
    const { identifier, password } = req.body;
    if (!identifier || !password) throw new AppError('identifier and password are required.', 400);
    const result = await authService.login(identifier, password);
    return sendSuccess(res, 'Signed in successfully.', result);
  }

  async function register(req, res) {
    const { name, email, password, role, employeeId, phoneNumber, assignedSite } = req.body;
    const profile = await authService.register({ name, email, password, role, employeeId, phoneNumber, assignedSite });
    return sendSuccess(res, 'User created successfully.', profile, 201);
  }

  async function me(req, res) {
    return sendSuccess(res, 'Profile fetched.', req.userProfile);
  }

  async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    return sendSuccess(res, 'Password updated successfully.');
  }

  return { login, register, me, changePassword };
}
