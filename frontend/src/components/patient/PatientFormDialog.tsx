import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import type { PatientForm } from "../../types/patient";

interface Props {
  open: boolean;
  isCreating: boolean;
  form: PatientForm;
  setForm: (form: PatientForm) => void;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function PatientFormDialog({ open, isCreating, form, setForm, loading, onClose, onSubmit }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4, overflow: "hidden" } } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>{isCreating ? "Add New Patient" : "Edit Patient"}</DialogTitle>
      <DialogContent sx={{ position: "relative", pointerEvents: "auto" }}>
        <Grid container spacing={2} sx={{ mt: 0.5, position: "relative", zIndex: 1 }}>
          <Grid size={12}>
            <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              label="Date of Birth"
              value={form.dateOfBirth ? dayjs(form.dateOfBirth) : null}
              onChange={(newValue) => setForm({ ...form, dateOfBirth: newValue ? newValue.format("YYYY-MM-DD") : "" })}
              format="MM/DD/YYYY"
              slotProps={{
                textField: { fullWidth: true, size: "small" },
                popper: { sx: { "& .MuiIconButton-root": { color: "#333" } } },
              }}
            />
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
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Patient Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Grid>
          {isCreating ? (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required helperText="Minimum 8 characters" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
              </Grid>
            </>
          ) : null}
        </Grid>
        {isCreating ? (
          <Alert severity="info" sx={{ mt: 3 }}>
            Create the patient first, then add visits, prescriptions, medications, labs, diagnoses, and allergies from the patient record page.
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ color: "text.secondary" }}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit} disabled={loading} color="primary">
          {loading ? <CircularProgress size={20} /> : isCreating ? "Create" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
