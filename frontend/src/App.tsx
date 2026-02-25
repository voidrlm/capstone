import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PatientSignup from "./pages/PatientSignupMUI";
import ProviderSignup from "./pages/ProviderSignupMUI";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import PatientDashboard from "./pages/PatientDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup/patient" element={<PatientSignup />} />
        <Route path="/signup/provider" element={<ProviderSignup />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/dashboard/patient" element={<PatientDashboard />} />
        <Route path="/dashboard/provider" element={<ProviderDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
