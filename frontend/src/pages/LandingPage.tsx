import HeroSection from '../components/landing/HeroSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import CTASection from '../components/landing/CTASection'

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: 'var(--mr-navy)', minHeight: '100vh' }}>
      <HeroSection />
      <FeaturesSection />
      <CTASection />
    </div>
  )
}
