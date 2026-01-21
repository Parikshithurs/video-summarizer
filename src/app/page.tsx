"use client";
import { useState } from "react";

// --- Utility: Download Helper ---
function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- Icons ---
const Icons = {
  YouTube: () => (
    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
  ),
  Copy: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
    </svg>
  ),
  Download: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Alert: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState<"short" | "medium" | "long">("long");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSummarize() {
    setError(null);
    setResult(null);
    setCopied(false);

    if (!url.trim()) {
      setError("Please paste a valid YouTube URL first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, options: { depth } }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Unable to fetch summary. Please check the URL.");
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err?.message || "Network connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const summaryText = result?.summary?.long_summary ?? result?.summary?.short_summary ?? result?.summary?.raw ?? null;
  const rawJson = result ? JSON.stringify(result, null, 2) : "";

  return (
    // DARK MODE: Main background set to slate-950 (Deep Blue/Black)
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* --- Navbar --- */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-lg shadow-indigo-500/20">
              <Icons.Sparkles />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">VideoSummarizer</span>
          </div>
          <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Documentation
          </a>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        
        {/* --- Hero / Input Section --- */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Summarize videos in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">seconds</span>.
          </h1>
          <p className="text-lg text-slate-400 mb-8">
            Paste a link below to get an elegant, formatted summary of any public  video.
          </p>

          <div className="bg-slate-900 p-2 rounded-2xl shadow-2xl shadow-black/50 border border-slate-800 flex flex-col md:flex-row gap-2 items-center">
            {/* URL Input */}
            <div className="flex-1 w-full relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors">
                <Icons.YouTube />
              </div>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full pl-12 pr-4 py-3.5 bg-transparent rounded-xl outline-none text-white placeholder:text-slate-600 font-medium"
              />
            </div>

            {/* Depth Selection (Segmented Control) */}
            <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center gap-1 w-full md:w-auto">
               {(['short', 'medium', 'long'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDepth(d)}
                    className={`px-3 py-2 text-sm font-semibold rounded-lg capitalize transition-all duration-200 ${
                      depth === d
                        ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                    }`}
                  >
                    {d}
                  </button>
               ))}
            </div>

            {/* Action Button */}
            <button
              onClick={handleSummarize}
              disabled={loading}
              className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] ${
                loading 
                  ? "bg-indigo-500/50 cursor-not-allowed text-white/50" 
                  : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/30"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing
                </span>
              ) : (
                "Summarize"
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 inline-flex items-center gap-2 text-rose-400 bg-rose-950/30 px-4 py-2 rounded-lg text-sm font-medium border border-rose-900/50">
              <Icons.Alert />
              {error}
            </div>
          )}
        </div>

        {/* --- Results Section --- */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Main Summary Card */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900 rounded-2xl shadow-xl shadow-black/20 border border-slate-800 overflow-hidden">
                {/* Card Header */}
                <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                  <div>
                    <h2 className="text-lg font-bold text-white">Summary</h2>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                      {result.source || "YouTube Video"} • {depth} Mode
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => summaryText && handleCopy(summaryText)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      {copied ? <Icons.Check /> : <Icons.Copy />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={() => summaryText && downloadText("summary.txt", summaryText)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                    >
                      <Icons.Download />
                      Download
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-8 text-slate-300 leading-relaxed text-[15px]">
                  {summaryText ? (
                    summaryText.split("\n\n").map((para: string, i: number) => (
                      <p key={i} className="mb-5 last:mb-0 text-justify">{para}</p>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-600 italic">No summary content available.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Sidebar / Meta Info */}
            <aside className="space-y-6">
              
              {/* Metadata Card */}
              <div className="bg-slate-900 rounded-2xl p-5 shadow-xl shadow-black/20 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                  Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Source</span>
                    <span className="font-medium text-slate-300 truncate max-w-[150px]">{result.source || "Unknown"}</span>
                  </div>
                   <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Depth</span>
                    <span className="font-medium capitalize text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">{depth}</span>
                  </div>
                   <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Status</span>
                    <span className="font-medium text-emerald-400">Success</span>
                  </div>
                </div>
              </div>

              {/* JSON/Raw Data Card */}
              <div className="bg-slate-900 rounded-2xl p-5 shadow-xl shadow-black/20 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                   <h3 className="text-sm font-bold text-white">Raw Data</h3>
                   <div className="flex gap-1">
                      <button onClick={() => rawJson && handleCopy(rawJson)} className="p-1.5 text-slate-500 hover:text-white transition-colors rounded hover:bg-slate-800">
                        <Icons.Copy />
                      </button>
                      <button onClick={() => rawJson && downloadText("data.json", rawJson)} className="p-1.5 text-slate-500 hover:text-white transition-colors rounded hover:bg-slate-800">
                        <Icons.Download />
                      </button>
                   </div>
                </div>
                <div className="bg-black/50 rounded-lg p-3 overflow-hidden border border-slate-800/50">
                  <pre className="text-[10px] leading-4 text-slate-400 font-mono h-32 overflow-auto scrollbar-thin scrollbar-thumb-slate-700">
                    {rawJson || "{}"}
                  </pre>
                </div>
              </div>

               <button
                  onClick={() => {
                    setUrl("");
                    setResult(null);
                    setError(null);
                  }}
                  className="w-full py-2 rounded-lg border border-slate-800 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
                >
                  Start Over
                </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}