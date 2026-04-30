// Module: Message Repository
// Purpose: PostgreSQL data access for user messages and attachments.
import pool from '../db/pool.js';

export function createMessageRepository() {
  async function create({ senderId, senderName, senderRole, receiverId, text }) {
    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, sender_name, sender_role, receiver_id, text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [senderId, senderName, senderRole, receiverId, text],
    );
    return rows[0];
  }

  async function addAttachment(messageId, { name, mimeType, size, url }) {
    const { rows } = await pool.query(
      `INSERT INTO message_attachments (message_id, name, mime_type, size, url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [messageId, name, mimeType, size, url],
    );
    return rows[0];
  }

  async function findByParticipant(userId) {
    const { rows } = await pool.query(
      `SELECT m.*,
         COALESCE(
           json_agg(
             json_build_object('id', ma.id, 'name', ma.name, 'type', ma.mime_type, 'size', ma.size, 'url', ma.url)
           ) FILTER (WHERE ma.id IS NOT NULL),
           '[]'
         ) AS attachments
       FROM messages m
       LEFT JOIN message_attachments ma ON ma.message_id = m.id
       WHERE m.sender_id = $1 OR m.receiver_id = $1
       GROUP BY m.id
       ORDER BY m.created_at DESC`,
      [userId],
    );
    return rows;
  }

  return { create, addAttachment, findByParticipant };
}
