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

export function VaccinationsSection({ form, setForm, editable, onStartEdit, onSave, saving }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { ensureEditable, handleDone, saving: isSaving } = makeSectionHelpers(editable, onStartEdit, onSave, saving);

  return (
    <PatientRecordSection
      title="Vaccinations"
      count={form.vaccinations.length}
      addLabel="Add Vaccination"
      onAdd={() => {
        ensureEditable();
        setEditingIndex(0);
        setForm((current) => ({
          ...current,
          vaccinations: [{ vaccineName: "", date: "", dose: "" }, ...current.vaccinations],
        }));
      }}
    >
      {form.vaccinations.length === 0 ? (
        <Alert severity="info">No vaccinations recorded.</Alert>
      ) : (
        form.vaccinations.map((vaccination, index) => {
          const isEditing = editingIndex === index;
          return (
            <Card key={`vaccination-${index}`} variant="outlined" sx={{ mb: index === form.vaccinations.length - 1 ? 0 : 2, bgcolor: "background.default", borderRadius: 5 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: isEditing ? 2 : 0 }}>
                  <Box>
                    <Typography fontWeight={700}>{vaccination.vaccineName || "Vaccination"}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vaccination.date || "No date"}{vaccination.dose ? ` • Dose: ${vaccination.dose}` : ""}
                    </Typography>
                  </Box>
                  <ItemActions
                    onEdit={() => setEditingIndex(index)}
                    onDelete={() => setForm((current) => ({ ...current, vaccinations: current.vaccinations.filter((_, i) => i !== index) }))}
                    isEditing={isEditing}
                    ensureEditable={ensureEditable}
                  />
                </Box>
                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <TextField
                        fullWidth
                        label="Vaccine Name"
                        value={vaccination.vaccineName}
                        onChange={(e) => setForm((current) => ({ ...current, vaccinations: updateListItem(current.vaccinations, index, { vaccineName: e.target.value }) }))}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <DatePicker
                        label="Date"
                        value={vaccination.date ? dayjs(vaccination.date) : null}
                        onChange={(newValue) => setForm((current) => ({ ...current, vaccinations: updateListItem(current.vaccinations, index, { date: newValue ? newValue.format("YYYY-MM-DD") : "" }) }))}
                        format="MM/DD/YYYY"
                        slotProps={{
                          textField: { fullWidth: true, size: "small" },
                          popper: { sx: { "& .MuiIconButton-root": { color: "#333" } } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Dose"
                        value={vaccination.dose}
                        onChange={(e) => setForm((current) => ({ ...current, vaccinations: updateListItem(current.vaccinations, index, { dose: e.target.value }) }))}
                        placeholder="e.g. 0.5 mL"
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
