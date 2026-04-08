import { Link } from 'react-router-dom'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Security', href: '#stats' },
      { label: 'Pricing', href: '#' },
      { label: 'API Docs', href: '#' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'For Patients', href: '/signup/patient' },
      { label: 'For Providers', href: '/signup/provider' },
      { label: 'Organizations', href: '/signup/provider' },
      { label: 'Sign In', href: '/login' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help Center', href: '#' },
      { label: 'Documentation', href: '#' },
      { label: 'Community', href: '#' },
      { label: 'Blog', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'HIPAA Compliance', href: '#' },
      { label: 'BAA', href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#030609', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 lg:px-12">

        {/* Top row */}
        <div className="mb-12 grid gap-10 lg:grid-cols-5">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: 'linear-gradient(135deg, #00d4aa 0%, #0099cc 100%)' }}>
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M10 2v6M10 12v6M2 10h6M12 10h6" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="10" cy="10" r="2" fill="white" />
                </svg>
              </div>
              <span className="font-display text-sm font-bold" style={{ color: '#dce8ff' }}>MediRisk</span>
            </Link>
            <p className="mt-4 text-xs leading-relaxed"
              style={{ color: 'rgba(220,232,255,0.35)' }}>
              AI-powered drug safety platform helping healthcare providers make safer prescribing decisions.
            </p>

            {/* Status badge */}
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
              style={{ borderColor: 'rgba(0,212,170,0.25)', color: 'rgba(0,212,170,0.8)', background: 'rgba(0,212,170,0.06)' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              All systems operational
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-4 lg:grid-cols-4">
            {columns.map(col => (
              <div key={col.title}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'rgba(220,232,255,0.5)' }}>
                  {col.title}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map(({ label, href }) => (
                    <li key={label}>
                      {href.startsWith('/') ? (
                        <Link
                          to={href}
                          className="text-sm transition-colors duration-150"
                          style={{ color: 'rgba(220,232,255,0.35)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(220,232,255,0.75)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(220,232,255,0.35)')}>
                          {label}
                        </Link>
                      ) : (
                        <a
                          href={href}
                          className="text-sm transition-colors duration-150"
                          style={{ color: 'rgba(220,232,255,0.35)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(220,232,255,0.75)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(220,232,255,0.35)')}>
                          {label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs sm:flex-row"
          style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(220,232,255,0.25)' }}>
          <p>© {new Date().getFullYear()} MediRisk. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--mr-teal)' }} />
            HIPAA Compliant · SOC 2 Type II
          </div>
        </div>
      </div>
    </footer>
  )
}
