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
  Code,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Settings,
  X,
  AlertTriangle,
  ZapOff
} from 'lucide-react';

// --- Types ---

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  feedback?: 'up' | 'down';
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
  [key: string]: any;
};

type ConfigState = {
  primaryProvider: string;
  secondaryProvider: string;
  maxTokenBudget: number;
  simulateTimeout: boolean;
};

// --- Initial Data ---

const INITIAL_PIPELINE: PipelineStep[] = [
  { id: 'auth', label: 'Auth & Access Control', status: 'idle', icon: ShieldCheck, description: 'Role-Based Access Verification' },
  { id: 'conversation', label: 'Conversation Service', status: 'idle', icon: Layers, description: 'History & Context Management' },
  { id: 'embedding', label: 'Embedding Service', status: 'idle', icon: Search, description: 'Query Vectorization (text-embedding-v2)' },
  { id: 'retriever', label: 'Retriever (Vector DB)', status: 'idle', icon: Database, description: 'Similarity Search & Chunk Extraction' },
  { id: 'llm', label: 'LLM Gateway (Generation)', status: 'idle', icon: Cpu, description: 'Context Synthesis & Completion' },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pipeline, setPipeline] = useState<PipelineStep[]>(INITIAL_PIPELINE);
  const [payload, setPayload] = useState<JsonPayload | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<ConfigState>({
    primaryProvider: 'OpenAI (GPT-4o)',
    secondaryProvider: 'Anthropic (Claude 3.5 Sonnet)',
    maxTokenBudget: 4096,
    simulateTimeout: false
  });
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
      const step = steps[i];
      // Set current step to processing
      steps[i] = { ...steps[i], status: 'processing' };
      setPipeline([...steps]);
      
      // Update Payload Inspector based on step
      updatePayloadForStep(steps[i].id, query);
      
      // Handle Simulation for LLM step
      if (step.id === 'llm' && config.simulateTimeout) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Fail primary
        steps[i] = { ...steps[i], status: 'error', description: 'PRIMARY_PROVIDER_TIMEOUT' };
        setPipeline([...steps]);
        
        setPayload({
          error: "504 Gateway Timeout",
          provider: config.primaryProvider,
          message: "Upstream service failed to respond within 5000ms"
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        // Circuit breaker trip visual
        setPayload({
          event: "CIRCUIT_BREAKER_TRIPPED",
          action: "Routing to Fallback",
          fallback_provider: config.secondaryProvider
        });

        await new Promise(resolve => setTimeout(resolve, 1200));

        // Fallback success
        setPayload({
          status: "200 OK",
          provider: config.secondaryProvider,
          constructed_prompt: `User Query: ${query}\n\nContext Chunks: ...`,
          model: "claude-3-5-sonnet",
          latency_ms: 1420
        });

        // Continue as completed after fallback
        steps[i] = { ...steps[i], status: 'completed', description: `Fallback Active: ${config.secondaryProvider}` };
        setPipeline([...steps]);
      } else {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
        
        // Complete step normally
        steps[i] = { ...steps[i], status: 'completed' };
        setPipeline([...steps]);
      }
    }

    // 1.5-second simulated loading state before showing the final response
    await new Promise(resolve => setTimeout(resolve, 1500));

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
      case 'auth':
        setPayload({
          user: "u_884",
          role: "employee",
          access_scopes: ["public", "hr_docs"]
        });
        break;
      case 'conversation':
        setPayload({
          history: [
            { role: "user", content: query }
          ]
        });
        break;
      case 'embedding':
        setPayload({
          model: "text-embedding-v2",
          vector: [0.012, -0.045, 0.112, "... 765 more"]
        });
        break;
      case 'retriever':
        setPayload({
          results: [
            { id: "doc_77", score: 0.89, text: "The new HR policy states that all employees are eligible for dynamic benefits tracking starting FY2026..." },
            { id: "doc_12", score: 0.74, text: "Standard PTO is allocated at 25 days per annum for full-time staff members..." }
          ]
        });
        break;
      case 'llm':
        setPayload({
          constructed_prompt: `User Query: ${query}\n\nContext Chunks:\n1. HR policy v2.4 updates...\n2. Standard PTO rules...\n\nInstructions: Answer accurately based ONLY on context.`,
          model: "gpt-4o-enterprise",
          temperature: 0.2
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
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-bg-main border border-border-color rounded hover:bg-white transition-all text-[11px] font-bold text-text-muted hover:text-primary mr-2"
          >
            <Settings className="w-3.5 h-3.5" />
            CONFIG_SERVICE
          </button>
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
                  <div className={`flex items-center justify-between mt-1`}>
                    <div className={`text-[10px] font-mono opacity-50 ${m.role === 'user' ? 'text-white/70' : ''}`}>
                      {m.timestamp}
                    </div>
                    {m.role === 'assistant' && (
                      <div className="flex gap-2">
                        <button className="text-text-muted hover:text-primary transition-colors p-0.5">
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button className="text-text-muted hover:text-red-500 transition-colors p-0.5">
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
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
                  <div className="flex justify-between items-center">
                    <div className="step-label">{step.label}</div>
                    {step.id === 'auth' && step.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-accent animate-in fade-in zoom-in duration-300" />
                    )}
                  </div>
                  <div className="step-meta">
                    {step.status === 'processing' ? 'EXECUTING_KERNEL...' : 
                     (step.id === 'retriever' && step.status === 'completed') ? (
                       <span className="text-primary font-bold">2_CHUNKS_RETRIEVED</span>
                     ) :
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

      {/* --- CONFIGURATION MODAL --- */}
      <AnimatePresence>
        {isConfigOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-text-main/20 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white border border-border-color shadow-2xl rounded-xl overflow-hidden flex flex-col"
            >
              <header className="p-4 border-b border-border-color flex items-center justify-between bg-bg-main">
                <div className="flex items-center gap-2 font-bold text-[12px] tracking-wider uppercase text-text-muted">
                  <Settings className="w-4 h-4" />
                  Configuration Service
                </div>
                <button 
                  onClick={() => setIsConfigOpen(false)}
                  className="p-1 hover:bg-border-color rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="p-6 space-y-6">
                {/* Primary Provider */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Primary LLM Provider</label>
                  <select 
                    value={config.primaryProvider}
                    onChange={(e) => setConfig({...config, primaryProvider: e.target.value})}
                    className="w-full p-2.5 bg-bg-main border border-border-color rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                  >
                    <option>OpenAI (GPT-4o)</option>
                    <option>Anthropic (Claude 3.5 Sonnet)</option>
                    <option>Local (Llama 3 8B)</option>
                  </select>
                </div>

                {/* Secondary Provider */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Secondary/Fallback LLM Provider</label>
                  <select 
                    value={config.secondaryProvider}
                    onChange={(e) => setConfig({...config, secondaryProvider: e.target.value})}
                    className="w-full p-2.5 bg-bg-main border border-border-color rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                  >
                    <option>Anthropic (Claude 3.5 Sonnet)</option>
                    <option>OpenAI (GPT-4o)</option>
                    <option>Local (Mistral v0.3)</option>
                  </select>
                </div>

                {/* Max Token Budget */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Max Token Budget</label>
                    <span className="text-[11px] font-mono text-primary font-bold">{config.maxTokenBudget} tokens</span>
                  </div>
                  <input 
                    type="range" 
                    min="512" 
                    max="128000" 
                    step="512"
                    value={config.maxTokenBudget}
                    onChange={(e) => setConfig({...config, maxTokenBudget: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-border-color rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-text-muted opacity-60">
                    <span>512</span>
                    <span>128K</span>
                  </div>
                </div>

                {/* Simulation Toggles */}
                <div className="pt-4 border-t border-border-color">
                  <div className="flex items-center justify-between p-3 bg-red-50/50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <ZapOff className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-red-900">Simulate Timeout</span>
                        <span className="text-[10px] text-red-700 opacity-80">Trigger 504 Gateway error in step 5</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={config.simulateTimeout}
                        onChange={(e) => setConfig({...config, simulateTimeout: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              <footer className="p-4 bg-bg-main border-t border-border-color flex justify-end gap-3">
                <button 
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                >
                  Save Configuration
                </button>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
