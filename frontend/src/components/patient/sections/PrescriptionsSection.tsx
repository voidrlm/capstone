import { useState } from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Grid, MenuItem, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { Plus } from "lucide-react";
import { API_URL } from "../../../lib/api";
import { PatientRecordSection } from "../PatientRecordSection";
import { PrescriptionMedicationEditor } from "../PrescriptionMedicationEditor";
import { ItemActions, makeSectionHelpers } from "../sectionUtils";
import { updateListItem, normalizePhraseSpacing, getAuthHeaders } from "../../../lib/helpers";
import { toForm } from "../../../lib/patientFormHelpers";
import type { PatientForm, PatientDetail, DrugSuggestion, MedicationInteractionResult } from "../../../types/patient";
import type { Dispatch, SetStateAction } from "react";

interface Props {
  form: PatientForm;
  setForm: Dispatch<SetStateAction<PatientForm>>;
  editable: boolean;
  onStartEdit?: () => void;
  onSave?: () => Promise<boolean>;
  saving?: boolean;
  existingMedicationDrugIds: string[];
  onSavePrescription: (index: number) => Promise<boolean>;
  onDeletePrescription: (index: number) => Promise<void>;
  patientDetail: PatientDetail | null;
  onError: (message: string) => void;
}

export function PrescriptionsSection({
  form,
  setForm,
  editable,
  onStartEdit,
  onSave,
  saving,
  existingMedicationDrugIds,
  onSavePrescription,
  onDeletePrescription,
  patientDetail,
  onError,
}: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [interactionLoadingIndex, setInteractionLoadingIndex] = useState<number | null>(null);
  const [interactionsByIndex, setInteractionsByIndex] = useState<Record<number, MedicationInteractionResult[]>>({});
  const { ensureEditable, saving: isSaving } = makeSectionHelpers(editable, onStartEdit, onSave, saving);

  let userRole = "";
  try {
    const storedUser = localStorage.getItem("user");
    userRole = storedUser ? (JSON.parse(storedUser).role as string) : "";
  } catch {
    userRole = "";
  }
  const canRequestInsteadOfCreate = userRole === "doctor" || userRole === "nurse";

  const handleCancel = (index: number) => {
    if (patientDetail?.prescriptions?.[index]) {
      const original = toForm({
        ...patientDetail,
        prescriptions: [patientDetail.prescriptions[index]],
      }).prescriptions[0];
      setForm((current) => ({
        ...current,
        prescriptions: current.prescriptions.map((p, i) => (i === index ? original : p)),
      }));
    } else {
      setForm((current) => ({
        ...current,
        prescriptions: current.prescriptions.filter((_, i) => i !== index),
      }));
    }
    setEditingIndex(null);
  };

  const handleInteractionCheck = async (index: number) => {
    const prescription = form.prescriptions[index];
    if (!prescription) return;

    setInteractionLoadingIndex(index);
    let resolvedMedications = prescription.medications;

    try {
      const resolved = await Promise.all(
        prescription.medications.map(async (medication) => {
          if (medication.selectedDrug?.id) return medication;
          const fallbackQuery = medication.search.trim();
          if (!fallbackQuery) return medication;
          try {
            const safeQuery = normalizePhraseSpacing(fallbackQuery.split(",")[0] || fallbackQuery).trim();
            if (!safeQuery) return medication;
            const res = await fetch(`${API_URL}/api/drugs/autocomplete?q=${encodeURIComponent(safeQuery)}`);
            if (!res.ok) return medication;
            const json = await res.json();
            const suggestions: DrugSuggestion[] = json.data?.suggestions || [];
            const selectedDrug = suggestions[0] || null;
            return selectedDrug ? { ...medication, selectedDrug, search: selectedDrug.name, suggestions: [] } : medication;
          } catch {
            return medication;
          }
        }),
      );
      resolvedMedications = resolved;
      setForm((current) => ({
        ...current,
        prescriptions: updateListItem(current.prescriptions, index, { medications: resolved }),
      }));
    } catch {
      resolvedMedications = prescription.medications;
    }

    const drugIds = Array.from(new Set([
      ...existingMedicationDrugIds,
      ...resolvedMedications.map((m) => m.selectedDrug?.id).filter((id): id is string => Boolean(id)),
    ]));

    if (drugIds.length < 2) {
      onError("Add at least two medications, or select valid drugs, to check interactions.");
      setInteractionsByIndex((current) => ({ ...current, [index]: [] }));
      setInteractionLoadingIndex((current) => (current === index ? null : current));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/drugs/check-interactions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ drugIds }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        onError(errJson.error?.message || "Failed to check interactions.");
        setInteractionsByIndex((current) => ({ ...current, [index]: [] }));
        return;
      }
      const json = await res.json();
      const interactions = json.data?.interactions || [];
      setInteractionsByIndex((current) => ({ ...current, [index]: interactions }));
      if (interactions.length === 0) {
        onError("No known interactions found for the selected prescription drugs.");
      }
    } catch {
      onError("Failed to check interactions.");
      setInteractionsByIndex((current) => ({ ...current, [index]: [] }));
    } finally {
      setInteractionLoadingIndex((current) => (current === index ? null : current));
    }
  };

  return (
    <PatientRecordSection
      title="Prescriptions"
      count={form.prescriptions.length}
      addLabel="Add Prescription"
      onAdd={() => {
        ensureEditable();
        setEditingIndex(0);
        setForm((current) => ({
          ...current,
          prescriptions: [
            { medications: [], instructions: "", prescriptionDate: new Date().toISOString().split("T")[0], doctorName: "", doctorSpecialty: "", uploadedFileName: "", uploadedFileMimeType: "", uploadedFileContent: "", approvalStatus: "draft" },
            ...current.prescriptions,
          ],
        }));
      }}
    >
      {form.prescriptions.length === 0 ? (
        <Alert severity="info">No prescriptions recorded.</Alert>
      ) : (
        form.prescriptions.map((prescription, index) => {
          const isEditing = editingIndex === index;
          return (
            <Card key={`prescription-${index}`} variant="outlined" sx={{ mb: index === form.prescriptions.length - 1 ? 0 : 2, bgcolor: "background.default", borderRadius: 5 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: isEditing ? 2 : 0 }}>
                  <Box>
                    <Typography fontWeight={700}>
                      {prescription.medications.map((item) => item.selectedDrug?.name || item.search).filter(Boolean).join(", ") || "Prescription"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {prescription.prescriptionDate || "No date"}{prescription.doctorName ? ` • ${prescription.doctorName}` : ""}{prescription.doctorSpecialty ? ` (${prescription.doctorSpecialty})` : ""} • {prescription.approvalStatus === "approved" ? "Approved" : "Draft"}
                    </Typography>
                    {prescription.uploadedFileName ? (
                      <Typography variant="caption" color="text.secondary">
                        File: {prescription.uploadedFileName}
                      </Typography>
                    ) : null}
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => void handleInteractionCheck(index)}
                      disabled={interactionLoadingIndex === index}
                      sx={{ borderRadius: 999 }}
                    >
                      {interactionLoadingIndex === index ? <CircularProgress size={16} color="inherit" /> : "Check Interactions"}
                    </Button>
                    <ItemActions
                      onEdit={() => setEditingIndex(index)}
                      onDelete={() => void onDeletePrescription(index)}
                      isEditing={isEditing}
                      ensureEditable={ensureEditable}
                    />
                  </Box>
                </Box>

                {(interactionsByIndex[index] || []).length > 0 ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography fontWeight={700} sx={{ mb: 1 }}>Interaction results</Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {interactionsByIndex[index].map((interaction, interactionIndex) => (
                        <Box key={`${interaction.drug1Name}-${interaction.drug2Name}-${interactionIndex}`}>
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
                ) : null}

                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <DatePicker
                        label="Prescription Date"
                        value={prescription.prescriptionDate ? dayjs(prescription.prescriptionDate) : null}
                        onChange={(newValue) => setForm((current) => ({ ...current, prescriptions: updateListItem(current.prescriptions, index, { prescriptionDate: newValue ? newValue.format("YYYY-MM-DD") : "" }) }))}
                        format="MM/DD/YYYY"
                        slotProps={{
                          textField: { fullWidth: true, size: "small" },
                          popper: { sx: { "& .MuiIconButton-root": { color: "#333" } } },
                        }}
                      />
                    </Grid>
                    {!canRequestInsteadOfCreate ? (
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                          id={`prescription-status-${index}`}
                          fullWidth
                          select
                          label="Status"
                          value={prescription.approvalStatus}
                          onChange={(e) => setForm((current) => ({ ...current, prescriptions: updateListItem(current.prescriptions, index, { approvalStatus: e.target.value as "draft" | "approved" }) }))}
                        >
                          <MenuItem value="draft">Draft</MenuItem>
                          <MenuItem value="approved">Approved</MenuItem>
                        </TextField>
                      </Grid>
                    ) : null}
                    <Grid size={{ xs: 12, md: canRequestInsteadOfCreate ? 7 : 4 }}>
                      <TextField
                        id={`prescription-instructions-${index}`}
                        fullWidth
                        label="Instructions"
                        value={prescription.instructions}
                        onChange={(e) => setForm((current) => ({ ...current, prescriptions: updateListItem(current.prescriptions, index, { instructions: e.target.value }) }))}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <TextField
                        id={`prescription-doctor-name-${index}`}
                        fullWidth
                        label="Doctor Name"
                        value={prescription.doctorName}
                        onChange={(e) => setForm((current) => ({ ...current, prescriptions: updateListItem(current.prescriptions, index, { doctorName: e.target.value }) }))}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <TextField
                        id={`prescription-specialty-${index}`}
                        fullWidth
                        label="Specialty"
                        value={prescription.doctorSpecialty}
                        onChange={(e) => setForm((current) => ({ ...current, prescriptions: updateListItem(current.prescriptions, index, { doctorSpecialty: e.target.value }) }))}
                      />
                    </Grid>
                    <Grid size={12}>
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Prescription Medications</Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {prescription.medications.length === 0 ? (
                          <Alert severity="info">No prescription medications yet. Add one below.</Alert>
                        ) : null}
                        {prescription.medications.map((item, medicationIndex) => (
                          <PrescriptionMedicationEditor
                            key={`prescription-${index}-medication-${medicationIndex}`}
                            item={item}
                            label="Medication"
                            disabled={isSaving}
                            comparisonDrugIds={[
                              ...existingMedicationDrugIds,
                              ...prescription.medications
                                .filter((_, mi) => mi !== medicationIndex)
                                .map((m) => m.selectedDrug?.id)
                                .filter((id): id is string => Boolean(id)),
                            ]}
                            onChange={(patch) => {
                              setForm((current) => ({
                                ...current,
                                prescriptions: current.prescriptions.map((p, pi) =>
                                  pi === index
                                    ? { ...p, medications: p.medications.map((m, mi) => (mi === medicationIndex ? { ...m, ...patch } : m)) }
                                    : p,
                                ),
                              }));
                            }}
                            onRemove={() => {
                              setForm((current) => ({
                                ...current,
                                prescriptions: current.prescriptions.map((p, pi) =>
                                  pi === index
                                    ? { ...p, medications: p.medications.filter((_, mi) => mi !== medicationIndex) }
                                    : p,
                                ),
                              }));
                            }}
                            onCancel={() => handleCancel(index)}
                            onDone={() => void onSavePrescription(index).then((didSave) => {
                              if (didSave) setEditingIndex(null);
                            })}
                          />
                        ))}
                        <Box>
                          <Button
                            size="small"
                            startIcon={<Plus size={16} />}
                            onClick={() => {
                              setForm((current) => ({
                                ...current,
                                prescriptions: current.prescriptions.map((p, pi) =>
                                  pi === index
                                    ? {
                                        ...p,
                                        medications: [
                                          { selectedDrug: null, search: "", suggestions: [], dosageLevel: "medium", dosageAmount: "", startDate: prescription.prescriptionDate || "", endDate: "", notes: "" },
                                          ...p.medications,
                                        ],
                                      }
                                    : p,
                                ),
                              }));
                            }}
                          >
                            Add Medication
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={12} sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                      <Button size="small" color="inherit" onClick={() => handleCancel(index)} disabled={isSaving} sx={{ borderRadius: 999 }}>
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        onClick={() => void onSavePrescription(index).then((didSave) => {
                          if (didSave) setEditingIndex(null);
                        })}
                        disabled={isSaving}
                        sx={{ borderRadius: 999 }}
                      >
                        Done
                      </Button>
                    </Grid>
                  </Grid>
                ) : null}
              </CardContent>
            </Card>
          );
        })
      )}
    </PatientRecordSection>
  );
}
