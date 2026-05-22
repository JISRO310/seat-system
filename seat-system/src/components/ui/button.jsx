export function Button({
  children,
  className = "",
  ...props
}) {
  return (
    <button
      className={`rounded-2xl px-4 py-3 font-semibold transition-all bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}