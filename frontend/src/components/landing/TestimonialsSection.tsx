const testimonials = [
  {
    quote: 'PharmaLogs transformed how we handle prescriptions. The drug interaction alerts alone have prevented several potentially dangerous situations in our ICU.',
    name: 'Dr. Sarah Chen',
    title: 'Chief of Internal Medicine',
    initials: 'SC',
    accent: '#3b9fff',
  },
  {
    quote: 'As a clinical pharmacist, having instant access to comprehensive side-effect data helps me counsel patients far more effectively. It has become indispensable.',
    name: 'James Okafor, PharmD',
    title: 'Clinical Pharmacist',
    initials: 'JO',
    accent: '#00d4aa',
  },
  {
    quote: 'The analytics dashboard gives our team clear visibility into risk patterns across our entire patient population. Evidence-based decision-making has never been easier.',
    name: 'Dr. Maria Rodriguez',
    title: 'Medical Director',
    initials: 'MR',
    accent: '#a78bfa',
  },
]

export default function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative py-24 md:py-32"
      style={{ backgroundColor: 'var(--mr-navy)' }}>

      <div className="mx-auto max-w-7xl px-6 lg:px-12">

        {/* Header */}
        <div className="mb-16 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: 'var(--mr-teal)' }}>
            Testimonials
          </span>
          <h2 className="font-display mt-4 text-4xl font-bold tracking-tight md:text-5xl"
            style={{ color: '#dce8ff' }}>
            Trusted by Healthcare{' '}
            <span style={{ color: 'var(--mr-teal)' }}>Professionals</span>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map(({ quote, name, title, initials, accent }) => (
            <div
              key={name}
              className="hover-teal-border group relative flex flex-col justify-between rounded-2xl border p-7 transition-all duration-300"
              style={{
                backgroundColor: 'var(--mr-card, #0d1d34)',
                borderColor: 'rgba(255,255,255,0.07)',
              }}>

              {/* Quote mark */}
              <div
                className="mb-5 font-display text-5xl font-bold leading-none select-none"
                style={{ color: `${accent}40` }}>
                "
              </div>

              <p className="flex-1 text-sm leading-relaxed"
                style={{ color: 'rgba(220,232,255,0.65)' }}>
                {quote}
              </p>

              {/* Author */}
              <div className="mt-7 flex items-center gap-3 border-t pt-5"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: `${accent}20`, color: accent }}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#dce8ff' }}>
                    {name}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(220,232,255,0.4)' }}>
                    {title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
