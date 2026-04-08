import { FileText, Activity, Shield, AlertTriangle, TrendingUp, Lock } from 'lucide-react'

const features = [
  {
    title: 'Patient Health Records',
    description: 'Securely store and access comprehensive patient health records. Authorized providers get instant, structured views of medical history.',
    Icon: FileText,
    accent: '#3b9fff',
  },
  {
    title: 'Drug Interaction Checker',
    description: 'Detect dangerous multi-drug combinations before prescribing. Real-time alerts sourced from the FDA adverse event database.',
    Icon: Shield,
    accent: '#ff4d6d',
  },
  {
    title: 'Side Effect Analysis',
    description: 'AI-powered prediction of side effects based on patient history, age group, existing diagnoses, and current medication load.',
    Icon: Activity,
    accent: '#ff8c42',
  },
  {
    title: 'Side Effect Tracking',
    description: 'Patients log and track reported side effects over time. Providers receive structured summaries for better-informed decisions.',
    Icon: AlertTriangle,
    accent: '#f5c842',
  },
  {
    title: 'Analytics Dashboard',
    description: 'Visual dashboards showing risk trends, interaction frequencies, and prescribing patterns across your patient population.',
    Icon: TrendingUp,
    accent: '#00d4aa',
  },
  {
    title: 'HIPAA Security & RBAC',
    description: 'Role-based access control with end-to-end encryption. Every action is logged. Full HIPAA compliance out of the box.',
    Icon: Lock,
    accent: '#a78bfa',
  },
]

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative py-24 md:py-32"
      style={{ backgroundColor: 'var(--mr-navy)' }}>

      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(220,232,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(220,232,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-12">

        {/* Section header */}
        <div className="mb-16 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: 'var(--mr-teal)' }}>
            Platform Capabilities
          </span>
          <h2 className="font-display mt-4 text-4xl font-bold tracking-tight md:text-5xl"
            style={{ color: '#dce8ff' }}>
            Everything You Need{' '}
            <span style={{ color: 'var(--mr-teal)' }}>for Drug Safety</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed"
            style={{ color: 'rgba(220,232,255,0.55)' }}>
            A complete clinical intelligence platform designed to reduce prescribing errors
            and improve patient outcomes.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, description, Icon, accent }) => (
            <div
              key={title}
              className="hover-teal-border group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300"
              style={{
                backgroundColor: 'var(--mr-card, #0d1d34)',
                borderColor: 'rgba(255,255,255,0.07)',
              }}>

              {/* Accent glow blob */}
              <div
                className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle, ${accent}22, transparent 70%)` }}
              />

              {/* Icon */}
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${accent}18`, color: accent }}>
                <Icon className="h-5 w-5" />
              </div>

              <h3 className="font-display mb-2 text-base font-semibold" style={{ color: '#dce8ff' }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(220,232,255,0.5)' }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
