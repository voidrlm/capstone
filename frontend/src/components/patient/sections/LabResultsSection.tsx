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

export function LabResultsSection({ form, setForm, editable, onStartEdit, onSave, saving, onUploadFile }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { ensureEditable, handleDone, saving: isSaving } = makeSectionHelpers(editable, onStartEdit, onSave, saving);

  const groupedByDate = form.labResults.reduce(
    (acc, lab, index) => {
      const date = lab.date || "No date";
      if (!acc[date]) acc[date] = [];
      acc[date].push({ lab, index });
      return acc;
    },
    {} as Record<string, Array<{ lab: (typeof form.labResults)[0]; index: number }>>,
  );

  return (
    <PatientRecordSection
      title="Lab Results"
      count={form.labResults.length}
      addLabel="Add Lab Result"
      onAdd={() => {
        ensureEditable();
        setEditingIndex(0);
        setForm((current) => ({
          ...current,
          labResults: [{ testName: "", result: "", date: "", uploadedFileName: "", uploadedFileMimeType: "", uploadedFileContent: "" }, ...current.labResults],
        }));
      }}
    >
      {form.labResults.length === 0 ? (
        <Alert severity="info">No lab results recorded.</Alert>
      ) : (
        Object.entries(groupedByDate).map(([date, items]) => (
          <Box key={date} sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(15,23,42,0.1))" }} />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 0.75, borderRadius: 99, bgcolor: "#f8fafc", border: "1px solid rgba(15,23,42,0.09)" }}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: "#334155", letterSpacing: "0.04em" }}>
                  {date}
                </Typography>
                <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "rgba(15,23,42,0.25)" }} />
                <Typography sx={{ fontWeight: 600, fontSize: "0.72rem", color: "#94a3b8" }}>
                  {items.length} result{items.length === 1 ? "" : "s"}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(15,23,42,0.1), transparent)" }} />
            </Box>
            {items.map(({ lab, index }) => {
              const isEditing = editingIndex === index;
              return (
                <Card key={`lab-${index}`} variant="outlined" sx={{ mb: 2, bgcolor: "background.default", borderRadius: 5 }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: isEditing ? 2 : 0 }}>
                      <Box>
                        <Typography fontWeight={700}>{lab.testName || "Lab Result"}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                          {lab.result || "-"}
                        </Typography>
                        {lab.uploadedFileName ? (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            File: {lab.uploadedFileName}
                          </Typography>
                        ) : null}
                      </Box>
                      <ItemActions
                        onEdit={() => setEditingIndex(index)}
                        onDelete={() => setForm((current) => ({ ...current, labResults: current.labResults.filter((_, i) => i !== index) }))}
                        isEditing={isEditing}
                        ensureEditable={ensureEditable}
                      />
                    </Box>
                    {isEditing ? (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            id={`lab-test-name-${index}`}
                            fullWidth
                            label="Test Name"
                            value={lab.testName}
                            onChange={(e) => setForm((current) => ({ ...current, labResults: updateListItem(current.labResults, index, { testName: e.target.value }) }))}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 5 }}>
                          <TextField
                            id={`lab-result-${index}`}
                            fullWidth
                            multiline
                            minRows={5}
                            label="Result"
                            value={lab.result}
                            onChange={(e) => setForm((current) => ({ ...current, labResults: updateListItem(current.labResults, index, { result: e.target.value }) }))}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <DatePicker
                            label="Date"
                            value={lab.date ? dayjs(lab.date) : null}
                            onChange={(newValue) => setForm((current) => ({ ...current, labResults: updateListItem(current.labResults, index, { date: newValue ? newValue.format("YYYY-MM-DD") : "" }) }))}
                            format="MM/DD/YYYY"
                            slotProps={{
                              textField: { fullWidth: true, size: "small" },
                              popper: { sx: { "& .MuiIconButton-root": { color: "#333" } } },
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <Button component="label" variant="contained" fullWidth>
                            {lab.uploadedFileName ? `Uploaded: ${lab.uploadedFileName}` : "Upload Lab Result File"}
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
                          {lab.uploadedFileContent ? (
                            <Button
                              variant="text"
                              onClick={() => downloadStoredFile(
                                lab.uploadedFileName || "lab-result-file",
                                lab.uploadedFileMimeType || "application/octet-stream",
                                lab.uploadedFileContent,
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
                    ) : lab.uploadedFileContent ? (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="text"
                          onClick={() => downloadStoredFile(
                            lab.uploadedFileName || "lab-result-file",
                            lab.uploadedFileMimeType || "application/octet-stream",
                            lab.uploadedFileContent,
                          )}
                        >
                          Download File
                        </Button>
                      </Box>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        ))
      )}
    </PatientRecordSection>
  );
}
