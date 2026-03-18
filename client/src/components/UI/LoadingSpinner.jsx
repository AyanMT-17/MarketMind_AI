function LoadingSpinner({ size = "md", className = "" }) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`
        animate-spin rounded-full border-2 border-[#decdb9] border-t-[#3fc46f]
        ${sizes[size]}
      `}
      ></div>
    </div>
  )
}

export default LoadingSpinner
