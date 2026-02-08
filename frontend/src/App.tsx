import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPageMUI";
import FeaturesPage from "./pages/FeaturesPageMUI";
import AboutPage from "./pages/AboutPageMUI";
import PatientSignup from "./pages/PatientSignupMUI";
import ProviderSignup from "./pages/ProviderSignupMUI";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/signup/patient" element={<PatientSignup />} />
        <Route path="/signup/provider" element={<ProviderSignup />} />
      </Routes>
    </Router>
  );
}

export default App;
