import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { cn } from '@/lib/utils'
import { Menu, X, ChevronRight, Shield, Activity, Database, Zap, Lock, CheckCircle, BarChart2, Users } from 'lucide-react'
import { useScroll, motion } from 'motion/react'

/* ── Trust badge data ─────────────────────────────────────────────────── */
const trustBadges = [
  { Icon: Shield,      label: 'HIPAA Compliant' },
  { Icon: Database,    label: 'FDA Drug Database' },
  { Icon: Activity,    label: '500+ Drugs Analyzed' },
  { Icon: Zap,         label: 'Real-time Alerts' },
  { Icon: Lock,        label: 'End-to-End Encrypted' },
  { Icon: BarChart2,   label: '10,000+ Assessments' },
  { Icon: Users,       label: '50+ Care Teams' },
  { Icon: CheckCircle, label: '99.9% Uptime' },
]

/* ── Main hero ────────────────────────────────────────────────────────── */
export default function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-x-hidden" style={{ backgroundColor: 'var(--mr-navy)' }}>

        {/* ── Hero panel ── */}
        <section style={{ backgroundColor: 'var(--mr-navy)' }}>
          <div className="relative min-h-screen">

            {/* Background video */}
            <div className="absolute inset-0 overflow-hidden">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover opacity-30"
                src="https://ik.imagekit.io/lrigu76hy/tailark/dna-video.mp4?updatedAt=1745736251477"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to bottom, rgba(4,8,15,0.55) 0%, rgba(4,8,15,0.3) 40%, rgba(4,8,15,0.75) 100%)'
              }} />
              {/* Side fade */}
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, rgba(4,8,15,0.6) 100%)'
              }} />
            </div>

            {/* Hero content */}
            <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-center px-6 pt-40 pb-32 text-center lg:px-12">

              {/* Eyebrow badge */}
              <div className="animate-enter-1">
                <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium tracking-widest uppercase"
                  style={{
                    borderColor: 'rgba(0,212,170,0.35)',
                    background: 'rgba(0,212,170,0.08)',
                    color: 'var(--mr-teal)',
                  }}>
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--mr-teal)' }} />
                  AI-Powered Drug Safety Platform
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display animate-enter-2 mt-8 max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl"
                style={{ color: '#dce8ff' }}>
                Prescribe Safer.{' '}
                <br className="hidden sm:block" />
                <span className="text-glow-teal" style={{ color: 'var(--mr-teal)' }}>
                  Protect Every Patient.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="animate-enter-3 mt-6 max-w-2xl text-lg leading-relaxed md:text-xl"
                style={{ color: 'rgba(220,232,255,0.7)' }}>
                MediRisk detects dangerous drug interactions and predicts adverse
                side effects in real-time — giving clinicians the intelligence to
                make safer prescribing decisions.
              </p>

              {/* CTAs */}
              <div className="animate-enter-4 mt-10 flex flex-col items-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="pulse-glow h-12 rounded-full pl-6 pr-4 text-base font-semibold">
                  <Link to="/signup/patient">
                    Get Started Free
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-6 text-base">
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>

              {/* Scroll indicator */}
              <div className="mt-20 flex flex-col items-center gap-2 animate-enter-4"
                style={{ color: 'rgba(220,232,255,0.3)' }}>
                <span className="text-xs tracking-widest uppercase">Scroll</span>
                <div className="h-8 w-px" style={{ background: 'linear-gradient(to bottom, rgba(0,212,170,0.5), transparent)' }} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust / infinite slider ── */}
        <section style={{ backgroundColor: 'var(--mr-surface, #0a1628)' }}>
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col items-center border-b border-t py-5 md:flex-row"
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}>

              <div className="shrink-0 pr-0 pb-4 text-center md:border-r md:pr-8 md:pb-0 md:text-right">
                <p className="text-xs font-medium uppercase tracking-widest"
                  style={{ color: 'rgba(220,232,255,0.4)' }}>
                  Trusted by clinicians
                </p>
              </div>

              <div className="relative w-full md:pl-4">
                <InfiniteSlider duration={40} durationOnHover={80} gap={48}>
                  {trustBadges.map(({ Icon, label }) => (
                    <div key={label}
                      className="flex items-center gap-2 rounded-full border px-4 py-2"
                      style={{
                        borderColor: 'rgba(255,255,255,0.07)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'rgba(220,232,255,0.65)',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                      }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: 'var(--mr-teal)' }} />
                      {label}
                    </div>
                  ))}
                </InfiniteSlider>

                {/* Fade edges */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-16"
                  style={{ background: 'linear-gradient(to right, var(--mr-surface, #0a1628), transparent)' }} />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-16"
                  style={{ background: 'linear-gradient(to left, var(--mr-surface, #0a1628), transparent)' }} />
                <ProgressiveBlur className="pointer-events-none absolute left-0 top-0 h-full w-16" direction="left" blurIntensity={0.5} />
                <ProgressiveBlur className="pointer-events-none absolute right-0 top-0 h-full w-16" direction="right" blurIntensity={0.5} />
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}

/* ── Nav items ────────────────────────────────────────────────────────── */
const menuItems = [
  { name: 'Features',     href: '#features' },
  { name: 'For Providers', href: '#testimonials' },
  { name: 'Security',     href: '#stats' },
  { name: 'About',        href: '#cta' },
]

/* ── Navbar ───────────────────────────────────────────────────────────── */
const HeroHeader = () => {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const { scrollYProgress } = useScroll()

  React.useEffect(() => {
    const unsub = scrollYProgress.on('change', v => setScrolled(v > 0.03))
    return unsub
  }, [scrollYProgress])

  return (
    <header>
      <nav
        data-state={menuOpen ? 'active' : undefined}
        className="group fixed top-0 z-50 w-full pt-3">
        <div className={cn(
          'mx-auto max-w-7xl rounded-2xl px-5 transition-all duration-300 lg:px-10',
          scrolled && 'shadow-lg',
        )}
          style={scrolled ? {
            background: 'rgba(4,8,15,0.75)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          } : undefined}>

          <motion.div
            className={cn(
              'relative flex flex-wrap items-center justify-between gap-4 py-3 transition-all duration-200 lg:gap-0',
              scrolled && 'lg:py-3',
              !scrolled && 'lg:py-5',
            )}>

            {/* Logo + mobile menu toggle */}
            <div className="flex w-full items-center justify-between lg:w-auto">
              <Link to="/" aria-label="home" className="flex items-center gap-2.5">
                <MediRiskLogo />
              </Link>

              <button
                onClick={() => setMenuOpen(o => !o)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                className="relative z-20 -m-2 block p-2 lg:hidden"
                style={{ color: 'rgba(220,232,255,0.8)' }}>
                {menuOpen
                  ? <X className="h-5 w-5" />
                  : <Menu className="h-5 w-5" />}
              </button>

              {/* Desktop nav links */}
              <ul className="hidden lg:flex lg:items-center lg:gap-8 lg:text-sm">
                {menuItems.map(item => (
                  <li key={item.name}>
                    <a href={item.href}
                      className="transition-colors duration-150"
                      style={{ color: 'rgba(220,232,255,0.6)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#dce8ff')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(220,232,255,0.6)')}>
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Desktop auth buttons */}
            <div className={cn(
              'mb-4 hidden w-full flex-wrap items-center justify-end gap-3 rounded-2xl border p-5 shadow-xl',
              'lg:mb-0 lg:flex lg:w-auto lg:gap-3 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none',
              menuOpen && 'block',
            )}
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#0a1628' }}>

              {/* Mobile links */}
              <ul className="mb-6 w-full space-y-5 text-base lg:hidden">
                {menuItems.map(item => (
                  <li key={item.name}>
                    <a href={item.href}
                      onClick={() => setMenuOpen(false)}
                      style={{ color: 'rgba(220,232,255,0.7)' }}>
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="flex w-full flex-col gap-2 sm:flex-row sm:gap-2 lg:w-auto">
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup/patient">Get Started</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </nav>
    </header>
  )
}

/* ── MediRisk logo mark ───────────────────────────────────────────────── */
const MediRiskLogo = () => (
  <div className="flex items-center gap-2.5">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg"
      style={{ background: 'linear-gradient(135deg, #00d4aa 0%, #0099cc 100%)', boxShadow: '0 0 16px rgba(0,212,170,0.4)' }}>
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
        <path d="M10 2v6M10 12v6M2 10h6M12 10h6" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="10" cy="10" r="2" fill="white" />
      </svg>
    </div>
    <span className="font-display text-base font-bold tracking-tight" style={{ color: '#dce8ff' }}>
      MediRisk
    </span>
  </div>
)
