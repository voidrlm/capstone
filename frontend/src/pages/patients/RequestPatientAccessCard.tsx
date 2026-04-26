import { Box, Button, Card, CardContent, Chip, CircularProgress, TextField, Typography } from "@mui/material";
import { type PatientAccessSearchResult } from "../../types/patient";

type RequestPatientAccessCardProps = {
  patientEmailSearch: string;
  requestSearchLoading: boolean;
  requestSubmitting: boolean;
  requestSearchResult: PatientAccessSearchResult | null;
  setPatientEmailSearch: (value: string) => void;
  onSearch: () => void;
  onRequestAccess: () => void;
};

export default function RequestPatientAccessCard({
  patientEmailSearch,
  requestSearchLoading,
  requestSubmitting,
  requestSearchResult,
  setPatientEmailSearch,
  onSearch,
  onRequestAccess,
}: RequestPatientAccessCardProps) {
  return (
    <Card sx={{ mb: 2.5, borderRadius: 5 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
              Request Patient Access
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search using the patient&apos;s email. After the patient approves, your organization will be able to view their records.
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) auto" }, gap: 1.5 }}>
            <TextField
              label="Patient Email"
              value={patientEmailSearch}
              onChange={(event) => setPatientEmailSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSearch();
                }
              }}
              placeholder="jane.doe@example.com"
            />
            <Button variant="contained" onClick={onSearch} disabled={requestSearchLoading} sx={{ borderRadius: 999 }}>
              {requestSearchLoading ? <CircularProgress size={20} color="inherit" /> : "Search"}
            </Button>
          </Box>
          {requestSearchResult ? (
            <Box sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.default", display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
              <Box>
                <Typography fontWeight={700}>{requestSearchResult.name}</Typography>
                <Typography variant="body2" color="text.secondary">{requestSearchResult.email}</Typography>
                <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {requestSearchResult.alreadyAccessible ? (
                    <Chip label="Already Accessible" color="success" size="small" />
                  ) : requestSearchResult.requestStatus ? (
                    <Chip
                      label={`Request ${requestSearchResult.requestStatus}`}
                      size="small"
                      color={requestSearchResult.requestStatus === "approved" ? "success" : requestSearchResult.requestStatus === "rejected" ? "error" : "warning"}
                    />
                  ) : (
                    <Chip label="No request yet" size="small" />
                  )}
                </Box>
              </Box>
              <Button
                variant="contained"
                onClick={onRequestAccess}
                disabled={requestSubmitting || requestSearchResult.alreadyAccessible || requestSearchResult.requestStatus === "pending"}
                sx={{ borderRadius: 999 }}
              >
                {requestSubmitting ? <CircularProgress size={18} color="inherit" /> : requestSearchResult.requestStatus === "rejected" ? "Request Again" : "Request Approval"}
              </Button>
            </Box>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );
}
