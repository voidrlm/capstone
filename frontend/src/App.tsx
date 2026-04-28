import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box, LinearProgress } from "@mui/material";
import DashboardLayout from "./components/layout/DashboardLayout";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const PatientSignup = lazy(() => import("./pages/PatientSignupMUI"));
const ProviderSignup = lazy(() => import("./pages/ProviderSignupMUI"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const ProviderDashboard = lazy(() => import("./pages/ProviderDashboard"));
const DrugSearchPage = lazy(() => import("./pages/DrugSearchPage"));
const PatientsPage = lazy(() => import("./pages/PatientsPage"));
const MyMedicationsPage = lazy(() => import("./pages/MyMedicationsPage"));
const MyRecordsPage = lazy(() => import("./pages/MyRecordsPage"));
const MyVisitsPage = lazy(() => import("./pages/MyVisitsPage"));
const InsurancePage = lazy(() => import("./pages/InsurancePage"));
const SideEffectsPage = lazy(() => import("./pages/SideEffectsPage"));
const ProviderAnalyticsPage = lazy(() => import("./pages/ProviderAnalyticsPage"));
const OrganizationPage = lazy(() => import("./pages/OrganizationPage"));

function PageFallback() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <LinearProgress sx={{ "& .MuiLinearProgress-bar": { bgcolor: "#00d4aa" } }} />
    </Box>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<PageFallback />}>
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
      </Suspense>
    </Router>
  );
}

export default App;
