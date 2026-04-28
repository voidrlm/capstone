import { Box, Button, Card, CardContent, Chip, CircularProgress, InputAdornment, TextField, Typography } from "@mui/material";
import { Mail, Search, ShieldCheck, UserCheck } from "lucide-react";
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
    <Card sx={{ mb: 2.5, borderRadius: 5, border: "1px solid rgba(148,163,184,0.16)", boxShadow: "0 20px 55px rgba(15,23,42,0.07)", overflow: "hidden" }}>
      <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: "rgba(0,212,170,0.12)", display: "grid", placeItems: "center", border: "1px solid rgba(0,212,170,0.18)", flexShrink: 0 }}>
              <ShieldCheck size={22} color="#008f74" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 0.4, color: "#0f172a" }}>
                Request Patient Access
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Enter the patient email to send an organization access request. Records unlock after patient approval.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) auto" }, gap: 1.5, alignItems: "center" }}>
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={18} color="#64748b" />
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="contained" onClick={onSearch} disabled={requestSearchLoading} startIcon={!requestSearchLoading ? <Search size={18} /> : undefined} sx={{ borderRadius: 999, px: 3, minHeight: 48, fontWeight: 800, boxShadow: "0 12px 28px rgba(25,118,210,0.22)" }}>
              {requestSearchLoading ? <CircularProgress size={20} color="inherit" /> : "Search"}
            </Button>
          </Box>
          {requestSearchResult ? (
            <Box sx={{ p: 2, borderRadius: 3, border: "1px solid rgba(0,212,170,0.18)", bgcolor: "rgba(240,253,250,0.62)", display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: "#fff", display: "grid", placeItems: "center", border: "1px solid rgba(0,212,170,0.18)" }}>
                  <UserCheck size={20} color="#008f74" />
                </Box>
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
