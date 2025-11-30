import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';

function AssessmentChat({ candidateId, onComplete }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    // Initialize Chat
    useEffect(() => {
        const startChat = async () => {
            setLoading(true);
            try {
                const res = await fetch('http://localhost:5000/api/assessment/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ candidateId })
                });
                const data = await res.json();
                setSessionId(data.sessionId);
                setMessages(data.messages);
            } catch (error) {
                console.error("Failed to start chat:", error);
            } finally {
                setLoading(false);
            }
        };
        startChat();
    }, [candidateId]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !sessionId) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/assessment/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, message: userMsg })
            });
            const data = await res.json();

            setMessages(data.messages);

            if (data.status === 'completed') {
                setAnalyzing(true);
                setTimeout(() => {
                    onComplete(data.updatedProfile);
                }, 3000); // Longer delay to show analysis state
            }
        } catch (error) {
            console.error("Chat error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ height: '500px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {analyzing && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="spinner" style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #E5E7EB',
                        borderTopColor: 'var(--color-primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '16px'
                    }}></div>
                    <h3 style={{ color: 'var(--color-primary)', marginBottom: '8px' }}>Analyzing Profile...</h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>Re-evaluating your skills and career paths</p>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}

            <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: '#F0FDF4', color: '#10B981' }}>
                    <Bot size={24} />
                </div>
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Career Coach AI</h3>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Refining your profile...</p>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                        <div style={{
                            maxWidth: '80%',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            backgroundColor: msg.role === 'user' ? 'var(--color-primary)' : '#F3F4F6',
                            color: msg.role === 'user' ? 'white' : 'var(--color-text)',
                            borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                            borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px'
                        }}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && !analyzing && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                            Typing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '12px' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your answer..."
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        outline: 'none'
                    }}
                    disabled={loading || analyzing}
                />
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || analyzing || !input.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Send size={18} />
                    Send
                </button>
            </form>
        </div>
    );
}

export default AssessmentChat;
