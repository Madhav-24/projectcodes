// Module: User Service
// Purpose: REST API data access layer for the users collection (PostgreSQL backend).
import { api } from '../api/client.js';

// Fetch all users ordered alphabetically by name
export async function getAllUsers() {
  try {
    return await api.get('/api/users');
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}

// Partially update only the permissions field for a given user ID
export async function updateUserPermissions(uid, permissions) {
  try {
    return await api.patch(`/api/users/${uid}/permissions`, { permissions });
  } catch (error) {
    console.error(`Failed to update permissions for user ${uid}:`, error);
    throw error;
  }
}

