// Module: PPE Log Repository
// Purpose: Persist PPE events into PostgreSQL server logs via RAISE LOG.
import pool from '../db/pool.js';

export function createPpeLogRepository() {
  async function logPpeAlert({ alertId, helmet, vest, glove }) {
    await pool.query(
      `SELECT log_ppe_alert($1::uuid, $2::boolean, $3::boolean, $4::boolean)`,
      [alertId, helmet, vest, glove],
    );
  }

  return { logPpeAlert };
}
