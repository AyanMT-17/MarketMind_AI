function Input({ label, error, icon, className = "", ...props }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-[#4f473d]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a0907f]">
            {icon}
          </span>
        )}
        <input
          className={`
            block w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3
            text-[#1f201d] placeholder:text-[#a0907f]
            transition-all duration-200
            hover:border-[#d7c0a3] hover:bg-white
            focus:border-[#3fc46f] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#dff5e3]
            ${icon ? "pl-11" : ""}
            ${error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="flex items-center text-sm text-red-600">
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

export default Input
