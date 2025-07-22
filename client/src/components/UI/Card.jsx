function Card({ children, className = "", hover = false }) {
  return (
    <div
      className={`
      bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-lg shadow-md border border-indigo-200 p-6
      ${hover ? "hover:shadow-lg transition-shadow duration-300" : ""}
      ${className}
    `}
    >
      {children}
    </div>
  )
}

export default Card
