import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  Edit2,
  Eye,
  Pill,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface Patient {
  id: string;
  name: string;
  date_of_birth: string;
  gender?: string | null;
  age_group: string;
  medical_history: string[];
  created_at: string;
}

interface PatientDetail extends Patient {
  medications: {
    id: string;
    drug_name: string;
    drug_id: string;
    dosage_level: string;
    dosage_amount: string;
    start_date: string;
    end_date: string | null;
    notes: string;
  }[];
}

interface PatientForm {
  name: string;
  dateOfBirth: string;
  gender: string;
  ageGroup: string;
  medicalHistory: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const emptyForm: PatientForm = {
  name: "",
  dateOfBirth: "",
  gender: "",
  ageGroup: "",
  medicalHistory: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function calculateAge(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

function toForm(patient: PatientDetail): PatientForm {
  return {
    name: patient.name,
    dateOfBirth: patient.date_of_birth ? patient.date_of_birth.split("T")[0] : "",
    gender: patient.gender || "",
    ageGroup: patient.age_group || "",
    medicalHistory: (patient.medical_history || []).join(", "),
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  };
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const limit = 20;

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String((page - 1) * limit),
      });
      if (search) params.set("search", search);
      const res = await fetch(`${API_URL}/api/patients?${params}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load patients");
      const json = await res.json();
      const data = json.data || {};
      setPatients(data.patients || []);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load patients.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  const viewPatient = async (id: string, edit = false) => {
    setLoadingDetail(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/patients/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load patient");
      const json = await res.json();
      const detail = json.data || null;
      setSelectedPatient(detail);
      setForm(toForm(detail));
      setIsEditing(edit);
      setIsCreating(false);
    } catch {
      setError("Failed to load patient details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const startCreate = () => {
    setForm(emptyForm);
    setIsCreating(true);
    setFormOpen(true);
    setError("");
  };

  const goBack = () => {
    setSelectedPatient(null);
    setForm(emptyForm);
    setIsEditing(false);
    setIsCreating(false);
    setLoadingDetail(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Patient name is required."); return; }
    if (!form.dateOfBirth) { setError("Date of birth is required."); return; }
    if (isCreating) {
      if (!form.email.trim() || !form.email.includes("@")) { setError("A valid email is required."); return; }
      if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    }

    setFormLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        ageGroup: form.ageGroup || undefined,
        medicalHistory: form.medicalHistory
          ? form.medicalHistory.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        ...(isCreating
          ? {
              email: form.email.trim(),
              phone: form.phone.trim() || undefined,
              password: form.password,
            }
          : {}),
      };

      const url = isCreating
        ? `${API_URL}/api/patients`
        : `${API_URL}/api/patients/${selectedPatient?.id}`;
      const method = isCreating ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Failed to save patient");
      }

      await res.json();

      setSuccess(isCreating ? "Patient created." : "Patient updated.");
      setTimeout(() => setSuccess(""), 3000);
      await fetchPatients();

      if (isCreating) {
        setFormOpen(false);
        setIsCreating(false);
        setForm(emptyForm);
      } else if (selectedPatient) {
        await viewPatient(selectedPatient.id, false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save patient.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${API_URL}/api/patients/${deleteId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete patient");
      setSuccess("Patient deleted.");
      setDeleteId(null);
      if (selectedPatient?.id === deleteId) {
        goBack();
      }
      await fetchPatients();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to delete patient.");
    }
  };

  if (selectedPatient) {
    const currentAge = calculateAge(form.dateOfBirth || selectedPatient?.date_of_birth);

    return (
      <Box>
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Snackbar
          open={!!error}
          autoHideDuration={5000}
          onClose={() => setError("")}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={() => setError("")} severity="error" variant="filled" sx={{ width: "100%" }}>
            {error}
          </Alert>
        </Snackbar>

        <Card sx={{ borderRadius: 4 }}>
          <Box
            sx={{
              p: { xs: 3, sm: 4 },
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            <Box>
              <Button
                variant="text"
                startIcon={<ArrowLeft size={16} />}
                onClick={goBack}
                sx={{ px: 0, mb: 1, color: "#2563eb" }}
              >
                Go back
              </Button>
              <Typography variant="h4" fontWeight={800}>
                {form.name || "Patient Record"}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Full patient form view with basic information and medications.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {!isEditing ? (
                <Button variant="outlined" startIcon={<Edit2 size={16} />} onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              ) : null}
              {selectedPatient ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Trash2 size={16} />}
                  onClick={() => setDeleteId(selectedPatient.id)}
                >
                  Delete
                </Button>
              ) : null}
              {isEditing ? (
                <>
                  <Button variant="text" startIcon={<X size={16} />} onClick={() => {
                    if (selectedPatient) {
                      setForm(toForm(selectedPatient));
                    }
                    setIsEditing(false);
                    setError("");
                  }}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save size={16} />}
                    onClick={handleSubmit}
                    disabled={formLoading}
                    sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
                  >
                    {formLoading ? <CircularProgress size={18} color="inherit" /> : "Save"}
                  </Button>
                </>
              ) : null}
            </Box>
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {loadingDetail ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Patient ID"
                      value={selectedPatient?.id || "Will be generated after create"}
                      disabled
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                      slotProps={{ inputLabel: { shrink: true } }}
                      required
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Age"
                      value={currentAge ?? "-"}
                      disabled
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      select
                      label="Age Group"
                      value={form.ageGroup}
                      onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
                      disabled={!isEditing}
                    >
                      <MenuItem value="">Auto-detect</MenuItem>
                      <MenuItem value="young">Young (0-17)</MenuItem>
                      <MenuItem value="middle">Middle (18-64)</MenuItem>
                      <MenuItem value="elderly">Elderly (65+)</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      select
                      label="Gender"
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      disabled={!isEditing}
                    >
                      <MenuItem value="">Not set</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="non_binary">Non-binary</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Medical History"
                      value={form.medicalHistory}
                      onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
                      placeholder="Comma-separated (e.g., Diabetes, Hypertension)"
                      disabled={!isEditing}
                    />
                  </Grid>
                </Grid>

                {selectedPatient ? (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 4, mb: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: "#eff6ff", display: "flex" }}>
                        <Pill size={18} color="#2563eb" />
                      </Box>
                      <Typography variant="h6" fontWeight={700}>
                        Medications ({selectedPatient.medications?.length || 0})
                      </Typography>
                    </Box>
                    {selectedPatient.medications && selectedPatient.medications.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Drug</TableCell>
                              <TableCell>Dosage</TableCell>
                              <TableCell>Start Date</TableCell>
                              <TableCell>End Date</TableCell>
                              <TableCell>Notes</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedPatient.medications.map((med) => (
                              <TableRow key={med.id}>
                                <TableCell><Typography fontWeight={600}>{med.drug_name}</Typography></TableCell>
                                <TableCell>{med.dosage_amount || med.dosage_level || "-"}</TableCell>
                                <TableCell>{med.start_date ? new Date(med.start_date).toLocaleDateString() : "-"}</TableCell>
                                <TableCell>{med.end_date ? new Date(med.end_date).toLocaleDateString() : "Ongoing"}</TableCell>
                                <TableCell>{med.notes || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Alert severity="info">No medications recorded.</Alert>
                    )}
                  </>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <Snackbar
          open={!!deleteId && !selectedPatient}
          autoHideDuration={1}
          onClose={() => setDeleteId(null)}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, p: { xs: 3, sm: 4 }, borderRadius: 4, background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #2563eb 100%)", color: "white", position: "relative", overflow: "hidden", display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
        <Box sx={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(96,165,250,0.1)" }} />
        <Box sx={{ position: "absolute", bottom: -60, right: 100, width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(96,165,250,0.06)" }} />
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Sparkles size={18} color="#60a5fa" />
            <Chip label="Patient Management" size="small" sx={{ bgcolor: "rgba(96,165,250,0.15)", color: "#93c5fd", fontWeight: 600, height: 24, fontSize: "0.7rem" }} />
          </Box>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>Patients</Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>Manage patient profiles and their medications</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={startCreate} sx={{ position: "relative", zIndex: 1, bgcolor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
          Add Patient
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setError("")} severity="error" variant="filled" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: 2 }}>
          <TextField
            fullWidth
            placeholder="Search patients by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#f8fafc" } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} color="#94a3b8" /></InputAdornment> } }}
          />
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>DOB / Age</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ p: 2, borderRadius: 3, bgcolor: "#f8fafc" }}><Users size={40} color="#94a3b8" /></Box>
                      <Typography color="text.secondary" fontWeight={500}>
                        {search ? "No patients match your search." : "No patients yet. Add your first patient."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: "#eff6ff", color: "#2563eb", fontSize: 13, fontWeight: 700 }}>
                          {patient.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                        </Avatar>
                        <Typography fontWeight={600}>{patient.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : "-"}
                        {patient.date_of_birth ? ` / ${calculateAge(patient.date_of_birth) ?? "-"}` : ""}
                      </Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{patient.gender || "-"}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{new Date(patient.created_at).toLocaleDateString()}</Typography></TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                        <IconButton size="small" onClick={() => viewPatient(patient.id, false)} title="View" sx={{ color: "#2563eb" }}><Eye size={16} /></IconButton>
                        <IconButton size="small" onClick={() => viewPatient(patient.id, true)} title="Edit" sx={{ color: "#64748b" }}><Edit2 size={16} /></IconButton>
                        <IconButton size="small" onClick={() => setDeleteId(patient.id)} title="Delete" sx={{ color: "#dc2626" }}><Trash2 size={16} /></IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {total > limit && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Pagination count={Math.ceil(total / limit)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        )}
      </Card>

      <Dialog open={formOpen} onClose={() => { setFormOpen(false); setIsCreating(false); setForm(emptyForm); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Patient</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Age Group" value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}>
                <MenuItem value="">Auto-detect</MenuItem>
                <MenuItem value="young">Young (0-17)</MenuItem>
                <MenuItem value="middle">Middle (18-64)</MenuItem>
                <MenuItem value="elderly">Elderly (65+)</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <MenuItem value="">Not set</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="non_binary">Non-binary</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Medical History" value={form.medicalHistory} onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })} placeholder="Comma-separated (e.g., Diabetes, Hypertension)" multiline rows={2} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Patient Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required helperText="Minimum 8 characters" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => { setFormOpen(false); setIsCreating(false); setForm(emptyForm); }} sx={{ color: "text.secondary" }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={formLoading} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
            {formLoading ? <CircularProgress size={20} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="warning"
          variant="filled"
          action={
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button color="inherit" size="small" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button color="inherit" size="small" onClick={handleDelete}>Delete</Button>
            </Box>
          }
        >
          Delete this patient record?
        </Alert>
      </Snackbar>
    </Box>
  );
}
