import { useState, useRef, useEffect } from 'react';

export default function RecipeChat({ recipe }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages,
          recipe,
        }),
      });

      if (!res.ok) throw new Error('Failed to chat');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'סליחה, משהו לא עבד. נסה שוב.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sticky bottom-6 left-6 z-40 w-fit h-fit">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-cream px-4 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <span>👨‍🍳</span>
          <span>שאל את השף</span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="bg-white border border-accent rounded-3xl shadow-2xl flex flex-col w-80 h-96">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-accent bg-cream">
            <h3 className="font-display text-lg text-ink">עוזר בישול</h3>
            <div className="flex gap-2">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-sm text-secondary hover:text-primary transition-colors font-medium"
                  title="שיחה חדשה"
                >
                  🔄
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-ink-soft hover:text-ink transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" dir="rtl">
            {messages.length === 0 && (
              <p className="text-sm text-ink-soft text-center mt-4">
                שלום! אני כאן כדי לעזור לך בבישול המתכון הזה. בואו נתחיל!
              </p>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-cream'
                      : 'bg-cream border border-accent text-ink'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-end">
                <div className="bg-cream border border-accent px-3 py-2 rounded-lg">
                  <span className="text-sm text-ink-soft">טוען...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-accent px-4 py-3 bg-white flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="שאל משהו..."
              className="flex-1 px-3 py-2 border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-primary text-cream px-3 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
