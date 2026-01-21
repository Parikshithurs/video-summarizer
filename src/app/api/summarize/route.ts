// src/app/api/summarize/route.ts
import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

type ReqBody = { url?: string; options?: { depth?: string } };

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      if (u.hostname.includes("youtu.be")) {
        const pathParts = u.pathname.split("/").filter(Boolean);
        if (pathParts.length) return pathParts[0];
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchYoutubeCaptionsTimedtext(videoId: string, lang = "en") {
  const url = `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=srv3`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const xml = await res.text();
    if (!xml || xml.trim().length === 0) return null;
    const re = /<text[^>]*>(.*?)<\/text>/gms;
    let match;
    const pieces: string[] = [];
    while ((match = re.exec(xml)) !== null) {
      const raw = match[1] ?? "";
      const cleaned = raw
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();
      if (cleaned) pieces.push(cleaned);
    }
    if (pieces.length === 0) return null;
    return pieces.join(" ");
  } catch (err) {
    console.error("timedtext fetch error", err);
    return null;
  }
}

/**
 * Use yt-dlp to download subtitles (auto or uploaded) into a temp directory.
 * Returns transcript text or null.
 *
 * This version runs `python -m yt_dlp` which works when yt-dlp was installed with pip.
 */
async function fetchSubtitlesViaYtDlp(videoUrl: string) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "yt-"));
  const outTemplate = path.join(tmpDir, "%(id)s.%(ext)s");

  // Build yt-dlp args (we will call python -m yt_dlp ...)
  const ytDlpArgs = [
    "-m",
    "yt_dlp",
    videoUrl,
    "--skip-download",
    "--write-auto-sub", // try auto-generated subtitles
    "--write-sub", // try uploaded subtitles
    "--sub-lang",
    "en",
    "--sub-format",
    "srt",
    "-o",
    outTemplate,
  ];

  // On Windows use "python", else "python3" (adjust if your python command differs)
  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  try {
    // Run python -m yt_dlp ...
    await execFileAsync(pythonCmd, ytDlpArgs, { timeout: 2 * 60 * 1000 });

    const files = await fs.readdir(tmpDir);
    const srtFile = files.find((f) => f.endsWith(".srt") || f.endsWith(".vtt") || f.endsWith(".ttml"));
    if (!srtFile) {
      await fs.rm(tmpDir, { recursive: true, force: true });
      return null;
    }

    const srtPath = path.join(tmpDir, srtFile);
    const srtContent = await fs.readFile(srtPath, "utf8");

    // Convert SRT/VTT content to plain text:
    // - Remove index lines (numbers)
    // - Remove timestamp lines (e.g. "00:00:01,000 --> 00:00:03,000" or "00:00:01.000")
    // - Remove WEBVTT headers if present
    const lines = srtContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => !!l) // drop empty
      .filter((l) => !/^\d+$/.test(l)) // drop numeric indexes
      .filter((l) => !/^\s*WEBVTT/i.test(l)) // drop WEBVTT header
      .filter((l) => !/-->/i.test(l)) // drop timestamp ranges
      .filter((l) => !/^\d{2}:\d{2}:\d{2}[,\.]\d{3}/.test(l)) // drop timestamps starting with hh:mm:ss
      .join(" ");

    await fs.rm(tmpDir, { recursive: true, force: true });
    const cleaned = lines.replace(/\s+/g, " ").trim();
    return cleaned || null;
  } catch (err: any) {
    console.error("yt-dlp (python -m) error:", err?.message ?? err);
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
    return null;
  }
}

/**
 * Example LLM call wrapper stub.
 * Replace this with your Gemini or OpenAI call (callGeminiHTTP or callOpenAI...).
 * Must return an object (parsed JSON) or { raw: "..." }.
 */
async function callLLMSummary(transcript: string, depth = "short") {
  // Local quick summary for testing
  const sample = transcript.length > 800 ? transcript.slice(0, 800) : transcript;
  return {
    tl_dr: sample.slice(0, 120).replace(/\s+/g, " ") + (sample.length > 120 ? "…" : ""),
    short_summary: sample.slice(0, 400).replace(/\s+/g, " ") + (sample.length > 400 ? "…" : ""),
    long_summary: sample.replace(/\s+/g, " "),
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;
    const url = body?.url;
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const ytId = extractYouTubeId(url);
    if (!ytId) {
      return NextResponse.json({ error: "Only YouTube links supported in this fast path" }, { status: 400 });
    }

    // 1) fast timedtext endpoint
    let transcript = await fetchYoutubeCaptionsTimedtext(ytId, "en");

    // 2) fallback to yt-dlp subtitle download
    if (!transcript) {
      transcript = await fetchSubtitlesViaYtDlp(url);
    }

    if (!transcript) {
      return NextResponse.json(
        {
          error:
            "Could not retrieve captions automatically. Try a different public video, or we can fall back to audio transcription (requires ffmpeg + transcription service).",
        },
        { status: 422 }
      );
    }

    const depth = body.options?.depth ?? "short";
    const summary = await callLLMSummary(transcript, depth);

    return NextResponse.json({ status: "ok", source: "captions", summary });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
