// Module: Message Controller
// Purpose: Handle messaging HTTP endpoints with optional file upload.
import { sendSuccess } from '../utils/apiResponse.js';

export function createMessageController({ messageService }) {
  async function sendMessage(req, res) {
    const { receiverId, text } = req.body;
    const files = req.files || [];
    const message = await messageService.sendMessage({
      senderId: req.user.id,
      senderName: req.userProfile?.name || 'Unknown',
      senderRole: req.user.role,
      receiverId,
      text,
      files,
    });
    return sendSuccess(res, 'Message sent.', message, 201);
  }

  async function getMessages(req, res) {
    const messages = await messageService.getMessagesForUser(req.user.id);
    return sendSuccess(res, 'Messages fetched.', messages);
  }

  return { sendMessage, getMessages };
}
