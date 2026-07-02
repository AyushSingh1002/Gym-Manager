import { cn } from "@/lib/utils"

export function Skeleton({ className }: { className?: string }) {
  return (
    <div 
      className={cn(
        "rounded-[var(--radius-sm)] bg-gradient-to-r from-surface-2 via-surface-1 to-surface-2 bg-[length:200%_100%] animate-shimmer",
        className
      )} 
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface-1 p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20 sm:w-24" />
        <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
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
    <div className="space-y-3 sm:space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border border-hairline rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0 min-h-10 min-w-10" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-3 sm:h-4 w-3/4" />
            <Skeleton className="h-2.5 sm:h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16 sm:w-20 flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}
