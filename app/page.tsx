"use client";
import { useMemo, useState } from "react";
import { 
  ChevronRight, 
  Copy, 
  X, 
  Settings as SettingsIcon, 
  MessageSquare,
  Bot,
  Sparkles,
  Zap,
  Brain,
  Cpu,
  Star,
  Home as HomeIcon
} from "lucide-react";
import Settings from "@/components/Settings";
import HomePage from "@/components/HomePage";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { MODEL_CATALOG } from "@/lib/models";
import { AiModel, ChatMessage, ApiKeys, ChatThread } from "@/lib/types";
import { callGemini, callOpenRouter } from "@/lib/client";
import { AiInput } from "@/components/AIChatBox";
import MarkdownLite from "@/components/MarkdownLite";

export default function Home() {
  const [selectedIds, setSelectedIds] = useLocalStorage<string[]>(
    "ai-fiesta:selected-models",
    [
      "gemini-2.5-flash",
      "deepseek-r1",
      "llama-3.3-70b-instruct",
      "moonshot-kimi-k2",
      "qwen-2.5-72b-instruct",
    ]
  );
  const [keys] = useLocalStorage<ApiKeys>("ai-fiesta:keys", {});
  const [threads, setThreads] = useLocalStorage<ChatThread[]>("ai-fiesta:threads", []);
  const [activeId, setActiveId] = useLocalStorage<string | null>("ai-fiesta:active-thread", null);
  const [sidebarOpen, setSidebarOpen] = useLocalStorage<boolean>("ai-fiesta:sidebar-open", true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [modelsModalOpen, setModelsModalOpen] = useState(false);
  const [showHomePage, setShowHomePage] = useLocalStorage<boolean>("ai-fiesta:show-homepage", true);
  const activeThread = useMemo(() => threads.find(t => t.id === activeId) || null, [threads, activeId]);
  const messages = useMemo(() => activeThread?.messages ?? [], [activeThread]);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const selectedModels = useMemo(() => MODEL_CATALOG.filter(m => selectedIds.includes(m.id)), [selectedIds]);
  const anyLoading = loadingIds.length > 0;

  // Copy helper with fallback when navigator.clipboard is unavailable
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        // ignore
      }
    }
  };

  const toggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : (prev.length >= 5 ? prev : [...prev, id]));
  };

  // Delete a chat thread
  const deleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads(prev => prev.filter(t => t.id !== threadId));
    if (activeId === threadId) {
      setActiveId(null);
    }
  };

  // Get icon for model
  const getModelIcon = (modelId: string) => {
    if (modelId.includes('gemini')) return <Sparkles className="w-4 h-4" />;
    if (modelId.includes('deepseek')) return <Brain className="w-4 h-4" />;
    if (modelId.includes('llama')) return <Zap className="w-4 h-4" />;
    if (modelId.includes('moonshot') || modelId.includes('kimi')) return <Star className="w-4 h-4" />;
    if (modelId.includes('qwen')) return <Cpu className="w-4 h-4" />;
    return <Bot className="w-4 h-4" />;
  };

  function ensureThread() {
    if (activeThread) return activeThread;
    const t: ChatThread = { id: crypto.randomUUID(), title: "New Chat", messages: [], createdAt: Date.now() };
    setThreads(prev => [t, ...prev]);
    setActiveId(t.id);
    return t;
  }

  async function send(text: string, imageDataUrl?: string) {
    const prompt = text.trim();
    if (!prompt) return;
    if (selectedModels.length === 0) return alert("Select at least one model.");
    const userMsg: ChatMessage = { role: "user", content: prompt, ts: Date.now() };
    const thread = ensureThread();
    const nextHistory = [...(thread.messages ?? []), userMsg];
    // set thread messages and optional title
    setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, title: thread.title === "New Chat" ? prompt.slice(0, 40) : t.title, messages: nextHistory } : t));
    // input reset handled within AiInput component

    // fire all selected models in parallel
    setLoadingIds(selectedModels.map(m => m.id));
    await Promise.allSettled(selectedModels.map(async (m: AiModel) => {
      try {
        let res: unknown;
        if (m.provider === "gemini") {
          // If user hasn't set a key, rely on server env fallback
          res = await callGemini({ apiKey: keys.gemini || undefined, model: m.model, messages: nextHistory, imageDataUrl });
        } else {
          res = await callOpenRouter({ apiKey: keys.openrouter || undefined, model: m.model, messages: nextHistory });
        }
        const text = (() => {
          const r = res as { text?: unknown; error?: unknown } | null | undefined;
          const t = r && typeof r === 'object' ? (typeof r.text === 'string' ? r.text : undefined) : undefined;
          const e = r && typeof r === 'object' ? (typeof r.error === 'string' ? r.error : undefined) : undefined;
          return t || e || "No response";
        })();
        const asst: ChatMessage = { role: "assistant", content: String(text), modelId: m.id, ts: Date.now() };
        // Append to current thread messages to accumulate answers from multiple models
        setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, messages: [...(t.messages ?? nextHistory), asst] } : t));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        const asst: ChatMessage = { role: "assistant", content: `[${m.label}] Error: ${msg}`, modelId: m.id, ts: Date.now() };
        setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, messages: [...(t.messages ?? nextHistory), asst] } : t));
      } finally {
        setLoadingIds(prev => prev.filter(x => x !== m.id));
      }
    }));
  }

  // group assistant messages by turn for simple compare view
  const pairs = useMemo(() => {
    const rows: { user: ChatMessage; answers: ChatMessage[] }[] = [];
    let currentUser: ChatMessage | null = null;
    for (const m of messages) {
      if (m.role === "user") {
        currentUser = m;
        rows.push({ user: m, answers: [] });
      } else if (m.role === "assistant" && currentUser) {
        rows[rows.length - 1]?.answers.push(m);
      }
    }
    return rows;
  }, [messages]);

  // Show homepage if user hasn't started using the app
  if (showHomePage) {
    return (
      <HomePage 
        onGetStarted={() => setShowHomePage(false)} 
      />
    );
  }

  return (
    <div className="h-screen w-full bg-background relative text-foreground flex">
      {/* Desktop Sidebar */}
      <div className={`${sidebarOpen ? 'w-[260px]' : 'w-0'} hidden lg:block transition-all duration-200 overflow-hidden border-r border-border bg-muted/30`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-border">
            <button
              onClick={() => {
                const t: ChatThread = { id: crypto.randomUUID(), title: 'New Chat', messages: [], createdAt: Date.now() };
                setThreads(prev => [t, ...prev]);
                setActiveId(t.id);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded"
            >
              <MessageSquare className="w-4 h-4" />
              New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Recent Chats</div>
            <div className="space-y-1">
              {threads.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">No chats yet</div>
              )}
                               {threads.map(t => (
                   <div key={t.id} className="relative group">
                     <button
                       onClick={() => setActiveId(t.id)}
                       className={`w-full flex items-center gap-2 px-3 py-2 pr-8 rounded text-sm transition-colors ${
                         t.id === activeId 
                           ? 'bg-accent text-accent-foreground' 
                           : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                       }`}
                       title={t.title || 'Untitled'}
                     >
                       <MessageSquare className="w-3 h-3 opacity-60 flex-shrink-0" />
                       <span className="truncate text-left">{t.title || 'Untitled'}</span>
                     </button>
                     <button
                       onClick={(e) => deleteThread(t.id, e)}
                       className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground rounded transition-all"
                       title="Delete chat"
                     >
                       <X className="w-3 h-3" />
                     </button>
                   </div>
                 ))}
            </div>
          </div>
          
          <div className="p-4 border-t border-border space-y-2">
            <button
              onClick={() => setShowHomePage(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground rounded transition-colors"
            >
              <HomeIcon className="w-4 h-4" />
              Back to Home
            </button>
            <Settings />
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[280px] bg-background border-r border-border">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold">Weeble Chat</h2>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="px-3 py-1 bg-secondary text-sm rounded"
                  >
                    Close
                  </button>
                </div>
                <button
                  onClick={() => {
                    const t: ChatThread = { id: crypto.randomUUID(), title: 'New Chat', messages: [], createdAt: Date.now() };
                    setThreads(prev => [t, ...prev]);
                    setActiveId(t.id);
                    setMobileSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded"
                >
                  <MessageSquare className="w-4 h-4" />
                  New Chat
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Recent Chats</div>
                <div className="space-y-1">
                  {threads.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">No chats yet</div>
                  )}
                                     {threads.map(t => (
                     <div key={t.id} className="relative group">
                       <button
                         onClick={() => {
                           setActiveId(t.id);
                           setMobileSidebarOpen(false);
                         }}
                         className={`w-full flex items-center gap-2 px-3 py-2 pr-8 rounded text-sm transition-colors ${
                           t.id === activeId 
                             ? 'bg-accent text-accent-foreground' 
                             : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                         }`}
                         title={t.title || 'Untitled'}
                       >
                         <MessageSquare className="w-3 h-3 opacity-60 flex-shrink-0" />
                         <span className="truncate text-left">{t.title || 'Untitled'}</span>
                       </button>
                       <button
                         onClick={(e) => deleteThread(t.id, e)}
                         className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground rounded transition-all"
                         title="Delete chat"
                       >
                         <X className="w-3 h-3" />
                       </button>
                     </div>
                   ))}
                </div>
              </div>
              
              <div className="p-4 border-t border-border space-y-2">
                <button
                  onClick={() => setShowHomePage(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground rounded transition-colors"
                >
                  <HomeIcon className="w-4 h-4" />
                  Back to Home
                </button>
                <Settings />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top navigation */}
        <nav className="px-4 py-3 flex items-center justify-between border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-secondary transition-colors lg:block hidden rounded"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-secondary transition-colors rounded"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <h1 className="text-lg font-semibold">Weeble Chat</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModelsModalOpen(true)}
              className="px-3 py-2 text-sm flex items-center gap-2 bg-secondary hover:bg-secondary/80 transition-colors rounded"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Models</span>
            </button>
          </div>
        </nav>

        {/* Selected models bar */}
        {/* {selectedModels.length > 0 && (
          <div className="border-b border-border p-3 bg-muted/30">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Active:</span>
              {selectedModels.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 text-xs whitespace-nowrap rounded"
                >
                  {getModelIcon(m.id)}
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )} */}

        {/* Models Modal */}
        {modelsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => setModelsModalOpen(false)} />
            <div className="relative w-full max-w-4xl mx-auto bg-card border border-border rounded-lg shadow-lg p-6 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Select AI Models
                </h3>
                <button 
                  onClick={() => setModelsModalOpen(false)} 
                  className="p-2 hover:bg-secondary transition-colors rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-muted-foreground mb-6 text-center">
                Choose up to 5 models to compare responses. Selected: {selectedIds.length}/5
              </div>
              <div className="space-y-2 overflow-y-auto pr-2">
                {MODEL_CATALOG.map((m) => {
                  const selected = selectedIds.includes(m.id);
                  const disabled = !selected && selectedIds.length >= 5;
                  return (
                    <button
                      key={m.id}
                      onClick={() => !disabled && toggle(m.id)}
                      className={`w-full p-4 border transition-all text-left rounded ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary shadow-md'
                          : disabled
                          ? 'bg-muted text-muted-foreground border-border cursor-not-allowed opacity-60'
                          : 'bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground'
                      }`}
                      title={selected ? 'Click to unselect' : disabled ? 'Limit reached (5 max)' : 'Click to select'}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getModelIcon(m.id)}
                          <div className="flex flex-col">
                            <span className="font-medium">{m.label}</span>
                            <span className="text-xs opacity-70">
                              {m.provider === 'gemini' ? 'Google Gemini' : 'OpenRouter'}
                            </span>
                          </div>
                        </div>
                        <div className={`w-4 h-4 border-2 flex items-center justify-center rounded-sm ${
                          selected 
                            ? 'bg-white border-white' 
                            : 'border-current'
                        }`}>
                          {selected && <span className="text-primary text-xs">✓</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-hidden bg-background">
          {selectedModels.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center py-12">
                <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Chat!</h3>
                <p className="text-muted-foreground mb-6">Select models to start comparing AI responses</p>
                <button
                  onClick={() => setModelsModalOpen(true)}
                  className="px-6 py-3 flex items-center gap-2 mx-auto bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded"
                >
                  <Bot className="w-4 h-4" />
                  Select Models
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <div className="p-4">
                {/* Header row: model labels */}
                <div
                  className="grid gap-4 items-end mb-6 min-w-max"
                  style={{ gridTemplateColumns: `repeat(${selectedModels.length}, minmax(300px, 1fr))` }}
                >
                  {selectedModels.map((m) => (
                    <div key={m.id} className="bg-secondary px-4 py-3 flex items-center justify-between rounded">
                      <div className="flex items-center gap-2">
                        {getModelIcon(m.id)}
                        <span className="text-sm font-semibold truncate">{m.label}</span>
                      </div>
                      {loadingIds.includes(m.id) && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                          <span className="text-xs text-primary">Thinking…</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Rows: one per user turn, with a cell per model aligned */}
                {pairs.map((row, i) => (
                  <div key={i} className="mb-8">
                    {/* User prompt */}
                    <div className="bg-accent p-4 mb-4 flex items-center justify-between gap-4 rounded">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-accent-foreground opacity-70">You asked:</span>
                        <p className="text-accent-foreground mt-1">{row.user.content}</p>
                      </div>
                      <button
                        onClick={() => {
                          const all = selectedModels.map((m) => {
                            const ans = row.answers.find((a) => a.modelId === m.id);
                            const header = m.label;
                            const body = ans?.content ?? '';
                            return `## ${header}\n${body}`;
                          }).join('\n\n');
                          copyToClipboard(all);
                        }}
                        className="px-3 py-2 text-xs whitespace-nowrap flex items-center gap-1 bg-secondary hover:bg-secondary/80 transition-colors rounded"
                        title="Copy all model responses for this prompt"
                      >
                        <Copy className="w-3 h-3" />
                        Copy All
                      </button>
                    </div>
                    <div
                      className="grid gap-4"
                      style={{ gridTemplateColumns: `repeat(${selectedModels.length}, minmax(300px, 1fr))` }}
                    >
                      {selectedModels.map((m) => {
                        const ans = row.answers.find((a) => a.modelId === m.id);
                        return (
                          <div key={m.id} className="h-full">
                            <div className="relative bg-card p-4 h-full min-h-[200px] border border-border shadow-sm rounded">
                              {ans && (
                                <button
                                  onClick={() => copyToClipboard(ans.content)}
                                  className="absolute top-3 right-3 z-10 p-1 hover:bg-secondary transition-colors rounded"
                                  title={`Copy ${m.label} response`}
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                              <div className="text-sm leading-relaxed w-full pr-12">
                                {ans ? (
                                  <>
                                    <MarkdownLite text={ans.content} />
                                    {(() => {
                                      try {
                                        const txt = String(ans.content || '');
                                        const show = /rate limit|add your own\s+.*api key/i.test(txt);
                                        return show;
                                      } catch { return false; }
                                    })() && (
                                      <div className="mt-3">
                                        <button
                                          onClick={() => window.dispatchEvent(new Event('open-settings'))}
                                          className="px-3 py-2 text-xs flex items-center gap-1 bg-secondary hover:bg-secondary/80 transition-colors rounded"
                                        >
                                          <SettingsIcon className="w-3 h-3" />
                                          Add API Keys
                                        </button>
                                      </div>
                                    )}
                                  </>
                                ) : loadingIds.includes(m.id) ? (
                                  <div className="animate-pulse space-y-3">
                                    <div className="h-3 w-1/3 rounded bg-primary/30" />
                                    <div className="h-2 rounded bg-muted" />
                                    <div className="h-2 rounded bg-muted w-5/6" />
                                    <div className="h-2 rounded bg-muted w-2/3" />
                                    <div className="h-2 rounded bg-muted w-4/5" />
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-32">
                                    <span className="text-muted-foreground">Waiting for response...</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom input */}
        <div className="border-t border-border bg-background p-4">
          <div className="max-w-4xl mx-auto">
            <AiInput onSubmit={(text, imageDataUrl) => { send(text, imageDataUrl); }} loading={anyLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}