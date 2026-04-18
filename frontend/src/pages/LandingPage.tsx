import HeroSection from '../components/landing/HeroSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import StatsSection from '../components/landing/StatsSection'
import CTASection from '../components/landing/CTASection'

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: 'var(--mr-navy)', minHeight: '100vh' }}>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <CTASection />
    </div>
  )
}
