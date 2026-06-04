import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sparkles, Send, Loader2, Brain, TrendingUp, AlertOctagon, RefreshCw, Bot, User } from 'lucide-react';
import { aiApi } from '../services/api';
import toast from 'react-hot-toast';

interface Message { role: 'user' | 'assistant'; content: string; }

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m Inventra AI, your intelligent inventory assistant. I can help you analyze stock levels, predict shortages, detect anomalies, and answer questions about your inventory. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'summary' | 'anomalies'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['ai-summary'],
    queryFn: () => aiApi.getSummary(),
    enabled: false,
  });

  const { data: anomalyData, isLoading: anomalyLoading, refetch: refetchAnomalies } = useQuery({
    queryKey: ['ai-anomalies'],
    queryFn: () => aiApi.detectAnomalies(),
    enabled: false,
  });

  const chatMutation = useMutation({
    mutationFn: ({ message, history }: { message: string; history: Message[] }) =>
      aiApi.chat(message, history.map(m => ({ role: m.role, content: m.content }))),
    onSuccess: (res) => {
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.data.reply }]);
    },
    onError: () => toast.error('AI failed to respond. Try again.'),
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    chatMutation.mutate({ message: input.trim(), history: messages });
    setInput('');
  };

  const suggestions = [
    'Which products need reordering?',
    'What are my top 5 low stock items?',
    'Summarize this month\'s activity',
    'Any unusual patterns in transactions?',
  ];

  const severityBadge = (s: string) => {
    if (s === 'high') return 'badge-red';
    if (s === 'medium') return 'badge-yellow';
    return 'badge-green';
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="page-title">AI Assistant</h1>
            <p className="page-subtitle">Powered by Google Gemini</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'chat', label: 'Chat', icon: Bot },
          { id: 'summary', label: 'Inventory Summary', icon: Brain },
          { id: 'anomalies', label: 'Anomaly Detection', icon: AlertOctagon },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`btn text-sm ${activeTab === id ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'chat' && (
        <div className="card flex flex-col h-[65vh]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'assistant'
                    ? 'bg-brand-500/20 border border-blue-200'
                    : 'bg-slate-700 border border-slate-600'
                }`}>
                  {msg.role === 'assistant'
                    ? <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    : <User className="w-3.5 h-3.5 text-gray-500" />
                  }
                </div>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-50 border border-blue-200 text-gray-800'
                    : 'bg-gray-50 border border-gray-200 text-gray-700'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-blue-200 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex gap-2 flex-wrap">
              {suggestions.map(s => (
                <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 rounded-full bg-gray-50 hover:bg-slate-700 text-gray-500 hover:text-gray-800 border border-gray-200 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about your inventory..."
              className="input flex-1"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              className="btn-primary px-4"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" /> AI Inventory Summary
            </h3>
            <button onClick={() => refetchSummary()} disabled={summaryLoading} className="btn-secondary text-sm">
              {summaryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Generate</>}
            </button>
          </div>
          {summaryData?.data?.data?.summary ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                {summaryData.data.data.summary}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Click "Generate" to get an AI-powered inventory summary</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'anomalies' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-yellow-400" /> Anomaly Detection
            </h3>
            <button onClick={() => refetchAnomalies()} disabled={anomalyLoading} className="btn-secondary text-sm">
              {anomalyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Analyze</>}
            </button>
          </div>
          {anomalyData?.data?.data ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Risk Score</p>
                  <p className={`text-2xl font-bold ${
                    anomalyData.data.data.overallRiskScore > 70 ? 'text-red-400' :
                    anomalyData.data.data.overallRiskScore > 40 ? 'text-yellow-400' : 'text-green-400'
                  }`}>{anomalyData.data.data.overallRiskScore}/100</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{anomalyData.data.data.summary}</p>
                </div>
              </div>
              {anomalyData.data.data.anomalies?.length === 0 ? (
                <p className="text-center text-green-400 text-sm py-4">✓ No anomalies detected</p>
              ) : (
                anomalyData.data.data.anomalies?.map((a: any, i: number) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={severityBadge(a.severity)}>{a.severity}</span>
                      <span className="font-medium text-gray-800 text-sm">{a.type}</span>
                    </div>
                    <p className="text-sm text-gray-500">{a.description}</p>
                    <p className="text-xs text-blue-600 font-medium">→ {a.recommendation}</p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <AlertOctagon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Click "Analyze" to detect transaction anomalies</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
