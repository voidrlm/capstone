import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { cn } from '@/lib/utils'
import { Menu, X, Shield, Activity, Database, Zap, Lock, CheckCircle, BarChart2, Users, ArrowRight } from 'lucide-react'
import { useScroll } from 'motion/react'

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
          <div className="relative flex min-h-screen flex-col items-center justify-center">

            {/* Background */}
            <div className="absolute inset-0 overflow-hidden">
              <HeroBg />
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to bottom, rgba(4,8,15,0.4) 0%, rgba(4,8,15,0.15) 50%, rgba(4,8,15,0.65) 100%)'
              }} />
            </div>

            {/* Hero content — vertically + horizontally centered */}
            <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-24 pt-32 text-center lg:px-12">

              {/* Eyebrow */}
              <div className="animate-enter-1 mb-6">
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-widest uppercase"
                  style={{
                    borderColor: 'rgba(0,212,170,0.4)',
                    background: 'rgba(0,212,170,0.1)',
                    color: 'var(--mr-teal)',
                  }}>
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--mr-teal)' }} />
                  Comprehensive Medication Tracker & Intelligence
                </span>
              </div>

              {/* Headline */}
              <h1
                className="font-display animate-enter-2 max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl"
                style={{ color: '#dce8ff' }}>
                Track Your Medications.{' '}
                <br />
                <span className="text-glow-teal" style={{ color: 'var(--mr-teal)' }}>
                  Check For Interactions.
                </span>
              </h1>

              {/* Subheadline */}
              <p
                className="animate-enter-3 mt-7 max-w-2xl text-lg leading-relaxed sm:text-xl"
                style={{ color: 'rgba(220,232,255,0.65)' }}>
                It's not just for prescriptions. MediRisk helps you safely track your entire medication record over the years, instantly catches dangerous drug interactions, and gives both patients and providers peace of mind.
              </p>

              {/* CTAs */}
              <div className="animate-enter-4 mt-10 flex flex-col items-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="pulse-glow h-14 gap-2 rounded-full px-7 text-[1rem] font-bold shadow-[0_18px_40px_rgba(0,212,170,0.3)] hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(0,212,170,0.38)]"
                >
                  <Link to="/signup/patient">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-full border-white/15 bg-white/4 px-6 text-[1rem] font-semibold text-white/88 backdrop-blur-md hover:border-white/30 hover:bg-white/10 hover:text-white"
                >
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>

              {/* Stats row */}
              <div className="animate-enter-4 mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                {[
                  { value: '500+', label: 'Drugs' },
                  { value: '10k+', label: 'Assessments' },
                  { value: '99.9%', label: 'Uptime' },
                  { value: 'HIPAA', label: 'Compliant' },
                ].map(({ value, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="font-display text-xl font-bold" style={{ color: 'var(--mr-teal)' }}>{value}</span>
                    <span className="text-sm" style={{ color: 'rgba(220,232,255,0.4)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="animate-enter-4 absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
              style={{ color: 'rgba(220,232,255,0.25)' }}>
              <span className="text-xs tracking-widest uppercase">Scroll</span>
              <div className="h-8 w-px" style={{ background: 'linear-gradient(to bottom, rgba(0,212,170,0.5), transparent)' }} />
            </div>
          </div>
        </section>

        {/* ── Trust / infinite slider ── */}
        <section style={{ backgroundColor: 'var(--mr-surface, #0a1628)' }}>
          <div className="mx-auto max-w-7xl px-6">
            <div
              className="flex flex-col items-center border-b border-t py-5 md:flex-row"
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}>

              <div className="shrink-0 pb-4 text-center md:border-r md:pr-8 md:pb-0 md:text-right"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'rgba(220,232,255,0.35)' }}>
                  Trusted by patients and clinicians
                </p>
              </div>

              <div className="relative w-full md:pl-4">
                <InfiniteSlider duration={40} durationOnHover={80} gap={48}>
                  {trustBadges.map(({ Icon, label }) => (
                    <div key={label}
                      className="flex items-center gap-2 rounded-full border px-4 py-2"
                      style={{
                        borderColor: 'rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'rgba(220,232,255,0.6)',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                      }}>
                      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--mr-teal)' }} />
                      {label}
                    </div>
                  ))}
                </InfiniteSlider>

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

/* ── Animated SVG background ──────────────────────────────────────────── */
const HeroBg = () => (
  <div className="absolute inset-0 h-full w-full" style={{ opacity: 0.6 }}>
    <svg
      className="h-full w-full"
      viewBox="0 0 1440 800"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="bg-grad" cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor="#0d2a20" />
          <stop offset="100%" stopColor="#04080f" />
        </radialGradient>
        <radialGradient id="orb1-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00d4aa" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#00d4aa" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orb2-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0099cc" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0099cc" stopOpacity="0" />
        </radialGradient>
        <style>{`
          @keyframes drift1{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-20px)}}
          @keyframes drift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-25px,18px)}}
          @keyframes drift3{0%,100%{transform:translate(0,0)}33%{transform:translate(18px,-28px)}66%{transform:translate(-15px,12px)}}
          @keyframes nodePulse{0%,100%{opacity:0.5;r:3}50%{opacity:1;r:5}}
          @keyframes edgeFlow{0%{stroke-dashoffset:40}100%{stroke-dashoffset:0}}
          .d1{animation:drift1 10s ease-in-out infinite}
          .d2{animation:drift2 13s ease-in-out infinite}
          .d3{animation:drift3 16s ease-in-out infinite}
          .np{animation:nodePulse 3s ease-in-out infinite}
          .ef{stroke-dasharray:6 3;animation:edgeFlow 3s linear infinite}
        `}</style>
      </defs>

      <rect width="1440" height="800" fill="url(#bg-grad)" />

      {/* Large glow orbs */}
      <g className="d1"><ellipse cx="360" cy="380" rx="380" ry="320" fill="url(#orb1-grad)" /></g>
      <g className="d2"><ellipse cx="1100" cy="420" rx="320" ry="280" fill="url(#orb2-grad)" /></g>
      <g className="d3"><ellipse cx="720" cy="200" rx="200" ry="160" fill="url(#orb1-grad)" /></g>

      {/* Grid */}
      {Array.from({ length: 15 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="800" stroke="rgba(0,212,170,0.06)" strokeWidth="1" />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 100} x2="1440" y2={i * 100} stroke="rgba(0,212,170,0.06)" strokeWidth="1" />
      ))}

      {/* DNA helix — left */}
      {Array.from({ length: 14 }).map((_, i) => {
        const t = i / 13
        const y = 60 + i * 52
        const x1 = 130 + Math.sin(t * Math.PI * 3.5) * 48
        const x2 = 130 - Math.sin(t * Math.PI * 3.5) * 48
        return (
          <g key={`dna${i}`}>
            <line x1={x1} y1={y} x2={x2} y2={y} stroke="rgba(0,212,170,0.3)" strokeWidth="1.5" />
            <circle cx={x1} cy={y} r="3.5" fill="rgba(0,212,170,0.7)" className="np" style={{ animationDelay: `${i * 0.18}s` }} />
            <circle cx={x2} cy={y} r="3.5" fill="rgba(0,153,204,0.7)" className="np" style={{ animationDelay: `${i * 0.18 + 0.09}s` }} />
          </g>
        )
      })}
      <path
        d={Array.from({ length: 14 }).map((_, i) => {
          const t = i / 13; const y = 60 + i * 52; const x = 130 + Math.sin(t * Math.PI * 3.5) * 48
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
        }).join(' ')}
        fill="none" stroke="rgba(0,212,170,0.4)" strokeWidth="2" />
      <path
        d={Array.from({ length: 14 }).map((_, i) => {
          const t = i / 13; const y = 60 + i * 52; const x = 130 - Math.sin(t * Math.PI * 3.5) * 48
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
        }).join(' ')}
        fill="none" stroke="rgba(0,153,204,0.4)" strokeWidth="2" />

      {/* Network graph — right */}
      {([
        [1100,130],[1190,240],[1270,150],[1060,280],[1240,310],
        [1150,390],[1300,390],[1030,180],[1220,460],[1320,220],
      ] as [number,number][]).map(([x, y], i) => (
        <circle key={`n${i}`} cx={x} cy={y} r="4.5"
          fill="rgba(0,212,170,0.7)" className="np"
          style={{ animationDelay: `${i * 0.25}s` }} />
      ))}
      {([
        [1100,130,1190,240],[1190,240,1270,150],[1190,240,1060,280],
        [1190,240,1240,310],[1240,310,1150,390],[1240,310,1300,390],
        [1060,280,1030,180],[1150,390,1220,460],[1270,150,1300,390],
        [1030,180,1100,130],[1320,220,1270,150],[1320,220,1300,390],
      ] as [number,number,number,number][]).map(([x1,y1,x2,y2], i) => (
        <line key={`e${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(0,212,170,0.25)" strokeWidth="1.5" className="ef"
          style={{ animationDelay: `${i * 0.3}s` }} />
      ))}

      {/* Floating data chips */}
      {([
        { x: 500, y: 100, label: 'Drug Interaction Detected', delay: '0s' },
        { x: 820, y: 620, label: 'Risk Score: 94 · High', delay: '2s' },
        { x: 560, y: 500, label: 'Alert: Adverse Event', delay: '4s' },
        { x: 350, y: 680, label: 'Side Effect: Monitoring', delay: '1s' },
      ] as {x:number;y:number;label:string;delay:string}[]).map(({ x, y, label, delay }) => (
        <g key={label} style={{ animation: `drift1 ${11 + x % 5}s ease-in-out infinite`, animationDelay: delay }}>
          <rect x={x} y={y} width={label.length * 7.2 + 20} height={26} rx="13"
            fill="rgba(0,212,170,0.1)" stroke="rgba(0,212,170,0.3)" strokeWidth="1" />
          <text x={x + 10} y={y + 17} fill="rgba(0,212,170,0.85)"
            fontSize="11" fontFamily="'DM Mono', 'Fira Code', monospace" fontWeight="500">{label}</text>
        </g>
      ))}

      {/* Horizontal scan line */}
      <line x1="0" y1="400" x2="1440" y2="400"
        stroke="rgba(0,212,170,0.08)" strokeWidth="1"
        strokeDasharray="4 8" />
    </svg>
  </div>
)

/* ── Nav items ────────────────────────────────────────────────────────── */
const menuItems = [
  { name: 'Features',      href: '#features' },
  { name: 'For Providers', href: '#testimonials' },
  { name: 'Security',      href: '#stats' },
  { name: 'About',         href: '#cta' },
]

/* ── Navbar ───────────────────────────────────────────────────────────── */
const HeroHeader = () => {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const { scrollYProgress } = useScroll()

  React.useEffect(() => {
    const unsub = scrollYProgress.on('change', v => setScrolled(v > 0.02))
    return unsub
  }, [scrollYProgress])

  return (
    <header>
      <nav className="fixed top-0 z-50 w-full">
        <div
          className={cn(
            'mx-auto max-w-7xl px-4 transition-all duration-300 sm:px-6 lg:px-10',
            scrolled ? 'py-3' : 'py-5',
          )}>

          <div
            className="flex items-center justify-between gap-6 rounded-2xl border px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition-all duration-300 sm:px-5 lg:px-6"
            style={{
              background: scrolled ? 'rgba(4,8,15,0.88)' : 'rgba(4,8,15,0.72)',
              backdropFilter: 'blur(20px)',
              borderColor: scrolled ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.06)',
            }}>

            {/* Logo */}
            <Link to="/" aria-label="home" className="shrink-0">
              <MediRiskLogo />
            </Link>

            {/* Desktop nav links — centered */}
            <ul
              className="hidden items-center rounded-full border px-3 py-2 text-sm lg:flex"
              style={{
                borderColor: 'rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.025)',
              }}>
              {menuItems.map(item => (
                <li key={item.name} className="px-3">
                  <a
                    href={item.href}
                    className="text-[0.95rem] font-medium transition-colors duration-150"
                    style={{ color: 'rgba(220,232,255,0.58)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#dce8ff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(220,232,255,0.58)')}>
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* Desktop auth */}
            <div className="hidden items-center gap-2 lg:flex">
              <Button asChild variant="ghost" size="sm" className="px-4 text-[0.95rem] font-semibold">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full px-5 text-[0.95rem] font-semibold">
                <Link to="/signup/patient">Get Started</Link>
              </Button>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="block p-2 lg:hidden"
              style={{ color: 'rgba(220,232,255,0.8)' }}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="mt-4 rounded-2xl border p-5 lg:hidden"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#0a1628' }}>
              <ul className="mb-5 space-y-4 text-base">
                {menuItems.map(item => (
                  <li key={item.name}>
                    <a href={item.href} onClick={() => setMenuOpen(false)}
                      style={{ color: 'rgba(220,232,255,0.7)' }}>
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <Link to="/signup/patient">Get Started</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}

/* ── Logo ─────────────────────────────────────────────────────────────── */
const MediRiskLogo = () => (
  <div className="flex items-center gap-3">
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
      style={{
        background: 'linear-gradient(135deg, #00d4aa 0%, #0099cc 100%)',
        boxShadow: '0 0 18px rgba(0,212,170,0.45)',
      }}>
      <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
        <path d="M10 2v6M10 12v6M2 10h6M12 10h6" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="10" cy="10" r="2" fill="white" />
      </svg>
    </div>
    <div className="flex flex-col">
      <span className="font-display text-[1.05rem] font-bold leading-none tracking-tight" style={{ color: '#dce8ff' }}>
        MediRisk
      </span>
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.24em]" style={{ color: 'rgba(220,232,255,0.35)' }}>
        Drug Safety
      </span>
    </div>
  </div>
)
