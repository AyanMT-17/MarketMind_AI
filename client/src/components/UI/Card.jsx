function Card({ children, className = "", hover = true, variant = "default" }) {
  const variants = {
    default: `
      bg-white rounded-2xl shadow-sm border border-gray-100 p-6
      transition-all duration-300
      ${hover ? "hover:shadow-lg hover:border-emerald-100 hover:-translate-y-1" : ""}
    `,
    gradient: `
      bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100 p-6
      transition-all duration-300
      ${hover ? "hover:shadow-lg hover:border-emerald-100 hover:-translate-y-1" : ""}
    `,
    stat: `
      bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-6
      transition-all duration-300
      ${hover ? "hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1" : ""}
    `,
    dark: `
      bg-gray-900 text-white rounded-2xl shadow-lg p-6
      transition-all duration-300
      ${hover ? "hover:shadow-xl hover:-translate-y-1" : ""}
    `,
    glass: `
      bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6
      transition-all duration-300
      ${hover ? "hover:shadow-xl hover:-translate-y-1" : ""}
    `,
  }

  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  )
}

export default Card
