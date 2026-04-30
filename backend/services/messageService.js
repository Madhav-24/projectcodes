// Module: Message Service
// Purpose: Messaging business logic — send messages with optional file attachments.
import path from 'path';
import AppError from '../utils/AppError.js';

export function createMessageService({ messageRepository }) {
  async function sendMessage({ senderId, senderName, senderRole, receiverId, text, files = [] }) {
    if (!senderId || !receiverId) {
      throw new AppError('senderId and receiverId are required.', 400);
    }
    if (!text?.trim() && files.length === 0) {
      throw new AppError('Message must have text or at least one attachment.', 400);
    }

    const message = await messageRepository.create({
      senderId,
      senderName,
      senderRole,
      receiverId,
      text: text?.trim() || '',
    });

    const attachments = [];
    for (const file of files) {
      const attachment = await messageRepository.addAttachment(message.id, {
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${path.basename(file.path)}`,
      });
      attachments.push(attachment);
    }

    return { ...message, attachments };
  }

  async function getMessagesForUser(userId) {
    return messageRepository.findByParticipant(userId);
  }

  return { sendMessage, getMessagesForUser };
}
