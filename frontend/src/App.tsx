import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PatientSignup from "./pages/PatientSignupMUI";
import ProviderSignup from "./pages/ProviderSignupMUI";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import LandingPage from "./pages/LandingPage";
import PatientDashboard from "./pages/PatientDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import DashboardLayout from "./components/layout/DashboardLayout";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup/patient" element={<PatientSignup />} />
        <Route path="/signup/provider" element={<ProviderSignup />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route
          path="/dashboard/patient"
          element={
            <DashboardLayout requiredRole="patient">
              <PatientDashboard />
            </DashboardLayout>
          }
        />
        <Route
          path="/dashboard/provider"
          element={
            <DashboardLayout requiredRole="provider">
              <ProviderDashboard />
            </DashboardLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
