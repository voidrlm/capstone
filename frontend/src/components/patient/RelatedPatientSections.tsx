import type { Dispatch, SetStateAction } from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress } from "@mui/material";
import { VisitsSection } from "./sections/VisitsSection";
import { PrescriptionsSection } from "./sections/PrescriptionsSection";
import { LabResultsSection } from "./sections/LabResultsSection";
import { DiagnosesSection } from "./sections/DiagnosesSection";
import { AllergiesSection } from "./sections/AllergiesSection";
import { VaccinationsSection } from "./sections/VaccinationsSection";
import type { PatientForm, PatientDetail, RelatedPage } from "../../types/patient";

const relatedSectionSx = {
  borderRadius: 5,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
};

interface Props {
  form: PatientForm;
  setForm: Dispatch<SetStateAction<PatientForm>>;
  editable: boolean;
  activePage: RelatedPage;
  setActivePage: Dispatch<SetStateAction<RelatedPage>>;
  onTabChange?: (tab: RelatedPage) => void;
  tabLoading?: RelatedPage | null;
  onStartEdit?: () => void;
  onSave?: () => Promise<boolean>;
  saving?: boolean;
  existingMedicationDrugIds: string[];
  onSavePrescription: (index: number) => Promise<boolean>;
  onDeletePrescription: (index: number) => Promise<void>;
  patientDetail: PatientDetail | null;
  onError: (message: string) => void;
  medicationsSection?: React.ReactNode;
  detailsSection?: React.ReactNode;
  userRole?: string;
}

export function RelatedPatientSections({
  form,
  setForm,
  editable,
  activePage,
  setActivePage,
  onTabChange,
  tabLoading,
  onStartEdit,
  onSave,
  saving,
  existingMedicationDrugIds,
  onSavePrescription,
  onDeletePrescription,
  patientDetail,
  onError,
  medicationsSection,
  detailsSection,
  userRole,
}: Props) {
  const sectionProps = { form, setForm, editable, onStartEdit, onSave, saving };
  const hidePrescriptions = userRole === "nurse" || userRole === "doctor" || userRole === "org_admin";

  const handleTabClick = (tab: RelatedPage) => {
    if (onTabChange) {
      // Parent handles both state update and data loading
      onTabChange(tab);
    } else {
      setActivePage(tab);
    }
  };

  return (
    <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      {editable ? (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          }
        >
          Changes in visits, labs, diagnoses, allergies, and prescriptions are written to the database when you click Save Changes.
        </Alert>
      ) : null}

      <Card variant="outlined" sx={relatedSectionSx}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {[
              { key: "details", label: "Details", count: undefined },
              { key: "visits", label: "Visits", count: form.visits.length },
              ...(!hidePrescriptions ? [{ key: "prescriptions", label: "Prescriptions", count: form.prescriptions.length }] : []),
              { key: "medications", label: "Medications", count: patientDetail?.medications?.length || 0 },
              { key: "labs", label: "Lab Results", count: form.labResults.length },
              { key: "diagnoses", label: "Diagnoses", count: form.diagnoses.length },
              { key: "allergies", label: "Allergies", count: form.allergies.length },
              { key: "vaccinations", label: "Vaccinations", count: form.vaccinations.length },
            ].map((page) => {
              const isActive = activePage === page.key;
              const isLoading = tabLoading === page.key;
              return (
                <Button
                  key={page.key}
                  variant={isActive ? "contained" : "outlined"}
                  onClick={() => handleTabClick(page.key as RelatedPage)}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
                  sx={{
                    borderRadius: 999,
                    px: 1.75,
                    py: 0.85,
                    fontWeight: 700,
                    bgcolor: isActive ? "#00d4aa" : "transparent",
                    color: isActive ? "white" : "#00d4aa",
                    borderColor: "rgba(0,212,170,0.25)",
                    "&:hover": {
                      bgcolor: isActive ? "#00b894" : "rgba(0,212,170,0.08)",
                      borderColor: "rgba(0,212,170,0.35)",
                    },
                  }}
                >
                  {page.label}
                </Button>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Show a loading skeleton while tab data is being fetched */}
      {tabLoading === activePage && activePage !== "details" ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} sx={{ color: "#00d4aa" }} />
        </Box>
      ) : (
        <>
          {activePage === "details" ? detailsSection : null}
          {activePage === "visits" ? <VisitsSection {...sectionProps} /> : null}
          {activePage === "prescriptions" ? (
            <PrescriptionsSection
              {...sectionProps}
              existingMedicationDrugIds={existingMedicationDrugIds}
              onSavePrescription={onSavePrescription}
              onDeletePrescription={onDeletePrescription}
              patientDetail={patientDetail}
              onError={onError}
            />
          ) : null}
          {activePage === "medications" ? medicationsSection : null}
          {activePage === "labs" ? <LabResultsSection {...sectionProps} /> : null}
          {activePage === "diagnoses" ? <DiagnosesSection {...sectionProps} /> : null}
          {activePage === "allergies" ? <AllergiesSection {...sectionProps} /> : null}
          {activePage === "vaccinations" ? <VaccinationsSection {...sectionProps} /> : null}
        </>
      )}
    </Box>
  );
}
