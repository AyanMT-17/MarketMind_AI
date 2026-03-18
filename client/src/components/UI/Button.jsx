function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#fbf4e8]"

  const variants = {
    primary:
      "bg-[#3fc46f] text-white shadow-[0_18px_36px_rgba(63,196,111,0.24)] hover:-translate-y-0.5 hover:bg-[#2fb55e] hover:shadow-[0_22px_44px_rgba(63,196,111,0.3)] active:translate-y-0 focus:ring-[#78d999]",
    secondary:
      "border border-[#e7d8c3] bg-[#fffaf1] text-[#1f201d] hover:-translate-y-0.5 hover:bg-[#f4ebdd] hover:shadow-[0_16px_34px_rgba(87,64,30,0.1)] focus:ring-[#d7c0a3]",
    outline:
      "border border-[#d8c5af] bg-transparent text-[#1f201d] hover:-translate-y-0.5 hover:border-[#3fc46f] hover:bg-[#fffaf1] focus:ring-[#78d999]",
    danger:
      "bg-[#d95d51] text-white hover:-translate-y-0.5 hover:bg-[#c74d41] focus:ring-[#ef8b82]",
    ghost:
      "bg-transparent text-[#5f564b] hover:bg-[#f3e7d4] hover:text-[#1f201d]",
  }

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  }

  return (
    <button
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled || loading ? "opacity-50 cursor-not-allowed transform-none shadow-none" : ""}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  )
}

export default Button
