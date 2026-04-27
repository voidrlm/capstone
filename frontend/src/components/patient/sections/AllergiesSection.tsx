import { useState } from "react";
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";
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

export function AllergiesSection({ form, setForm, editable, onStartEdit, onSave, saving }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { ensureEditable, handleDone, saving: isSaving } = makeSectionHelpers(editable, onStartEdit, onSave, saving);

  return (
    <PatientRecordSection
      title="Allergies"
      count={form.allergies.length}
      addLabel="Add Allergy"
      onAdd={() => {
        ensureEditable();
        setEditingIndex(0);
        setForm((current) => ({
          ...current,
          allergies: [{ allergyName: "" }, ...current.allergies],
        }));
      }}
    >
      {form.allergies.length === 0 ? (
        <Alert severity="info">No allergies recorded.</Alert>
      ) : (
        form.allergies.map((allergy, index) => {
          const isEditing = editingIndex === index;
          return (
            <Card key={`allergy-${index}`} variant="outlined" sx={{ mb: index === form.allergies.length - 1 ? 0 : 2, bgcolor: "background.default", borderRadius: 5 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: isEditing ? 2 : 0 }}>
                  <Typography fontWeight={700}>{allergy.allergyName || "Allergy"}</Typography>
                  <ItemActions
                    onEdit={() => setEditingIndex(index)}
                    onDelete={() => setForm((current) => ({ ...current, allergies: current.allergies.filter((_, i) => i !== index) }))}
                    isEditing={isEditing}
                    ensureEditable={ensureEditable}
                  />
                </Box>
                {isEditing ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                      id={`allergy-name-${index}`}
                      fullWidth
                      label="Allergy Name"
                      value={allergy.allergyName}
                      onChange={(e) => setForm((current) => ({ ...current, allergies: updateListItem(current.allergies, index, { allergyName: e.target.value }) }))}
                    />
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button size="small" onClick={() => void handleDone(() => setEditingIndex(null))} disabled={isSaving} sx={{ borderRadius: 999 }}>Done</Button>
                    </Box>
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
