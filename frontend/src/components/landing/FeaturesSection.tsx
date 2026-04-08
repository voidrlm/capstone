import { FileText, Activity, Shield, AlertTriangle, TrendingUp, Lock } from 'lucide-react'

const features = [
  { title: 'Patient Health Records', description: 'Securely store and access comprehensive patient health records. Authorized providers get instant, structured views of medical history.', Icon: FileText, accent: '#3b9fff' },
  { title: 'Drug Interaction Checker', description: 'Detect dangerous multi-drug combinations before prescribing. Real-time alerts sourced from the FDA adverse event database.', Icon: Shield, accent: '#ff4d6d' },
  { title: 'Side Effect Analysis', description: 'AI-powered prediction of side effects based on patient history, age group, existing diagnoses, and current medication load.', Icon: Activity, accent: '#ff8c42' },
  { title: 'Side Effect Tracking', description: 'Patients log and track reported side effects over time. Providers receive structured summaries for better-informed decisions.', Icon: AlertTriangle, accent: '#f5c842' },
  { title: 'Analytics Dashboard', description: 'Visual dashboards showing risk trends, interaction frequencies, and prescribing patterns across your patient population.', Icon: TrendingUp, accent: '#00d4aa' },
  { title: 'HIPAA Security & RBAC', description: 'Role-based access control with end-to-end encryption. Every action is logged. Full HIPAA compliance out of the box.', Icon: Lock, accent: '#a78bfa' },
]

export default function FeaturesSection() {
  return (
    <section
      id="features"
      style={{ backgroundColor: 'var(--mr-navy)', padding: '6rem 0', position: 'relative', overflow: 'hidden' }}>

      {/* Grid bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
        backgroundImage: 'linear-gradient(rgba(220,232,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(220,232,255,1) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div className="land-wrap" style={{ position: 'relative' }}>

        {/* Header */}
        <div className="land-center" style={{ marginBottom: '4rem' }}>
          <span style={{ color: 'var(--mr-teal)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Platform Capabilities
          </span>
          <h2 className="font-display" style={{ color: '#dce8ff', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, marginTop: '1rem', letterSpacing: '-0.02em' }}>
            Everything You Need{' '}
            <span style={{ color: 'var(--mr-teal)' }}>for Drug Safety</span>
          </h2>
          <p style={{ color: 'rgba(220,232,255,0.55)', maxWidth: '36rem', margin: '1rem auto 0', lineHeight: 1.7 }}>
            A complete clinical intelligence platform designed to reduce prescribing errors and improve patient outcomes.
          </p>
        </div>

        {/* Cards */}
        <div className="land-grid-3">
          {features.map(({ title, description, Icon, accent }) => (
            <div
              key={title}
              className="hover-teal-border group"
              style={{
                backgroundColor: 'var(--mr-card, #0d1d34)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '1rem',
                padding: '1.5rem',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}>
              <div style={{ position: 'absolute', top: -32, right: -32, width: 128, height: 128, borderRadius: '50%', background: `radial-gradient(circle, ${accent}22, transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${accent}18`, color: accent, marginBottom: '1rem' }}>
                <Icon size={20} />
              </div>
              <h3 className="font-display" style={{ color: '#dce8ff', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>{title}</h3>
              <p style={{ color: 'rgba(220,232,255,0.5)', fontSize: '0.875rem', lineHeight: 1.65 }}>{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
