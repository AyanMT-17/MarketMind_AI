function Input({ label, error, icon, className = "", ...props }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          className={`
            block w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl
            placeholder-gray-400 text-gray-900
            transition-all duration-200
            hover:border-gray-300 hover:bg-gray-100/50
            focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10
            ${icon ? "pl-11" : ""}
            ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" : ""}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="flex items-center text-sm text-red-600">
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

export default Input
