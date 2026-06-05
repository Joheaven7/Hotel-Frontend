import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    MessageCircle, Send, Users, Clock, CheckCheck,
    Check, Loader2, Circle, X, Hash, ChevronRight, UserPlus
} from 'lucide-react';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';
import { onSocketEvent, offSocketEvent, getSocket } from '../services/socket';
import PageHeader from '../components/ui/PageHeader';
import toast from 'react-hot-toast';

const DEPARTMENTS = [
    { id: 'front_desk', name: 'Front Desk' },
    { id: 'housekeeping', name: 'Housekeeping' },
    { id: 'maintenance', name: 'Maintenance' },
    { id: 'management', name: 'Management' },
];

const ChatPage = () => {
    const { user } = useAuthStore();
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [activeDept, setActiveDept] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [typingStatus, setTypingStatus] = useState({ isTyping: false, userName: '' });
    const [activeTab, setActiveTab] = useState('support'); // 'support' or 'department'

    const messagesEndRef = useRef(null);
    const typingTimer = useRef(null);

    // ── Fetch Support Sessions ───────────────────────────────────────────────
    const fetchSessions = useCallback(async () => {
        try {
            const res = await apiClient.get('/chat/sessions');
            setSessions(res.data.sessions || []);
        } catch (err) {
            toast.error('Failed to load chat channels');
        } finally {
            setLoadingSessions(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    // ── Load Channel Content ──────────────────────────────────────────────────
    const loadSessionMessages = async (id) => {
        setLoadingMessages(true);
        try {
            const res = await apiClient.get(`/chat/sessions/${id}/messages`);
            setMessages(res.data.messages || []);
            setSessions((prev) =>
                prev.map((s) => (s._id === id ? { ...s, unreadByStaff: 0 } : s))
            );
        } catch (err) {
            toast.error('Could not load messages');
        } finally {
            setLoadingMessages(false);
        }
    };

    const loadDeptMessages = async (deptId) => {
        setLoadingMessages(true);
        try {
            const res = await apiClient.get(`/chat/department/${deptId}`);
            setMessages(res.data.messages || []);
        } catch (err) {
            toast.error('Could not load department history');
        } finally {
            setLoadingMessages(false);
        }
    };

    // ── Room Navigation Switchers ────────────────────────────────────────────
    const handleSelectSession = (session) => {
        if (activeSession) {
            getSocket()?.emit('chat:leave', { sessionId: activeSession._id });
        }
        setActiveDept(null);
        setActiveSession(session);
        loadSessionMessages(session._id);
        getSocket()?.emit('chat:join', { sessionId: session._id });
    };

    const handleSelectDept = (deptId) => {
        if (activeSession) {
            getSocket()?.emit('chat:leave', { sessionId: activeSession._id });
            setActiveSession(null);
        }
        setActiveDept(deptId);
        loadDeptMessages(deptId);
        getSocket()?.emit('chat:joinDept', { department: deptId });
    };

    // ── Socket Core Events Listener Sync ─────────────────────────────────────
    useEffect(() => {
        const handleNewSession = (data) => {
            setSessions((prev) => [data.session, ...prev]);
            toast(`New chat request from ${data.customerName}`, { icon: '💬' });
        };

        const handleIncomingMessage = (data) => {
            if (activeSession && data.sessionId === activeSession._id) {
                setMessages((prev) => {
                    if (prev.some((m) => m._id === data.message._id)) return prev;
                    return [...prev, data.message];
                });
                apiClient.get(`/chat/sessions/${activeSession._id}/messages`).catch(() => { });
            } else {
                setSessions((prev) =>
                    prev.map((s) =>
                        s._id === data.sessionId ? { ...s, unreadByStaff: s.unreadByStaff + 1, lastMessage: data.message } : s
                    )
                );
            }
        };

        const handleCustomerMsgNotify = (data) => {
            if (!activeSession || activeSession._id !== data.sessionId) {
                toast(`${data.customerName}: ${data.preview}...`, { duration: 3000 });
                fetchSessions();
            }
        };

        const handleDeptMessage = (data) => {
            if (activeDept && activeDept === data.department) {
                setMessages((prev) => [...prev, data.message]);
            }
        };

        const handleTyping = (data) => {
            if (activeSession && data.sessionId === activeSession._id && data.userId !== user._id) {
                setTypingStatus({ isTyping: data.isTyping, userName: data.userName });
                if (data.isTyping) {
                    clearTimeout(typingTimer.current);
                    typingTimer.current = setTimeout(() => setTypingStatus({ isTyping: false, userName: '' }), 3000);
                }
            }
        };

        onSocketEvent('chat:newSession', handleNewSession);
        onSocketEvent('chat:message', handleIncomingMessage);
        onSocketEvent('chat:customerMessage', handleCustomerMsgNotify);
        onSocketEvent('chat:departmentMessage', handleDeptMessage);
        onSocketEvent('chat:typing', handleTyping);

        return () => {
            offSocketEvent('chat:newSession', handleNewSession);
            offSocketEvent('chat:message', handleIncomingMessage);
            offSocketEvent('chat:customerMessage', handleCustomerMsgNotify);
            offSocketEvent('chat:departmentMessage', handleDeptMessage);
            offSocketEvent('chat:typing', handleTyping);
        };
    }, [activeSession, activeDept, user._id, fetchSessions]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingStatus.isTyping]);

    // ── Dispatch Outbound Messages ──────────────────────────────────────────
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() || sending) return;

        const messageText = text.trim();
        setText('');
        setSending(true);

        try {
            if (activeSession) {
                await apiClient.post(`/chat/sessions/${activeSession._id}/messages`, { text: messageText });
            } else if (activeDept) {
                await apiClient.post(`/chat/department/${activeDept}`, { text: messageText });
            }
        } catch (err) {
            toast.error('Failed to deliver message');
            setText(messageText);
        } finally {
            setSending(false);
        }
    };

    const handleClaimSession = async (id) => {
        try {
            const res = await apiClient.patch(`/chat/sessions/${id}/assign`);
            toast.success('Session claimed');
            setActiveSession(res.data.session);
            fetchSessions();
            loadSessionMessages(id);
        } catch (err) {
            toast.error('Could not claim session');
        }
    };

    const handleCloseSession = async (id) => {
        try {
            await apiClient.patch(`/chat/sessions/${id}/close`);
            toast.success('Session closed');
            setActiveSession(null);
            fetchSessions();
            setMessages([]);
        } catch (err) {
            toast.error('Failed to close session');
        }
    };

    const handleTypingIndicator = (val) => {
        setText(val);
        if (!activeSession) return;
        getSocket()?.emit('chat:typing', { sessionId: activeSession._id, isTyping: true });
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {
            getSocket()?.emit('chat:typing', { sessionId: activeSession._id, isTyping: false });
        }, 2000);
    };

    return (
        <div className="flex flex-col animate-fade-in" style={{ height: 'calc(100vh - 130px)' }}>
            <PageHeader title="Staff Communication Hub" subtitle="Real-time guest support channels and internal operations line" />

            <div className="flex flex-1 bg-white border border-border rounded-card shadow-soft overflow-hidden min-h-0">
                {/* Left Control Panel / Tabs Selection */}
                <div className="w-80 border-r border-border flex flex-col shrink-0 bg-background/30">
                    <div className="flex border-b border-border bg-white">
                        <button
                            onClick={() => setActiveTab('support')}
                            className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-colors ${activeTab === 'support' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            Guest Stays ({sessions.filter(s => s.status !== 'CLOSED').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('department')}
                            className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-colors ${activeTab === 'department' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            Departments
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loadingSessions ? (
                            <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                        ) : activeTab === 'support' ? (
                            sessions.length === 0 ? (
                                <p className="text-center text-xs text-text-secondary py-6">No service requests found</p>
                            ) : (
                                sessions.map((s) => {
                                    const isSelected = activeSession?._id === s._id;
                                    return (
                                        <div
                                            key={s._id}
                                            onClick={() => handleSelectSession(s)}
                                            className={`p-3 rounded-xl cursor-pointer transition-all flex items-start justify-between border ${isSelected ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-white border-transparent hover:bg-background'
                                                }`}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-semibold text-text-primary text-sm truncate">
                                                        {s.customerId?.firstName} {s.customerId?.lastName}
                                                    </p>
                                                    {s.status === 'WAITING' && (
                                                        <span className="w-2 h-2 rounded-full bg-error animate-pulse shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-xs font-medium text-text-secondary truncate mt-0.5">{s.subject}</p>
                                                <p className="text-xs text-text-muted truncate mt-1 italic">
                                                    {s.lastMessage?.text || 'No messages sent yet'}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.status === 'ACTIVE' ? 'bg-success/10 text-success' : s.status === 'CLOSED' ? 'bg-border text-text-muted' : 'bg-error/10 text-error'
                                                    }`}>
                                                    {s.status}
                                                </span>
                                                {s.unreadByStaff > 0 && (
                                                    <span className="bg-error text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                                        {s.unreadByStaff}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )
                        ) : (
                            DEPARTMENTS.map((d) => {
                                const isSelected = activeDept === d.id;
                                return (
                                    <button
                                        key={d.id}
                                        onClick={() => handleSelectDept(d.id)}
                                        className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between font-medium text-sm border ${isSelected ? 'bg-primary text-white border-transparent shadow-md' : 'bg-white border-transparent hover:bg-background text-text-primary'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Hash size={16} className={isSelected ? 'text-white' : 'text-text-secondary'} />
                                            {d.name}
                                        </div>
                                        <ChevronRight size={14} className="opacity-60" />
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Active Channel Workspace View Panel */}
                <div className="flex-1 flex flex-col bg-background/10 min-w-0">
                    {activeSession || activeDept ? (
                        <>
                            {/* Active Header Action bar */}
                            <div className="bg-white border-b border-border px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">
                                <div>
                                    <h4 className="font-bold text-text-primary">
                                        {activeSession
                                            ? `Support Desk: ${activeSession.customerId?.firstName} ${activeSession.customerId?.lastName}`
                                            : `${DEPARTMENTS.find((d) => d.id === activeDept)?.name} Lounge`}
                                    </h4>
                                    {activeSession && (
                                        <p className="text-xs text-text-secondary mt-0.5">
                                            Assigned Agent:{' '}
                                            <span className="font-semibold text-primary">
                                                {activeSession.assignedStaff
                                                    ? `${activeSession.assignedStaff.firstName} (${activeSession.assignedStaff.role})`
                                                    : 'Unassigned'}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {activeSession && activeSession.status !== 'CLOSED' && (
                                    <div className="flex gap-2">
                                        {!activeSession.assignedStaff && (
                                            <button
                                                onClick={() => handleClaimSession(activeSession._id)}
                                                className="flex items-center gap-1.5 bg-success text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-success/90 transition-colors shadow-sm"
                                            >
                                                <UserPlus size={13} /> Take Request
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleCloseSession(activeSession._id)}
                                            className="flex items-center gap-1 bg-error/10 text-error px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-error hover:text-white transition-all"
                                        >
                                            <X size={13} /> End Chat
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Chat Message Logs Stream */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                                {loadingMessages ? (
                                    <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
                                ) : (
                                    messages.map((msg) => {
                                        const isMine = msg.sender?._id === user._id || msg.sender === user._id;
                                        return (
                                            <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] rounded-2xl p-3 text-sm shadow-soft ${isMine
                                                    ? 'bg-primary text-white rounded-tr-none'
                                                    : 'bg-white border border-border text-text-primary rounded-tl-none'
                                                    }`}>
                                                    {!isMine && (
                                                        <p className="text-[10px] font-bold text-primary mb-1">
                                                            {msg.sender?.firstName || 'Guest'} {msg.sender?.role ? `(${msg.sender.role})` : ''}
                                                        </p>
                                                    )}
                                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                                    <div className={`flex items-center gap-1 mt-1 justify-end opacity-60 text-[9px]`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isMine && (msg.readBy?.length > 1 ? <CheckCheck size={11} /> : <Check size={11} />)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                {/* Live Client Typing Indicators container */}
                                {typingStatus.isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-border rounded-xl rounded-tl-none px-3 py-2 text-xs text-text-secondary flex items-center gap-1">
                                            <span className="font-semibold text-primary">{typingStatus.userName}</span> is typing
                                            <div className="flex gap-0.5 ml-1">
                                                <span className="w-1 h-1 rounded-full bg-text-secondary animate-bounce [animation-delay:-0.3s]" />
                                                <span className="w-1 h-1 rounded-full bg-text-secondary animate-bounce [animation-delay:-0.15s]" />
                                                <span className="w-1 h-1 rounded-full bg-text-secondary animate-bounce" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Entry Area inputs */}
                            {(!activeSession || activeSession.status !== 'CLOSED') && (
                                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-border shrink-0">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={text}
                                            onChange={(e) => handleTypingIndicator(e.target.value)}
                                            placeholder="Type your reply here..."
                                            className="flex-1 px-4 py-2.5 border border-border bg-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!text.trim() || sending}
                                            className="bg-primary text-white p-2.5 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-40 shadow-soft shrink-0"
                                        >
                                            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-secondary p-8 space-y-2">
                            <MessageCircle size={48} className="opacity-20 text-primary" />
                            <p className="font-medium text-sm">No Active Channel Selected</p>
                            <p className="text-xs text-text-muted text-center max-w-xs">
                                Pick an ongoing customer support wire or open your department chat panel on the left to begin syncing messages.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;