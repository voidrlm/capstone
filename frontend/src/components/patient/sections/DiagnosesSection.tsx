import { useState } from "react";
import { Alert, Box, Button, Card, CardContent, Grid, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { PatientRecordSection } from "../PatientRecordSection";
import { ItemActions, makeSectionHelpers } from "../sectionUtils";
import { updateListItem, downloadStoredFile } from "../../../lib/helpers";
import type { PatientForm } from "../../../types/patient";
import type { Dispatch, SetStateAction } from "react";

interface Props {
  form: PatientForm;
  setForm: Dispatch<SetStateAction<PatientForm>>;
  editable: boolean;
  onStartEdit?: () => void;
  onSave?: () => Promise<boolean>;
  saving?: boolean;
  onUploadFile: (index: number, file: File) => Promise<void>;
}

export function DiagnosesSection({ form, setForm, editable, onStartEdit, onSave, saving, onUploadFile }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { ensureEditable, handleDone, saving: isSaving } = makeSectionHelpers(editable, onStartEdit, onSave, saving);

  return (
    <PatientRecordSection
      title="Diagnoses"
      count={form.diagnoses.length}
      addLabel="Add Diagnosis"
      onAdd={() => {
        ensureEditable();
        setEditingIndex(0);
        setForm((current) => ({
          ...current,
          diagnoses: [{ diagnosisName: "", date: "", uploadedFileName: "", uploadedFileMimeType: "", uploadedFileContent: "" }, ...current.diagnoses],
        }));
      }}
    >
      {form.diagnoses.length === 0 ? (
        <Alert severity="info">No diagnoses recorded.</Alert>
      ) : (
        form.diagnoses.map((diagnosis, index) => {
          const isEditing = editingIndex === index;
          return (
            <Card key={`diagnosis-${index}`} variant="outlined" sx={{ mb: index === form.diagnoses.length - 1 ? 0 : 2, bgcolor: "background.default", borderRadius: 5 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: isEditing ? 2 : 0 }}>
                  <Box>
                    <Typography fontWeight={700}>{diagnosis.diagnosisName || "Diagnosis"}</Typography>
                    <Typography variant="body2" color="text.secondary">{diagnosis.date || "No date"}</Typography>
                    {diagnosis.uploadedFileName ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        File: {diagnosis.uploadedFileName}
                      </Typography>
                    ) : null}
                  </Box>
                  <ItemActions
                    onEdit={() => setEditingIndex(index)}
                    onDelete={() => setForm((current) => ({ ...current, diagnoses: current.diagnoses.filter((_, i) => i !== index) }))}
                    isEditing={isEditing}
                    ensureEditable={ensureEditable}
                  />
                </Box>
                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <TextField
                        fullWidth
                        label="Diagnosis"
                        value={diagnosis.diagnosisName}
                        onChange={(e) => setForm((current) => ({ ...current, diagnoses: updateListItem(current.diagnoses, index, { diagnosisName: e.target.value }) }))}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <DatePicker
                        label="Date"
                        value={diagnosis.date ? dayjs(diagnosis.date) : null}
                        onChange={(newValue) => setForm((current) => ({ ...current, diagnoses: updateListItem(current.diagnoses, index, { date: newValue ? newValue.format("YYYY-MM-DD") : "" }) }))}
                        format="MM/DD/YYYY"
                        slotProps={{
                          textField: { fullWidth: true, size: "small" },
                          popper: { sx: { "& .MuiIconButton-root": { color: "#333" } } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Button component="label" variant="contained" fullWidth>
                        {diagnosis.uploadedFileName ? `Uploaded: ${diagnosis.uploadedFileName}` : "Upload Diagnosis File"}
                        <input
                          hidden
                          type="file"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            void onUploadFile(index, file);
                            event.target.value = "";
                          }}
                        />
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", alignItems: "center" }}>
                      {diagnosis.uploadedFileContent ? (
                        <Button
                          variant="text"
                          onClick={() => downloadStoredFile(
                            diagnosis.uploadedFileName || "diagnosis-file",
                            diagnosis.uploadedFileMimeType || "application/octet-stream",
                            diagnosis.uploadedFileContent,
                          )}
                        >
                          Download File
                        </Button>
                      ) : null}
                    </Grid>
                    <Grid size={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button size="small" onClick={() => void handleDone(() => setEditingIndex(null))} disabled={isSaving} sx={{ borderRadius: 999 }}>Done</Button>
                    </Grid>
                  </Grid>
                ) : diagnosis.uploadedFileContent ? (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="text"
                      onClick={() => downloadStoredFile(
                        diagnosis.uploadedFileName || "diagnosis-file",
                        diagnosis.uploadedFileMimeType || "application/octet-stream",
                        diagnosis.uploadedFileContent,
                      )}
                    >
                      Download File
                    </Button>
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          );
        })
      )}
    </PatientRecordSection>
  );
}
