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
    <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-5xl z-[100] p-4 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-[2rem] shadow-2xl shadow-zinc-500/10 dark:shadow-black/50 animate-in fade-in slide-in-from-bottom-5 duration-300 ease-out">
      <div className="w-full space-y-4">
        {/* Progress bar */}
        {isProcessing && progress && (
          <div className="px-1">
            <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                Running in background…
              </span>
              <span>
                {progress.done} / {progress.total} processed
              </span>
            </div>
            <div className="h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-primary to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.round((progress.done / progress.total) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left: Info / Selected Count */}
          <div className="flex items-center justify-center lg:justify-start w-full lg:w-auto gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-black shadow-md">
                {selectedCount}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider leading-none mb-0.5">
                  Selected
                </span>
                <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                  {selectedCount === 1 ? "1 User" : `${selectedCount} Users`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {executeCount < selectedCount && (
                <Badge
                  variant="secondary"
                  className="text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-500 border-none px-2 py-0.5"
                >
                  Will run: {executeCount}
                </Badge>
              )}
              {plan === "FREE" && (
                <Badge
                  variant="outline"
                  className="text-[9px] font-black uppercase tracking-wider text-zinc-400 border-zinc-200 dark:border-zinc-800 px-2 py-0.5"
                >
                  FREE LIMIT
                </Badge>
              )}
            </div>
          </div>

          {/* Center: Controls */}
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/30 w-full lg:w-auto">
            {/* Action toggle */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-950 p-0.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onBulkActionChange("follow")}
                disabled={isProcessing}
                className={`h-7 px-3 text-[10px] font-black uppercase tracking-wider rounded-lg gap-1.5 transition-all duration-200 ${
                  bulkAction === "follow"
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Follow
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onBulkActionChange("unfollow")}
                disabled={isProcessing}
                className={`h-7 px-3 text-[10px] font-black uppercase tracking-wider rounded-lg gap-1.5 transition-all duration-200 ${
                  bulkAction === "unfollow"
                    ? "bg-red-500/10 text-red-600 dark:text-red-400 shadow-sm hover:bg-red-500/20"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <UserMinus className="w-3.5 h-3.5" />
                Unfollow
              </Button>
            </div>

            <div className="hidden sm:block w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800" />

            {/* Batch / execute count selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Run
              </span>
              <Select
                value={String(batchSize)}
                onValueChange={(v) => onBatchSizeChange(Number(v))}
                disabled={isProcessing}
              >
                <SelectTrigger className="h-8 w-20 text-xs font-black border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[150]">
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

            <div className="hidden sm:block w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800" />

            {/* Ignore shielded */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bulk-exclude-protected"
                checked={excludeProtected}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  onExcludeProtectedChange(checked === true)
                }
                disabled={isProcessing}
                className="h-4 w-4 rounded-md border-zinc-300 dark:border-zinc-700"
              />
              <Label
                htmlFor="bulk-exclude-protected"
                className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Skip Shielded
              </Label>
            </div>
          </div>

          {/* Right: Cancel + Execute */}
          <div className="flex items-center justify-center lg:justify-end gap-2 w-full lg:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isProcessing}
              className="rounded-xl font-bold h-9 px-4 text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              {isProcessing ? "Cancel" : "Clear"}
            </Button>

            <Button
              variant={bulkAction === "unfollow" ? "destructive" : "default"}
              disabled={!canExecute}
              onClick={onExecute}
              className={`rounded-xl font-bold px-6 h-9 text-xs shadow-md gap-2 min-w-[140px] transition-transform hover:scale-[1.02] active:scale-[0.98] ${
                bulkAction === "unfollow"
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/10"
                  : "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900"
              }`}
            >
              {isProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Brush className="w-3.5 h-3.5" />
              )}
              {isProcessing
                ? `${progress?.done ?? 0}/${progress?.total ?? executeCount}`
                : `Execute (${executeCount})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
