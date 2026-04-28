import type { PatientDetail, PatientForm, MedicationDialogForm } from "../types/patient";

export const emptyForm: PatientForm = {
  name: "",
  dateOfBirth: "",
  gender: "",
  ageGroup: "",
  medicalHistory: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  visits: [],
  labResults: [],
  diagnoses: [],
  allergies: [],
  vaccinations: [],
  prescriptions: [],
};

export const emptyMedicationForm: MedicationDialogForm = {
  selectedDrug: null,
  search: "",
  suggestions: [],
  dosageLevel: "medium",
  dosageAmount: "",
  startDate: "",
  endDate: "",
  notes: "",
};

export const bottomSnackbarSx = {
  zIndex: (theme: { zIndex: { appBar: number } }) => theme.zIndex.appBar + 1400,
  bottom: { xs: 16, sm: 20 },
};

export const relatedSectionSx = {
  borderRadius: 4,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
};

export function toForm(patient: PatientDetail): PatientForm {
  return {
    name: patient.name,
    dateOfBirth: patient.date_of_birth ? patient.date_of_birth.split("T")[0] : "",
    gender: patient.gender || "",
    ageGroup: patient.age_group || "",
    medicalHistory: (patient.medical_history || []).join(", "),
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    visits: (patient.visits || []).map((visit) => ({
      visitDate: visit.visit_date ? visit.visit_date.split("T")[0] : "",
      reason: visit.reason || "",
      doctorName: visit.doctor_name || "",
      doctorSpecialty: visit.doctor_specialty || "",
    })),
    labResults: (patient.labResults || []).map((lab) => ({
      testName: lab.test_name || "",
      result: lab.result || "",
      date: lab.date ? lab.date.split("T")[0] : "",
      uploadedFileName: lab.uploaded_file_name || "",
      uploadedFileMimeType: lab.uploaded_file_mime_type || "",
      uploadedFileContent: lab.uploaded_file_content || "",
    })),
    diagnoses: (patient.diagnoses || []).map((diagnosis) => ({
      diagnosisName: diagnosis.diagnosis_name || "",
      date: diagnosis.date ? diagnosis.date.split("T")[0] : "",
      uploadedFileName: diagnosis.uploaded_file_name || "",
      uploadedFileMimeType: diagnosis.uploaded_file_mime_type || "",
      uploadedFileContent: diagnosis.uploaded_file_content || "",
    })),
    allergies: (patient.allergies || []).map((allergy) => ({
      allergyName: allergy.allergy_name || "",
    })),
    vaccinations: (patient.vaccinations || []).map((vaccination) => ({
      vaccineName: vaccination.vaccine_name || "",
      date: (vaccination.administered_date || vaccination.date) ? (vaccination.administered_date || vaccination.date).split("T")[0] : "",
      dose: vaccination.dose || "",
    })),
    prescriptions: (patient.prescriptions || []).map((prescription) => ({
      id: prescription.id,
      medications: (
        (prescription.medications && prescription.medications.length > 0)
          ? prescription.medications
          : prescription.medication
            ? [{
                medication_name: prescription.medication,
                drug_id: prescription.drug_id || null,
                dosage_level: "medium",
                start_date: prescription.prescription_date || "",
              }]
            : []
      ).map((item) => ({
        selectedDrug: item.drug_id ? { id: item.drug_id, name: item.medication_name } : null,
        search: item.medication_name || "",
        suggestions: [],
        dosageLevel: item.dosage_level || "medium",
        dosageAmount: item.dosage_amount || "",
        startDate: item.start_date ? item.start_date.split("T")[0] : "",
        endDate: item.end_date ? item.end_date.split("T")[0] : "",
        notes: item.notes || "",
      })),
      instructions: prescription.instructions || "",
      prescriptionDate: prescription.prescription_date ? prescription.prescription_date.split("T")[0] : "",
      doctorName: prescription.doctor_name || "",
      doctorSpecialty: prescription.doctor_specialty || "",
      uploadedFileName: prescription.uploaded_file_name || "",
      uploadedFileMimeType: prescription.uploaded_file_mime_type || "",
      uploadedFileContent: prescription.uploaded_file_content || "",
      approvalStatus: prescription.approval_status === "approved" ? "approved" : "draft",
    })),
  };
}
