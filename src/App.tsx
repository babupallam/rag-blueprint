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
  ZapOff,
  ChevronUp,
  ChevronDown,
  HardDrive,
  BarChart3,
  Play,
  BookOpen,
  Info,
  HelpCircle
} from 'lucide-react';
import { 
  LineChart as ReLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  ReferenceLine
} from 'recharts';

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
  retrievalStrategy: 'dense' | 'hybrid';
  alphaWeight: number;
  topK: number;
  temperature: number;
  persona: 'factual' | 'creative' | 'code';
};

const MOCK_DOCS = [
  { id: 'doc_1', title: 'Q3 Financial Report 2025', text: 'Net revenue increased by 14% year-over-year. Operating margin stabilized at 22%.', metadata: { department: 'Finance', date: '2025-09', confidence: 0.94 } },
  { id: 'doc_2', title: '2026 Remote Work Policy', text: 'Employees may work remotely up to 3 days per week. Office core hours are 10 AM to 3 PM.', metadata: { department: 'HR', date: '2026-01', confidence: 0.89 } },
  { id: 'doc_3', title: 'Kubernetes Deployment Runbook', text: 'Standard deployment utilizes Helm v3.4. Ensure resource limits are set to 500m CPU.', metadata: { department: 'Engineering', date: '2025-11', confidence: 0.96 } },
  { id: 'doc_4', title: 'Employee Benefits Matrix', text: 'Health coverage includes dental, vision, and mental health support with $0 co-pay.', metadata: { department: 'HR', date: '2026-01', confidence: 0.85 } },
  { id: 'doc_5', title: 'Environmental Sustainability Goals', text: 'Mission: achieve net-zero carbon emissions by 2030 through renewable energy transition.', metadata: { department: 'Corporate', date: '2025-12', confidence: 0.91 } },
];

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
    simulateTimeout: false,
    retrievalStrategy: 'dense',
    alphaWeight: 0.5,
    topK: 3,
    temperature: 0.2,
    persona: 'factual'
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBlueprintMode, setIsBlueprintMode] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(true);
  const [drawerTab, setDrawerTab] = useState<'indexer' | 'metrics'>('indexer');
  const [indexerLogs, setIndexerLogs] = useState<string[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [currentLatency, setCurrentLatency] = useState(0);
  const [latencyHistory, setLatencyHistory] = useState([
    { name: 'Req 1', retrieval: 180, generation: 1100 },
    { name: 'Req 2', retrieval: 250, generation: 1400 },
    { name: 'Req 3', retrieval: 210, generation: 900 },
    { name: 'Req 4', retrieval: 450, generation: 1600 },
    { name: 'Req 5', retrieval: 195, generation: 1250 },
  ]);
  const [feedbackStats, setFeedbackStats] = useState({ accepted: 10, rejected: 2 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [indexerLogs]);

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

  const handleCitationClick = (num: number) => {
    const docIndex = num - 1;
    if (docIndex >= 0 && docIndex < MOCK_DOCS.length) {
      setPayload({
        event: "CITATION_INSPECT",
        doc_id: MOCK_DOCS[docIndex].id,
        source: MOCK_DOCS[docIndex].title,
        confidence_score: MOCK_DOCS[docIndex].metadata.confidence,
        raw_text: MOCK_DOCS[docIndex].text,
        metadata: MOCK_DOCS[docIndex].metadata
      });
      setSelectedStepId('retriever');
    }
  };

  const handleFeedback = (messageId: string, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return { ...m, feedback };
      }
      return m;
    }));

    setFeedbackStats(prev => ({
      ...prev,
      accepted: feedback === 'up' ? prev.accepted + 1 : prev.accepted,
      rejected: feedback === 'down' ? prev.rejected + 1 : prev.rejected
    }));
  };

  const renderContentWithCitations = (content: string) => {
    const parts = content.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const num = parseInt(match[1]);
        return (
          <button
            key={i}
            onClick={() => handleCitationClick(num)}
            className="mx-0.5 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 rounded hover:bg-primary hover:text-white transition-all transform hover:scale-110 active:scale-95 shadow-sm"
          >
            {num}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const runPipeline = async (query: string) => {
    const steps = [...INITIAL_PIPELINE];
    let retrievalLat = 0;
    let generationLat = 0;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      // Set current step to processing
      steps[i] = { ...steps[i], status: 'processing' };
      setPipeline([...steps]);
      setSelectedStepId(step.id);
      
      // Update Payload Inspector based on step
      updatePayloadForStep(steps[i].id, query);
      
      // Dynamic Latency Calculation
      let stepLat = 800 + Math.random() * 400;
      if (step.id === 'retriever') {
        retrievalLat = 150 + Math.floor(Math.random() * 250);
        stepLat = retrievalLat;
      } else if (step.id === 'llm') {
        generationLat = 800 + Math.floor(Math.random() * 1200);
        stepLat = generationLat;
      }

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
        const fallbackPayload = {
          status: "200 OK",
          provider: config.secondaryProvider,
          constructed_prompt: `User Query: ${query}\n\nContext Chunks: ...`,
          model: "claude-3-5-sonnet",
          latency_ms: 1420
        };
        setPayload(fallbackPayload);

        // Continue as completed after fallback
        steps[i] = { ...steps[i], status: 'completed', description: `Fallback Active: ${config.secondaryProvider}` };
        setPipeline([...steps]);
      } else {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, stepLat));
        
        // Complete step normally
        steps[i] = { ...steps[i], status: 'completed' };
        setPipeline([...steps]);
      }
    }

    // Update Global Latency State
    const totalLat = retrievalLat + generationLat;
    setCurrentLatency(totalLat);
    setLatencyHistory(prev => {
      const newHistory = [...prev, { 
        name: `Req ${prev.length + 1}`, 
        retrieval: retrievalLat, 
        generation: generationLat 
      }];
      if (newHistory.length > 7) return newHistory.slice(1);
      return newHistory;
    });

    // simulated loading state before showing the final response
    await new Promise(resolve => setTimeout(resolve, 800));

    // Add Assistant Response
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: getMockResponse(query, config),
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
          strategy: config.retrievalStrategy,
          alpha: config.retrievalStrategy === 'hybrid' ? config.alphaWeight : null,
          top_k: config.topK,
          results: MOCK_DOCS.slice(0, config.topK).map(d => ({
            id: d.id,
            title: d.title,
            score: d.metadata.confidence,
            snippet: d.text.substring(0, 80) + "..."
          }))
        });
        break;
      case 'llm':
        const personaPrompts = {
          factual: "You are a precise technical librarian. Answer ONLY with facts from provided chunks.",
          creative: "You are a creative strategist. Summarize chunks into a visionary narrative.",
          code: "You are a senior DevOps engineer. Provide executable steps and configs based on docs."
        };
        setPayload({
          system_prompt: personaPrompts[config.persona],
          temperature: config.temperature,
          top_p: 0.95,
          user_query: query,
          context_window_size: `${config.topK} chunks`,
          max_tokens: config.maxTokenBudget
        });
        break;
    }
  };

  const handleTriggerIndexing = async () => {
    if (isIndexing) return;
    setIsIndexing(true);
    setIndexerLogs([]);
    const logs = [
      "[INFO] Polling Document Store... Found 1 new PDF",
      "[INFO] Initializing OCR & Extraction Kernels...",
      "[INFO] Parsing & Chunking... generated 15 chunks",
      "[INFO] Verifying Content Safety Scopes...",
      "[INFO] Calling Embedding Service API...",
      "[INFO] Normalizing Vector Space...",
      "[INFO] Upserting to PostgreSQL Vector Extension... Success."
    ];

    for (const log of logs) {
      setIndexerLogs(prev => [...prev, log]);
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
    }
    setIsIndexing(false);
  };

  // --- Chart Data ---
  const costData = [
    { name: '10:00', cost: 0.002 },
    { name: '10:05', cost: 0.005 },
    { name: '10:10', cost: 0.003 },
    { name: '10:15', cost: 0.008 },
    { name: '10:20', cost: 0.004 },
    { name: '10:25', cost: 0.006 },
    { name: '10:30', cost: 0.005 },
  ];

  const latencyData = [
    { name: 'Req 1', retrieval: 180, generation: 1100 },
    { name: 'Req 2', retrieval: 250, generation: 1400 },
    { name: 'Req 3', retrieval: 210, generation: 900 },
    { name: 'Req 4', retrieval: 450, generation: 1600 },
    { name: 'Req 5', retrieval: 195, generation: 1250 },
  ];

  const feedbackData = [
    { name: 'Accepted', value: 85 },
    { name: 'Rejected', value: 15 },
  ];
  const COLORS = ['#10b981', '#ef4444'];

  const getMockResponse = (q: string, cfg: ConfigState) => {
    const query = q.toLowerCase();
    const citations = Array.from({ length: cfg.topK }, (_, i) => `[${i + 1}]`).join(' ');
    
    if (cfg.temperature < 0.3) {
      // Dry, structured
      if (cfg.persona === 'code') {
        return `## SYSTEM_EXECUTION_STEPS\n1. Initialize gateway protocol.\n2. Apply security headers.\n3. Verify identity via IAM.\n\nValidated against documentation: ${citations}`;
      }
      return `RECOVERY_REPORT:\n- Status: Verified\n- Reference IDs: ${citations}\n- Compliance: 100%\n\nDocuments indicate that the enterprise RAG environment is configured for ${cfg.retrievalStrategy} search with a temperature of ${cfg.temperature}.`;
    } else if (cfg.temperature > 0.7) {
      // Conversational, verbose
      let tone = "I'm so glad you asked! Looking through our extensive records, I found some really fascinating insights for you.";
      if (cfg.persona === 'creative') {
        tone = "Imagine a world where data flows like a river of light. Based on these beautiful insights I've gathered...";
      }
      return `${tone} It seems like the core of what you're looking for relates to our active policies. Specifically, our archives ${citations} mention some really key points about our strategy. Isn't it interesting how everything connects?`;
    }
    
    // Balanced
    if (query.includes('hr') || query.includes('policy')) {
      return `The new HR policy for 2026 features significant updates, including a transition to an asynchronous-first work model [1] and a 20% increase in professional development stipends [2]. You can find the full document in the internal portal. ${citations}`;
    }
    return `The system has retrieved ${cfg.topK} relevant document fragments from the vector store [1]. Based on the RAG pipeline synthesis ${cfg.retrievalStrategy === 'hybrid' ? '(Hybrid mode)' : ''}, the query matches our latest documentation. How else can I assist? ${citations}`;
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
            onClick={() => setIsBlueprintMode(!isBlueprintMode)}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded transition-all text-[11px] font-bold ${isBlueprintMode ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-bg-main border-border-color text-text-muted hover:text-primary hover:bg-white'}`}
          >
            <Code className="w-3.5 h-3.5" />
            TDD_BLUEPRINT
          </button>
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-bg-main border border-border-color rounded hover:bg-white transition-all text-[11px] font-bold text-text-muted hover:text-primary mr-2"
          >
            <Settings className="w-3.5 h-3.5" />
            CONFIG_SERVICE
          </button>
          <span className="text-[12px] text-text-muted font-mono">LATENCY: {isProcessing ? (120 + Math.floor(Math.random() * 50)) : currentLatency}ms</span>
          <div className="flex items-center gap-2 bg-[#dcfce7] text-[#166534] text-[11px] px-2 py-0.5 rounded-full font-semibold">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            {isProcessing ? 'PIPELINE ACTIVE' : 'EDGE ACTIVE'}
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* --- COLUMN 1: CLIENT (CHAT) --- */}
        <aside className="col-span-4 bg-bg-sidebar border-r border-border-color flex flex-col overflow-hidden">
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
                  <div className="text-[13px] leading-relaxed">
                    {m.role === 'assistant' ? renderContentWithCitations(m.content) : m.content}
                  </div>
                  <div className={`flex items-center justify-between mt-1`}>
                    <div className={`text-[10px] font-mono opacity-50 ${m.role === 'user' ? 'text-white/70' : ''}`}>
                      {m.timestamp}
                    </div>
                    {m.role === 'assistant' && (
                      <div className="flex gap-2">
                        <button 
                          disabled={!!m.feedback}
                          onClick={() => handleFeedback(m.id, 'up')}
                          className={`transition-all p-0.5 ${m.feedback === 'up' ? 'text-emerald-500 scale-110' : 'text-text-muted hover:text-primary'} disabled:cursor-not-allowed`}
                        >
                          <ThumbsUp className={`w-3 h-3 ${m.feedback === 'up' ? 'fill-current' : ''}`} />
                        </button>
                        <button 
                          disabled={!!m.feedback}
                          onClick={() => handleFeedback(m.id, 'down')}
                          className={`transition-all p-0.5 ${m.feedback === 'down' ? 'text-red-500 scale-110' : 'text-text-muted hover:text-red-500'} disabled:cursor-not-allowed`}
                        >
                          <ThumbsDown className={`w-3 h-3 ${m.feedback === 'down' ? 'fill-current' : ''}`} />
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
        <main className="col-span-3 bg-white border-r border-border-color p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[12px] font-bold uppercase tracking-wider text-text-muted">Pipeline Execution Trace</span>
            <span className={`text-[12px] font-bold uppercase tracking-wider ${isProcessing ? 'text-primary' : 'text-text-muted opacity-40'}`}>
              {isProcessing ? 'Running...' : 'Idle'}
            </span>
          </div>

          <div className="space-y-0 translate-x-2">
            {pipeline.map((step, idx) => {
              const isActive = selectedStepId === step.id;
              return (
                <button 
                  key={step.id} 
                  onClick={() => {
                    setSelectedStepId(step.id);
                    // Look up dummy data for this step if messages exist
                    if (messages.length > 0) {
                      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                      updatePayloadForStep(step.id, lastUserMsg?.content || '');
                    }
                  }}
                  className={`w-full text-left pipeline-step transition-all duration-200 outline-none
                    ${step.status === 'completed' ? 'complete' : ''} 
                    ${step.status === 'processing' ? 'active' : ''}
                    ${isActive ? 'bg-blue-50/50 scale-[1.02] border-solid border-primary/40' : 'hover:bg-slate-50'}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <div className={`step-label ${isActive ? 'text-primary font-bold' : ''}`}>{step.label}</div>
                    {step.id === 'auth' && step.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-accent animate-in fade-in zoom-in duration-300" />
                    )}
                    {isActive && (
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    )}
                  </div>
                  <div className="step-meta">
                    {step.status === 'processing' ? 'EXECUTING_KERNEL...' : 
                     (step.id === 'retriever' && step.status === 'completed') ? (
                       <span className="text-primary font-bold">{config.topK}_CHUNKS_RETRIEVED</span>
                     ) :
                     step.status === 'completed' ? 'NODE_SYNC_SUCCESS' : step.description}
                  </div>
                </button>
              );
            })}
          </div>
        </main>

        {/* --- COLUMN 3: PAYLOAD INSPECTOR --- */}
        <section className="col-span-5 bg-bg-terminal flex flex-col overflow-hidden">
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

      {/* --- INFRASTRUCTURE & OBSERVABILITY DRAWER --- */}
      <motion.div 
        animate={{ height: isDrawerOpen ? '320px' : '40px' }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-color shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] z-40 flex flex-col overflow-hidden"
      >
        <header 
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="h-[40px] px-6 flex items-center justify-between cursor-pointer hover:bg-bg-main transition-colors shrink-0"
        >
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Infrastructure & Observability</span>
            {isIndexing && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-[9px] font-mono text-primary">INDEXER_JOB_RUNNING</span>
              </div>
            )}
          </div>
          {isDrawerOpen ? <ChevronDown className="w-4 h-4 opacity-40" /> : <ChevronUp className="w-4 h-4 opacity-40" />}
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Side Nav for Drawer */}
          <aside className="w-[180px] border-r border-border-color bg-bg-main p-2 space-y-1">
            <button 
              onClick={(e) => { e.stopPropagation(); setDrawerTab('indexer'); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-[11px] font-bold transition-all ${drawerTab === 'indexer' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:bg-white/50'}`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              BACKGROUND_INDEXER
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setDrawerTab('metrics'); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-[11px] font-bold transition-all ${drawerTab === 'metrics' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:bg-white/50'}`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              METRICS_DASHBOARD
            </button>
          </aside>

          {/* Content Area */}
          <main className="flex-1 overflow-hidden">
            {drawerTab === 'indexer' ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-border-color flex justify-between items-center bg-white">
                  <span className="text-[10px] font-mono text-text-muted uppercase">Batch Pipeline Terminal</span>
                  <button 
                    onClick={handleTriggerIndexing}
                    disabled={isIndexing}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded text-[10px] font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    TRIGGER DOCUMENT INGESTION
                  </button>
                </div>
                <div 
                  ref={terminalRef}
                  className="flex-1 bg-bg-terminal p-4 font-mono text-[12px] overflow-y-auto"
                >
                  {indexerLogs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-700 opacity-40 italic">
                      Ready for ingestion command...
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {indexerLogs.map((log, i) => (
                        <div key={i} className="text-[#94a3b8]">
                          <span className="text-emerald-500 mr-2">➜</span>
                          {log}
                        </div>
                      ))}
                      {isIndexing && (
                        <div className="text-white animate-pulse">
                          <span className="text-emerald-500 mr-2">➜</span>
                          [PROC] System processing binary data...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full grid grid-cols-3 p-4 gap-4 overflow-y-auto">
                {/* Cost Chart */}
                <div className="bg-white border border-border-color rounded-lg p-3 flex flex-col shadow-sm">
                  <header className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase text-text-muted">Cost Constraints ($)</span>
                    <span className="text-[10px] font-mono text-text-muted opacity-50">REAL_TIME_COST</span>
                  </header>
                  <div className="flex-1 min-h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReLineChart data={costData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" hide />
                        <YAxis tick={{fontSize: 9}} width={35} />
                        <Tooltip contentStyle={{fontSize: '10px'}} />
                        <ReferenceLine y={0.01} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'MAX', position: 'right', fill: '#ef4444', fontSize: 8 }} />
                        <Line type="monotone" dataKey="cost" stroke="#2563eb" strokeWidth={2} dot={false} />
                      </ReLineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Latency Chart */}
                <div className="bg-white border border-border-color rounded-lg p-3 flex flex-col shadow-sm">
                  <header className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase text-text-muted">Latency Breakdown (ms)</span>
                    <span className="text-[10px] font-mono text-text-muted opacity-50">E2E_TIME</span>
                  </header>
                  <div className="flex-1 min-h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={latencyHistory}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" hide />
                        <YAxis tick={{fontSize: 9}} width={35} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{fontSize: '10px'}} />
                        <Legend iconSize={8} wrapperStyle={{fontSize: '9px', paddingTop: '5px'}} />
                        <Bar dataKey="retrieval" fill="#10b981" stackId="a" name="Retrieval" />
                        <Bar dataKey="generation" fill="#2563eb" stackId="a" name="Generation" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Feedback Chart */}
                <div className="bg-white border border-border-color rounded-lg p-3 flex flex-col shadow-sm">
                  <header className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase text-text-muted">Feedback Store</span>
                    <span className="text-[10px] font-mono text-text-muted opacity-50">SATISFACTION</span>
                  </header>
                  <div className="flex-1 min-h-[140px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={[
                            { name: 'Accepted', value: feedbackStats.accepted },
                            { name: 'Rejected', value: feedbackStats.rejected },
                          ]}
                          innerRadius={35}
                          outerRadius={50}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {[0, 1].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{fontSize: '10px'}} />
                        <Legend iconSize={8} wrapperStyle={{fontSize: '9px'}} layout="vertical" align="right" verticalAlign="middle" />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </motion.div>

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

              <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                {/* Providers Group */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Primary LLM</label>
                    <select 
                      value={config.primaryProvider}
                      onChange={(e) => setConfig({...config, primaryProvider: e.target.value})}
                      className="w-full p-2 bg-bg-main border border-border-color rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                    >
                      <option>OpenAI (GPT-4o)</option>
                      <option>Anthropic (Claude 3.5 Sonnet)</option>
                      <option>Local (Llama 3 8B)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Secondary LLM</label>
                    <select 
                      value={config.secondaryProvider}
                      onChange={(e) => setConfig({...config, secondaryProvider: e.target.value})}
                      className="w-full p-2 bg-bg-main border border-border-color rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                    >
                      <option>Anthropic (Claude 3.5 Sonnet)</option>
                      <option>OpenAI (GPT-4o)</option>
                      <option>Local (Mistral v0.3)</option>
                    </select>
                  </div>
                </div>

                {/* Retrieval Strategy */}
                <div className="pt-4 border-t border-border-color space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Retrieval Strategy</label>
                    <div className="flex bg-bg-main p-1 rounded-lg border border-border-color">
                      <button 
                        onClick={() => setConfig({...config, retrievalStrategy: 'dense'})}
                        className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${config.retrievalStrategy === 'dense' ? 'bg-white shadow text-primary' : 'text-text-muted hover:text-primary'}`}
                      >
                        DENSE
                      </button>
                      <button 
                        onClick={() => setConfig({...config, retrievalStrategy: 'hybrid'})}
                        className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${config.retrievalStrategy === 'hybrid' ? 'bg-white shadow text-primary' : 'text-text-muted hover:text-primary'}`}
                      >
                        HYBRID
                      </button>
                    </div>
                  </div>

                  {config.retrievalStrategy === 'hybrid' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-text-muted font-bold">ALPHA WEIGHT (BM25 vs Vector)</span>
                        <span className="text-primary font-bold">{config.alphaWeight.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.05"
                        value={config.alphaWeight}
                        onChange={(e) => setConfig({...config, alphaWeight: parseFloat(e.target.value)})}
                        className="w-full h-1 bg-border-color rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-text-muted font-bold">TOP-K CHUNKS</span>
                      <span className="text-primary font-bold">{config.topK}</span>
                    </div>
                    <input 
                      type="range" min="1" max="5" step="1"
                      value={config.topK}
                      onChange={(e) => setConfig({...config, topK: parseInt(e.target.value)})}
                      className="w-full h-1 bg-border-color rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>

                {/* LLM Parameters */}
                <div className="pt-4 border-t border-border-color space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">System Prompt Persona</label>
                    <select 
                      value={config.persona}
                      onChange={(e) => setConfig({...config, persona: e.target.value as any})}
                      className="w-full p-2 bg-bg-main border border-border-color rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer font-medium"
                    >
                      <option value="factual">Strict Factual (Technical Librarian)</option>
                      <option value="creative">Creative Summarizer (Strategic Analyst)</option>
                      <option value="code">Code Assistant (DevOps Engineer)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-text-muted font-bold">LLM TEMPERATURE</span>
                      <span className="text-primary font-bold">{config.temperature.toFixed(1)}</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.1"
                      value={config.temperature}
                      onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
                      className="w-full h-1 bg-border-color rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[9px] font-mono opacity-40">
                      <span>PRECISE</span>
                      <span>CREATIVE</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-text-muted uppercase font-bold">
                      <span>Max Token Budget</span>
                      <span className="text-primary">{config.maxTokenBudget}</span>
                    </div>
                    <input 
                      type="range" min="512" max="128000" step="512"
                      value={config.maxTokenBudget}
                      onChange={(e) => setConfig({...config, maxTokenBudget: parseInt(e.target.value)})}
                      className="w-full h-1 bg-border-color rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>

                {/* Simulation Toggles */}
                <div className="pt-4 border-t border-border-color">
                  <div className="flex items-center justify-between p-3 bg-red-50/30 border border-red-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ZapOff className="w-4 h-4 text-red-500" />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-red-900">Simulate Timeout</span>
                        <span className="text-[9px] text-red-700 opacity-70 italic">Trigger downstream failure</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={config.simulateTimeout}
                        onChange={(e) => setConfig({...config, simulateTimeout: e.target.checked})}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
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
      {/* --- TDD BLUEPRINT OVERLAY --- */}
      <AnimatePresence>
        {isBlueprintMode && (
          <div className="fixed inset-0 z-[100] pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
            />
            
            <div className="absolute inset-0 grid grid-cols-12 pt-[56px] pb-[40px]">
              {/* Box 1: Chat (Application Layer) */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-4 border-r-2 border-dashed border-cyan-400/60 shadow-[inset_0_0_40px_rgba(34,211,238,0.1)] relative"
              >
                <div className="absolute top-4 left-4 bg-cyan-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">LAYER_01: APP</div>
                <div className="absolute top-[140px] right-[-140px] w-[220px] bg-slate-800 border-l-4 border-cyan-400 p-4 rounded-r-lg shadow-2xl pointer-events-auto z-[110]">
                  <p className="text-[11px] leading-relaxed text-cyan-50">
                    <span className="text-cyan-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">1. Application Layer</span>
                    Manages conversational state, access control, and exposes evaluation surfaces.
                  </p>
                </div>
              </motion.div>

              {/* Box 2: Orchestrator (Model Layer) */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-3 border-r-2 border-dashed border-purple-400/60 shadow-[inset_0_0_40px_rgba(192,132,252,0.1)] relative"
              >
                <div className="absolute top-4 left-4 bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">LAYER_02: MODEL</div>
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[220px] bg-slate-800 border-t-4 border-purple-400 p-4 rounded-b-lg shadow-2xl text-center pointer-events-auto z-[110]">
                  <p className="text-[11px] leading-relaxed text-purple-50">
                    <span className="text-purple-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">2. Model Layer</span>
                    Wraps external APIs behind a unified gateway. Implements RAG and multi-model routing.
                  </p>
                </div>
              </motion.div>

              {/* Box 4: Safety & Quality (Payload Inspector) */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-5 border-dashed border-amber-400/60 shadow-[inset_0_0_40px_rgba(251,191,36,0.1)] relative"
              >
                <div className="absolute top-4 right-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">MODULE_06: SAFETY</div>
                <div className="absolute top-1/2 -left-[140px] -translate-y-1/2 w-[200px] bg-slate-800 border-r-4 border-amber-400 p-4 rounded-l-lg shadow-2xl pointer-events-auto z-[110]">
                  <p className="text-[11px] leading-relaxed text-amber-50">
                    <span className="text-amber-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">6.3 Quality & Safety</span>
                    Input/Output Validation. Enforces guardrails in preprocessing and postprocessing.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Box 3: Infrastructure (Bottom Drawer) overlay on the absolute bottom */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute left-0 right-0 bottom-0 h-10 border-t-2 border-dashed border-emerald-400 bg-emerald-400/10 flex items-center justify-center"
            >
              <div className="absolute -top-16 bg-slate-800 border-b-4 border-emerald-500 p-4 rounded-t-lg shadow-2xl text-center pointer-events-auto">
                <p className="text-[11px] leading-relaxed text-emerald-50">
                  <span className="text-emerald-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">3. Infrastructure Layer</span>
                  Provides services for vector search, background jobs, and observability.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HOW TO USE DEMO MODAL --- */}
      <AnimatePresence>
        {isHowToOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-border-color"
            >
              <div className="bg-primary p-8 text-white relative">
                <button 
                  onClick={() => setIsHowToOpen(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-6 h-6" />
                  <span className="text-[12px] font-bold uppercase tracking-[0.2em] opacity-80">Developer Guide</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Enterprise RAG Visualizer</h2>
                <p className="mt-2 text-blue-100 max-w-md">Technical demonstration of a resilient, observable AI architecture. Follow these scenarios to explore the platform.</p>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">01</div>
                  <h4 className="font-bold text-sm text-slate-900">RAG Knowledge Retrieval</h4>
                  <p className="text-[12px] text-slate-500 leading-relaxed">
                    Input: <code className="bg-slate-100 px-1 rounded">"What is the new HR policy?"</code>
                  </p>
                  <p className="text-[11px] text-slate-400 italic font-medium">Watch the "Retriever" step and check the Payload Inspector for source chunks.</p>
                </div>

                <div className="space-y-3">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold">02</div>
                  <h4 className="font-bold text-sm text-slate-900">Circuit Breaker Failover</h4>
                  <p className="text-[12px] text-slate-500 leading-relaxed">
                    Enable <span className="font-bold">"Simulate Timeout"</span> in the Config Service and send a query.
                  </p>
                  <p className="text-[11px] text-slate-400 italic font-medium">Observe Step 5 fail and immediately route to the secondary LLM provider.</p>
                </div>

                <div className="space-y-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold">03</div>
                  <h4 className="font-bold text-sm text-slate-900">Background Ingestion</h4>
                  <p className="text-[12px] text-slate-500 leading-relaxed">
                    Expand the <span className="font-bold">Observability Drawer</span> and trigger document ingestion.
                  </p>
                  <p className="text-[11px] text-slate-400 italic font-medium">Follow the real-time terminal logs as documents are parsed and vectorized.</p>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                <button 
                  onClick={() => setIsHowToOpen(false)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                >
                  Start Demo Exploration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
