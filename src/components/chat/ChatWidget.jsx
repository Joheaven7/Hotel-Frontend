import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    MessageCircle, X, Send, ChevronDown, Loader2,
    CheckCheck, Check, User,
} from 'lucide-react';
import apiClient from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { onSocketEvent, offSocketEvent } from '../../services/socket';
import { getSocket } from '../../services/socket';
import toast from 'react-hot-toast';

const ChatWidget = () => {
    const { user } = useAuthStore();
    const [open, setOpen] = useState(false);
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [unread, setUnread] = useState(0);
    const [staffTyping, setStaffTyping] = useState(false);
    const [staffJoined, setStaffJoined] = useState(false);
    const bottomRef = useRef(null);
    const typingTimer = useRef(null);

    // Only show for CUSTOMER role
    if (!user || user.role !== 'CUSTOMER') return null;

    // ── Load or create session ───────────────────────────────────────────────
    const initSession = useCallback(async () => {
        if (session) return;
        setLoading(true);
        try {
            const res = await apiClient.get('/chat/sessions?status=ACTIVE&status=WAITING');
            const existing = (res.data.sessions || [])[0];
            if (existing) {
                setSession(existing);
                loadMessages(existing._id);
                if (existing.assignedStaff) setStaffJoined(true);
                // Join socket room
                getSocket()?.emit('chat:join', { sessionId: existing._id });
            }
        } catch { }
        finally { setLoading(false); }
    }, [session]);

    const createSession = async () => {
        setLoading(true);
        try {
            const res = await apiClient.post('/chat/sessions', { subject: 'Support Request' });
            setSession(res.data.session);
            setMessages([]);
            getSocket()?.emit('chat:join', { sessionId: res.data.session._id });
        } catch (err) {
            toast.error('Failed to start chat');
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (sessionId) => {
        try {
            const res = await apiClient.get(`/chat/sessions/${sessionId}/messages`);
            setMessages(res.data.messages || []);
        } catch { }
    };

    // ── Open chat ────────────────────────────────────────────────────────────
    const handleOpen = () => {
        setOpen(true);
        setUnread(0);
        initSession();
        if (session) loadMessages(session._id);
    };

    // ── Socket listeners ────────────────────────────────────────────────────
    useEffect(() => {
        const handleMessage = (data) => {
            if (!session || data.sessionId !== session._id) return;
            setMessages((p) => [...p, data.message]);
            if (!open) setUnread((p) => p + 1);
        };

        const handleTyping = (data) => {
            if (!session || data.sessionId !== session._id) return;
            if (data.userId?.toString() !== user._id?.toString()) {
                setStaffTyping(data.isTyping);
                if (data.isTyping) {
                    setTimeout(() => setStaffTyping(false), 3000);
                }
            }
        };

        const handleStaffJoined = (data) => {
            if (!session || data.sessionId !== session._id) return;
            setStaffJoined(true);
            toast(`${data.staffName} joined the chat`, { icon: '👋', duration: 3000 });
        };

        const handleClosed = (data) => {
            if (!session || data.sessionId !== session._id) return;
            setSession((s) => s ? { ...s, status: 'CLOSED' } : s);
            toast('Chat session was closed', { duration: 4000 });
        };

        onSocketEvent('chat:message', handleMessage);
        onSocketEvent('chat:typing', handleTyping);
        onSocketEvent('chat:staffJoined', handleStaffJoined);
        onSocketEvent('chat:sessionClosed', handleClosed);

        return () => {
            offSocketEvent('chat:message', handleMessage);
            offSocketEvent('chat:typing', handleTyping);
            offSocketEvent('chat:staffJoined', handleStaffJoined);
            offSocketEvent('chat:sessionClosed', handleClosed);
        };
    }, [session, open, user._id]);

    // ── Auto-scroll ──────────────────────────────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, staffTyping]);

    // ── Send message ─────────────────────────────────────────────────────────
    const handleSend = async () => {
        if (!text.trim() || sending || !session) return;
        if (session.status === 'CLOSED') {
            toast.error('This session is closed. Please start a new one.');
            return;
        }

        setSending(true);
        // Optimistic update
        const optimistic = {
            _id: `tmp-${Date.now()}`,
            text: text.trim(),
            sender: { _id: user._id, firstName: user.firstName, lastName: user.lastName },
            createdAt: new Date().toISOString(),
            readBy: [{ userId: user._id }],
        };
        setMessages((p) => [...p, optimistic]);
        const outgoing = text.trim();
        setText('');

        try {
            const res = await apiClient.post(`/chat/sessions/${session._id}/messages`, { text: outgoing });
            // Replace optimistic with real
            setMessages((p) => p.map((m) => m._id === optimistic._id ? res.data.data : m));
        } catch {
            // Remove optimistic on failure
            setMessages((p) => p.filter((m) => m._id !== optimistic._id));
            setText(outgoing);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    // ── Typing indicator ─────────────────────────────────────────────────────
    const handleTyping = (val) => {
        setText(val);
        if (!session) return;
        getSocket()?.emit('chat:typing', { sessionId: session._id, isTyping: true });
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {
            getSocket()?.emit('chat:typing', { sessionId: session._id, isTyping: false });
        }, 2000);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isClosed = session?.status === 'CLOSED';

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-6 right-6 z-50">
                {!open && (
                    <button
                        onClick={handleOpen}
                        className="relative w-14 h-14 bg-primary text-white rounded-full shadow-elevated flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
                    >
                        <MessageCircle size={24} />
                        {unread > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                                {unread > 9 ? '9+' : unread}
                            </span>
                        )}
                    </button>
                )}
            </div>

            {/* Chat Panel */}
            {open && (
                <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 flex flex-col bg-surface border border-border rounded-2xl shadow-elevated overflow-hidden"
                    style={{ maxHeight: '520px' }}>

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-primary text-white">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <User size={16} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">LuxStay Support</p>
                                <p className="text-xs opacity-75">
                                    {!session ? 'Click below to start'
                                        : isClosed ? 'Session ended'
                                            : staffJoined ? 'Staff connected ●'
                                                : 'Waiting for staff…'}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background min-h-0"
                        style={{ maxHeight: '340px' }}>
                        {!session ? (
                            <div className="text-center py-8 space-y-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                    <MessageCircle size={24} className="text-primary" />
                                </div>
                                <p className="text-sm text-text-secondary">Start a conversation with our support team</p>
                                <button
                                    onClick={createSession}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 mx-auto"
                                >
                                    {loading ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                                    {loading ? 'Starting...' : 'Start Chat'}
                                </button>
                            </div>
                        ) : loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={20} className="text-primary animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Welcome message */}
                                <div className="text-center">
                                    <span className="text-xs text-text-secondary bg-border/40 px-3 py-1 rounded-full">
                                        {new Date(session.createdAt).toLocaleDateString()} — Support session started
                                    </span>
                                </div>

                                {messages.map((msg) => {
                                    const isMine = msg.sender?._id?.toString() === user._id?.toString()
                                        || msg.sender?.toString() === user._id?.toString();
                                    return (
                                        <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMine
                                                    ? 'bg-primary text-white rounded-br-sm'
                                                    : 'bg-white border border-border text-text-primary rounded-bl-sm'
                                                }`}>
                                                {!isMine && (
                                                    <p className="text-[10px] font-semibold text-primary mb-0.5">
                                                        {msg.sender?.firstName} {msg.sender?.role === 'STAFF' ? '· Staff' : ''}
                                                    </p>
                                                )}
                                                <p>{msg.text}</p>
                                                <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                    <span className="text-[10px] opacity-60">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isMine && (
                                                        msg.readBy?.length > 1
                                                            ? <CheckCheck size={11} className="opacity-60" />
                                                            : <Check size={11} className="opacity-40" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Typing indicator */}
                                {staffTyping && (
                                    <div className="flex justify-start">
                                        <div className="px-3 py-2 rounded-2xl bg-white border border-border rounded-bl-sm">
                                            <div className="flex gap-1 items-center h-4">
                                                {[0, 1, 2].map((i) => (
                                                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-bounce"
                                                        style={{ animationDelay: `${i * 0.15}s` }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={bottomRef} />
                            </>
                        )}
                    </div>

                    {/* Input */}
                    {session && !isClosed && (
                        <div className="p-3 border-t border-border bg-surface">
                            <div className="flex items-end gap-2">
                                <textarea
                                    value={text}
                                    onChange={(e) => handleTyping(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message…"
                                    rows={1}
                                    className="flex-1 px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none bg-background"
                                    style={{ maxHeight: '80px' }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!text.trim() || sending}
                                    className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                                >
                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {isClosed && (
                        <div className="p-3 border-t border-border text-center">
                            <p className="text-xs text-text-secondary mb-2">This session has ended</p>
                            <button
                                onClick={() => { setSession(null); setMessages([]); createSession(); }}
                                className="text-xs text-primary hover:underline font-medium"
                            >
                                Start a new chat
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default ChatWidget;