import { useState, useEffect, useRef } from 'react';
import { getConversations, getChatHistory, sendMessage } from '../services/api';
import { Search, Send, Phone, User, Clock, Image, FileText } from 'lucide-react';

export default function Messages() {
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null); // Phone number
    const [messages, setMessages] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Initial Load
    useEffect(() => {
        loadConversations();
        const interval = setInterval(loadConversations, 10000); // Poll list every 10s
        return () => clearInterval(interval);
    }, []);

    // Load Chat History when Active Chat changes
    useEffect(() => {
        if (activeChat) {
            loadChatHistory();
            const interval = setInterval(loadChatHistory, 3000); // Poll chat every 3s
            return () => clearInterval(interval);
        }
    }, [activeChat]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversations = async () => {
        try {
            const res = await getConversations();
            // Sort by latest message time
            const sorted = (res.data.data || []).sort((a, b) =>
                new Date(b.last_message_at) - new Date(a.last_message_at)
            );
            setConversations(sorted);
            setLoading(false);
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    const loadChatHistory = async () => {
        if (!activeChat) return;
        try {
            const res = await getChatHistory(activeChat);
            setMessages(res.data.data);
        } catch (error) {
            console.error('Error loading chat:', error);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            // Optimistic Update
            const tempMsg = {
                id: 'temp-' + Date.now(),
                direction: 'out',
                body: replyText,
                created_at: new Date().toISOString(),
                type: 'text'
            };
            setMessages([...messages, tempMsg]);
            setReplyText('');

            await sendMessage(activeChat, tempMsg.body);
            loadChatHistory(); // Refresh to get real ID
        } catch (error) {
            alert('Failed to send message');
            console.error(error);
        }
    };

    const getActiveConv = () => conversations.find(c => c.customer_phone === activeChat);

    return (
        <div className="h-screen flex flex-col" style={{ height: 'calc(100vh - 100px)' }}> {/* Adjust based on layout */}
            <div className="flex flex-1 overflow-hidden card p-0">
                {/* Left Sidebar: Conversations List */}
                <div className="w-1/3 border-r border-gray-700 flex flex-col bg-secondary">
                    <div className="p-md border-b border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-muted" size={18} />
                            <input
                                type="text"
                                className="form-input pl-10"
                                placeholder="Search customers..."
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading && <div className="p-md text-center text-muted">Loading chats...</div>}
                        {conversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => setActiveChat(conv.customer_phone)}
                                className={`p-md border-b border-gray-800 cursor-pointer hover:bg-tertiary transition-colors ${activeChat === conv.customer_phone ? 'bg-tertiary border-l-4 border-blue-500' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-xs">
                                    <span className="font-bold truncate">{conv.customer_name || conv.customer_phone}</span>
                                    <span className="text-xs text-muted">
                                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="text-sm text-muted truncate">
                                    {conv.last_message || <span className="italic">No messages yet</span>}
                                </div>
                                {/* Tags could go here */}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Pane: Chat Window */}
                <div className="flex-1 flex flex-col bg-primary relative">
                    {activeChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-md border-b border-gray-700 flex justify-between items-center bg-secondary">
                                <div className="flex items-center gap-md">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                        {(getActiveConv()?.customer_name || activeChat)[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{getActiveConv()?.customer_name || 'Unknown Customer'}</h3>
                                        <div className="text-xs text-muted flex items-center gap-xs">
                                            <Phone size={12} /> {activeChat}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-sm">
                                    {/* Action buttons could go here (e.g. Create Order) */}
                                    <button className="btn btn-sm btn-secondary">Create Order</button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-lg space-y-md" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '400px', backgroundBlendMode: 'overlay', backgroundColor: 'rgba(15, 23, 42, 0.95)' }}>
                                {messages.map((msg, idx) => {
                                    const isOut = msg.direction === 'out';
                                    return (
                                        <div key={idx} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[70%] p-sm rounded-lg shadow-sm text-sm ${isOut ? 'bg-green-700 text-white rounded-tr-none' : 'bg-tertiary text-text-primary rounded-tl-none'}`}
                                            >
                                                {msg.type === 'text' && <div className="whitespace-pre-wrap">{msg.body}</div>}
                                                {msg.type === 'image' && (
                                                    <div className="mb-xs">
                                                        <img src="placeholder-image.jpg" className="rounded max-w-full" alt="Shared" />
                                                        <div className="flex items-center gap-xs mt-1 text-xs opacity-70"><Image size={12} /> Image</div>
                                                    </div>
                                                )}
                                                {msg.type === 'interactive' && (
                                                    <div className="border-l-2 border-yellow-500 pl-sm">
                                                        <div className="font-bold text-xs text-yellow-500 uppercase mb-xs">Interactive Bot Reply</div>
                                                        {msg.body}
                                                    </div>
                                                )}

                                                <div className={`text-[10px] mt-1 text-right ${isOut ? 'text-green-200' : 'text-gray-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {isOut && <span className="ml-1">✓</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-md bg-secondary border-t border-gray-700">
                                <form onSubmit={handleSend} className="flex gap-md">
                                    <input
                                        type="text"
                                        className="form-input flex-1"
                                        placeholder="Type a message..."
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                    />
                                    <button type="submit" className="btn btn-primary px-lg">
                                        <Send size={18} />
                                    </button>
                                </form>
                                <div className="flex gap-md mt-sm text-xs text-muted">
                                    <button className="hover:text-white flex items-center gap-xs"><Image size={14} /> Image</button>
                                    <button className="hover:text-white flex items-center gap-xs"><FileText size={14} /> Template</button>
                                    <button className="hover:text-white flex items-center gap-xs"><Clock size={14} /> Saved Reply</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted opacity-50">
                            <Send size={48} className="mb-md" />
                            <p>Select a conversation to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
