import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PatientSignup from "./pages/PatientSignupMUI";
import ProviderSignup from "./pages/ProviderSignupMUI";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup/patient" element={<PatientSignup />} />
        <Route path="/signup/provider" element={<ProviderSignup />} />
      </Routes>
    </Router>
  );
}

export default App;
