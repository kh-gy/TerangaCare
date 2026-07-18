const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  teal: 'bg-teal-500 text-white hover:bg-teal-600 shadow-sm',
  secondary: 'bg-white text-brand-600 border border-[#dce6f4] hover:border-brand-300 hover:bg-brand-50',
  ghost: 'text-brand-600 hover:bg-brand-50',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  dangerSolid: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
};

const SIZES = {
  sm: 'text-xs px-3 py-2 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
  lg: 'text-base px-6 py-3.5 rounded-2xl gap-2',
};

export default function Button({
  variant = 'primary', size = 'md', className = '', type = 'button',
  loading = false, disabled = false, children, ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold tc-press transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
