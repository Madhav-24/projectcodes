// Module: Alert Repository
// Purpose: PostgreSQL data access for safety alert reports.
import pool from '../db/pool.js';

export function createAlertRepository() {
  async function create({ description }) {
    const { rows } = await pool.query(
      `INSERT INTO alerts (date, time, description)
       VALUES (CURRENT_DATE, CURRENT_TIME, $1)
       RETURNING *`,
      [description],
    );
    return rows[0];
  }

  async function findAll() {
    const { rows } = await pool.query('SELECT * FROM alerts ORDER BY alert_id DESC');
    return rows;
  }

  async function findVisibleTo() {
    return findAll();
  }

  return { create, findAll, findVisibleTo };
}
