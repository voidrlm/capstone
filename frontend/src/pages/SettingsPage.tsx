import { useEffect, useMemo, useState } from "react";
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Grid, TextField, Typography } from "@mui/material";
import { Save, User } from "lucide-react";
import { fetchCurrentPatientDetail, type PatientDetailApi } from "../lib/patientApi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type PatientSettingsForm = {
  fullName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  ageGroup: string;
  medicalHistory: string;
};

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function parseMedicalHistory(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toFormState(user: AuthUser | null, patient: PatientDetailApi | null): PatientSettingsForm {
  return {
    fullName: patient?.name || user?.name || "",
    email: user?.email || "",
    dateOfBirth: patient?.date_of_birth || "",
    gender: patient?.gender || "",
    ageGroup: patient?.age_group || "",
    medicalHistory: patient?.medical_history?.join("\n") || "",
  };
}

export default function SettingsPage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [patient, setPatient] = useState<PatientDetailApi | null>(null);
  const [form, setForm] = useState<PatientSettingsForm>({
    fullName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    ageGroup: "",
    medicalHistory: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const meRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: getAuthHeaders(),
        });

        if (!meRes.ok) {
          throw new Error("Failed to load account");
        }

        const meJson = await meRes.json();
        const me = meJson.data?.user as AuthUser;

        let patientDetail: PatientDetailApi | null = null;
        if (me?.role === "patient") {
          patientDetail = await fetchCurrentPatientDetail();
        }

        if (!active) {
          return;
        }

        setAuthUser(me);
        setPatient(patientDetail);
        setForm(toFormState(me, patientDetail));
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load settings");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const initials = useMemo(() => {
    const source = form.fullName || authUser?.name || "User";
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [authUser?.name, form.fullName]);

  async function handleSave() {
    if (!patient) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.fullName.trim(),
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        ageGroup: form.ageGroup || null,
        medicalHistory: parseMedicalHistory(form.medicalHistory),
      };

      const response = await fetch(`${API_URL}/api/patients/${patient.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error?.message || "Failed to update profile");
      }

      const json = await response.json();
      const updatedPatient = json.data as PatientDetailApi;
      setPatient(updatedPatient);
      setForm(toFormState(authUser, updatedPatient));

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          localStorage.setItem("user", JSON.stringify({ ...parsed, name: payload.name }));
        } catch {
          // Ignore malformed local storage user payload.
        }
      }

      setSuccess("Profile updated.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !authUser) {
    return <Alert severity="error">{error}</Alert>;
  }

  const isPatient = authUser?.role === "patient";

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Account Settings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {isPatient ? "Review and update your patient profile information." : "Review your account details."}
        </Typography>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}
      {success ? <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert> : null}

      <Card sx={{ maxWidth: 980 }}>
        <Box
          sx={{
            p: 3,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: "#eff6ff", display: "flex" }}>
              <User size={20} color="#2563eb" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>Profile</Typography>
              <Typography variant="body2" color="text.secondary">
                {isPatient ? "Live patient record and account information" : "Live account information"}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={authUser?.role === "org_admin" ? "Organization Admin" : authUser?.role || "User"}
            sx={{ fontWeight: 700, textTransform: "capitalize" }}
          />
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: "#2563eb", fontSize: 28, fontWeight: 700 }}>
              {initials || "U"}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={800}>{form.fullName || authUser?.name || "Account"}</Typography>
              <Typography variant="body2" color="text.secondary">{form.email || authUser?.email}</Typography>
            </Box>
          </Box>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Full Name"
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                fullWidth
                disabled={!isPatient}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Email Address"
                value={form.email}
                fullWidth
                disabled
                helperText="Email changes are not supported here."
              />
            </Grid>

            {isPatient ? (
              <>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Date of Birth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Gender"
                    value={form.gender}
                    onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Age Group"
                    value={form.ageGroup}
                    onChange={(event) => setForm((current) => ({ ...current, ageGroup: event.target.value }))}
                    fullWidth
                    helperText="young, middle, or elderly"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Medical History"
                    value={form.medicalHistory}
                    onChange={(event) => setForm((current) => ({ ...current, medicalHistory: event.target.value }))}
                    fullWidth
                    multiline
                    minRows={5}
                    helperText="Enter one item per line."
                  />
                </Grid>
              </>
            ) : null}
          </Grid>

          {isPatient ? (
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                startIcon={<Save size={18} />}
                onClick={() => void handleSave()}
                disabled={saving}
                sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          ) : null}
        </CardContent>
      </Card>
    </Box>
  );
}
