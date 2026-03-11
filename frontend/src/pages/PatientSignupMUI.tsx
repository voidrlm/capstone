import { useState, useCallback } from "react";
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
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Shield,
  Heart,
  Mail,
  KeyRound,
  User,
  Phone,
  Calendar,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Upload,
  FileText,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";

function PatientSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const steps = ["Personal Info", "Create Password"];

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file");
        return;
      }

      setUploadedFile(file);
      setIsParsing(true);
      setError("");

      try {
        const formPayload = new FormData();
        formPayload.append("file", file);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/auth/parse-medical-report`,
          { method: "POST", body: formPayload },
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
          setError(data?.error?.message || "Failed to parse medical report");
          setUploadedFile(null);
          return;
        }

        const parsed = data.data;
        setFormData((prev) => ({
          ...prev,
          firstName: parsed.firstName || prev.firstName,
          lastName: parsed.lastName || prev.lastName,
          dateOfBirth: parsed.dateOfBirth || prev.dateOfBirth,
        }));
        setSuccess("Medical report parsed — fields populated!");
        setTimeout(() => setSuccess(""), 3000);
      } catch {
        setError("Unable to connect to server. Please try again.");
        setUploadedFile(null);
      } finally {
        setIsParsing(false);
      }
    },
    [],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: isParsing,
  });

  const clearUpload = () => {
    setUploadedFile(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName) {
      setError("Please enter your full name");
      return false;
    }
    if (!formData.email || !formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.dateOfBirth) {
      setError("Please enter your date of birth");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.password || formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setActiveStep(1);
    }
  };

  const handleBack = () => {
    setActiveStep(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/auth/register/patient`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            dateOfBirth: formData.dateOfBirth,
            password: formData.password,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        setError(data?.error?.message || "Registration failed. Please try again.");
        return;
      }

      setSuccess("Account created successfully!");
      setTimeout(() => navigate("/login"), 1500);
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    "Track all your medications in one place",
    "Receive personalized risk assessments",
    "Understand potential drug interactions",
    "Access your health insights anytime",
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
                bgcolor: "primary.main",
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
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
              icon={<Heart size={16} />}
              label="Patient Account"
              sx={{
                bgcolor: "primary.light",
                color: "primary.dark",
                fontWeight: 600,
                mb: 3,
                "& .MuiChip-icon": { color: "primary.dark" },
              }}
            />
            <Typography
              variant="h3"
              fontWeight={800}
              color="text.primary"
              gutterBottom
            >
              Join MediRisk Today
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, lineHeight: 1.7 }}
            >
              Create your free patient account to track medications, understand
              risks, and take control of your health journey.
            </Typography>

            <Stack spacing={2} sx={{ mb: 4 }}>
              {benefits.map((benefit, index) => (
                <Box
                  key={index}
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                >
                  <CheckCircle2
                    size={20}
                    color="#3b82f6"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {benefit}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Link
              href="/login"
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
                    bgcolor: "primary.light",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                    color: "primary.main",
                  }}
                >
                  <Heart size={24} />
                </Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Create Patient Account
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

              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                {activeStep === 0 ? (
                  <Stack spacing={2.5}>
                    {/* Upload Medical Report (Optional) */}
                    {!uploadedFile ? (
                      <Box
                        {...getRootProps()}
                        sx={{
                          border: "2px dashed",
                          borderColor: isDragActive ? "primary.main" : "divider",
                          borderRadius: 3,
                          p: 2.5,
                          textAlign: "center",
                          cursor: isParsing ? "wait" : "pointer",
                          bgcolor: isDragActive
                            ? "primary.light"
                            : "grey.50",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "primary.main",
                            bgcolor: "primary.light",
                          },
                        }}
                      >
                        <input {...getInputProps()} />
                        {isParsing ? (
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                            <CircularProgress size={28} />
                            <Typography variant="body2" color="text.secondary">
                              Parsing medical report...
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                            <Upload size={24} color="#9ca3af" />
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                              Upload Medical Report{" "}
                              <Typography component="span" variant="body2" color="text.secondary">
                                (Optional)
                              </Typography>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Drop a PDF here or click to browse — auto-fills your info
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: 1.5,
                          bgcolor: "success.light",
                          borderRadius: 2,
                        }}
                      >
                        <FileText size={20} color="#16a34a" />
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                          {uploadedFile.name}
                        </Typography>
                        <Box
                          onClick={clearUpload}
                          sx={{ cursor: "pointer", display: "flex", "&:hover": { opacity: 0.7 } }}
                        >
                          <X size={18} color="#6b7280" />
                        </Box>
                      </Box>
                    )}

                    <Divider sx={{ my: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        or fill in manually
                      </Typography>
                    </Divider>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 2,
                      }}
                    >
                      <TextField
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
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
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        fullWidth
                      />
                    </Box>

                    <TextField
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
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
                      name="phone"
                      type="tel"
                      value={formData.phone}
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

                    <TextField
                      label="Date of Birth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      required
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Calendar size={18} color="#9ca3af" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleNext}
                      endIcon={<ChevronRight size={18} />}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      Continue
                    </Button>
                  </Stack>
                ) : (
                  <Stack spacing={2.5}>
                    <TextField
                      label="Password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      fullWidth
                      helperText="At least 8 characters"
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
                        />
                      }
                      label={
                        <Typography variant="body2" color="text.secondary">
                          I agree to the{" "}
                          <Link href="#terms" underline="hover">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link href="#privacy" underline="hover">
                            Privacy Policy
                          </Link>
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
                        size="large"
                        disabled={isLoading}
                        endIcon={<ChevronRight size={18} />}
                        sx={{ flex: 1 }}
                      >
                        {isLoading ? "Creating Account..." : "Create Account"}
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
                  Already have an account?{" "}
                  <Link href="/login" underline="hover" fontWeight={600}>
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

export default PatientSignup;
