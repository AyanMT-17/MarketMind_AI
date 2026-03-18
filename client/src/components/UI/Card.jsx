function Card({ children, className = "", hover = true, variant = "default" }) {
  const variants = {
    default: `
      editorial-card rounded-[2rem] p-6
      transition-all duration-300
      ${hover ? "hover:-translate-y-1 hover:border-[#d8c5af] hover:shadow-[0_30px_74px_rgba(77,56,24,0.11)]" : ""}
    `,
    gradient: `
      rounded-[2rem] border border-[#eadbc7] bg-[linear-gradient(180deg,_rgba(255,251,245,0.95)_0%,_rgba(247,236,217,0.9)_100%)] p-6 shadow-[0_24px_60px_rgba(77,56,24,0.08)]
      transition-all duration-300
      ${hover ? "hover:-translate-y-1 hover:border-[#d8c5af] hover:shadow-[0_30px_74px_rgba(77,56,24,0.11)]" : ""}
    `,
    stat: `
      rounded-[2rem] border border-[#cfeace] bg-[linear-gradient(180deg,_#eef9ef_0%,_#dcf2df_100%)] p-6 shadow-[0_18px_44px_rgba(63,196,111,0.12)]
      transition-all duration-300
      ${hover ? "hover:shadow-md hover:-translate-y-1" : ""}
    `,
    dark: `
      rounded-[2rem] bg-[#1f201d] p-6 text-white shadow-[0_24px_56px_rgba(31,32,29,0.2)]
      transition-all duration-300
      ${hover ? "hover:shadow-xl hover:-translate-y-1" : ""}
    `,
    glass: `
      rounded-[2rem] border border-[#eadbc7] bg-[rgba(255,251,245,0.72)] p-6 backdrop-blur-xl shadow-[0_28px_68px_rgba(77,56,24,0.1)]
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
