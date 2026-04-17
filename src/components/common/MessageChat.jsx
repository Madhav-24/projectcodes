import { useEffect, useMemo, useRef, useState } from 'react';
import { FaSearch, FaPaperclip, FaCamera, FaPaperPlane, FaTimes, FaFileAlt, FaFileImage, FaFileVideo, FaFileAudio } from 'react-icons/fa';
import { collection, getFirestore, onSnapshot, orderBy, query } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import app from '../../firebase/firebaseConfig.js';
import { useAuthContext } from '../../context/AuthContext.jsx';

const db = getFirestore(app);
const storage = getStorage(app);
const ATTACHMENT_ACCEPT = 'image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain';

function MessageChat({ excludeRole }) {
  const { profile, sendMessage } = useAuthContext();
  const [messages, setMessages] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [lastReadTimestamps, setLastReadTimestamps] = useState({});
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem(`messages_read_${profile?.uid}`);
    if (stored) {
      setLastReadTimestamps(JSON.parse(stored));
    }
  }, [profile?.uid]);

  const saveLastReadTimestamps = (timestamps) => {
    setLastReadTimestamps(timestamps);
    localStorage.setItem(`messages_read_${profile?.uid}`, JSON.stringify(timestamps));
  };

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const recipientsQuery = query(collection(db, 'users'));
    const unsubscribeRecipients = onSnapshot(recipientsQuery, (snapshot) => {
      setRecipients(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubscribeRecipients();
    };
  }, []);

  const availableRecipients = useMemo(() => {
    return recipients.filter(
      (user) => user.role !== excludeRole && user.id !== profile?.uid
    );
  }, [recipients, excludeRole, profile?.uid]);

  const handleSelectRecipient = (recipientId) => {
    setSelectedRecipient(recipientId);
    const newTimestamps = { ...lastReadTimestamps, [recipientId]: Date.now() };
    saveLastReadTimestamps(newTimestamps);
  };

  useEffect(() => {
    if (!selectedRecipient && availableRecipients.length > 0) {
      handleSelectRecipient(availableRecipients[0].id);
    }
  }, [availableRecipients, selectedRecipient]);

  const filteredRecipients = useMemo(() => {
    let filtered = availableRecipients.filter((recipient) =>
      recipient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipient.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered = filtered.map((recipient) => {
      const unreadCount = messages.filter(
        (message) =>
          message.senderId === recipient.id &&
          message.receiverId === profile?.uid &&
          (!lastReadTimestamps[recipient.id] || message.timestamp?.toDate?.() > new Date(lastReadTimestamps[recipient.id]))
      ).length;
      return { ...recipient, unreadCount };
    });

    filtered.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    return filtered;
  }, [availableRecipients, searchQuery, messages, profile?.uid, lastReadTimestamps]);

  const selectedContact = availableRecipients.find((recipient) => recipient.id === selectedRecipient);

  const currentChatMessages = messages.filter(
    (message) =>
      (message.receiverId === selectedRecipient && message.senderId === profile?.uid) ||
      (message.senderId === selectedRecipient && message.receiverId === profile?.uid)
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatMessages]);

  const handleAttachments = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const nextAttachments = files.map((file) => ({
      id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));

    setAttachments((current) => [...current, ...nextAttachments]);
  };

  const removeAttachment = (attachmentId) => {
    setAttachments((current) => {
      const next = current.filter((item) => item.id !== attachmentId);
      const removed = current.find((item) => item.id === attachmentId);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return next;
    });
  };

  useEffect(() => {
    return () => {
      attachments.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview);
      });
    };
  }, [attachments]);

  const uploadAttachment = async (file) => {
    const path = `messageAttachments/${profile?.uid}/${Date.now()}_${file.name}`;
    const storageReference = storageRef(storage, path);
    const snapshot = await uploadBytesResumable(storageReference, file);
    const url = await getDownloadURL(snapshot.ref);
    return {
      name: file.name,
      type: file.type,
      size: file.size,
      url,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedRecipient || (!inputMessage.trim() && attachments.length === 0)) return;

    setSending(true);
    try {
      await sendMessage(
        selectedRecipient,
        inputMessage,
        attachments.map((attachment) => attachment.file)
      );
      setInputMessage('');
      attachments.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview);
      });
      setAttachments([]);
    } catch (error) {
      console.error('Error sending message with attachments:', error);
    } finally {
      setSending(false);
    }
  };

  const renderAttachmentPreview = (attachment) => {
    const { url, type, name } = attachment;
    if (type?.startsWith('image/')) {
      return <img src={url} alt={name} className="mx-auto max-h-40 rounded-2xl object-cover" />;
    }
    if (type?.startsWith('video/')) {
      return (
        <video controls src={url} className="mx-auto max-h-40 rounded-2xl" />
      );
    }
    if (type?.startsWith('audio/')) {
      return <audio controls src={url} className="w-full" />;
    }
    return (
      <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-3xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500">
        <FaFileAlt />
        {name}
      </a>
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-6 xl:flex-row xl:items-stretch">
      <div className="flex w-full max-w-full flex-col overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900 shadow-card xl:w-[340px] xl:max-h-[calc(100vh-8rem)]">
        <div className="border-b border-slate-800 px-6 py-5">
          <h3 className="text-lg font-semibold text-white">Contacts</h3>
          <p className="mt-1 text-sm text-slate-400">Tap a contact to open the chat.</p>
        </div>
        <div className="flex items-center gap-3 border-b border-slate-800 bg-slate-950 px-5 py-4">
          <FaSearch className="text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts"
            className="w-full bg-slate-950 text-sm text-slate-200 outline-none placeholder:text-slate-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {filteredRecipients.length === 0 ? (
            <p className="text-sm text-slate-500">No contacts found.</p>
          ) : (
            <div className="space-y-3">
              {filteredRecipients.map((recipient) => (
                <button
                  key={recipient.id}
                  onClick={() => handleSelectRecipient(recipient.id)}
                  className={`flex w-full items-center gap-4 rounded-3xl px-4 py-3 text-left transition ${
                    selectedRecipient === recipient.id
                      ? 'bg-blue-600/20 text-white'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-500/20 text-blue-300 relative">
                    {recipient.name?.charAt(0) || recipient.role?.charAt(0)}
                    {recipient.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white">
                        {recipient.unreadCount > 9 ? '9+' : recipient.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{recipient.name || 'Unknown'}</p>
                    <p className="text-sm text-slate-500 truncate">{recipient.role?.charAt(0).toUpperCase() + recipient.role?.slice(1)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900 shadow-card max-h-[calc(100vh-8rem)]">
        <div className="border-b border-slate-800 px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{selectedContact?.name || 'Select a contact'}</h3>
              <p className="mt-1 text-sm text-slate-400">
                {selectedContact
                  ? selectedContact.role?.charAt(0).toUpperCase() + selectedContact.role?.slice(1)
                  : 'Choose a contact to start chatting.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
          <div className="flex flex-col min-h-0 space-y-4">
            {currentChatMessages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/80 p-8 text-center text-slate-500">
                {selectedContact ? 'No messages yet. Send the first message.' : 'Select a contact to view messages.'}
              </div>
            ) : (
              currentChatMessages.map((message) => {
                const isMe = message.senderId === profile?.uid;
                return (
                  <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] overflow-hidden rounded-3xl p-4 text-sm shadow-sm ${
                      isMe ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-100'
                    }`}>
                      {!isMe && (
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                          {selectedContact?.name || 'Contact'}
                        </p>
                      )}
                      <div className="space-y-3">
                        {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
                        {message.attachments?.length > 0 && (
                          <div className="space-y-3">
                            {message.attachments.map((attachment, index) => (
                              <div key={`${attachment.url}-${index}`} className="rounded-3xl border border-slate-700 bg-slate-950 p-3">
                                {renderAttachmentPreview(attachment)}
                                {!attachment.type?.startsWith('image/') && !attachment.type?.startsWith('video/') && !attachment.type?.startsWith('audio/') && (
                                  <p className="mt-2 text-xs text-slate-400">{attachment.name}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className={`mt-3 text-right text-[11px] ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                        {new Date(message.timestamp?.toDate?.() || message.timestamp || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="border-t border-slate-800 px-6 py-5">
          {attachments.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200">
                  {attachment.type.startsWith('image/') ? <FaFileImage /> : attachment.type.startsWith('video/') ? <FaFileVideo /> : attachment.type.startsWith('audio/') ? <FaFileAudio /> : <FaFileAlt />}
                  <span className="truncate max-w-[10rem]">{attachment.name}</span>
                  <button type="button" onClick={() => removeAttachment(attachment.id)} className="text-slate-400 hover:text-slate-100">
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 rounded-3xl bg-slate-950 px-4 py-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 transition hover:bg-slate-700"
                aria-label="Attach file"
              >
                <FaPaperclip />
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 transition hover:bg-slate-700"
                aria-label="Capture photo"
              >
                <FaCamera />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ATTACHMENT_ACCEPT}
                className="hidden"
                onChange={(event) => {
                  handleAttachments(event.target.files);
                  event.target.value = null;
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  handleAttachments(event.target.files);
                  event.target.value = null;
                }}
              />
              <input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={selectedContact ? `Message ${selectedContact.name}` : 'Select a contact first'}
                disabled={!selectedContact}
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={!selectedContact || (!inputMessage.trim() && attachments.length === 0) || sending}
              className="inline-flex h-12 items-center justify-center rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? 'Sending...' : <><FaPaperPlane className="mr-2" />Send</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MessageChat;
