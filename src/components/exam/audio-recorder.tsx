"use client";

import { useRef, useState } from "react";
import { Mic, Square, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AudioRecorder({ onUploaded }: { onUploaded: (assetId: string) => void }) {
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "recording" | "uploading" | "uploaded" | "error">("idle");

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      recorder.current = new MediaRecorder(stream);
      recorder.current.ondataavailable = (event) => chunks.current.push(event.data);
      recorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.current.start();
      setState("recording");
    } catch {
      setState("error");
    }
  }

  function stop() {
    recorder.current?.stop();
    setState("idle");
  }

  async function upload() {
    if (!url) return;
    setState("uploading");
    const blob = await fetch(url).then((response) => response.blob());
    const form = new FormData();
    form.append("file", new File([blob], "speaking.webm", { type: "audio/webm" }));
    const response = await fetch("/api/media/upload", { method: "POST", body: form });
    if (!response.ok) {
      setState("error");
      return;
    }
    const data = (await response.json()) as { id: string };
    onUploaded(data.id);
    setState("uploaded");
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      {url ? <audio src={url} controls className="w-full" aria-label="Recording playback" /> : null}
      <div className="flex flex-wrap gap-2">
        {state !== "recording" ? (
          <Button type="button" size="sm" onClick={start}>
            <Mic className="h-4 w-4" /> Record
          </Button>
        ) : (
          <Button type="button" size="sm" variant="destructive" onClick={stop}>
            <Square className="h-4 w-4" /> Stop
          </Button>
        )}
        <Button type="button" size="sm" variant="secondary" onClick={upload} disabled={!url || state === "uploading"}>
          <Upload className="h-4 w-4" /> {state === "uploading" ? "Uploading" : "Upload"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setUrl(null)} disabled={!url}>
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>
      {state === "error" ? <p className="text-sm text-red-700">Microphone or upload failed. Please try again.</p> : null}
      {state === "uploaded" ? <p className="text-sm font-semibold text-emerald-700">Uploaded successfully.</p> : null}
    </div>
  );
}
