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
      style={{ backgroundColor: 'var(--mr-surface, #0a1628)', padding: '5rem 0', position: 'relative', overflow: 'hidden' }}>

      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 384, height: 384, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="land-wrap" style={{ position: 'relative' }}>

        <p className="land-center" style={{ color: 'rgba(220,232,255,0.35)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '3rem' }}>
          By the numbers
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1px',
          borderRadius: '1rem',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.07)',
          backgroundColor: 'rgba(255,255,255,0.04)',
        }}>
          {stats.map(({ value, label, sub }) => (
            <div
              key={label}
              style={{ backgroundColor: 'var(--mr-surface, #0a1628)', padding: '2.5rem 1.5rem', textAlign: 'center', transition: 'background-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,212,170,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--mr-surface, #0a1628)')}>
              <span className="font-display" style={{ display: 'block', color: 'var(--mr-teal)', fontSize: '3rem', fontWeight: 700, marginBottom: '0.25rem', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
              <span style={{ display: 'block', color: '#dce8ff', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{label}</span>
              <span style={{ color: 'rgba(220,232,255,0.35)', fontSize: '0.75rem' }}>{sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
