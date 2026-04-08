import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function CTASection() {
  return (
    <section
      id="cta"
      style={{ backgroundColor: 'var(--mr-surface, #0a1628)', padding: '6rem 0', position: 'relative', overflow: 'hidden' }}>

      {/* Background glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(0,212,170,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      {/* Animated rings */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 600, height: 600, transform: 'translate(-50%,-50%)', borderRadius: '50%', border: '1px solid rgba(0,212,170,0.15)', animation: 'slowSpin 30s linear infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 400, height: 400, transform: 'translate(-50%,-50%)', borderRadius: '50%', border: '1px solid rgba(0,212,170,0.1)', animation: 'slowSpin 20s linear infinite reverse', pointerEvents: 'none' }} />

      <div className="land-wrap" style={{ position: 'relative' }}>
        <div className="land-center" style={{ maxWidth: '48rem', margin: '0 auto' }}>

          <span style={{ color: 'var(--mr-teal)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Get Started Today
          </span>

          <h2 className="font-display text-glow-teal" style={{ color: '#dce8ff', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, marginTop: '1.25rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Ready to Make{' '}
            <span style={{ color: 'var(--mr-teal)' }}>Prescribing Safer?</span>
          </h2>

          <p style={{ color: 'rgba(220,232,255,0.6)', marginTop: '1.25rem', lineHeight: 1.7, fontSize: '1.0625rem' }}>
            Join healthcare professionals who trust MediRisk to protect their patients
            from adverse drug events — set up in minutes, not days.
          </p>

          <div style={{ marginTop: '2.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <Link
              to="/signup/patient"
              className="pulse-glow"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: '#00d4aa', color: '#04080f',
                fontWeight: 700, fontSize: '1rem',
                padding: '0.75rem 1.75rem', borderRadius: '9999px',
                textDecoration: 'none', transition: 'background-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#00ffcc')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#00d4aa')}>
              Start for Free
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/signup/provider"
              style={{
                display: 'inline-flex', alignItems: 'center',
                border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(220,232,255,0.85)',
                fontWeight: 600, fontSize: '1rem',
                padding: '0.75rem 1.75rem', borderRadius: '9999px',
                textDecoration: 'none', transition: 'all 0.2s',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}>
              Register Your Organization
            </Link>
          </div>

          <p style={{ color: 'rgba(220,232,255,0.3)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
            No credit card required · HIPAA compliant · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}
