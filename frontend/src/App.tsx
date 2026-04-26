import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PatientSignup from "./pages/PatientSignupMUI";
import ProviderSignup from "./pages/ProviderSignupMUI";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import LandingPage from "./pages/LandingPage";
import ProviderDashboard from "./pages/ProviderDashboard";
import DrugSearchPage from "./pages/DrugSearchPage";
import PatientsPage from "./pages/PatientsPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import MyMedicationsPage from "./pages/MyMedicationsPage";
import MyRecordsPage from "./pages/MyRecordsPage";
import MyVisitsPage from "./pages/MyVisitsPage";
import InsurancePage from "./pages/InsurancePage";
import SideEffectsPage from "./pages/SideEffectsPage";
import ProviderAnalyticsPage from "./pages/ProviderAnalyticsPage";
import OrganizationPage from "./pages/OrganizationPage";

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
              <Navigate to="/patient/records" replace />
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
          path="/patient/records"
          element={
            <DashboardLayout requiredRole="patient">
              <MyRecordsPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/patient/visits"
          element={
            <DashboardLayout requiredRole="patient">
              <MyVisitsPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/patient/insurance"
          element={
            <DashboardLayout requiredRole="patient">
              <InsurancePage />
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
          path="/provider/analytics"
          element={
            <DashboardLayout requiredRole="analytics">
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
      </Routes>
    </Router>
  );
}

export default App;
