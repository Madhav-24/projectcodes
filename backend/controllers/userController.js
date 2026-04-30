// Module: User Controller
// Purpose: Handle user HTTP requests and responses.
import { sendSuccess } from '../utils/apiResponse.js';
import AppError from '../utils/AppError.js';

export default function createUserController({ userService }) {
  if (!userService) {
    throw new Error('userService is required for userController');
  }

  async function listUsers(req, res) {
    const users = await userService.listUsers();
    return sendSuccess(res, 'Users fetched successfully.', users);
  }

  async function getUserById(req, res) {
    const user = await userService.getUserById(req.params.userId);
    return sendSuccess(res, 'User fetched successfully.', user);
  }

  async function updatePermissions(req, res) {
    const { permissions } = req.body;
    if (!permissions || typeof permissions !== 'object') {
      throw new AppError('permissions object is required.', 400);
    }
    const updated = await userService.updatePermissions(req.params.userId, permissions);
    return sendSuccess(res, 'Permissions updated.', updated);
  }

  return {
    listUsers,
    getUserById,
    updatePermissions,
  };
}
