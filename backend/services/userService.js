// Module: User Service
// Purpose: Encapsulate user domain business operations.
import AppError from '../utils/AppError.js';
import { mapUserRecord } from '../models/userModel.js';

export default function createUserService({ userRepository }) {
  if (!userRepository) {
    throw new Error('userRepository is required for userService');
  }

  async function listUsers() {
    const records = await userRepository.findAll();
    return records.map(mapUserRecord);
  }

  async function getUserById(userId) {
    const record = await userRepository.findById(userId);
    if (!record) {
      throw new AppError('User not found.', 404);
    }
    return mapUserRecord(record);
  }

  async function updatePermissions(userId, permissions) {
    const record = await userRepository.updatePermissions(userId, permissions);
    if (!record) {
      throw new AppError('User not found.', 404);
    }
    return mapUserRecord(record);
  }

  return {
    listUsers,
    getUserById,
    updatePermissions,
  };
}
