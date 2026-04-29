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
  TextField,
  Typography,
} from "@mui/material";
import { Edit2, Search, Trash2 } from "lucide-react";
import { PatientRecordSection } from "./PatientRecordSection";
import type { PatientDetail, DrugSuggestion, MedicationInteractionResult, MedicationDialogForm } from "../../types/patient";

interface MedicationSectionProps {
  selectedPatient: PatientDetail;
  medicationDialogOpen: boolean;
  medicationForm: MedicationDialogForm;
  medicationSearch: string;
  medicationSuggestions: DrugSuggestion[];
  medicationInteractions: MedicationInteractionResult[];
  medicationInteractionLoading: boolean;
  medicationLoading: boolean;
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
  medicationInteractions,
  medicationInteractionLoading,
  medicationLoading,
  openMedicationDialog,
  closeMedicationDialog,
  handleMedicationInteractionCheck,
  handleMedicationSubmit,
  setMedicationForm,
  setMedicationSearch,
  setMedicationSuggestions,
  handleMedicationDelete,
}: MedicationSectionProps) {
  return (
    <PatientRecordSection
      title="Medications"
      count={selectedPatient.medications?.length || 0}
      sx={{ mt: 0 }}
    >
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
                  onClick={() => void handleMedicationInteractionCheck()}
                  disabled={medicationInteractionLoading || medicationLoading || !medicationForm.selectedDrug}
                  sx={{ borderRadius: 999 }}
                >
                  {medicationInteractionLoading ? <CircularProgress size={20} color="inherit" /> : "Check Interactions"}
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
              {medicationInteractions.length > 0 ? (
                <Grid size={12}>
                  <Alert severity="warning">
                    <Typography fontWeight={700} sx={{ mb: 1 }}>
                      Interaction results
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {medicationInteractions.map((interaction, index) => (
                        <Box key={`${interaction.drug1Name}-${interaction.drug2Name}-${index}`}>
                          <Typography variant="body2" fontWeight={600}>
                            {interaction.drug1Name} + {interaction.drug2Name} ({interaction.severity})
                          </Typography>
                          <Typography variant="body2">{interaction.description}</Typography>
                          {interaction.recommendation ? (
                            <Typography variant="caption" color="text.secondary">
                              Recommendation: {interaction.recommendation}
                            </Typography>
                          ) : null}
                        </Box>
                      ))}
                    </Box>
                  </Alert>
                </Grid>
              ) : null}
            </Grid>
          </CardContent>
        </Card>
      ) : null}
      {selectedPatient.medications && selectedPatient.medications.length > 0 ? (
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
