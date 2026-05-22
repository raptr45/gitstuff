"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface ActivityEntry {
  id: string;
  label: string;
  status: "running" | "done" | "error";
  progress?: { done: number; total: number };
  result?: string;
  timestamp: number;
}

interface ActivityFeedProps {
  entries: ActivityEntry[];
  /** Offset from bottom in px — pass when BulkActionBar is visible */
  bottomOffset?: number;
}

export function ActivityFeed({ entries, bottomOffset = 0 }: ActivityFeedProps) {
  const [expanded, setExpanded] = useState(false);
  const prevRunning = useRef(false);

  const running = entries.filter((e) => e.status === "running");
  const recent = entries.filter((e) => e.status !== "running").slice(0, 6);
  const hasAny = entries.length > 0;

  // Auto-expand when a task starts running
  useEffect(() => {
    if (running.length > 0 && !prevRunning.current) setExpanded(true);
    prevRunning.current = running.length > 0;
  }, [running.length]);

  if (!hasAny) return null;

  return (
    <div
      className="fixed right-4 z-[99] flex flex-col items-end gap-2 transition-all duration-300"
      style={{ bottom: `${bottomOffset + 16}px` }}
    >
      {/* Expanded panel */}
      {expanded && (
        <div className="w-80 bg-background/98 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Background Tasks
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setExpanded(false)}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </div>

          <ScrollArea className="max-h-64">
            <div className="p-3 space-y-2">
              {[...running, ...recent].map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30"
                >
                  <div className="shrink-0 mt-0.5">
                    {entry.status === "running" && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                    {entry.status === "done" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {entry.status === "error" && (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{entry.label}</p>
                    {entry.status === "running" && entry.progress && (
                      <div className="mt-1.5">
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.round(
                                (entry.progress.done / entry.progress.total) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold mt-0.5 block">
                          {entry.progress.done} / {entry.progress.total}
                        </span>
                      </div>
                    )}
                    {entry.result && (
                      <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
                        {entry.result}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Floating toggle bubble */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 bg-background/98 backdrop-blur-xl border border-border rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
      >
        {running.length > 0 ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <Activity className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-xs font-black">
          {running.length > 0
            ? `${running.length} running`
            : `${entries.length} task${entries.length !== 1 ? "s" : ""}`}
        </span>
        {running.length > 0 && (
          <Badge className="h-4 px-1.5 bg-primary text-primary-foreground text-[9px] font-black border-none">
            {running.length}
          </Badge>
        )}
        {expanded ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-3 h-3 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}
