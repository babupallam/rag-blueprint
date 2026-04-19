/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Upload, 
  Terminal, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Search, 
  LineChart, 
  Zap,
  ChevronRight,
  User,
  Bot,
  Layers,
  Activity,
  Code
} from 'lucide-react';

// --- Types ---

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

type PipelineStep = {
  id: string;
  label: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  icon: any;
  description: string;
};

type JsonPayload = {
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  metadata?: Record<string, any>;
};

// --- Initial Data ---

const INITIAL_PIPELINE: PipelineStep[] = [
  { id: 'gateway', label: 'Edge Gateway', status: 'idle', icon: ShieldCheck, description: 'Authentication & Rate Limiting' },
  { id: 'cache', label: 'Semantic Cache', status: 'idle', icon: Zap, description: 'Redis Vector Similarity Search' },
  { id: 'hyde', label: 'Query Transform', status: 'idle', icon: Search, description: 'Hypothetical Document Embeddings' },
  { id: 'retrieval', label: 'Vector Retrieval', status: 'idle', icon: Database, description: 'Dense Passages Extraction' },
  { id: 'rerank', label: 'Cross-Encoder', status: 'idle', icon: LineChart, description: 'Neural Re-ranking for Precision' },
  { id: 'llm', label: 'Orchestrater', status: 'idle', icon: Cpu, description: 'GPT-4o Synthesis & Tool Use' },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pipeline, setPipeline] = useState<PipelineStep[]>(INITIAL_PIPELINE);
  const [payload, setPayload] = useState<JsonPayload | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // 1. Edge Gateway Payload
    setPayload({
      endpoint: '/v1/chat',
      method: 'POST',
      headers: { 
        "Authorization": "Bearer tok_123",
        "X-Request-ID": `req_${Math.random().toString(36).substr(2, 9)}`,
        "Content-Type": "application/json"
      },
      body: { 
        "user_id": "u_884", 
        "message": input 
      }
    });

    // Run Pipeline Simulation
    await runPipeline(input);
  };

  const runPipeline = async (query: string) => {
    const steps = [...INITIAL_PIPELINE];
    
    for (let i = 0; i < steps.length; i++) {
      // Set current step to processing
      steps[i] = { ...steps[i], status: 'processing' };
      setPipeline([...steps]);
      
      // Update Payload Inspector based on step
      updatePayloadForStep(steps[i].id, query);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
      
      // Complete step
      steps[i] = { ...steps[i], status: 'completed' };
      setPipeline([...steps]);
    }

    // Add Assistant Response
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: getMockResponse(query),
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, assistantMessage]);
    setIsProcessing(false);
  };

  const updatePayloadForStep = (stepId: string, query: string) => {
    switch (stepId) {
      case 'gateway':
        // Already set in handleSend
        break;
      case 'cache':
        setPayload({
          metadata: {
            cache_hit: false,
            latency_ms: 12,
            provider: "Redis-VL"
          },
          body: {
            query_embedding: "[0.12, -0.45, 0.89, ...]",
            threshold: 0.95
          }
        });
        break;
      case 'hyde':
        setPayload({
          method: "HYDE_TRANSFORM",
          input: query,
          output: "A hypothetical HR policy document describing the updated employee benefits for 2026...",
          prompt_tokens: 145
        });
        break;
      case 'retrieval':
        setPayload({
          database: "Pinecone-Serverless",
          top_k: 5,
          namespace: "enterprise-docs-v2",
          matches: [
            { id: "doc_99", score: 0.88, text: "The new HR policy (v2.1) includes unlimited PTO..." },
            { id: "doc_102", score: 0.84, text: "Health benefits have been expanded to include mental health support..." }
          ]
        });
        break;
      case 'rerank':
        setPayload({
          model: "bge-reranker-large",
          input_size: 5,
          final_rank: [
            { doc_id: "doc_99", old_score: 0.88, new_score: 0.94 },
            { doc_id: "doc_102", old_score: 0.84, new_score: 0.91 }
          ]
        });
        break;
      case 'llm':
        setPayload({
          model: "gpt-4o-2024-05-13",
          system_prompt: "You are an enterprise HR assistant. Use the provided context to answer...",
          context_used: "The new HR policy includes unlimited PTO and expanded mental health...",
          tokens: { prompt: 1240, completion: 85 }
        });
        break;
    }
  };

  const getMockResponse = (q: string) => {
    const query = q.toLowerCase();
    if (query.includes('hr') || query.includes('policy')) {
      return "The new HR policy for 2026 features significant updates, including a transition to an asynchronous-first work model, unlimited PTO (subject to team synchronization), and a 20% increase in professional development stipends. You can find the full document in the internal confluence portal under 'Benefit-Updates-2026'.";
    }
    return "The system has retrieved 3 relevant document fragments from the vector store. Based on the RAG pipeline synthesis, the query matches our latest internal documentation regarding your request. How else can I assist with your search today?";
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-bg-main">
      {/* --- APP HEADER --- */}
      <header className="h-[56px] bg-white border-b border-border-color flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2 font-bold text-[14px] tracking-wider uppercase text-primary">
          <Layers className="w-5 h-5" />
          RAG-CORE ARCH v2.4
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[12px] text-text-muted font-mono">LATENCY: {isProcessing ? (120 + Math.floor(Math.random() * 50)) : 0}ms</span>
          <div className="flex items-center gap-2 bg-[#dcfce7] text-[#166534] text-[11px] px-2 py-0.5 rounded-full font-semibold">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            {isProcessing ? 'PIPELINE ACTIVE' : 'EDGE ACTIVE'}
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-[320px_360px_1fr] overflow-hidden">
        {/* --- COLUMN 1: CLIENT (CHAT) --- */}
        <aside className="bg-bg-sidebar border-r border-border-color flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-30 py-20 pointer-events-none self-center">
                  <Bot className="w-10 h-10 mb-2" />
                  <p className="text-[13px]">System ready for queries</p>
                </div>
              )}
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`message ${m.role === 'user' ? 'message-user' : 'message-ai'}`}
                >
                  <p className="text-[13px] leading-relaxed">{m.content}</p>
                  <div className={`text-[10px] mt-1 font-mono opacity-50 ${m.role === 'user' ? 'text-white/70' : ''}`}>
                    {m.timestamp}
                  </div>
                </motion.div>
              ))}
              {isProcessing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="message message-ai">
                  <div className="flex gap-1 py-1">
                    <span className="w-1.5 h-1.5 bg-text-main/20 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-text-main/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-text-main/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <footer className="p-5 border-t border-border-color bg-white">
            <div className="p-2 border border-border-color rounded-lg bg-bg-main flex items-center gap-2 group transition-all focus-within:border-primary">
              <button className="w-7 h-7 flex items-center justify-center bg-bg-sidebar border border-border-color rounded text-[16px] font-bold hover:bg-white">
                <Upload className="w-3 h-3 text-text-muted" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Enter prompt..."
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-text-main placeholder:text-text-muted/60"
              />
              <button 
                onClick={handleSend}
                disabled={isProcessing}
                className="w-7 h-7 flex items-center justify-center bg-primary text-white rounded font-bold hover:opacity-90 disabled:opacity-40 transition-all shadow-sm"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </footer>
        </aside>

        {/* --- COLUMN 2: ORCHESTRATOR (VISUALIZER) --- */}
        <main className="bg-white border-r border-border-color p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[12px] font-bold uppercase tracking-wider text-text-muted">Pipeline Execution Trace</span>
            <span className={`text-[12px] font-bold uppercase tracking-wider ${isProcessing ? 'text-primary' : 'text-text-muted opacity-40'}`}>
              {isProcessing ? 'Running...' : 'Idle'}
            </span>
          </div>

          <div className="space-y-0 translate-x-2">
            {pipeline.map((step, idx) => {
              return (
                <div 
                  key={step.id} 
                  className={`pipeline-step ${step.status === 'completed' ? 'complete' : ''} ${step.status === 'processing' ? 'active' : ''}`}
                >
                  <div className="step-label">{step.label}</div>
                  <div className="step-meta">
                    {step.status === 'processing' ? 'EXECUTING_KERNEL...' : 
                     step.status === 'completed' ? 'NODE_SYNC_SUCCESS' : step.description}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* --- COLUMN 3: PAYLOAD INSPECTOR --- */}
        <section className="bg-bg-terminal flex flex-col overflow-hidden">
          <header className="px-5 py-3 bg-[#1e293b] border-b border-[#334155] flex items-center justify-between shrink-0">
            <span className="text-[11px] font-bold text-white tracking-widest uppercase opacity-80">Payload Inspector</span>
            <div className="bg-[#334155] text-white text-[10px] px-2 py-1 rounded font-bold">
              {payload?.method === 'POST' ? 'HTTP REQUEST' : 'KERNEL LOG'}
            </div>
          </header>

          <div className="flex-1 overflow-auto p-5 font-mono text-[13px] leading-relaxed text-[#94a3b8]">
            {payload ? (
              <motion.div
                key={JSON.stringify(payload)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {payload.method && payload.endpoint && (
                  <div className="mb-5">
                    <span className="text-[#60a5fa]">{payload.method}</span> <span className="text-white">{payload.endpoint}</span>
                  </div>
                )}
                
                <div className="whitespace-pre">
                  {JSON.stringify(payload, null, 2).split('\n').map((line, i) => {
                    // Primitive JSON highlighting
                    const parts = line.split(/(".*?"|[\d.]+|true|false|null)/);
                    return (
                      <div key={i}>
                        {parts.map((part, j) => {
                          if (part.startsWith('"') && part.endsWith('"')) {
                            // Key vs String check is simple here based on following colon
                            const nextPart = parts[j + 1];
                            const isKey = nextPart?.trim().startsWith(':');
                            return <span key={j} className={isKey ? 'json-key' : 'json-string'}>{part}</span>;
                          }
                          if (/^[\d.]+$/.test(part)) return <span key={j} className="json-number">{part}</span>;
                          if (/^(true|false|null)$/.test(part)) return <span key={j} className="json-boolean">{part}</span>;
                          return <span key={j}>{part}</span>;
                        })}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-20 text-center space-y-3">
                <Terminal className="w-10 h-10" />
                <p className="text-[11px] font-bold tracking-widest uppercase">Buffer Empty</p>
              </div>
            )}
          </div>

          <footer className="mt-auto px-5 py-3 border-t border-[#334155] text-[10px] font-mono text-text-muted flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-accent">●</span>
              STREAMING_BUFFER: {isProcessing ? '14KB' : '0KB'} / 1024KB
            </div>
            <span>v2.4_SECURE</span>
          </footer>
        </section>
      </div>
    </div>
  );
}
