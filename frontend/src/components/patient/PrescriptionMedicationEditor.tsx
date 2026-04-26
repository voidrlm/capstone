import { useState, useEffect } from "react";
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
import { Search, Trash2 } from "lucide-react";
import { getAuthHeaders } from "../../lib/helpers";
import type { MedicationInteractionResult, PatientForm } from "../../types/patient";

interface PrescriptionMedicationEditorProps {
  item: PatientForm["prescriptions"][number]["medications"][number];
  label: string;
  disabled?: boolean;
  comparisonDrugIds: string[];
  onChange: (patch: Partial<PatientForm["prescriptions"][number]["medications"][number]>) => void;
  onRemove: () => void;
  onCancel: () => void;
  onDone: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function PrescriptionMedicationEditor({
  item,
  label,
  disabled,
  comparisonDrugIds,
  onChange,
  onRemove,
  onCancel,
  onDone,
}: PrescriptionMedicationEditorProps) {
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [interactions, setInteractions] = useState<MedicationInteractionResult[]>([]);

  useEffect(() => {
    const query = item.search.trim();
    if (query.length < 2 || item.selectedDrug) {
      if (item.suggestions.length > 0) {
        onChange({ suggestions: [] });
      }
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/drugs/autocomplete?q=${encodeURIComponent(query)}`);
        if (!res.ok) {
          onChange({ suggestions: [] });
          return;
        }
        const json = await res.json();
        onChange({ suggestions: json.data?.suggestions || [] });
      } catch {
        onChange({ suggestions: [] });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [item.search, item.selectedDrug]);

  const handleInteractionCheck = async () => {
    if (!item.selectedDrug?.id) {
      return;
    }

    const drugIds = Array.from(new Set([...comparisonDrugIds, item.selectedDrug.id]));
    if (drugIds.length < 2) {
      setInteractions([]);
      return;
    }

    setInteractionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/drugs/check-interactions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ drugIds }),
      });

      if (!res.ok) {
        setInteractions([]);
        return;
      }

      const json = await res.json();
      setInteractions(json.data?.interactions || []);
    } catch {
      setInteractions([]);
    } finally {
      setInteractionLoading(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ bgcolor: "background.paper", borderRadius: 5 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid size={12}>
            <Box sx={{ position: "relative" }}>
              <TextField
                fullWidth
                label={label}
                placeholder="Search drugs..."
                value={item.search}
                onChange={(e) => {
                  const value = e.target.value;
                  onChange({
                    search: value,
                    selectedDrug: item.selectedDrug?.name === value ? item.selectedDrug : null,
                    suggestions: value.length < 2 ? [] : item.suggestions,
                  });
                  setInteractions([]);
                }}
                helperText="Search and choose a drug from the drugs table."
                required
                disabled={disabled}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} color="#94a3b8" />
                    </InputAdornment>
                  ),
                }}
              />
              {item.selectedDrug ? (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={`Selected: ${item.selectedDrug.name}`}
                    onDelete={
                      disabled
                        ? undefined
                        : () => {
                            onChange({ selectedDrug: null, search: "", suggestions: [] });
                            setInteractions([]);
                          }
                    }
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              ) : null}
              {!item.selectedDrug && item.suggestions.length > 0 ? (
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
                    {item.suggestions.map((drug) => (
                      <ListItemButton
                        key={drug.id}
                        onClick={() => {
                          onChange({ selectedDrug: drug, search: drug.name, suggestions: [] });
                          setInteractions([]);
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
              fullWidth
              select
              label="Dosage Level"
              value={item.dosageLevel}
              onChange={(e) => onChange({ dosageLevel: e.target.value })}
              disabled={disabled}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Dosage Amount"
              value={item.dosageAmount}
              onChange={(e) => onChange({ dosageAmount: e.target.value })}
              placeholder="e.g. 10 mg twice daily"
              disabled={disabled}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={item.startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              required
              disabled={disabled}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={item.endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={disabled}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Notes"
              value={item.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              disabled={disabled}
            />
          </Grid>
          <Grid size={12} sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
            <Button color="error" variant="contained" startIcon={<Trash2 size={14} />} onClick={onRemove} disabled={disabled} sx={{ borderRadius: 999 }}>
              Remove
            </Button>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Button onClick={onCancel} sx={{ color: "text.secondary", borderRadius: 999 }} disabled={disabled}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => void handleInteractionCheck()}
                disabled={disabled || interactionLoading || !item.selectedDrug}
                sx={{ borderRadius: 999 }}
              >
                {interactionLoading ? <CircularProgress size={20} color="inherit" /> : "Check Interactions"}
              </Button>
              <Button
                variant="contained"
                onClick={onDone}
                disabled={disabled}
                color="primary"
                sx={{ borderRadius: 999 }}
              >
                Done
              </Button>
            </Box>
          </Grid>
          {interactions.length > 0 ? (
            <Grid size={12}>
              <Alert severity="warning">
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  Interaction results
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {interactions.map((interaction, index) => (
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
  );
}
