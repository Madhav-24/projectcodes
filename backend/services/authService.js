// Module: Auth Service
// Purpose: Authentication business logic — login, register, password management, token verification.
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';

const ROLES_REQUIRING_SITE = ['engineer', 'supervisor'];
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: Number(process.env.ARGON2_MEMORY_COST || 19456),
  timeCost: Number(process.env.ARGON2_TIME_COST || 2),
  parallelism: Number(process.env.ARGON2_PARALLELISM || 1),
};
const DEFAULT_PERMISSIONS = {
  canViewDashboard: true,
  canViewCharts: true,
  canMessageRoles: ['admin', 'supervisor', 'engineer', 'project_manager'],
};

export function createAuthService({ userRepository }) {
  // ── Login ────────────────────────────────────────────────────
  async function login(identifier, password) {
    const normalizedIdentifier = String(identifier || '').trim();
    const user = await userRepository.findByIdentifier(normalizedIdentifier);
    if (!user) throw new AppError('Invalid credentials.', 401);

    let valid = false;
    try {
      valid = await argon2.verify(user.password_hash, password);
    } catch {
      valid = false;
    }
    if (!valid) throw new AppError('Invalid credentials.', 401);

    const token = signToken(user);
    return { token, profile: sanitize(user) };
  }

  // ── Register ─────────────────────────────────────────────────
  async function register({ name, email, password, role, employeeId, phoneNumber, assignedSite }) {
    if (!name || !email || !password || !role) {
      throw new AppError('name, email, password and role are required.', 400);
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) throw new AppError('Email already registered.', 409);

    const normalizedRole = role.toLowerCase();
    const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);

    const user = await userRepository.create({
      name,
      email,
      passwordHash,
      role: normalizedRole,
      employeeId: employeeId || null,
      phoneNumber: phoneNumber || null,
      assignedSite: ROLES_REQUIRING_SITE.includes(normalizedRole) ? (assignedSite || null) : null,
      permissions: DEFAULT_PERMISSIONS,
    });

    return sanitize(user);
  }

  // ── Change Password ──────────────────────────────────────────
  async function changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new AppError('currentPassword and newPassword are required.', 400);
    }
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters.', 400);
    }

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found.', 404);

    let valid = false;
    try {
      valid = await argon2.verify(user.password_hash, currentPassword);
    } catch {
      valid = false;
    }
    if (!valid) throw new AppError('Current password is incorrect.', 401);

    const passwordHash = await argon2.hash(newPassword, ARGON2_OPTIONS);
    await userRepository.updatePasswordHash(userId, passwordHash);
  }

  // ── Seed admin on startup ─────────────────────────────────────
  async function seedAdmin() {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';
      const shouldSyncPassword = process.env.ADMIN_SYNC_ON_STARTUP !== 'false';
      const existing = await userRepository.findByEmail(adminEmail);
      if (!existing || shouldSyncPassword) {
        const passwordHash = await argon2.hash(adminPassword, ARGON2_OPTIONS);
        await userRepository.upsertById(existing?.id || '00000000-0000-0000-0000-000000000001', {
          name: existing?.name || 'Madhav',
          email: adminEmail,
          passwordHash,
          role: 'admin',
          assignedSite: 'All Sites',
          permissions: existing?.permissions || DEFAULT_PERMISSIONS,
          status: 'active',
        });
        console.log(existing ? 'Admin user synced.' : 'Admin user seeded.');
      }
    } catch (err) {
      console.error('Admin seed failed:', err.message);
    }
  }

  function signToken(user) {
    return jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );
  }

  function sanitize(user) {
    const { password_hash, ...safe } = user;
    return safe;
  }

  return { login, register, changePassword, seedAdmin };
}
