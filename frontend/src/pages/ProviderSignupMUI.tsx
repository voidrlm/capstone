import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Checkbox,
  FormControlLabel,
  Link,
  InputAdornment,
  Chip,
  Stack,
  MenuItem,
  Paper,
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
} from "lucide-react";

function ProviderSignup() {
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
    if (!formData.organizationName) {
      setError("Organization name is required");
      return false;
    }
    if (!formData.organizationType) {
      setError("Please select organization type");
      return false;
    }
    if (!formData.address || !formData.city || !formData.state) {
      setError("Please complete the organization address");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.adminFirstName || !formData.adminLastName) {
      setError("Please enter the administrator's full name");
      return false;
    }
    if (!formData.adminEmail || !formData.adminEmail.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.adminPassword || formData.adminPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!agreedToTerms || !agreedToHipaa) {
      setError("Please agree to all terms and conditions");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (activeStep === 0 && validateStep1()) {
      setActiveStep(1);
    } else if (activeStep === 1 && validateStep2()) {
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setIsLoading(true);
    try {
      console.log("Organization registration:", formData);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      window.location.href = "/";
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    "AI-powered drug risk assessment for all patients",
    "Manage your entire healthcare team from one dashboard",
    "Add doctors, nurses, and staff with role-based access",
    "Real-time drug interaction alerts",
    "Comprehensive analytics and reporting",
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid",
          borderColor: "divider",
          py: 2,
          px: 3,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="lg">
          <Link
            href="/"
            underline="none"
            sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                bgcolor: "secondary.main",
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
            >
              <Shield size={24} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                MediRisk
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Drug Safety Platform
              </Typography>
            </Box>
          </Link>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 6,
          }}
        >
          {/* Left Side - Benefits */}
          <Box sx={{ py: 2 }}>
            <Chip
              icon={<Building2 size={16} />}
              label="Healthcare Organization"
              color="secondary"
              sx={{ fontWeight: 600, mb: 3 }}
            />
            <Typography
              variant="h3"
              fontWeight={800}
              color="text.primary"
              gutterBottom
            >
              Register Your Organization
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, lineHeight: 1.7 }}
            >
              Create an organization account to provide your healthcare team
              with powerful drug safety tools and risk assessment capabilities.
            </Typography>

            <Stack spacing={2} sx={{ mb: 4 }}>
              {benefits.map((benefit, index) => (
                <Box
                  key={index}
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                >
                  <CheckCircle2
                    size={20}
                    color="#10b981"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {benefit}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: "rgba(16, 185, 129, 0.08)",
                border: "1px solid",
                borderColor: "secondary.light",
                borderRadius: 3,
                display: "flex",
                gap: 2,
                mb: 4,
              }}
            >
              <Stethoscope
                size={20}
                color="#10b981"
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <Typography variant="body2" color="secondary.dark">
                As the organization admin, you'll be able to invite doctors,
                nurses, and other staff members to join your organization.
              </Typography>
            </Paper>

            <Link
              href="/"
              underline="hover"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                color: "text.secondary",
              }}
            >
              <ArrowLeft size={18} />
              <span>Back to Sign In</span>
            </Link>
          </Box>

          {/* Right Side - Form */}
          <Card
            elevation={0}
            sx={{ boxShadow: "0 25px 60px rgba(0, 0, 0, 0.1)" }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: "rgba(16, 185, 129, 0.15)",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                    color: "secondary.main",
                  }}
                >
                  <Building2 size={24} />
                </Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Organization Registration
                </Typography>
              </Box>

              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

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
                            <Building2 size={18} color="#9ca3af" />
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
                            <MapPin size={18} color="#9ca3af" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr",
                        gap: 2,
                      }}
                    >
                      <TextField
                        label="City"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        fullWidth
                      />
                      <TextField
                        label="State"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        fullWidth
                      />
                      <TextField
                        label="ZIP"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        required
                        fullWidth
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 2,
                      }}
                    >
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
                              <Phone size={18} color="#9ca3af" />
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
                              <Globe size={18} color="#9ca3af" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    <Button
                      variant="contained"
                      color="secondary"
                      size="large"
                      onClick={handleNext}
                      endIcon={<ChevronRight size={18} />}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      Continue
                    </Button>
                  </Stack>
                )}

                {activeStep === 1 && (
                  <Stack spacing={2.5}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                      sx={{ mb: 1 }}
                    >
                      Enter the details for the organization administrator. This
                      person will have full access to manage users and settings.
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 2,
                      }}
                    >
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
                              <User size={18} color="#9ca3af" />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        label="Last Name"
                        name="adminLastName"
                        value={formData.adminLastName}
                        onChange={handleChange}
                        required
                        fullWidth
                      />
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
                            <Mail size={18} color="#9ca3af" />
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
                            <Phone size={18} color="#9ca3af" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={handleBack}
                        startIcon={<ArrowLeft size={18} />}
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        onClick={handleNext}
                        endIcon={<ChevronRight size={18} />}
                        sx={{ flex: 1 }}
                      >
                        Continue
                      </Button>
                    </Box>
                  </Stack>
                )}

                {activeStep === 2 && (
                  <Stack spacing={2.5}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                      sx={{ mb: 1 }}
                    >
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
                            <KeyRound size={18} color="#9ca3af" />
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
                            <KeyRound size={18} color="#9ca3af" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          color="secondary"
                        />
                      }
                      label={
                        <Typography variant="body2" color="text.secondary">
                          I agree to the{" "}
                          <Link href="#terms" underline="hover">
                            Terms of Service
                          </Link>
                          ,{" "}
                          <Link href="#privacy" underline="hover">
                            Privacy Policy
                          </Link>
                          , and{" "}
                          <Link href="#baa" underline="hover">
                            Business Associate Agreement
                          </Link>
                        </Typography>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={agreedToHipaa}
                          onChange={(e) => setAgreedToHipaa(e.target.checked)}
                          color="secondary"
                        />
                      }
                      label={
                        <Typography variant="body2" color="text.secondary">
                          I confirm that our organization will comply with HIPAA
                          regulations when using this platform
                        </Typography>
                      }
                    />

                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={handleBack}
                        startIcon={<ArrowLeft size={18} />}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="secondary"
                        size="large"
                        disabled={isLoading}
                        endIcon={<ChevronRight size={18} />}
                        sx={{ flex: 1 }}
                      >
                        {isLoading ? "Registering..." : "Register Organization"}
                      </Button>
                    </Box>
                  </Stack>
                )}
              </form>

              <Box
                sx={{
                  textAlign: "center",
                  mt: 3,
                  pt: 3,
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Already registered?{" "}
                  <Link
                    href="/"
                    underline="hover"
                    fontWeight={600}
                    color="secondary.main"
                  >
                    Sign In
                  </Link>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}

export default ProviderSignup;
