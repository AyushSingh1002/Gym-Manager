import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-canvas gap-4 text-center p-8">
      <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center">
        <svg className="w-8 h-8 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-ink">Page not found</h2>
      <p className="text-ink-tertiary max-w-md">The page you are looking for does not exist or has been moved.</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Go home
      </Link>
    </div>
  )
}
