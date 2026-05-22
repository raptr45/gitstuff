"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plan } from "@/lib/types";
import { Brush, RefreshCw, UserCheck, UserMinus } from "lucide-react";

export type BulkActionType = "follow" | "unfollow";

// 0 = "All selected" — client sends all selected users in tier-limited chunks
const BATCH_OPTIONS_FREE = [10, 25, 0] as const;
const BATCH_OPTIONS_PRO = [10, 25, 50, 100, 500, 0] as const;

interface BulkActionBarProps {
  selectedCount: number;
  plan: Plan;
  /** 0 = process all selected */
  batchSize: number;
  onBatchSizeChange: (size: number) => void;
  bulkAction: BulkActionType;
  onBulkActionChange: (action: BulkActionType) => void;
  excludeProtected: boolean;
  onExcludeProtectedChange: (val: boolean) => void;
  isProcessing: boolean;
  progress: { done: number; total: number } | null;
  onExecute: () => void;
  onCancel: () => void;
}

function labelForSize(size: number) {
  return size === 0 ? "All" : String(size);
}

export function BulkActionBar({
  selectedCount,
  plan,
  batchSize,
  onBatchSizeChange,
  bulkAction,
  onBulkActionChange,
  excludeProtected,
  onExcludeProtectedChange,
  isProcessing,
  progress,
  onExecute,
  onCancel,
}: BulkActionBarProps) {
  const sizeOptions =
    plan === "PRO" ? BATCH_OPTIONS_PRO : BATCH_OPTIONS_FREE;

  // How many will actually be processed this run
  const executeCount = batchSize === 0 ? selectedCount : Math.min(batchSize, selectedCount);
  const canExecute = selectedCount > 0 && !isProcessing;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-background/97 backdrop-blur-md border-t border-border animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="container mx-auto max-w-6xl space-y-3">
        {/* Progress bar */}
        {isProcessing && progress && (
          <div>
            <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                Running in background…
              </span>
              <span>
                {progress.done} / {progress.total} processed
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.round((progress.done / progress.total) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Selected / will-execute count */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tabular-nums">
                {selectedCount} selected
              </span>
              {executeCount < selectedCount && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border-none"
                >
                  Will run: {executeCount}
                </Badge>
              )}
              {plan === "FREE" && (
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  FREE tier
                </span>
              )}
            </div>

            <div className="h-4 w-[1px] bg-border hidden sm:block" />

            {/* Action toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
              <Button
                variant={bulkAction === "follow" ? "default" : "ghost"}
                size="sm"
                onClick={() => onBulkActionChange("follow")}
                disabled={isProcessing}
                className="h-7 px-3 text-xs font-black rounded-md gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Follow
              </Button>
              <Button
                variant={bulkAction === "unfollow" ? "destructive" : "ghost"}
                size="sm"
                onClick={() => onBulkActionChange("unfollow")}
                disabled={isProcessing}
                className="h-7 px-3 text-xs font-black rounded-md gap-1.5"
              >
                <UserMinus className="w-3.5 h-3.5" />
                Unfollow
              </Button>
            </div>

            <div className="h-4 w-[1px] bg-border hidden sm:block" />

            {/* Batch / execute count selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                Run
              </span>
              <Select
                value={String(batchSize)}
                onValueChange={(v) => onBatchSizeChange(Number(v))}
                disabled={isProcessing}
              >
                <SelectTrigger className="h-8 w-24 text-xs font-black border-border/50 bg-muted/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map((size) => (
                    <SelectItem
                      key={size}
                      value={String(size)}
                      className="text-xs font-bold"
                    >
                      {labelForSize(size)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="h-4 w-[1px] bg-border hidden sm:block" />

            {/* Ignore shielded */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bulk-exclude-protected"
                checked={excludeProtected}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  onExcludeProtectedChange(checked === true)
                }
                disabled={isProcessing}
              />
              <Label
                htmlFor="bulk-exclude-protected"
                className="text-xs font-black uppercase tracking-widest cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
              >
                Skip Shielded
              </Label>
            </div>
          </div>

          {/* Right: Cancel + Execute */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isProcessing}
              className="rounded-xl font-bold h-9 px-5"
            >
              {isProcessing ? "Running…" : "Cancel"}
            </Button>

            <Button
              variant={bulkAction === "unfollow" ? "destructive" : "default"}
              disabled={!canExecute}
              onClick={onExecute}
              className="rounded-xl font-bold px-8 h-9 shadow-lg gap-2 min-w-[160px]"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Brush className="w-4 h-4" />
              )}
              {isProcessing
                ? `${progress?.done ?? 0} / ${progress?.total ?? executeCount} done`
                : `Execute (${executeCount})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
