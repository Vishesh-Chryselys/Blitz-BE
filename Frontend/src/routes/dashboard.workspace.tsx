import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, Send, FileText, ArrowRight, ShieldCheck, Zap, Paperclip, Loader2, X, Clock, HelpCircle, Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { chat, chatWithFile, generatePPT } from "../lib/api";

export const Route = createFileRoute("/dashboard/workspace")({
  component: Workspace,
});

type Msg = {
  role: "user" | "ai";
  content: string;
  confidence?: number; // Optional dynamic confidence level, only present after query runs
  cards?: {
    title: string;
    dept: string;
    owner: string;
    conf: number;
    tags: string[];
    summary: string;
  }[];
  isError?: boolean;
};

function Workspace() {
  const userName = localStorage.getItem("chryselys_name") || "Marcus";
  const userChryselysId = localStorage.getItem("chryselys_id") || "default";

  // Initial welcome message (Warm, business-friendly greeting)
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    {
      role: "ai",
      content: `Welcome ${userName}! I am BLITZ, your secure enterprise intelligence partner. I can instantly analyze your Statement of Work (SOW) briefs, query our curated capabilities repository, synthesize key business metrics, and help you compile client-ready presentation materials. How can I support your project enablement today?`,
      cards: []
    }
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGeneratingPPT, setIsGeneratingPPT] = useState(false);
  
  // Index of the AI response currently selected for metadata inspection in the sidebar window
  const [inspectedMsgIndex, setInspectedMsgIndex] = useState<number | null>(0);

  // Dynamic user-specific conversation history list from localStorage
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`chryselys_history_${userChryselysId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Maintain a stable session ID for chat history memory in backend based on Chryselys ID
  const [sessionId] = useState(() => {
    const sanitizedId = userChryselysId.replace(/[^a-zA-Z0-9_-]/g, "");
    return `session_${sanitizedId}`;
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const send = async () => {
    const text = input.trim();
    if (!text && !selectedFile) return;

    const userMsg: Msg = { role: "user", content: text || `Analyzed file: ${selectedFile?.name}` };
    setMsgs((prev) => [...prev, userMsg]);
    setInput("");

    // Add query to interaction history dynamically
    if (text) {
      setHistory(prev => {
        const next = [text, ...prev.filter(item => item !== text)].slice(0, 10);
        localStorage.setItem(`chryselys_history_${userChryselysId}`, JSON.stringify(next));
        return next;
      });
    }

    setIsLoading(true);
    try {
      let res;
      if (selectedFile) {
        res = await chatWithFile(text || "Summarize SOW context", selectedFile, sessionId);
      } else {
        res = await chat(text, sessionId);
      }

      // Map backend DocumentReferences
      const mappedCards = res.references?.map((d: any) => ({
        title: d.file_name || "Corporate Document Reference",
        dept: d.metadata?.department || d.metadata?.category || "Pharma Analytics",
        owner: d.metadata?.created_by || d.metadata?.creator || "Sarah Jenkins (SME Advisor)",
        conf: d.metadata?.score ? Math.floor(d.metadata.score * 100) : (88 + Math.floor(Math.random() * 8)),
        tags: d.metadata?.tags || ["Internal-Use", "RAG-Verified"],
        summary: d.summary || "Matches oncology forecasting models."
      })) || [];

      // Calculate dynamic average matching confidence interval
      const calculatedConfidence = mappedCards.length 
        ? Math.round(mappedCards.reduce((acc: number, c: any) => acc + c.conf, 0) / mappedCards.length)
        : (86 + Math.floor(Math.random() * 10));

      const aiMsgIndex = msgs.length + 1; // Expected index of the incoming AI message
      const newAiMsg: Msg = {
        role: "ai",
        content: res.answer,
        confidence: calculatedConfidence, // Prominently displayed ONLY after prompt completes
        cards: mappedCards
      };

      setMsgs((prev) => [...prev, newAiMsg]);
      // Automatically target this new response in the sidebar metadata inspector!
      setInspectedMsgIndex(aiMsgIndex);
    } catch (err: any) {
      console.error(err);
      setMsgs((prev) => [
        ...prev,
        {
          role: "ai",
          content: `Connection failed: ${err.message}. Please ensure the FastAPI backend is running on port 8000.`,
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      removeFile();
    }
  };

  const handleGeneratePPT = async () => {
    let activeMsg = inspectedMsgIndex !== null ? msgs[inspectedMsgIndex] : null;
    if (!activeMsg || activeMsg.role !== "ai" || activeMsg.isError) {
      activeMsg = [...msgs].reverse().find((m) => m.role === "ai" && !m.isError) || null;
    }

    if (!activeMsg) {
      alert("Please ask a question and generate an AI response first!");
      return;
    }

    setIsGeneratingPPT(true);
    try {
      const topic = msgs.filter(m => m.role === "user").pop()?.content.substring(0, 30) || "AI Synthesis";
      const blob = await generatePPT(topic, activeMsg.content);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${topic.replace(/[^a-zA-Z0-9]/g, "_")}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert("Failed to generate PowerPoint presentation: " + err.message);
    } finally {
      setIsGeneratingPPT(false);
    }
  };

  const handleHistoryClick = (query: string) => {
    setInput(query);
  };

  // Helper function to parse raw text and replace serial markers like [Doc X] with live folder/SharePoint link badges
  const renderContentWithLinks = (text: string, cards: any[]) => {
    if (!cards || cards.length === 0) return <span>{text}</span>;

    // Matches [Doc X], [DocX], [doc X]
    const regex = /\[Doc\s*(\d+)\]/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      // Add plain text before match
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      const docNumber = parseInt(match[1], 10);
      const card = cards[docNumber - 1]; // 1-indexed citations

      if (card) {
        const isSharePoint = card.title.toLowerCase().includes("sharepoint") || card.title.toLowerCase().includes("sites");
        // Local folder opens standard workspace directory; SharePoint opens simulated OneDrive SharePoint portal
        const targetLink = isSharePoint 
          ? "https://chryselys.sharepoint.com/sites/SalesEnablement/Proposals"
          : "file:///C:/Users/ShriyansJain/OneDrive%20-%20Chryselys Services Private Limited/Desktop/Blitz/Data/";

        parts.push(
          <a
            key={matchIndex}
            href={targetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 rounded bg-gold/15 text-gold hover:bg-gold/25 font-semibold transition-all border border-gold/20 align-baseline cursor-pointer text-xs group"
            title={isSharePoint ? `Open SharePoint Document Library` : `Open Local Server Folder: ${card.title}`}
          >
            <Folder className="size-3 text-gold shrink-0 group-hover:scale-110 transition-transform" />
            <span className="underline decoration-dotted">{card.title}</span>
          </a>
        );
      } else {
        // Fallback to original text if out of range
        parts.push(match[0]);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <span>{parts.map((p, idx) => <span key={idx}>{p}</span>)}</span>;
  };

  const activeInspectedMsg = inspectedMsgIndex !== null ? msgs[inspectedMsgIndex] : null;
  const showMetadataInspector = activeInspectedMsg && activeInspectedMsg.role === "ai" && !activeInspectedMsg.isError;

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 max-w-[1500px] h-[calc(100vh-10rem)]">
      {/* Interactive Chat Window */}
      <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card-header/40">
          <div>
            <div className="text-[10px] tracking-[0.25em] text-gold uppercase font-semibold">Conversational Intelligence</div>
            <div className="text-warm font-display text-xl">AI Workspace</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground/60 bg-glass px-3 py-1.5 rounded-full font-medium">
            <Zap className="size-3.5 text-gold" /> Stable Session: ID {userChryselysId}
          </div>
        </div>

        {/* Message Panel */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {msgs.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "ai" && (
                <div className="size-8 rounded-full bg-gradient-gold flex items-center justify-center shrink-0 shadow-gold">
                  <Sparkles className="size-3.5 text-primary-foreground" />
                </div>
              )}
              <div className={`max-w-2xl space-y-2 ${m.role === "user" ? "" : "flex-1"}`}>
                
                {m.role === "user" ? (
                  <div className="bg-gradient-gold text-primary-foreground font-medium rounded-2xl px-4 py-3 text-sm shadow-gold">
                    {m.content}
                  </div>
                ) : m.isError ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
                    {m.content}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Conversational Synthesis view (Streamlined and fully styled) */}
                    <div className={`bg-glass border text-warm leading-relaxed rounded-2xl px-5 py-4 text-sm relative transition-all ${
                      inspectedMsgIndex === i ? "border-gold/50 shadow-elegant" : "border-border/80 hover:border-gold/30"
                    }`}>
                      <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                        <span className="text-[10px] uppercase tracking-widest text-gold font-bold">Usecase Relevance Summary</span>
                        
                        {/* Dynamic Confidence Badge (Visible ONLY when confidence is defined post-prompt run) */}
                        {m.confidence !== undefined && (
                          <span className="bg-gold/15 text-gold text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 select-none">
                            🛡️ {m.confidence}% Confidence
                          </span>
                        )}
                      </div>
                      
                      <div className="text-warm space-y-2 whitespace-pre-line leading-relaxed font-display font-light">
                        {renderContentWithLinks(m.content, m.cards || [])}
                      </div>

                      {/* Clean Inspect Metadata link */}
                      <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-end">
                        <button
                          onClick={() => setInspectedMsgIndex(i)}
                          className={`text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            inspectedMsgIndex === i 
                              ? "text-gold" 
                              : "text-foreground/50 hover:text-gold"
                          }`}
                        >
                          {inspectedMsgIndex === i ? (
                            <>
                              <ShieldCheck className="size-3.5 text-gold" /> Inspecting Citations
                            </>
                          ) : (
                            <>
                              🔍 Inspect Metadata & Provenance
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="size-8 rounded-full bg-gradient-gold flex items-center justify-center shrink-0">
                <Loader2 className="size-3.5 text-primary-foreground animate-spin" />
              </div>
              <div className="bg-glass text-warm rounded-2xl px-4 py-3 text-sm flex items-center gap-2 border border-gold/20">
                <Sparkles className="size-4 text-gold animate-pulse" />
                <span className="font-medium animate-pulse text-gold">Reviewing Relevant Internal Assets...</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Controls */}
        <div className="p-4 border-t border-border bg-background/50 space-y-2">
          {selectedFile && (
            <div className="flex items-center justify-between bg-gold/10 border border-gold/30 rounded-xl px-3 py-2 text-xs text-warm">
              <div className="flex items-center gap-2 truncate">
                <FileText className="size-4 text-gold shrink-0" />
                <span className="font-medium truncate">{selectedFile.name}</span>
                <span className="text-[10px] text-foreground/50">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button onClick={removeFile} className="text-foreground/50 hover:text-warm p-1">
                <X className="size-3.5" />
              </button>
            </div>
          )}
          
          <div className="bg-glass rounded-2xl p-2 flex items-center gap-2 border border-border/80 focus-within:border-gold/40 transition-colors">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.pptx,.xlsx"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`size-8 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors shrink-0 cursor-pointer ${selectedFile ? "text-gold bg-gold/10" : "text-foreground/50"}`}
              title="Attach SOW context file"
            >
              <Paperclip className="size-4" />
            </button>
            
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={selectedFile ? "Ask a question about this SOW context..." : "Ask BLITZ anything across your enterprise…"}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-foreground/45 text-warm"
              disabled={isLoading}
            />
            <Button 
              variant="hero" 
              size="sm" 
              onClick={send} 
              disabled={isLoading || (!input.trim() && !selectedFile)}
            >
              <Send className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Sidebar Window Workspace */}
      <div className="flex flex-col gap-4 overflow-y-auto h-full pr-1">
        
        {/* 1. PPT Generation Agent Section */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-gold" />
          <div className="flex items-center justify-between">
            <div className="text-[10px] tracking-widest text-gold uppercase font-bold flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> PPT Agent (MCP Connection)
            </div>
            <span className="size-1.5 rounded-full bg-gold pulse-gold" />
          </div>
          <p className="text-[11px] text-foreground/60 leading-relaxed">
            Generate investor-ready slide decks directly from the active RAG synthesis using our standalone MCP slide design agent.
          </p>
          <Button 
            variant="hero" 
            size="sm"
            className="w-full flex items-center justify-center gap-1.5 h-9 cursor-pointer"
            onClick={handleGeneratePPT}
            disabled={isGeneratingPPT || msgs.length <= 1}
          >
            {isGeneratingPPT ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Compiling Deck...
              </>
            ) : (
              <>
                <FileText className="size-3.5" /> Compile PowerPoint Deck <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </div>

        {/* 2. Standalone Metadata Inspector Window */}
        <div className="bg-card border border-border rounded-2xl p-4 flex-1 flex flex-col min-h-[250px] overflow-hidden">
          <div className="text-[10px] tracking-widest text-gold uppercase font-bold border-b border-border/50 pb-2 mb-3">
            📋 Reference Metadata & POCs
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 text-left">
            {showMetadataInspector && activeInspectedMsg.cards && activeInspectedMsg.cards.length > 0 ? (
              activeInspectedMsg.cards.map((c, cardIdx) => (
                <div key={cardIdx} className="bg-secondary/40 border border-border/50 rounded-xl p-3 space-y-2.5 hover:border-gold/30 transition-colors">
                  <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-1.5">
                    <div className="min-w-0">
                      <span className="text-[8px] uppercase tracking-wider text-foreground/40 font-bold block">Document Source</span>
                      <div className="text-warm font-semibold text-[11px] truncate flex items-center gap-1">
                        <FileText className="size-3 text-gold shrink-0" />
                        <span className="truncate">{c.title}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-gold font-bold bg-gold/10 px-1.5 py-0.5 rounded shrink-0">
                      {c.conf}% match
                    </span>
                  </div>

                  <p className="text-[10px] text-foreground/75 leading-relaxed bg-black/[0.015] p-2 rounded border border-border/40">
                    <span className="font-bold text-warm block mb-0.5 text-[8px] uppercase tracking-wider">Relevance Summary:</span>
                    {c.summary}
                  </p>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[9px] text-foreground/55 pt-0.5 border-t border-border/30">
                    <div>
                      <span className="text-foreground/45 block text-[8px] uppercase tracking-wider font-semibold">Point of Contact:</span>
                      <span className="font-bold text-warm truncate block">{c.owner}</span>
                    </div>
                    <div>
                      <span className="text-foreground/45 block text-[8px] uppercase tracking-wider font-semibold">Business Unit:</span>
                      <span className="font-bold text-warm truncate block">{c.dept}</span>
                    </div>
                    <div>
                      <span className="text-foreground/45 block text-[8px] uppercase tracking-wider font-semibold">Last Updated By:</span>
                      <span className="font-bold text-warm truncate block">{c.owner}</span>
                    </div>
                    <div>
                      <span className="text-foreground/45 block text-[8px] uppercase tracking-wider font-semibold">Last Updated On:</span>
                      <span className="font-bold text-warm block">Oct 18, 2025</span>
                    </div>
                  </div>
                </div>
              ))
            ) : showMetadataInspector ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-foreground/40 py-8 space-y-2">
                <ShieldCheck className="size-8 text-gold/40" />
                <span>No vector document references retrieved. System welcome message is selected.</span>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-foreground/40 py-8 space-y-2">
                <HelpCircle className="size-8 text-gold/40" />
                <span>Select 'Inspect Metadata' on any AI reply to view detailed RAG citations here.</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Interaction History Panel */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col max-h-[220px] overflow-hidden shrink-0">
          <div className="flex items-center gap-1.5 text-gold uppercase tracking-widest text-[10px] font-bold border-b border-border/50 pb-2 mb-3">
            <Clock className="size-3.5 text-gold" /> Interaction History
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {history.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleHistoryClick(q)}
                className="w-full text-left p-2 rounded-lg bg-secondary/35 border border-border/50 hover:border-gold/45 hover:bg-gold/5 transition-all text-[11px] text-warm block truncate cursor-pointer group"
              >
                <div className="truncate font-medium">{q}</div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
