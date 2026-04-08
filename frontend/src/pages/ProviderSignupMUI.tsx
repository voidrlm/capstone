import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Checkbox,
  FormControlLabel,
  Link,
  InputAdornment,
  Stack,
  MenuItem,
  useTheme,
} from "@mui/material";
import {
  Shield,
  Building2,
  Mail,
  KeyRound,
  User,
  Phone,
  MapPin,
  Globe,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Stethoscope,
  Activity,
  BarChart3,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function ProviderSignup() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [formData, setFormData] = useState({
    organizationName: "",
    organizationType: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    website: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToHipaa, setAgreedToHipaa] = useState(false);

  const steps = ["Organization", "Admin Info", "Password"];

  const organizationTypes = [
    { value: "hospital", label: "Hospital" },
    { value: "clinic", label: "Medical Clinic" },
    { value: "pharmacy", label: "Pharmacy" },
    { value: "nursing_home", label: "Nursing Home / Long-term Care" },
    { value: "urgent_care", label: "Urgent Care Center" },
    { value: "specialty", label: "Specialty Practice" },
    { value: "other", label: "Other Healthcare Facility" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const validateStep1 = () => {
    if (!formData.organizationName) { setError("Organization name is required"); return false; }
    if (!formData.organizationType) { setError("Please select organization type"); return false; }
    if (!formData.address || !formData.city || !formData.state) { setError("Please complete the organization address"); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.adminFirstName || !formData.adminLastName) { setError("Please enter the administrator's full name"); return false; }
    if (!formData.adminEmail || !formData.adminEmail.includes("@")) { setError("Please enter a valid email address"); return false; }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.adminPassword || formData.adminPassword.length < 8) { setError("Password must be at least 8 characters"); return false; }
    if (formData.adminPassword !== formData.confirmPassword) { setError("Passwords do not match"); return false; }
    if (!agreedToTerms || !agreedToHipaa) { setError("Please agree to all terms and conditions"); return false; }
    return true;
  };

  const handleNext = () => {
    if (activeStep === 0 && validateStep1()) setActiveStep(1);
    else if (activeStep === 1 && validateStep2()) setActiveStep(2);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setIsLoading(true);
    setError("");
    try {
      const registerResponse = await fetch(`${API_URL}/api/auth/register/provider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const registerJson = await registerResponse.json().catch(() => ({}));
      if (!registerResponse.ok) throw new Error(registerJson.error?.message || "Registration failed.");

      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.adminEmail, password: formData.adminPassword }),
      });

      const loginJson = await loginResponse.json().catch(() => ({}));
      if (!loginResponse.ok) throw new Error(loginJson.error?.message || "Account created, but login failed.");

      const token = loginJson.data?.token;
      const user = loginJson.data?.user;
      if (!token || !user) throw new Error("Account created, but login response was incomplete.");

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.location.href = "/dashboard/provider";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const outlinedBtnSx = {
    borderColor: "divider",
    color: "text.primary",
    "&:hover": { borderColor: "#00d4aa" },
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      {/* Left panel */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: "45%",
          background: "linear-gradient(160deg, #04080f 0%, #071a14 50%, #0a2820 100%)",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 6,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.07)" }} />
        <Box sx={{ position: "absolute", bottom: -120, left: -60, width: 400, height: 400, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.04)" }} />
        <Box sx={{ position: "absolute", top: "40%", right: "10%", width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.05)" }} />
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 60% at 50% 40%, rgba(0,212,170,0.08) 0%, transparent 70%)" }} />

        <Box sx={{ position: "relative", zIndex: 1, maxWidth: 440, textAlign: "center" }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 4,
              background: "linear-gradient(135deg, rgba(0,212,170,0.2) 0%, rgba(0,153,204,0.15) 100%)",
              mb: 4,
              border: "1px solid rgba(0,212,170,0.28)",
              boxShadow: "0 0 40px rgba(0,212,170,0.15)",
            }}
          >
            <Building2 size={36} color="#00d4aa" />
          </Box>
          <Typography variant="h3" sx={{ color: "white", fontWeight: 800, mb: 2, fontFamily: '"Bricolage Grotesque", sans-serif' }}>
            Register Your Organization
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.5)", mb: 6, lineHeight: 1.7 }}>
            Provide your healthcare team with powerful drug safety tools and risk assessment capabilities.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { icon: Shield, text: "AI-powered drug risk assessment" },
              { icon: Stethoscope, text: "Manage your entire healthcare team" },
              { icon: Activity, text: "Real-time drug interaction alerts" },
              { icon: BarChart3, text: "Comprehensive analytics and reporting" },
              { icon: CheckCircle2, text: "Role-based access for staff" },
            ].map((feat) => {
              const FeatIcon = feat.icon;
              return (
                <Box
                  key={feat.text}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <FeatIcon size={20} color="#00d4aa" />
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.65)", textAlign: "left" }}>
                    {feat.text}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Link
            href="/login"
            underline="none"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              color: "rgba(255,255,255,0.45)",
              mt: 5,
              transition: "color 0.2s",
              "&:hover": { color: "#00d4aa" },
            }}
          >
            <ArrowLeft size={18} />
            <span>Back to Sign In</span>
          </Link>
        </Box>
      </Box>

      {/* Right panel — form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, sm: 6 },
          bgcolor: "background.default",
          overflow: "auto",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 480 }}>
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1, mb: 4 }}>
            <Box sx={{ p: 1, borderRadius: 2, background: "linear-gradient(135deg, #00d4aa 0%, #0099cc 100%)", display: "flex" }}>
              <Shield size={20} color="#04080f" />
            </Box>
            <Typography variant="h6" fontWeight={800}>MediRisk</Typography>
          </Box>

          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
            Organization Registration
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Set up your organization in a few simple steps
          </Typography>

          <Stepper
            activeStep={activeStep}
            sx={{
              mb: 3,
              "& .MuiStepLabel-label": { fontWeight: 600, fontSize: "0.8125rem" },
              "& .MuiStepIcon-root.Mui-active": { color: "#00d4aa" },
              "& .MuiStepIcon-root.Mui-completed": { color: "#00d4aa" },
            }}
          >
            {steps.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            {activeStep === 0 && (
              <Stack spacing={2.5}>
                <TextField
                  label="Organization Name"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="e.g., UMass Memorial Health"
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Building2 size={18} color="#94a3b8" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  select
                  label="Organization Type"
                  name="organizationType"
                  value={formData.organizationType}
                  onChange={handleChange}
                  required
                  fullWidth
                >
                  {organizationTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Street Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Medical Center Drive"
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MapPin size={18} color="#94a3b8" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 2 }}>
                  <TextField label="City" name="city" value={formData.city} onChange={handleChange} required fullWidth />
                  <TextField label="State" name="state" value={formData.state} onChange={handleChange} required fullWidth />
                  <TextField label="ZIP" name="zipCode" value={formData.zipCode} onChange={handleChange} required fullWidth />
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <TextField
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone size={18} color="#94a3b8" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Website (Optional)"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Globe size={18} color="#94a3b8" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Button variant="contained" size="large" onClick={handleNext} endIcon={<ChevronRight size={18} />} fullWidth sx={{ mt: 1 }}>
                  Continue
                </Button>
              </Stack>
            )}

            {activeStep === 1 && (
              <Stack spacing={2.5}>
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 1 }}>
                  Enter the details for the organization administrator. This person will have full access to manage users and settings.
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <TextField
                    label="First Name"
                    name="adminFirstName"
                    value={formData.adminFirstName}
                    onChange={handleChange}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <User size={18} color="#94a3b8" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField label="Last Name" name="adminLastName" value={formData.adminLastName} onChange={handleChange} required fullWidth />
                </Box>

                <TextField
                  label="Work Email"
                  name="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  helperText="Use your organization email address"
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail size={18} color="#94a3b8" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Phone Number (Optional)"
                  name="adminPhone"
                  type="tel"
                  value={formData.adminPhone}
                  onChange={handleChange}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone size={18} color="#94a3b8" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button variant="outlined" onClick={handleBack} startIcon={<ArrowLeft size={18} />} sx={outlinedBtnSx}>
                    Back
                  </Button>
                  <Button variant="contained" size="large" onClick={handleNext} endIcon={<ChevronRight size={18} />} sx={{ flex: 1 }}>
                    Continue
                  </Button>
                </Box>
              </Stack>
            )}

            {activeStep === 2 && (
              <Stack spacing={2.5}>
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 1 }}>
                  Create a secure password for the administrator account.
                </Typography>

                <TextField
                  label="Password"
                  name="adminPassword"
                  type="password"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  helperText="At least 8 characters with numbers and symbols"
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyRound size={18} color="#94a3b8" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyRound size={18} color="#94a3b8" />
                      </InputAdornment>
                    ),
                  }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      sx={{ "&.Mui-checked": { color: "#00d4aa" } }}
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.secondary">
                      I agree to the{" "}
                      <Link href="#terms" underline="hover" sx={{ color: "#00d4aa" }}>Terms of Service</Link>,{" "}
                      <Link href="#privacy" underline="hover" sx={{ color: "#00d4aa" }}>Privacy Policy</Link>, and{" "}
                      <Link href="#baa" underline="hover" sx={{ color: "#00d4aa" }}>Business Associate Agreement</Link>
                    </Typography>
                  }
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreedToHipaa}
                      onChange={(e) => setAgreedToHipaa(e.target.checked)}
                      sx={{ "&.Mui-checked": { color: "#00d4aa" } }}
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.secondary">
                      I confirm that our organization will comply with HIPAA regulations when using this platform
                    </Typography>
                  }
                />

                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button variant="outlined" onClick={handleBack} startIcon={<ArrowLeft size={18} />} sx={outlinedBtnSx}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isLoading}
                    endIcon={!isLoading && <ChevronRight size={18} />}
                    sx={{ flex: 1 }}
                  >
                    {isLoading ? "Registering..." : "Register Organization"}
                  </Button>
                </Box>
              </Stack>
            )}
          </form>

          <Box sx={{ textAlign: "center", mt: 3, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography variant="body2" color="text.secondary">
              Already registered?{" "}
              <Link href="/login" underline="hover" fontWeight={600} sx={{ color: "#00d4aa" }}>
                Sign In
              </Link>
            </Typography>
          </Box>


        </Box>
      </Box>
    </Box>
  );
}

export default ProviderSignup;
