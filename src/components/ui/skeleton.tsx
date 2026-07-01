import { cn } from "@/lib/utils"

export function Skeleton({ className }: { className?: string }) {
  return (
    <div 
      className={cn(
        "rounded-[var(--radius-sm)] bg-surface-2 animate-pulse-soft",
        className
      )} 
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface-1 p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-hairline rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}
