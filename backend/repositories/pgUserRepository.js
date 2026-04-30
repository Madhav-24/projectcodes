// Module: PG User Repository
// Purpose: PostgreSQL implementation of the user data access layer.
import pool from '../db/pool.js';

export function createPgUserRepository() {
  async function findAll() {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY name');
    return rows;
  }

  async function findById(id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async function findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return rows[0] || null;
  }

  async function findByIdentifier(identifier) {
    const { rows } = await pool.query(
      `SELECT * FROM users
       WHERE LOWER(email) = LOWER($1)
          OR employee_id = $1
          OR phone_number = $1
       LIMIT 1`,
      [identifier],
    );
    return rows[0] || null;
  }

  async function create({ name, email, passwordHash, role, employeeId, phoneNumber, assignedSite, permissions }) {
    const { rows } = await pool.query(
      `INSERT INTO users
         (name, email, password_hash, role, employee_id, phone_number, assigned_site, permissions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name,
        email,
        passwordHash,
        role,
        employeeId || null,
        phoneNumber || null,
        assignedSite || null,
        JSON.stringify(permissions),
      ],
    );
    return rows[0];
  }

  async function updatePermissions(id, permissions) {
    const { rows } = await pool.query(
      `UPDATE users
       SET permissions = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(permissions), id],
    );
    return rows[0] || null;
  }

  async function updatePasswordHash(id, passwordHash) {
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, id],
    );
  }

  async function upsertById(id, data) {
    const { name, email, passwordHash, role, assignedSite, permissions, status } = data;
    const { rows } = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, assigned_site, permissions, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE
         SET name          = EXCLUDED.name,
             email         = EXCLUDED.email,
             password_hash = EXCLUDED.password_hash,
             role          = EXCLUDED.role,
             assigned_site = EXCLUDED.assigned_site,
             permissions   = EXCLUDED.permissions,
             status        = EXCLUDED.status,
             updated_at    = NOW()
       RETURNING *`,
      [id, name, email, passwordHash, role, assignedSite || null, JSON.stringify(permissions), status || 'active'],
    );
    return rows[0];
  }

  return { findAll, findById, findByEmail, findByIdentifier, create, updatePermissions, updatePasswordHash, upsertById };
}
