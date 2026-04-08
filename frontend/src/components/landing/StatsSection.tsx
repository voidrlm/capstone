const stats = [
  { value: '500+',    label: 'Drugs Analyzed',      sub: 'From FDA adverse event reports' },
  { value: '10,000+', label: 'Risk Assessments',     sub: 'Completed to date' },
  { value: '50+',     label: 'Healthcare Providers', sub: 'Across multiple specialties' },
  { value: '99.9%',   label: 'Platform Uptime',      sub: 'SLA-backed reliability' },
]

export default function StatsSection() {
  return (
    <section
      id="stats"
      className="relative overflow-hidden py-20"
      style={{ backgroundColor: 'var(--mr-surface, #0a1628)' }}>

      {/* Teal glow orb */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.07) 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">

        {/* Label */}
        <p className="mb-12 text-center text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: 'rgba(220,232,255,0.35)' }}>
          By the numbers
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border lg:grid-cols-4"
          style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
          {stats.map(({ value, label, sub }) => (
            <div
              key={label}
              className="group flex flex-col items-center px-6 py-10 text-center transition-colors duration-200"
              style={{ backgroundColor: 'var(--mr-surface, #0a1628)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,212,170,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--mr-surface, #0a1628)')}>

              <span
                className="font-display mb-1 text-5xl font-bold tabular-nums"
                style={{ color: 'var(--mr-teal)' }}>
                {value}
              </span>
              <span className="mb-1 text-sm font-semibold" style={{ color: '#dce8ff' }}>
                {label}
              </span>
              <span className="text-xs" style={{ color: 'rgba(220,232,255,0.35)' }}>
                {sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
