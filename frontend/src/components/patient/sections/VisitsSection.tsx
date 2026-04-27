import { useState } from "react";
import { Alert, Box, Button, Card, CardContent, Grid, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { PatientRecordSection } from "../PatientRecordSection";
import { ItemActions, makeSectionHelpers } from "../sectionUtils";
import { updateListItem } from "../../../lib/helpers";
import type { PatientForm } from "../../../types/patient";
import type { Dispatch, SetStateAction } from "react";

interface Props {
  form: PatientForm;
  setForm: Dispatch<SetStateAction<PatientForm>>;
  editable: boolean;
  onStartEdit?: () => void;
  onSave?: () => Promise<boolean>;
  saving?: boolean;
}

export function VisitsSection({ form, setForm, editable, onStartEdit, onSave, saving }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { ensureEditable, handleDone, saving: isSaving } = makeSectionHelpers(editable, onStartEdit, onSave, saving);

  return (
    <PatientRecordSection
      title="Visits / Appointments"
      count={form.visits.length}
      addLabel="Add Visit"
      onAdd={() => {
        ensureEditable();
        setEditingIndex(0);
        setForm((current) => ({
          ...current,
          visits: [{ visitDate: "", reason: "", doctorName: "", doctorSpecialty: "" }, ...current.visits],
        }));
      }}
    >
      {form.visits.length === 0 ? (
        <Alert severity="info">No visits recorded.</Alert>
      ) : (
        form.visits.map((visit, index) => {
          const isEditing = editingIndex === index;
          return (
            <Card key={`visit-${index}`} variant="outlined" sx={{ mb: index === form.visits.length - 1 ? 0 : 2, bgcolor: "background.default", borderRadius: 5 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: isEditing ? 2 : 0 }}>
                  <Box>
                    <Typography fontWeight={700}>{visit.reason || "Visit"}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {visit.visitDate || "No date"}{visit.doctorName ? ` • ${visit.doctorName}` : ""}{visit.doctorSpecialty ? ` (${visit.doctorSpecialty})` : ""}
                    </Typography>
                  </Box>
                  <ItemActions
                    onEdit={() => setEditingIndex(index)}
                    onDelete={() => setForm((current) => ({ ...current, visits: current.visits.filter((_, i) => i !== index) }))}
                    isEditing={isEditing}
                    ensureEditable={ensureEditable}
                  />
                </Box>
                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <DatePicker
                        label="Visit Date"
                        value={visit.visitDate ? dayjs(visit.visitDate) : null}
                        onChange={(newValue) => setForm((current) => ({ ...current, visits: updateListItem(current.visits, index, { visitDate: newValue ? newValue.format("YYYY-MM-DD") : "" }) }))}
                        format="MM/DD/YYYY"
                        slotProps={{
                          textField: { fullWidth: true, size: "small" },
                          popper: { sx: { "& .MuiIconButton-root": { color: "#333" } } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        id={`visit-reason-${index}`}
                        fullWidth
                        label="Reason"
                        value={visit.reason}
                        onChange={(e) => setForm((current) => ({ ...current, visits: updateListItem(current.visits, index, { reason: e.target.value }) }))}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        id={`visit-doctor-name-${index}`}
                        fullWidth
                        label="Doctor Name"
                        value={visit.doctorName}
                        onChange={(e) => setForm((current) => ({ ...current, visits: updateListItem(current.visits, index, { doctorName: e.target.value }) }))}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <TextField
                        id={`visit-specialty-${index}`}
                        fullWidth
                        label="Specialty"
                        value={visit.doctorSpecialty}
                        onChange={(e) => setForm((current) => ({ ...current, visits: updateListItem(current.visits, index, { doctorSpecialty: e.target.value }) }))}
                      />
                    </Grid>
                    <Grid size={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button size="small" onClick={() => void handleDone(() => setEditingIndex(null))} disabled={isSaving} sx={{ borderRadius: 999 }}>Done</Button>
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
