import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

export default function CTASection() {
  return (
    <section
      id="cta"
      className="relative overflow-hidden py-24 md:py-32"
      style={{ backgroundColor: 'var(--mr-surface, #0a1628)' }}>

      {/* Background mesh */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(0,212,170,0.08) 0%, transparent 70%)',
        }}
      />
      {/* Animated ring */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-10"
        style={{ borderColor: 'var(--mr-teal)', animation: 'slowSpin 30s linear infinite' }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-10"
        style={{ borderColor: 'var(--mr-teal)', animation: 'slowSpin 20s linear infinite reverse' }}
      />

      <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-12">

        <span className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: 'var(--mr-teal)' }}>
          Get Started Today
        </span>

        <h2 className="font-display mt-5 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
          style={{ color: '#dce8ff' }}>
          Ready to Make{' '}
          <span className="text-glow-teal" style={{ color: 'var(--mr-teal)' }}>
            Prescribing Safer?
          </span>
        </h2>

        <p className="mt-5 text-base leading-relaxed md:text-lg"
          style={{ color: 'rgba(220,232,255,0.6)' }}>
          Join healthcare professionals who trust MediRisk to protect their patients
          from adverse drug events — set up in minutes, not days.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="pulse-glow h-12 rounded-full pl-6 pr-4 text-base font-semibold">
            <Link to="/signup/patient">
              Start for Free
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-6 text-base">
            <Link to="/signup/provider">Register Your Organization</Link>
          </Button>
        </div>

        <p className="mt-6 text-xs" style={{ color: 'rgba(220,232,255,0.3)' }}>
          No credit card required · HIPAA compliant · Cancel anytime
        </p>
      </div>
    </section>
  )
}
