// Petits composants d'état : spinner, squelettes, état vide.

export function Spinner({ className = 'w-8 h-8' }) {
  return (
    <div className="flex justify-center py-16">
      <div className={`${className} border-4 border-brand-600 border-t-transparent rounded-full animate-spin`} />
    </div>
  );
}

export function SkeletonList({ rows = 3 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="tc-card p-5 flex items-center gap-4">
          <div className="tc-skeleton w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="tc-skeleton h-3.5 w-1/3" />
            <div className="tc-skeleton h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, children, action }) {
  return (
    <div className="tc-card p-12 text-center tc-fade-up">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
      )}
      <p className="text-slate-600 font-semibold">{title}</p>
      {children && <p className="text-sm text-slate-400 mt-1">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorNote({ children }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{children}</div>
  );
}
