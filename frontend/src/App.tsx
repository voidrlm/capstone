import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
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

function PatientLayout() {
  return (
    <DashboardLayout requiredRole="patient">
      <Outlet />
    </DashboardLayout>
  );
}

function ProviderLayout() {
  return (
    <DashboardLayout requiredRole="provider">
      <Outlet />
    </DashboardLayout>
  );
}

function AnalyticsLayout() {
  return (
    <DashboardLayout requiredRole="analytics">
      <Outlet />
    </DashboardLayout>
  );
}

function DefaultLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
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

          <Route path="/dashboard/patient" element={<PatientLayout />}>
            <Route index element={<Navigate to="/patient/records" replace />} />
          </Route>

          <Route element={<PatientLayout />}>
            <Route path="/patient/records" element={<MyRecordsPage />} />
            <Route path="/patient/medications" element={<MyMedicationsPage />} />
            <Route path="/patient/visits" element={<MyVisitsPage />} />
            <Route path="/patient/insurance" element={<InsurancePage />} />
            <Route path="/patient/side-effects" element={<SideEffectsPage />} />
          </Route>

          <Route element={<ProviderLayout />}>
            <Route path="/dashboard/provider" element={<ProviderDashboard />} />
            <Route path="/provider/organization" element={<OrganizationPage />} />
          </Route>

          <Route element={<AnalyticsLayout />}>
            <Route path="/provider/analytics" element={<ProviderAnalyticsPage />} />
          </Route>

          <Route element={<DefaultLayout />}>
            <Route path="/drugs" element={<DrugSearchPage />} />
            <Route path="/patients" element={<PatientsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
