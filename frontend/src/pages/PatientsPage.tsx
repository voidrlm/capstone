import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Alert,
  MenuItem,
  Pagination,
} from "@mui/material";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  User,
  Pill,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface Patient {
  id: string;
  name: string;
  date_of_birth: string;
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
  ageGroup: string;
  medicalHistory: string;
}

const emptyForm: PatientForm = {
  name: "",
  dateOfBirth: "",
  ageGroup: "",
  medicalHistory: "",
};

const ageGroupLabels: Record<string, string> = {
  young: "Young (0-17)",
  middle: "Middle (18-64)",
  elderly: "Elderly (65+)",
};

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
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
  const limit = 20;

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    fetchPatients();
  }, [fetchPatients]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Patient name is required.");
      return;
    }
    setFormLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        dateOfBirth: form.dateOfBirth || undefined,
        ageGroup: form.ageGroup || undefined,
        medicalHistory: form.medicalHistory
          ? form.medicalHistory.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      };

      const url = editingId
        ? `${API_URL}/api/patients/${editingId}`
        : `${API_URL}/api/patients`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Failed to save patient");
      }

      setSuccess(editingId ? "Patient updated." : "Patient created.");
      setFormOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchPatients();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save patient.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingId(patient.id);
    setForm({
      name: patient.name,
      dateOfBirth: patient.date_of_birth ? patient.date_of_birth.split("T")[0] : "",
      ageGroup: patient.age_group || "",
      medicalHistory: (patient.medical_history || []).join(", "),
    });
    setFormOpen(true);
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
      fetchPatients();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to delete patient.");
    }
  };

  const viewPatient = async (id: string) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`${API_URL}/api/patients/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load patient");
      const json = await res.json();
      setSelectedPatient(json.data || null);
    } catch {
      setError("Failed to load patient details.");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Patients
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage patient profiles and their medications
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => {
          setEditingId(null);
          setForm(emptyForm);
          setFormOpen(true);
        }}>
          Add Patient
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <TextField
            fullWidth
            placeholder="Search patients by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Date of Birth</TableCell>
                <TableCell>Age Group</TableCell>
                <TableCell>Medical History</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                      <User size={40} color="#94a3b8" />
                      <Typography color="text.secondary">
                        {search ? "No patients match your search." : "No patients yet. Add your first patient."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{patient.name}</Typography>
                    </TableCell>
                    <TableCell>
                      {patient.date_of_birth
                        ? new Date(patient.date_of_birth).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {patient.age_group ? (
                        <Chip label={ageGroupLabels[patient.age_group] || patient.age_group} size="small" variant="outlined" />
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {(patient.medical_history || []).slice(0, 3).map((item, i) => (
                          <Chip key={i} label={item} size="small" variant="outlined" />
                        ))}
                        {(patient.medical_history || []).length > 3 && (
                          <Chip label={`+${patient.medical_history.length - 3}`} size="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(patient.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => viewPatient(patient.id)} title="View">
                        <Eye size={16} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleEdit(patient)} title="Edit">
                        <Edit2 size={16} />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeleteId(patient.id)} title="Delete" color="error">
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {total > limit && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <Pagination
              count={Math.ceil(total / limit)}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
            />
          </Box>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Patient" : "Add New Patient"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Age Group"
                select
                value={form.ageGroup}
                onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
              >
                <MenuItem value="">Auto-detect</MenuItem>
                <MenuItem value="young">Young (0-17)</MenuItem>
                <MenuItem value="middle">Middle (18-64)</MenuItem>
                <MenuItem value="elderly">Elderly (65+)</MenuItem>
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Medical History"
                value={form.medicalHistory}
                onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
                placeholder="Comma-separated (e.g., Diabetes, Hypertension)"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={formLoading}>
            {formLoading ? <CircularProgress size={20} /> : editingId ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Patient Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Patient Details
            <IconButton onClick={() => setDetailOpen(false)} size="small">
              <X size={18} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : selectedPatient ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography fontWeight={600}>{selectedPatient.name}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                  <Typography fontWeight={600}>
                    {selectedPatient.date_of_birth
                      ? new Date(selectedPatient.date_of_birth).toLocaleDateString()
                      : "N/A"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Age Group</Typography>
                  <Typography fontWeight={600}>
                    {selectedPatient.age_group
                      ? ageGroupLabels[selectedPatient.age_group] || selectedPatient.age_group
                      : "N/A"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Medical History</Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {(selectedPatient.medical_history || []).length > 0
                      ? selectedPatient.medical_history.map((item, i) => (
                          <Chip key={i} label={item} size="small" variant="outlined" />
                        ))
                      : <Typography>None recorded</Typography>}
                  </Box>
                </Grid>
              </Grid>

              {/* Medications */}
              <Typography variant="h6" fontWeight={600} mb={2}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Pill size={20} />
                  Medications ({selectedPatient.medications?.length || 0})
                </Box>
              </Typography>
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
                          <TableCell>
                            <Typography fontWeight={600}>{med.drug_name}</Typography>
                          </TableCell>
                          <TableCell>
                            {med.dosage_amount || med.dosage_level || "-"}
                          </TableCell>
                          <TableCell>
                            {med.start_date ? new Date(med.start_date).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>
                            {med.end_date ? new Date(med.end_date).toLocaleDateString() : "Ongoing"}
                          </TableCell>
                          <TableCell>{med.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No medications recorded.</Alert>
              )}
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Patient</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this patient? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
