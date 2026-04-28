import { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  TextField,
} from "@mui/material";
import { API_URL } from "../lib/api";

type DocType = "lab_result" | "visit" | "vaccination" | "diagnosis" | "insurance" | "discharge" | "allergy" | "medication";

interface Props {
  open: boolean;
  docType: DocType | null;
  patientId: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  onError: (msg: string) => void;
}

const TITLE: Record<DocType, string> = {
  lab_result: "Add Lab Result",
  visit: "Add Visit",
  vaccination: "Add Vaccination",
  diagnosis: "Add Diagnosis",
  insurance: "Add Insurance EOB",
  discharge: "Add Discharge Summary",
  allergy: "Add Allergy",
  medication: "Add Medication",
};

const EMPTY_LAB = { testName: "", result: "", date: "", referenceRange: "" };
const EMPTY_VISIT = { reason: "", date: "", doctorName: "", doctorSpecialty: "" };
const EMPTY_VACCINATION = { vaccineName: "", date: "", dose: "" };
const EMPTY_DIAGNOSIS = { diagnosisName: "", date: "" };
const EMPTY_INSURANCE = { insurerName: "", planName: "", statementDate: "", serviceDate: "", totalBilled: "", planPaid: "", yourResponsibility: "", claimReference: "" };
const EMPTY_DISCHARGE = { admissionDate: "", dischargeDate: "", primaryDiagnosis: "", attendingPhysician: "", losDays: "" };
const EMPTY_ALLERGY = { allergyName: "" };
const EMPTY_MEDICATION = { search: "", drugId: "", drugName: "", dosageLevel: "medium", dosageAmount: "", startDate: "", endDate: "", notes: "" };

interface DrugSuggestion { id: string; name: string; generic_name?: string }

const dateSx = {
  "& input[type='date']": { color: "#0f172a" },
  "& input[type='date']::-webkit-calendar-picker-indicator": {
    opacity: 1,
    cursor: "pointer",
    filter: "invert(19%) sepia(16%) saturate(1332%) hue-rotate(176deg) brightness(88%) contrast(91%)",
  },
};

export function ManualEntryDialog({ open, docType, patientId, onClose, onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [lab, setLab] = useState(EMPTY_LAB);
  const [visit, setVisit] = useState(EMPTY_VISIT);
  const [vaccination, setVaccination] = useState(EMPTY_VACCINATION);
  const [diagnosis, setDiagnosis] = useState(EMPTY_DIAGNOSIS);
  const [insurance, setInsurance] = useState(EMPTY_INSURANCE);
  const [discharge, setDischarge] = useState(EMPTY_DISCHARGE);
  const [allergy, setAllergy] = useState(EMPTY_ALLERGY);
  const [medication, setMedication] = useState(EMPTY_MEDICATION);
  const [drugSuggestions, setDrugSuggestions] = useState<DrugSuggestion[]>([]);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setDrugSuggestions([]);
    }
  }, [open]);

  const handleDrugSearch = (value: string) => {
    setMedication((p) => ({ ...p, search: value, drugId: "", drugName: "" }));
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!value.trim()) { setDrugSuggestions([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/drugs/autocomplete?q=${encodeURIComponent(value.trim())}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        setDrugSuggestions((json.data?.suggestions || []) as DrugSuggestion[]);
      } catch { /* ignore */ }
    }, 300);
  };

  const selectDrug = (drug: DrugSuggestion) => {
    setMedication((p) => ({ ...p, search: drug.name, drugId: drug.id, drugName: drug.name }));
    setDrugSuggestions([]);
  };

  const handleSubmit = async () => {
    if (!patientId || !docType) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let endpoint = "";
      let body: Record<string, unknown> = {};

      if (docType === "lab_result") {
        endpoint = `${API_URL}/api/patients/${patientId}/lab-results`;
        body = { test_name: lab.testName, result: lab.result, date: lab.date, reference_range: lab.referenceRange };
      } else if (docType === "visit") {
        endpoint = `${API_URL}/api/patients/${patientId}/visits`;
        body = { reason: visit.reason, visit_date: visit.date, doctor_name: visit.doctorName, doctor_specialty: visit.doctorSpecialty };
      } else if (docType === "vaccination") {
        endpoint = `${API_URL}/api/patients/${patientId}/vaccinations`;
        body = { vaccine_name: vaccination.vaccineName, administered_date: vaccination.date, dose: vaccination.dose };
      } else if (docType === "diagnosis") {
        endpoint = `${API_URL}/api/patients/${patientId}/diagnoses`;
        body = { diagnosis_name: diagnosis.diagnosisName, date: diagnosis.date };
      } else if (docType === "insurance") {
        endpoint = `${API_URL}/api/patients/${patientId}/insurance-eobs`;
        body = {
          insurer_name: insurance.insurerName,
          plan_name: insurance.planName,
          statement_date: insurance.statementDate,
          service_date: insurance.serviceDate,
          total_billed: insurance.totalBilled ? parseFloat(insurance.totalBilled) : null,
          plan_paid: insurance.planPaid ? parseFloat(insurance.planPaid) : null,
          your_responsibility: insurance.yourResponsibility ? parseFloat(insurance.yourResponsibility) : null,
          claim_reference: insurance.claimReference,
        };
      } else if (docType === "discharge") {
        endpoint = `${API_URL}/api/patients/${patientId}/discharge-summaries`;
        body = {
          admission_date: discharge.admissionDate,
          discharge_date: discharge.dischargeDate,
          primary_diagnosis: discharge.primaryDiagnosis,
          attending_physician: discharge.attendingPhysician,
          los_days: discharge.losDays ? parseInt(discharge.losDays) : null,
        };
      } else if (docType === "allergy") {
        endpoint = `${API_URL}/api/patients/${patientId}/allergies`;
        body = { allergy_name: allergy.allergyName };
      } else if (docType === "medication") {
        if (!medication.drugId) { onError("Please select a drug from the suggestions."); setLoading(false); return; }
        if (!medication.startDate) { onError("Start date is required."); setLoading(false); return; }
        endpoint = `${API_URL}/api/patients/${patientId}/medications`;
        body = {
          drugId: medication.drugId,
          dosageLevel: medication.dosageLevel || undefined,
          dosageAmount: medication.dosageAmount || undefined,
          startDate: medication.startDate,
          endDate: medication.endDate || undefined,
          notes: medication.notes || undefined,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error((json?.error?.message as string | undefined) || "Failed to save record");
      }

      setLab(EMPTY_LAB);
      setVisit(EMPTY_VISIT);
      setVaccination(EMPTY_VACCINATION);
      setDiagnosis(EMPTY_DIAGNOSIS);
      setInsurance(EMPTY_INSURANCE);
      setDischarge(EMPTY_DISCHARGE);
      setAllergy(EMPTY_ALLERGY);
      setMedication(EMPTY_MEDICATION);
      setDrugSuggestions([]);

      onClose();
      await onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      transitionDuration={{ enter: 200, exit: 100 }}
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>{docType ? TITLE[docType] : ""}</DialogTitle>
      <DialogContent sx={{ pt: 2, ...dateSx }}>
        {docType === "lab_result" && (
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField id="lab-test-name" fullWidth label="Test Name" required value={lab.testName} onChange={(e) => setLab((p) => ({ ...p, testName: e.target.value }))} />
            <TextField id="lab-result" fullWidth label="Result" required value={lab.result} onChange={(e) => setLab((p) => ({ ...p, result: e.target.value }))} />
            <TextField id="lab-date" fullWidth label="Date" type="date" InputLabelProps={{ shrink: true }} required value={lab.date} onChange={(e) => setLab((p) => ({ ...p, date: e.target.value }))} />
            <TextField id="lab-reference-range" fullWidth label="Reference Range (optional)" value={lab.referenceRange} onChange={(e) => setLab((p) => ({ ...p, referenceRange: e.target.value }))} />
          </Box>
        )}
        {docType === "visit" && (
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField id="visit-reason" fullWidth label="Reason for Visit" required value={visit.reason} onChange={(e) => setVisit((p) => ({ ...p, reason: e.target.value }))} />
            <TextField id="visit-date" fullWidth label="Date" type="date" InputLabelProps={{ shrink: true }} required value={visit.date} onChange={(e) => setVisit((p) => ({ ...p, date: e.target.value }))} />
            <TextField id="visit-doctor-name" fullWidth label="Doctor Name (optional)" value={visit.doctorName} onChange={(e) => setVisit((p) => ({ ...p, doctorName: e.target.value }))} />
            <TextField id="visit-doctor-specialty" fullWidth label="Doctor Specialty (optional)" value={visit.doctorSpecialty} onChange={(e) => setVisit((p) => ({ ...p, doctorSpecialty: e.target.value }))} />
          </Box>
        )}
        {docType === "vaccination" && (
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField id="vaccination-name" fullWidth label="Vaccine Name" required value={vaccination.vaccineName} onChange={(e) => setVaccination((p) => ({ ...p, vaccineName: e.target.value }))} />
            <TextField id="vaccination-date" fullWidth label="Date Administered" type="date" InputLabelProps={{ shrink: true }} required value={vaccination.date} onChange={(e) => setVaccination((p) => ({ ...p, date: e.target.value }))} />
            <TextField id="vaccination-dose" fullWidth label="Dose (optional)" placeholder="e.g., Dose 1 of 2" value={vaccination.dose} onChange={(e) => setVaccination((p) => ({ ...p, dose: e.target.value }))} />
          </Box>
        )}
        {docType === "diagnosis" && (
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField id="diagnosis-name" fullWidth label="Diagnosis Name" required value={diagnosis.diagnosisName} onChange={(e) => setDiagnosis((p) => ({ ...p, diagnosisName: e.target.value }))} />
            <TextField id="diagnosis-date" fullWidth label="Date" type="date" InputLabelProps={{ shrink: true }} required value={diagnosis.date} onChange={(e) => setDiagnosis((p) => ({ ...p, date: e.target.value }))} />
          </Box>
        )}
        {docType === "insurance" && (
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField id="insurance-insurer" fullWidth label="Insurer Name" required value={insurance.insurerName} onChange={(e) => setInsurance((p) => ({ ...p, insurerName: e.target.value }))} />
            <TextField id="insurance-plan" fullWidth label="Plan Name" value={insurance.planName} onChange={(e) => setInsurance((p) => ({ ...p, planName: e.target.value }))} />
            <TextField id="insurance-statement-date" fullWidth label="Statement Date" type="date" InputLabelProps={{ shrink: true }} required value={insurance.statementDate} onChange={(e) => setInsurance((p) => ({ ...p, statementDate: e.target.value }))} />
            <TextField id="insurance-service-date" fullWidth label="Service Date" type="date" InputLabelProps={{ shrink: true }} value={insurance.serviceDate} onChange={(e) => setInsurance((p) => ({ ...p, serviceDate: e.target.value }))} />
            <TextField id="insurance-total-billed" fullWidth label="Total Billed" type="number" value={insurance.totalBilled} onChange={(e) => setInsurance((p) => ({ ...p, totalBilled: e.target.value }))} />
            <TextField id="insurance-plan-paid" fullWidth label="Plan Paid" type="number" value={insurance.planPaid} onChange={(e) => setInsurance((p) => ({ ...p, planPaid: e.target.value }))} />
            <TextField id="insurance-responsibility" fullWidth label="Your Responsibility" type="number" value={insurance.yourResponsibility} onChange={(e) => setInsurance((p) => ({ ...p, yourResponsibility: e.target.value }))} />
            <TextField id="insurance-claim-reference" fullWidth label="Claim Reference" value={insurance.claimReference} onChange={(e) => setInsurance((p) => ({ ...p, claimReference: e.target.value }))} />
          </Box>
        )}
        {docType === "discharge" && (
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField id="discharge-admission-date" fullWidth label="Admission Date" type="date" InputLabelProps={{ shrink: true }} value={discharge.admissionDate} onChange={(e) => setDischarge((p) => ({ ...p, admissionDate: e.target.value }))} />
            <TextField id="discharge-discharge-date" fullWidth label="Discharge Date" type="date" InputLabelProps={{ shrink: true }} required value={discharge.dischargeDate} onChange={(e) => setDischarge((p) => ({ ...p, dischargeDate: e.target.value }))} />
            <TextField id="discharge-primary-diagnosis" fullWidth label="Primary Diagnosis" required value={discharge.primaryDiagnosis} onChange={(e) => setDischarge((p) => ({ ...p, primaryDiagnosis: e.target.value }))} />
            <TextField id="discharge-attending-physician" fullWidth label="Attending Physician" value={discharge.attendingPhysician} onChange={(e) => setDischarge((p) => ({ ...p, attendingPhysician: e.target.value }))} />
            <TextField id="discharge-los-days" fullWidth label="Length of Stay (days)" type="number" value={discharge.losDays} onChange={(e) => setDischarge((p) => ({ ...p, losDays: e.target.value }))} />
          </Box>
        )}
        {docType === "allergy" && (
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField id="allergy-name" fullWidth label="Allergy Name" required value={allergy.allergyName} onChange={(e) => setAllergy((p) => ({ ...p, allergyName: e.target.value }))} />
          </Box>
        )}
        {docType === "medication" && (
          <Box sx={{ display: "grid", gap: 2 }}>
            <Box sx={{ position: "relative" }}>
              <TextField
                id="medication-search"
                fullWidth
                label="Drug Name"
                required
                placeholder="Search drugs..."
                value={medication.search}
                onChange={(e) => handleDrugSearch(e.target.value)}
                helperText={medication.drugId ? `Selected: ${medication.drugName}` : "Type to search the drug database"}
                FormHelperTextProps={{ sx: { color: medication.drugId ? "success.main" : undefined } }}
              />
              {drugSuggestions.length > 0 && !medication.drugId ? (
                <Paper elevation={6} sx={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, mt: 0.5, borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
                  <List sx={{ py: 0, maxHeight: 220, overflowY: "auto" }}>
                    {drugSuggestions.map((drug) => (
                      <ListItemButton key={drug.id} onClick={() => selectDrug(drug)} sx={{ py: 1, px: 2 }}>
                        <ListItemText primary={drug.name} secondary={drug.generic_name ? `Generic: ${drug.generic_name}` : undefined} />
                      </ListItemButton>
                    ))}
                  </List>
                </Paper>
              ) : null}
            </Box>
            <TextField
              id="medication-dosage-level"
              select
              fullWidth
              label="Dosage Level"
              value={medication.dosageLevel}
              onChange={(e) => setMedication((p) => ({ ...p, dosageLevel: e.target.value }))}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>
            <TextField id="medication-dosage-amount" fullWidth label="Dosage Amount (optional)" placeholder="e.g. 10 mg twice daily" value={medication.dosageAmount} onChange={(e) => setMedication((p) => ({ ...p, dosageAmount: e.target.value }))} />
            <TextField id="medication-start-date" fullWidth label="Start Date" type="date" InputLabelProps={{ shrink: true }} required value={medication.startDate} onChange={(e) => setMedication((p) => ({ ...p, startDate: e.target.value }))} />
            <TextField id="medication-end-date" fullWidth label="End Date (optional)" type="date" InputLabelProps={{ shrink: true }} value={medication.endDate} onChange={(e) => setMedication((p) => ({ ...p, endDate: e.target.value }))} />
            <TextField id="medication-notes" fullWidth multiline minRows={2} label="Notes (optional)" value={medication.notes} onChange={(e) => setMedication((p) => ({ ...p, notes: e.target.value }))} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => void handleSubmit()} disabled={loading}>
          {loading ? "Saving..." : "Save Record"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
