import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, CircularProgress, Alert, MenuItem, Pagination, Avatar,
} from "@mui/material";
import { Search, Plus, Edit2, Trash2, Eye, Pill, X, Sparkles, Users } from "lucide-react";

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

const emptyForm: PatientForm = { name: "", dateOfBirth: "", ageGroup: "", medicalHistory: "" };

const ageGroupLabels: Record<string, string> = {
  young: "Young (0-17)",
  middle: "Middle (18-64)",
  elderly: "Elderly (65+)",
};

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
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

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String((page - 1) * limit) });
      if (search) params.set("search", search);
      const res = await fetch(`${API_URL}/api/patients?${params}`, { headers: getAuthHeaders() });
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

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Patient name is required."); return; }
    setFormLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        dateOfBirth: form.dateOfBirth || undefined,
        ageGroup: form.ageGroup || undefined,
        medicalHistory: form.medicalHistory ? form.medicalHistory.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      };
      const url = editingId ? `${API_URL}/api/patients/${editingId}` : `${API_URL}/api/patients`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(body) });
      if (!res.ok) { const errJson = await res.json().catch(() => ({})); throw new Error(errJson.error?.message || "Failed to save patient"); }
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
      const res = await fetch(`${API_URL}/api/patients/${deleteId}`, { method: "DELETE", headers: getAuthHeaders() });
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
      const res = await fetch(`${API_URL}/api/patients/${id}`, { headers: getAuthHeaders() });
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
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => { setEditingId(null); setForm(emptyForm); setFormOpen(true); }} sx={{ position: "relative", zIndex: 1, bgcolor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
          Add Patient
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

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
                <TableCell>Date of Birth</TableCell>
                <TableCell>Age Group</TableCell>
                <TableCell>Medical History</TableCell>
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
                    <TableCell><Typography variant="body2" color="text.secondary">{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : "-"}</Typography></TableCell>
                    <TableCell>
                      {patient.age_group ? (
                        <Chip label={ageGroupLabels[patient.age_group] || patient.age_group} size="small" sx={{ fontWeight: 600, fontSize: "0.7rem", bgcolor: "#eff6ff", color: "#2563eb", border: "1px solid #dbeafe" }} />
                      ) : <Typography variant="body2" color="text.secondary">-</Typography>}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {(patient.medical_history || []).slice(0, 3).map((item, i) => (
                          <Chip key={i} label={item} size="small" sx={{ fontWeight: 500, fontSize: "0.7rem", bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }} />
                        ))}
                        {(patient.medical_history || []).length > 3 && (
                          <Chip label={`+${patient.medical_history.length - 3}`} size="small" sx={{ fontWeight: 700, fontSize: "0.7rem", bgcolor: "#eff6ff", color: "#2563eb" }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{new Date(patient.created_at).toLocaleDateString()}</Typography></TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                        <IconButton size="small" onClick={() => viewPatient(patient.id)} title="View" sx={{ color: "#2563eb" }}><Eye size={16} /></IconButton>
                        <IconButton size="small" onClick={() => handleEdit(patient)} title="Edit" sx={{ color: "#64748b" }}><Edit2 size={16} /></IconButton>
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

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{editingId ? "Edit Patient" : "Add New Patient"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Age Group" select value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}>
                <MenuItem value="">Auto-detect</MenuItem>
                <MenuItem value="young">Young (0-17)</MenuItem>
                <MenuItem value="middle">Middle (18-64)</MenuItem>
                <MenuItem value="elderly">Elderly (65+)</MenuItem>
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Medical History" value={form.medicalHistory} onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })} placeholder="Comma-separated (e.g., Diabetes, Hypertension)" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setFormOpen(false)} sx={{ color: "text.secondary" }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={formLoading} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
            {formLoading ? <CircularProgress size={20} /> : editingId ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Patient Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700 }}>
          Patient Details
          <IconButton onClick={() => setDetailOpen(false)} size="small"><X size={18} /></IconButton>
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
          ) : selectedPatient ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { label: "Name", value: selectedPatient.name },
                  { label: "Date of Birth", value: selectedPatient.date_of_birth ? new Date(selectedPatient.date_of_birth).toLocaleDateString() : "N/A" },
                  { label: "Age Group", value: selectedPatient.age_group ? ageGroupLabels[selectedPatient.age_group] || selectedPatient.age_group : "N/A" },
                ].map((item, i) => (
                  <Grid size={{ xs: 12, sm: 4 }} key={i}>
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.65rem" }}>{item.label}</Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>{item.value}</Typography>
                    </Box>
                  </Grid>
                ))}
                <Grid size={12}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.65rem", mb: 1, display: "block" }}>Medical History</Typography>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      {(selectedPatient.medical_history || []).length > 0
                        ? selectedPatient.medical_history.map((item, i) => (
                            <Chip key={i} label={item} size="small" sx={{ fontWeight: 500, bgcolor: "white", border: "1px solid #e2e8f0" }} />
                          ))
                        : <Typography variant="body2" color="text.secondary">None recorded</Typography>}
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: "#eff6ff", display: "flex" }}><Pill size={18} color="#2563eb" /></Box>
                <Typography variant="h6" fontWeight={700}>Medications ({selectedPatient.medications?.length || 0})</Typography>
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
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Patient</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this patient? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ color: "text.secondary" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
