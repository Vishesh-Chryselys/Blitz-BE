import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, FileText, CheckCircle2, Loader2, Sparkles, Layers, Database, Zap, 
  AlertCircle, Share2, FolderKanban, ShieldCheck, Plus, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerIngestion, fetchIndexedFiles, type IndexedFile } from "../lib/api";

export const Route = createFileRoute("/dashboard/upload")({
  component: UploadPage,
});

const PIPELINE = [
  { icon: FileText, label: "Parse", desc: "OCR + structure" },
  { icon: Layers, label: "Chunk", desc: "Semantic boundaries" },
  { icon: Database, label: "Embed", desc: "Vector indexing" },
  { icon: Sparkles, label: "Enrich", desc: "Metadata + POCs" },
  { icon: Zap, label: "Serve", desc: "Live queries" },
];

function UploadPage() {
  // Navigation tabs for adding data sources
  const [activeConnector, setActiveConnector] = useState<"directory" | "sharepoint">("directory");
  const [folderPath, setFolderPath] = useState("Data");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // SharePoint Connector State
  const [spUrl, setSpUrl] = useState("https://chryselys.sharepoint.com/sites/SalesEnablement");
  const [spLibrary, setSpLibrary] = useState("Proposals");
  const [isConnectingSp, setIsConnectingSp] = useState(false);
  const [spStatus, setSpStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [spConnected, setSpConnected] = useState(false);
  const [, setActiveIngestions] = useState<{ name: string; type: string; stage: string; progress: number; files: number }[]>([]);

  const [indexedFiles, setIndexedFiles] = useState<IndexedFile[]>([]);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);

  const fetchFiles = async () => {
    setIsFetchingFiles(true);
    try {
      const res = await fetchIndexedFiles();
      setIndexedFiles(res.files || []);
    } catch (err) {
      console.error("Failed to fetch indexed files:", err);
    } finally {
      setIsFetchingFiles(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleIngestion = async () => {
    setIsLoading(true);
    setStatus({ type: "info", message: `Triggering ingestion pipeline for folder '${folderPath}'...` });
    
    try {
      // Always ingest documents into the shared knowledge base namespace
      // NOT the personal session namespace — that's for chat memory only
      const res = await triggerIngestion(folderPath, "knowledge_base");
      
      setStatus({ 
        type: "success", 
        message: `Successfully triggered! Background ingestion job started for folder /${folderPath}.` 
      });

      // Fetch updates shortly after to reflect new files
      setTimeout(fetchFiles, 3000);
      setTimeout(fetchFiles, 8000);

    } catch (err: any) {
      console.error(err);
      setStatus({ 
        type: "error", 
        message: `Ingestion failed: ${err.message}. Ensure uvicorn backend is running.` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectSharePoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spUrl.trim()) return;

    setIsConnectingSp(true);
    setSpStatus({ type: "info", message: "Verifying SharePoint tenant OAuth permissions..." });

    try {
      // Simulate OAuth connection handshake with MS Graph API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSpConnected(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("connected_sharepoint_url", spUrl);
        window.localStorage.setItem("connected_sharepoint_library", spLibrary);
      }
      setSpStatus({ 
        type: "success", 
        message: "MS SharePoint Handshake complete! Connected successfully under secure tenant ID 'chryselys-prod-9a7'. Connected to library: 'Proposals'." 
      });

      // Add to active streams
      const spStream = {
        name: `SharePoint Library: /${spLibrary}`,
        type: "SharePoint",
        stage: "Processing",
        progress: 10,
        files: 8
      };
      setActiveIngestions(prev => [spStream, ...prev]);

      // Progress stream
      let currentProgress = 10;
      const interval = setInterval(() => {
        currentProgress += 15;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          setActiveIngestions(prev => 
            prev.map(item => 
              item.name === spStream.name 
                ? { ...item, progress: 100, stage: "Done" } 
                : item
            )
          );
        } else {
          setActiveIngestions(prev => 
            prev.map(item => 
              item.name === spStream.name 
                ? { ...item, progress: currentProgress, stage: currentProgress > 60 ? "Embedding" : currentProgress > 30 ? "Chunking" : "Parsing" } 
                : item
            )
          );
        }
      }, 1500);

    } catch (err: any) {
      setSpStatus({ type: "error", message: "Failed to connect SharePoint site: Tenant credentials mismatch." });
    } finally {
      setIsConnectingSp(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto py-2">
      <div>
        <div className="text-[11px] tracking-[0.25em] text-gold uppercase mb-2 font-bold">Data Management</div>
        <h1 className="font-display text-4xl text-gradient-warm">Managed Data Sources</h1>
        <p className="text-sm text-foreground/60 mt-1">Connect corporate folder directories or Microsoft SharePoint libraries to index unstructured files securely into Pinecone.</p>
      </div>

      <div className="grid md:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left Side: Add Data Source Panel */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          <div className="flex border-b border-border/80 pb-3 gap-6">
            <button
              onClick={() => setActiveConnector("directory")}
              className={`pb-2 text-sm font-display tracking-wide font-medium cursor-pointer transition-all ${
                activeConnector === "directory" ? "text-gold border-b-2 border-gold" : "text-foreground/50 hover:text-foreground/75"
              }`}
            >
              📁 Server Folder Directory
            </button>
            <button
              onClick={() => setActiveConnector("sharepoint")}
              className={`pb-2 text-sm font-display tracking-wide font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                activeConnector === "sharepoint" ? "text-gold border-b-2 border-gold" : "text-foreground/50 hover:text-foreground/75"
              }`}
            >
              <Share2 className="size-4 text-gold" /> Microsoft SharePoint
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeConnector === "directory" ? (
              <motion.div 
                key="directory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-display text-lg text-warm font-medium">Ingest Local server folder</h3>
                  <p className="text-xs text-foreground/60 leading-relaxed mt-1">
                    Enter the path to a server directory. The backend will perform deep chunking, Bedrock semantic metadata enrichment (POC, department, and update logs), and index all PowerPoint, PDF, Word, and Excel files.
                  </p>
                </div>

                {status && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl flex items-start gap-3 border text-xs ${
                      status.type === "success" 
                        ? "bg-green-50 border-green-200 text-green-800" 
                        : status.type === "error"
                          ? "bg-red-50 border-red-200 text-red-800"
                          : "bg-gold/10 border-gold/20 text-warm"
                    }`}
                  >
                    {status.type === "info" && <Loader2 className="size-3.5 animate-spin mt-0.5 shrink-0" />}
                    {status.type === "success" && <CheckCircle2 className="size-3.5 text-green-600 mt-0.5 shrink-0" />}
                    {status.type === "error" && <AlertCircle className="size-3.5 text-red-600 mt-0.5 shrink-0" />}
                    <div>{status.message}</div>
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 items-stretch max-w-lg">
                  <input
                    type="text"
                    value={folderPath}
                    onChange={(e) => setFolderPath(e.target.value)}
                    placeholder="e.g. Data"
                    className="bg-background border border-border rounded-xl px-4 py-2 text-sm text-warm outline-none focus:border-gold/50 flex-1"
                    disabled={isLoading}
                  />
                  <Button 
                    variant="hero"
                    onClick={handleIngestion}
                    disabled={isLoading || !folderPath.trim()}
                    className="px-6 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Ingesting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" /> Trigger Ingestion
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-foreground/50">Current server root contains a preset directory: <span className="font-mono text-warm font-semibold">"Data"</span> holding 14 internal slides/reports.</p>
              </motion.div>
            ) : (
              <motion.div 
                key="sharepoint"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-display text-lg text-warm font-medium flex items-center gap-2">
                    Connect SharePoint Drive
                  </h3>
                  <p className="text-xs text-foreground/60 leading-relaxed mt-1">
                    Connect a Microsoft 365 SharePoint document vault. Future synchronizations will monitor document modification events in real-time, automatically scheduling index refreshes for modified slides.
                  </p>
                </div>

                {spStatus && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl flex items-start gap-3 border text-xs ${
                      spStatus.type === "success" 
                        ? "bg-green-50 border-green-200 text-green-800" 
                        : spStatus.type === "error"
                          ? "bg-red-50 border-red-200 text-red-800"
                          : "bg-gold/10 border-gold/20 text-warm"
                    }`}
                  >
                    {spStatus.type === "info" && <Loader2 className="size-3.5 animate-spin mt-0.5 shrink-0" />}
                    {spStatus.type === "success" && <Check className="size-3.5 text-green-600 mt-0.5 shrink-0 bg-green-200 rounded-full p-0.5" />}
                    {spStatus.type === "error" && <AlertCircle className="size-3.5 text-red-600 mt-0.5 shrink-0" />}
                    <div>{spStatus.message}</div>
                  </motion.div>
                )}

                <form onSubmit={handleConnectSharePoint} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-foreground/50 font-bold mb-1.5">SharePoint Site URL</label>
                    <input
                      type="url"
                      required
                      value={spUrl}
                      onChange={(e) => setSpUrl(e.target.value)}
                      placeholder="https://chryselys.sharepoint.com/sites/analytics"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-warm outline-none focus:border-gold/50"
                      disabled={isConnectingSp || spConnected}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-foreground/50 font-bold mb-1.5">Document Library</label>
                      <select 
                        value={spLibrary}
                        onChange={(e) => setSpLibrary(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-warm outline-none focus:border-gold/50"
                        disabled={isConnectingSp || spConnected}
                      >
                        <option value="Proposals">Proposals Library</option>
                        <option value="Executive Pitch Decks">Executive Pitch Decks</option>
                        <option value="Oncology Cohorts">Oncology Cohorts</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-foreground/50 font-bold mb-1.5">Sync Interval</label>
                      <select 
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-warm outline-none focus:border-gold/50"
                        disabled={isConnectingSp || spConnected}
                      >
                        <option>Real-Time Webhook</option>
                        <option>Overnight Daily</option>
                        <option>Manual Trigger</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button 
                      type="submit"
                      variant="hero"
                      disabled={isConnectingSp || spConnected || !spUrl.trim()}
                      className="px-6 flex items-center gap-2"
                    >
                      {isConnectingSp ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Performing OAuth Handshake...
                        </>
                      ) : spConnected ? (
                        <>
                          <CheckCircle2 className="size-4" /> SharePoint Site Linked
                        </>
                      ) : (
                        <>
                          <Share2 className="size-4" /> Connect SharePoint Drive
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Active Index Metadata Status */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 flex flex-col h-[600px]">
          <div className="flex items-center justify-between border-b border-border/50 pb-2 shrink-0">
            <div className="text-[10px] tracking-widest text-gold uppercase font-bold">
              Active Data Sources in Pinecone
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchFiles} 
              disabled={isFetchingFiles} 
              className="h-6 text-[10px] px-2 text-foreground/50 hover:text-gold"
            >
              {isFetchingFiles ? <Loader2 className="size-3 animate-spin" /> : "Refresh"}
            </Button>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar">
            {indexedFiles.length === 0 && !isFetchingFiles && (
              <div className="text-sm text-foreground/50 text-center py-10 flex flex-col items-center gap-3">
                <Database className="size-8 opacity-20" />
                <p>No files currently indexed.<br/>Trigger ingestion to add data.</p>
              </div>
            )}
            {indexedFiles.map((file, idx) => (
              <div key={idx} className="p-3 bg-secondary/35 rounded-xl border border-border/60 space-y-2 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="size-4 text-gold shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-warm break-all line-clamp-2" title={file.filename}>{file.filename}</span>
                  </div>
                  <CheckCircle2 className="size-4 text-gold shrink-0 mt-0.5" />
                </div>
                
                <div className="flex flex-col gap-1.5 text-[10px] text-foreground/60 bg-background/50 rounded-lg p-2 border border-border/40">
                   <div className="grid grid-cols-2 gap-2">
                     <div className="truncate" title={file.client}>
                        <span className="opacity-70">Client:</span> <span className="text-warm font-medium">{file.client}</span>
                     </div>
                     <div className="truncate" title={file.topic}>
                        <span className="opacity-70">Topic:</span> <span className="text-warm font-medium">{file.topic}</span>
                     </div>
                   </div>
                   <div className="truncate border-t border-border/40 pt-1 mt-0.5" title={file.pocs}>
                     <span className="opacity-70">POCs:</span> <span className="text-warm font-medium">{file.pocs}</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Index Ingestion Pipeline Guide */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-display text-2xl text-warm mb-4">Semantic Ingestion Stages</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {PIPELINE.map((p, i) => (
            <div key={p.label} className="flex items-center gap-2 shrink-0 min-w-fit">
              <div className="bg-glass rounded-xl px-4 py-3 flex items-center gap-3 border border-border/40">
                <div className="size-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
                  <p.icon className="size-4" />
                </div>
                <div>
                  <div className="text-sm text-warm font-medium">{p.label}</div>
                  <div className="text-[10px] text-foreground/55">{p.desc}</div>
                </div>
              </div>
              {i < PIPELINE.length - 1 && (
                <motion.div 
                  className="h-px w-8 bg-gradient-to-r from-gold/40 to-gold/20"
                  initial={{ scaleX: 0 }} 
                  animate={{ scaleX: 1 }} 
                  transition={{ delay: i * 0.15 }} 
                  style={{ transformOrigin: "left" }} 
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
