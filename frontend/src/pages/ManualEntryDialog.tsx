import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { API_URL } from "../lib/api";

type DocType = "lab_result" | "visit" | "vaccination" | "diagnosis" | "insurance" | "discharge";

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
};

const EMPTY_LAB = { testName: "", result: "", date: "", referenceRange: "" };
const EMPTY_VISIT = { reason: "", date: "", doctorName: "", doctorSpecialty: "" };
const EMPTY_VACCINATION = { vaccineName: "", date: "", dose: "" };
const EMPTY_DIAGNOSIS = { diagnosisName: "", date: "" };
const EMPTY_INSURANCE = { insurerName: "", planName: "", statementDate: "", serviceDate: "", totalBilled: "", planPaid: "", yourResponsibility: "", claimReference: "" };
const EMPTY_DISCHARGE = { admissionDate: "", dischargeDate: "", primaryDiagnosis: "", attendingPhysician: "", losDays: "" };

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
