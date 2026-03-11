import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PatientSignup from "./pages/PatientSignupMUI";
import ProviderSignup from "./pages/ProviderSignupMUI";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import LandingPage from "./pages/LandingPage";
import PatientDashboard from "./pages/PatientDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import DrugSearchPage from "./pages/DrugSearchPage";
import PatientsPage from "./pages/PatientsPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import MyMedicationsPage from "./pages/MyMedicationsPage";
import RiskAssessmentsPage from "./pages/RiskAssessmentsPage";
import MyRecordsPage from "./pages/MyRecordsPage";
import SideEffectsPage from "./pages/SideEffectsPage";
import ProviderAssessmentsPage from "./pages/ProviderAssessmentsPage";
import ProviderAnalyticsPage from "./pages/ProviderAnalyticsPage";
import OrganizationPage from "./pages/OrganizationPage";
import SettingsPage from "./pages/SettingsPage";

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
        <Route
          path="/drugs"
          element={
            <DashboardLayout>
              <DrugSearchPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/patients"
          element={
            <DashboardLayout>
              <PatientsPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/patient/medications"
          element={
            <DashboardLayout requiredRole="patient">
              <MyMedicationsPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/patient/assessments"
          element={
            <DashboardLayout requiredRole="patient">
              <RiskAssessmentsPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/patient/records"
          element={
            <DashboardLayout requiredRole="patient">
              <MyRecordsPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/patient/side-effects"
          element={
            <DashboardLayout requiredRole="patient">
              <SideEffectsPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/provider/assessments"
          element={
            <DashboardLayout requiredRole="provider">
              <ProviderAssessmentsPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/provider/analytics"
          element={
            <DashboardLayout requiredRole="provider">
              <ProviderAnalyticsPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/provider/organization"
          element={
            <DashboardLayout requiredRole="provider">
              <OrganizationPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <DashboardLayout>
              <SettingsPage />
            </DashboardLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
