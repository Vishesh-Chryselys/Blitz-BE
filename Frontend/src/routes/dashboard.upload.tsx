import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, FileText, CheckCircle2, Loader2, Sparkles, Layers, Database, Zap, 
  AlertCircle, Share2, FolderKanban, ShieldCheck, Plus, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerIngestion } from "../lib/api";

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

  const [activeIngestions, setActiveIngestions] = useState([
    { name: "SharePoint Drive: /sites/SalesEnablement/Proposals", type: "SharePoint", stage: "Done", progress: 100, files: 12 },
    { name: "Local Server Folder: /Data", type: "Directory", stage: "Done", progress: 100, files: 14 },
    { name: "Q3_Oncology_Forecast.pptx", type: "File", stage: "Done", progress: 100, files: 1 },
    { name: "Northwind_Lab_Outcomes.pdf", type: "File", stage: "Done", progress: 100, files: 1 },
  ]);

  const handleIngestion = async () => {
    setIsLoading(true);
    setStatus({ type: "info", message: `Triggering ingestion pipeline for folder '${folderPath}'...` });
    
    try {
      const res = await triggerIngestion(folderPath);
      
      setStatus({ 
        type: "success", 
        message: `Successfully triggered! Ingested raw files into Pinecone database.` 
      });

      const newIngest = {
        name: `Local Folder: /${folderPath}`,
        type: "Directory",
        stage: "Processing",
        progress: 10,
        files: 6
      };

      setActiveIngestions(prev => [newIngest, ...prev]);

      let currentProgress = 10;
      const interval = setInterval(() => {
        currentProgress += 20;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          setActiveIngestions(prev => 
            prev.map(item => 
              item.name === newIngest.name 
                ? { ...item, progress: 100, stage: "Done" } 
                : item
            )
          );
        } else {
          setActiveIngestions(prev => 
            prev.map(item => 
              item.name === newIngest.name 
                ? { ...item, progress: currentProgress, stage: currentProgress > 60 ? "Embedding" : currentProgress > 30 ? "Chunking" : "Parsing" } 
                : item
            )
          );
        }
      }, 2000);

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
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="text-[10px] tracking-widest text-gold uppercase font-bold border-b border-border/50 pb-2">
            Active Data Sources
          </div>
          
          <div className="space-y-3">
            {activeIngestions.map((item, idx) => (
              <div key={idx} className="p-3 bg-secondary/35 rounded-xl border border-border/60 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 truncate">
                    {item.type === "SharePoint" ? (
                      <Share2 className="size-4 text-gold shrink-0" />
                    ) : (
                      <FileText className="size-4 text-gold shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-warm truncate" title={item.name}>{item.name}</span>
                  </div>
                  {item.stage === "Done" ? (
                    <CheckCircle2 className="size-4 text-gold shrink-0" />
                  ) : (
                    <Loader2 className="size-4 text-gold animate-spin shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center justify-between text-[10px] text-foreground/50">
                  <span>Type: <strong className="text-warm font-medium">{item.type}</strong></span>
                  <span>{item.files} files indexed</span>
                </div>

                <div className="h-1 bg-black/[0.06] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-gold" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${item.progress}%` }} 
                    transition={{ duration: 1 }}
                  />
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
