'use client';

import { useEffect, useState } from 'react';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type ChatResponse = {
  answer: string;
  references?: { monitorId?: number; runId?: number }[];
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Ask me about monitor status or request a draft monitor.' },
  ]);
  const [input, setInput] = useState('How are my website monitors doing?');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: input }),
    });
    const data: ChatResponse = await res.json();
    setMessages((m) => [...m, { role: 'user', content: input }, { role: 'assistant', content: data.answer }]);
    setInput('');
    setLoading(false);
  };

  useEffect(() => {
    const el = document.getElementById('chat-log');
    el?.scrollTo({ top: el.scrollHeight });
  }, [messages]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 card flex flex-col h-[70vh]">
        <div id="chat-log" className="flex-1 overflow-auto space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`p-3 rounded ${msg.role === 'assistant' ? 'bg-slate-800' : 'bg-slate-900 border border-slate-800'}`}>
              <div className="text-xs text-slate-400 mb-1">{msg.role}</div>
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about status or propose a monitor"
          />
          <button
            onClick={send}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded text-sm font-semibold disabled:opacity-60"
          >
            {loading ? 'Working...' : 'Send'}
          </button>
        </div>
      </div>
      <div className="card space-y-3">
        <div className="font-semibold">Suggested queries</div>
        <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
          <li>"Show recent failures for Proxmox"</li>
          <li>"Which monitors are disabled?"</li>
          <li>"Draft a Cloudflare tunnel monitor for home.mydomain"</li>
        </ul>
        <p className="text-xs text-slate-500">Chat only reads sanitized views and can request commands via queue; no secrets or raw payloads are exposed.</p>
      </div>
    </div>
  );
}
