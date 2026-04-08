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

            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
              <HeroBg />
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

/* ── Animated hero background (replaces external video) ──────────────── */
const HeroBg = () => (
  <div className="absolute inset-0 h-full w-full" style={{ opacity: 0.35 }}>
    <svg
      className="h-full w-full"
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="bg-grad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#0c2820" />
          <stop offset="100%" stopColor="#04080f" />
        </radialGradient>
        <style>{`
          @keyframes drift1 { 0%,100%{transform:translateY(0px) translateX(0px)} 50%{transform:translateY(-30px) translateX(12px)} }
          @keyframes drift2 { 0%,100%{transform:translateY(0px) translateX(0px)} 50%{transform:translateY(24px) translateX(-18px)} }
          @keyframes drift3 { 0%,100%{transform:translateY(0px) translateX(0px)} 33%{transform:translateY(-18px) translateX(22px)} 66%{transform:translateY(14px) translateX(-10px)} }
          @keyframes pulse-r { 0%,100%{r:2;opacity:0.8} 50%{r:3.5;opacity:1} }
          @keyframes flow { 0%{stroke-dashoffset:300} 100%{stroke-dashoffset:0} }
          .orb1{animation:drift1 9s ease-in-out infinite}
          .orb2{animation:drift2 11s ease-in-out infinite}
          .orb3{animation:drift3 14s ease-in-out infinite}
          .node{animation:pulse-r 3s ease-in-out infinite}
          .edge{stroke-dasharray:8 4;animation:flow 4s linear infinite}
        `}</style>
      </defs>

      {/* Base fill */}
      <rect width="1200" height="700" fill="url(#bg-grad)" />

      {/* Glow orbs */}
      <g className="orb1">
        <circle cx="300" cy="200" r="220" fill="rgba(0,212,170,0.06)" />
      </g>
      <g className="orb2">
        <circle cx="900" cy="480" r="260" fill="rgba(0,153,204,0.05)" />
      </g>
      <g className="orb3">
        <circle cx="650" cy="350" r="180" fill="rgba(0,212,170,0.04)" />
      </g>

      {/* Grid lines */}
      {Array.from({ length: 13 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="700"
          stroke="rgba(0,212,170,0.04)" strokeWidth="1" />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 100} x2="1200" y2={i * 100}
          stroke="rgba(0,212,170,0.04)" strokeWidth="1" />
      ))}

      {/* DNA double helix — left strand */}
      {Array.from({ length: 12 }).map((_, i) => {
        const t = i / 11
        const y = 80 + i * 50
        const x1 = 160 + Math.sin(t * Math.PI * 3) * 40
        const x2 = 160 - Math.sin(t * Math.PI * 3) * 40
        return (
          <g key={`dna${i}`}>
            <line x1={x1} y1={y} x2={x2} y2={y}
              stroke="rgba(0,212,170,0.25)" strokeWidth="1.5" />
            <circle cx={x1} cy={y} r="3" fill="rgba(0,212,170,0.5)" className="node"
              style={{ animationDelay: `${i * 0.2}s` }} />
            <circle cx={x2} cy={y} r="3" fill="rgba(0,153,204,0.5)" className="node"
              style={{ animationDelay: `${i * 0.2 + 0.1}s` }} />
          </g>
        )
      })}
      <path d={`M ${Array.from({ length: 12 }).map((_, i) => {
        const t = i / 11; const y = 80 + i * 50; const x = 160 + Math.sin(t * Math.PI * 3) * 40
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      }).join(' ')}`} fill="none" stroke="rgba(0,212,170,0.3)" strokeWidth="1.5" />
      <path d={`M ${Array.from({ length: 12 }).map((_, i) => {
        const t = i / 11; const y = 80 + i * 50; const x = 160 - Math.sin(t * Math.PI * 3) * 40
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      }).join(' ')}`} fill="none" stroke="rgba(0,153,204,0.3)" strokeWidth="1.5" />

      {/* Network graph — right side */}
      {[
        [900, 150], [980, 260], [1050, 170], [860, 300], [1020, 340],
        [940, 420], [1080, 420], [820, 200], [1000, 480],
      ].map(([x, y], i) => (
        <circle key={`n${i}`} cx={x} cy={y} r="4"
          fill="rgba(0,212,170,0.6)" className="node"
          style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
      {[
        [900,150,980,260],[980,260,1050,170],[980,260,860,300],
        [980,260,1020,340],[1020,340,940,420],[1020,340,1080,420],
        [860,300,820,200],[940,420,1000,480],[1050,170,1080,420],
      ].map(([x1,y1,x2,y2], i) => (
        <line key={`e${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(0,212,170,0.2)" strokeWidth="1.5" className="edge"
          style={{ animationDelay: `${i * 0.4}s` }} />
      ))}

      {/* Floating data chips */}
      {[
        { x: 420, y: 120, label: 'Drug Interaction' },
        { x: 700, y: 560, label: 'Risk Score: 94' },
        { x: 500, y: 460, label: 'Alert: High Risk' },
      ].map(({ x, y, label }, i) => (
        <g key={`chip${i}`} style={{ animation: `drift${(i % 3) + 1} ${10 + i * 2}s ease-in-out infinite` }}>
          <rect x={x} y={y} width={label.length * 7 + 20} height={24} rx="12"
            fill="rgba(0,212,170,0.08)" stroke="rgba(0,212,170,0.2)" strokeWidth="1" />
          <text x={x + 10} y={y + 15.5} fill="rgba(0,212,170,0.7)"
            fontSize="10" fontFamily="monospace">{label}</text>
        </g>
      ))}
    </svg>
  </div>
)

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
