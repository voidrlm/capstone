import { useState, useCallback } from "react";
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
  Activity,
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

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      {/* Left panel - branding */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: "45%",
          background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 6,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", bgcolor: "rgba(96,165,250,0.08)" }} />
        <Box sx={{ position: "absolute", bottom: -120, left: -60, width: 400, height: 400, borderRadius: "50%", bgcolor: "rgba(96,165,250,0.05)" }} />
        <Box sx={{ position: "absolute", top: "40%", right: "10%", width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(96,165,250,0.06)" }} />

        <Box sx={{ position: "relative", zIndex: 1, maxWidth: 440, textAlign: "center" }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 4,
              bgcolor: "rgba(96,165,250,0.15)",
              mb: 4,
              border: "1px solid rgba(96,165,250,0.2)",
            }}
          >
            <Heart size={36} color="#60a5fa" />
          </Box>
          <Typography variant="h3" sx={{ color: "white", fontWeight: 800, mb: 2 }}>
            Join MediRisk
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)", mb: 6, lineHeight: 1.7 }}>
            Create your free patient account to track medications, understand
            risks, and take control of your health journey.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { icon: Shield, text: "Track all your medications in one place" },
              { icon: Activity, text: "Receive personalized risk assessments" },
              { icon: Heart, text: "Understand potential drug interactions" },
              { icon: CheckCircle2, text: "Access your health insights anytime" },
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
                  <FeatIcon size={20} color="#60a5fa" />
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", textAlign: "left" }}>
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
              color: "rgba(255,255,255,0.5)",
              mt: 5,
              transition: "color 0.2s",
              "&:hover": { color: "rgba(255,255,255,0.8)" },
            }}
          >
            <ArrowLeft size={18} />
            <span>Back to Sign In</span>
          </Link>
        </Box>
      </Box>

      {/* Right panel - form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, sm: 6 },
          bgcolor: "#f8fafc",
          overflow: "auto",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 480 }}>
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1, mb: 4 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: "#2563eb", display: "flex" }}>
              <Shield size={20} color="white" />
            </Box>
            <Typography variant="h6" fontWeight={800} color="text.primary">
              MediRisk
            </Typography>
          </Box>

          <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mb: 0.5 }}>
            Create Patient Account
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Fill in your details to get started
          </Typography>

          <Stepper
            activeStep={activeStep}
            sx={{
              mb: 3,
              "& .MuiStepLabel-label": { fontWeight: 600, fontSize: "0.8125rem" },
              "& .MuiStepIcon-root.Mui-active": { color: "#2563eb" },
              "& .MuiStepIcon-root.Mui-completed": { color: "#2563eb" },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2.5 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            {activeStep === 0 ? (
              <Stack spacing={2.5}>
                {/* Upload Medical Report (Optional) */}
                {!uploadedFile ? (
                  <Box
                    {...getRootProps()}
                    sx={{
                      border: "2px dashed",
                      borderColor: isDragActive ? "#2563eb" : "#e2e8f0",
                      borderRadius: 3,
                      p: 2.5,
                      textAlign: "center",
                      cursor: isParsing ? "wait" : "pointer",
                      bgcolor: isDragActive ? "#eff6ff" : "#f8fafc",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#2563eb",
                        bgcolor: "#eff6ff",
                      },
                    }}
                  >
                    <input {...getInputProps()} />
                    {isParsing ? (
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                        <CircularProgress size={28} sx={{ color: "#2563eb" }} />
                        <Typography variant="body2" color="text.secondary">
                          Parsing medical report...
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                        <Upload size={24} color="#94a3b8" />
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
                      bgcolor: "#f0fdf4",
                      borderRadius: 3,
                      border: "1px solid #bbf7d0",
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
                      <X size={18} color="#64748b" />
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    or fill in manually
                  </Typography>
                </Divider>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
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
                          <User size={18} color="#94a3b8" />
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
                        <Mail size={18} color="#94a3b8" />
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
                        <Phone size={18} color="#94a3b8" />
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
                        <Calendar size={18} color="#94a3b8" />
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
                  sx={{ mt: 1, bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
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
                    sx={{ borderColor: "#e2e8f0", color: "text.primary", "&:hover": { borderColor: "#cbd5e1", bgcolor: "white" } }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isLoading}
                    endIcon={!isLoading && <ChevronRight size={18} />}
                    sx={{ flex: 1, bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
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
              borderColor: "#e2e8f0",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Already have an account?{" "}
              <Link href="/login" underline="hover" fontWeight={600}>
                Sign In
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default PatientSignup;
