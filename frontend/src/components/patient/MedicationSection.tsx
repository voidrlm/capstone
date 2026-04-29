import { type Dispatch, type SetStateAction } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { AlertTriangle, Edit2, Info, Search, Shield, Trash2, X } from "lucide-react";
import { PatientRecordSection } from "./PatientRecordSection";
import type { PatientDetail, DrugSuggestion, MedicationInteractionResult, MedicationDialogForm } from "../../types/patient";

// Matches DrugSearchPage riskColors exactly
const riskColors = {
  high:   { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  medium: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  low:    { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
};

interface MedicationSectionProps {
  selectedPatient: PatientDetail;
  medicationDialogOpen: boolean;
  medicationForm: MedicationDialogForm;
  medicationSearch: string;
  medicationSuggestions: DrugSuggestion[];
  medicationInteractions: MedicationInteractionResult[];
  medicationInteractionLoading: boolean;
  medicationLoading: boolean;
  allMedicationInteractions: MedicationInteractionResult[];
  allInteractionsLoading: boolean;
  openMedicationDialog: (medication?: PatientDetail["medications"][number]) => void;
  closeMedicationDialog: () => void;
  handleMedicationInteractionCheck: () => Promise<void>;
  handleMedicationSubmit: () => Promise<void>;
  setMedicationForm: Dispatch<SetStateAction<MedicationDialogForm>>;
  setMedicationSearch: Dispatch<SetStateAction<string>>;
  setMedicationSuggestions: Dispatch<SetStateAction<DrugSuggestion[]>>;
  handleMedicationDelete: (medicationId: string) => Promise<void>;
}

export function MedicationSection({
  selectedPatient,
  medicationDialogOpen,
  medicationForm,
  medicationSearch,
  medicationSuggestions,
  medicationLoading,
  allMedicationInteractions,
  allInteractionsLoading,
  openMedicationDialog,
  closeMedicationDialog,
  handleMedicationSubmit,
  setMedicationForm,
  setMedicationSearch,
  setMedicationSuggestions,
  handleMedicationDelete,
}: MedicationSectionProps) {
  const hasMeds = selectedPatient.medications && selectedPatient.medications.length > 0;

  return (
    <PatientRecordSection
      title="Medications"
      count={selectedPatient.medications?.length || 0}
      sx={{ mt: 0 }}
    >
      {/* ── Drug Interaction Panel (DrugSearchPage style) ── */}
      {hasMeds && (
        <Box sx={{ mb: 3 }}>
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: "primary.50", color: "primary.main", display: "flex" }}>
              <Shield size={18} />
            </Box>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary">
              Drug Interaction Analysis
            </Typography>
            {allInteractionsLoading && (
              <CircularProgress size={16} thickness={5} sx={{ ml: 0.5 }} />
            )}
          </Box>

          {allInteractionsLoading ? (
            <Box sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
              <Skeleton variant="text" width="70%" height={24} />
              <Skeleton variant="text" width="50%" height={20} sx={{ mt: 1 }} />
              <Skeleton variant="rectangular" height={60} sx={{ mt: 1.5, borderRadius: 2 }} />
            </Box>
          ) : allMedicationInteractions.length > 0 ? (
            <Box>
              <Typography variant="body2" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "#dc2626" }}>
                <AlertTriangle size={16} />
                Found {allMedicationInteractions.length} interaction{allMedicationInteractions.length !== 1 ? "s" : ""}
              </Typography>
              {allMedicationInteractions.map((interaction, i) => {
                const colors = riskColors[interaction.severity] ?? riskColors.low;
                return (
                  <Paper
                    elevation={0}
                    key={`${interaction.drug1Name}-${interaction.drug2Name}-${i}`}
                    sx={{
                      mb: 2,
                      p: 2.5,
                      borderRadius: 3,
                      border: "2px solid",
                      borderColor: colors.border,
                      bgcolor: colors.bg,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Left accent bar */}
                    <Box sx={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 5, bgcolor: colors.color }} />

                    <Box sx={{ pl: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap", gap: 1.5 }}>
                        <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          {interaction.drug1Name}
                          <X size={14} color={colors.color} style={{ margin: "0 2px" }} />
                          {interaction.drug2Name}
                        </Typography>
                        <Chip
                          label={`${interaction.severity.toUpperCase()} RISK`}
                          size="small"
                          sx={{
                            bgcolor: colors.color,
                            color: "#fff",
                            fontWeight: 800,
                            fontSize: "0.7rem",
                            letterSpacing: 0.5,
                            borderRadius: 2,
                          }}
                        />
                      </Box>

                      <Typography variant="body2" color="text.primary" sx={{ mb: 1.5, lineHeight: 1.6, fontWeight: 500 }}>
                        {interaction.description}
                      </Typography>

                      {interaction.recommendation && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1.25,
                            p: 1.5,
                            bgcolor: "white",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: colors.border,
                          }}
                        >
                          <Info size={16} color={colors.color} style={{ flexShrink: 0, marginTop: 2 }} />
                          <Box>
                            <Typography variant="caption" fontWeight={700} sx={{ color: colors.color, display: "block", mb: 0.25 }}>
                              Clinical Recommendation
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500} lineHeight={1.5}>
                              {interaction.recommendation}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          ) : (
            <Alert
              severity="success"
              sx={{ borderRadius: 3, py: 1.5, "& .MuiAlert-message": { width: "100%" } }}
            >
              <Typography fontWeight={700} color="success.800">No known interactions found.</Typography>
              <Typography variant="body2" color="success.700" mt={0.25}>
                The current medication combination appears to be generally safe based on available data.
              </Typography>
            </Alert>
          )}
        </Box>
      )}

      {/* ── Add / edit medication form ── */}
      {medicationDialogOpen ? (
        <Card variant="outlined" sx={{ mb: 2, bgcolor: "background.default", borderRadius: 5 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={12}>
                <Box sx={{ position: "relative" }}>
                  <TextField
                    id="medication-search"
                    fullWidth
                    label="Medication"
                    placeholder="Search drugs..."
                    value={medicationSearch}
                    onChange={(e) => {
                      const value = e.target.value;
                      setMedicationSearch(value);
                      if (medicationForm.selectedDrug && value !== medicationForm.selectedDrug.name) {
                        setMedicationForm((current) => ({ ...current, selectedDrug: null }));
                      }
                    }}
                    helperText="Search and choose a drug from the drugs table."
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search size={18} color="#94a3b8" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  {medicationForm.selectedDrug ? (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={`Selected: ${medicationForm.selectedDrug.name}`}
                        onDelete={() => {
                          setMedicationForm((current) => ({ ...current, selectedDrug: null }));
                          setMedicationSearch("");
                          setMedicationSuggestions([]);
                        }}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  ) : null}
                  {!medicationForm.selectedDrug && medicationSuggestions.length > 0 ? (
                    <Paper
                      elevation={6}
                      sx={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 10,
                        mt: 1,
                        borderRadius: 3,
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <List sx={{ py: 0, maxHeight: 260, overflowY: "auto" }}>
                        {medicationSuggestions.map((drug) => (
                          <ListItemButton
                            key={drug.id}
                            onClick={() => {
                              setMedicationForm((current) => ({ ...current, selectedDrug: drug }));
                              setMedicationSearch(drug.name);
                              setMedicationSuggestions([]);
                            }}
                            sx={{ py: 1.25, px: 2 }}
                          >
                            <ListItemText
                              primary={drug.name}
                              secondary={drug.generic_name ? `Generic: ${drug.generic_name}` : undefined}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Paper>
                  ) : null}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  id="medication-dosage-level"
                  fullWidth
                  select
                  label="Dosage Level"
                  value={medicationForm.dosageLevel}
                  onChange={(e) => setMedicationForm((current) => ({ ...current, dosageLevel: e.target.value }))}
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  id="medication-dosage-amount"
                  fullWidth
                  label="Dosage Amount"
                  value={medicationForm.dosageAmount}
                  onChange={(e) => setMedicationForm((current) => ({ ...current, dosageAmount: e.target.value }))}
                  placeholder="e.g. 10 mg twice daily"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  id="medication-start-date"
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={medicationForm.startDate}
                  onChange={(e) => setMedicationForm((current) => ({ ...current, startDate: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  id="medication-end-date"
                  fullWidth
                  label="End Date"
                  type="date"
                  value={medicationForm.endDate}
                  onChange={(e) => setMedicationForm((current) => ({ ...current, endDate: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  id="medication-notes"
                  fullWidth
                  multiline
                  minRows={2}
                  label="Notes"
                  value={medicationForm.notes}
                  onChange={(e) => setMedicationForm((current) => ({ ...current, notes: e.target.value }))}
                />
              </Grid>
              <Grid size={12} sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Button onClick={closeMedicationDialog} sx={{ color: "text.secondary", borderRadius: 999 }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() => void handleMedicationSubmit()}
                  disabled={medicationLoading}
                  color="primary"
                  sx={{ borderRadius: 999 }}
                >
                  {medicationLoading ? <CircularProgress size={20} color="inherit" /> : "Done"}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Medication list ── */}
      {hasMeds ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {selectedPatient.medications.map((med) => (
            <Card key={med.id} variant="outlined" sx={{ bgcolor: "background.default", borderRadius: 5 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
                  <Box>
                    <Typography fontWeight={700}>{med.drug_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {med.dosage_amount || med.dosage_level || "-"} • {med.start_date ? new Date(med.start_date).toLocaleDateString() : "-"} • {med.end_date ? new Date(med.end_date).toLocaleDateString() : "Ongoing"}
                    </Typography>
                    {med.notes ? (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {med.notes}
                      </Typography>
                    ) : null}
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Edit2 size={13} />}
                      onClick={() => openMedicationDialog(med)}
                      sx={{ borderRadius: 999, borderColor: "rgba(0,212,170,0.35)", color: "#00d4aa", fontWeight: 600, "&:hover": { borderColor: "#00d4aa", bgcolor: "rgba(0,212,170,0.06)" } }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Trash2 size={13} />}
                      onClick={() => void handleMedicationDelete(med.id)}
                      sx={{ borderRadius: 999, borderColor: "rgba(239,68,68,0.35)", color: "#ef4444", fontWeight: 600, "&:hover": { borderColor: "#ef4444", bgcolor: "rgba(239,68,68,0.06)" } }}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Alert severity="info">No medications recorded. Use Add Medication to link a drug from the drugs table.</Alert>
      )}
    </PatientRecordSection>
  );
}
