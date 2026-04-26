import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import {
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Filter,
  Shield,
  X,
} from "lucide-react";
import { fetchCurrentPatientDetail, type PatientDetailApi } from "../lib/patientApi";
import { formatDate } from "../lib/helpers";

type InsuranceEOB = {
  id: string;
  insurerName: string | null;
  planName: string | null;
  memberId: string | null;
  statementDate: string | null;
  serviceDate: string | null;
  totalBilled: string | null;
  totalAllowed: string | null;
  planPaid: string | null;
  yourResponsibility: string | null;
  claimReference: string | null;
  documentId: string | null;
};

const theme = createTheme();

export default function InsurancePage() {
  const [patient, setPatient] = useState<PatientDetailApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEOB, setSelectedEOB] = useState<InsuranceEOB | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState<dayjs.Dayjs | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<dayjs.Dayjs | null>(null);
  const [insurerFilter, setInsurerFilter] = useState<string>("All");

  useEffect(() => {
    let active = true;
    fetchCurrentPatientDetail()
      .then((detail) => {
        if (active) {
          setPatient(detail);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load insurance information");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const insuranceEOBs = useMemo<InsuranceEOB[]>(() => {
    if (!patient) return [];

    return patient.insuranceEOBs.map((eob) => ({
      id: eob.id,
      insurerName: eob.insurer_name,
      planName: eob.plan_name,
      memberId: eob.member_id,
      statementDate: eob.statement_date,
      serviceDate: eob.service_date,
      totalBilled: eob.total_billed,
      totalAllowed: eob.total_allowed,
      planPaid: eob.plan_paid,
      yourResponsibility: eob.your_responsibility,
      claimReference: eob.claim_reference,
      documentId: eob.document_id,
    })).sort((a, b) => {
      const dateA = a.statementDate ? new Date(a.statementDate).getTime() : 0;
      const dateB = b.statementDate ? new Date(b.statementDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [patient]);

  const uniqueInsurers = useMemo(() => {
    const insurers = new Set(insuranceEOBs.map((eob) => eob.insurerName).filter(Boolean));
    return Array.from(insurers);
  }, [insuranceEOBs]);

  const filteredEOBs = useMemo(() => {
    return insuranceEOBs.filter((eob) => {
      if (insurerFilter !== "All" && eob.insurerName !== insurerFilter) {
        return false;
      }

      if (searchFilter) {
        const haystack = [eob.insurerName, eob.planName, eob.claimReference].join(" ").toLowerCase();
        if (!haystack.includes(searchFilter.toLowerCase())) {
          return false;
        }
      }

      const statementDate = eob.statementDate ? new Date(eob.statementDate) : null;
      if (!statementDate || Number.isNaN(statementDate.getTime())) {
        return !startDateFilter && !endDateFilter;
      }

      if (startDateFilter) {
        const start = startDateFilter.startOf("day").toDate();
        if (statementDate < start) {
          return false;
        }
      }

      if (endDateFilter) {
        const end = endDateFilter.endOf("day").toDate();
        if (statementDate > end) {
          return false;
        }
      }

      return true;
    });
  }, [insuranceEOBs, insurerFilter, searchFilter, startDateFilter, endDateFilter]);

  const analytics = useMemo(() => {
    const totalClaims = insuranceEOBs.length;
    const totalBilled = insuranceEOBs.reduce((sum, eob) => sum + (Number(eob.totalBilled) || 0), 0);
    const totalPlanPaid = insuranceEOBs.reduce((sum, eob) => sum + (Number(eob.planPaid) || 0), 0);
    const totalPatientResponsibility = insuranceEOBs.reduce((sum, eob) => sum + (Number(eob.yourResponsibility) || 0), 0);
    const avgCoverage = totalBilled > 0 ? ((totalPlanPaid / totalBilled) * 100).toFixed(1) : "0";

    return {
      totalClaims,
      totalBilled: totalBilled.toFixed(2),
      totalPlanPaid: totalPlanPaid.toFixed(2),
      totalPatientResponsibility: totalPatientResponsibility.toFixed(2),
      avgCoverage,
    };
  }, [insuranceEOBs]);

  const handleEOBClick = (eob: InsuranceEOB) => {
    setSelectedEOB(eob);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEOB(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ pb: 4 }}>
      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError("")} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setError("")} severity="error" variant="filled" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} sx={{ color: "#0f172a", mb: 1 }}>
          Insurance
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b" }}>
          View your insurance Explanation of Benefits (EOB) and claim details
        </Typography>
      </Box>

      {/* Analytics Summary */}
      {insuranceEOBs.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2, mb: 4 }}>
          <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mb: 0.5 }}>
              Total Claims
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: "#8b5cf6" }}>
              {analytics.totalClaims}
            </Typography>
          </Box>
          <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mb: 0.5 }}>
              Total Billed
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: "#3b82f6" }}>
              ${analytics.totalBilled}
            </Typography>
          </Box>
          <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mb: 0.5 }}>
              Plan Paid
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: "#10b981" }}>
              ${analytics.totalPlanPaid}
            </Typography>
          </Box>
          <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mb: 0.5 }}>
              Your Responsibility
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: "#dc2626" }}>
              ${analytics.totalPatientResponsibility}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Filters */}
      {insuranceEOBs.length > 0 && (
        <Box sx={{ mb: 4, p: 2.5, borderRadius: 2, bgcolor: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Filter size={18} color="#64748b" />
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0f172a" }}>
              Filters
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Insurer"
              select
              value={insurerFilter}
              onChange={(e) => setInsurerFilter(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="All">All Insurers</MenuItem>
              {uniqueInsurers.map((insurer) => (
                <MenuItem key={insurer} value={insurer as string}>
                  {insurer}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              size="small"
              label="Search"
              placeholder="Insurer, plan, reference..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
            <DatePicker
              label="From Date"
              value={startDateFilter}
              onChange={(newValue) => setStartDateFilter(newValue)}
              format="MM/DD/YYYY"
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
            <DatePicker
              label="To Date"
              value={endDateFilter}
              onChange={(newValue) => setEndDateFilter(newValue)}
              format="MM/DD/YYYY"
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Box>
        </Box>
      )}

      {filteredEOBs.length === 0 && insuranceEOBs.length > 0 ? (
        <Alert severity="info">No insurance records match your filters.</Alert>
      ) : filteredEOBs.length === 0 ? (
        <Alert severity="info">No insurance records found. Upload insurance documents to see your EOBs here.</Alert>
      ) : (
        <Box sx={{ display: "grid", gap: 3 }}>
          {filteredEOBs.map((eob) => (
            <Card
              key={eob.id}
              variant="outlined"
              sx={{
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  boxShadow: "0 8px 28px rgba(15, 23, 42, 0.12)",
                  transform: "translateY(-2px)",
                },
                borderLeft: "4px solid #8b5cf6",
              }}
              onClick={() => handleEOBClick(eob)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                      <Shield size={20} color="#8b5cf6" />
                      <Chip
                        label="Explanation of Benefits"
                        size="small"
                        sx={{
                          bgcolor: "rgba(139,92,246,0.1)",
                          color: "#8b5cf6",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                        }}
                      />
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ color: "#0f172a", mb: 0.5 }}>
                      {eob.insurerName || "Insurance Claim"}
                    </Typography>
                    {eob.planName && (
                      <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                        {eob.planName}
                      </Typography>
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
                      {eob.statementDate && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Calendar size={16} color="#64748b" />
                          <Typography variant="body2" sx={{ color: "#64748b" }}>
                            Statement: {formatDate(eob.statementDate)}
                          </Typography>
                        </Box>
                      )}
                      {eob.serviceDate && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Calendar size={16} color="#64748b" />
                          <Typography variant="body2" sx={{ color: "#64748b" }}>
                            Service: {formatDate(eob.serviceDate)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    {eob.yourResponsibility && (
                      <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                        <DollarSign size={16} color="#dc2626" />
                        <Typography variant="body2" fontWeight={600} sx={{ color: "#dc2626" }}>
                          You owe: ${Number(eob.yourResponsibility).toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, maxHeight: "90vh" },
        }}
      >
        {selectedEOB && (
          <>
            <DialogTitle
              sx={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, #fff 100%)",
                borderBottom: "1px solid rgba(139,92,246,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    bgcolor: "#8b5cf6",
                    display: "grid",
                    placeItems: "center",
                    border: "4px solid #fff",
                    boxShadow: "0 0 0 3px rgba(139,92,246,0.22), 0 8px 28px rgba(139,92,246,0.44)",
                  }}
                >
                  <Shield size={22} color="#fff" />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a" }}>
                    {selectedEOB.insurerName || "Insurance Claim"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
                    Explanation of Benefits
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={handleCloseDialog} sx={{ ml: "auto" }}>
                <X size={20} />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: "grid", gap: 2.5 }}>
                {selectedEOB.planName && (
                  <Box>
                    <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                      PLAN
                    </Typography>
                    <Box sx={{ mt: 1.5, p: 2, borderRadius: 2, bgcolor: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)" }}>
                      <Typography variant="body1" sx={{ color: "#0f172a", fontWeight: 600 }}>
                        {selectedEOB.planName}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {selectedEOB.memberId && (
                  <Box>
                    <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                      MEMBER ID
                    </Typography>
                    <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                      <CreditCard size={18} color="#64748b" />
                      <Typography variant="body1" sx={{ color: "#334155", fontWeight: 600 }}>
                        {selectedEOB.memberId}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    DATES
                  </Typography>
                  <Box sx={{ mt: 1.5, display: "grid", gap: 1.5 }}>
                    {selectedEOB.statementDate && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Calendar size={18} color="#64748b" />
                        <Typography variant="body2" sx={{ color: "#4b5563" }}>
                          Statement Date: {formatDate(selectedEOB.statementDate)}
                        </Typography>
                      </Box>
                    )}
                    {selectedEOB.serviceDate && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Calendar size={18} color="#64748b" />
                        <Typography variant="body2" sx={{ color: "#4b5563" }}>
                          Service Date: {formatDate(selectedEOB.serviceDate)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    FINANCIAL SUMMARY
                  </Typography>
                  <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                    {selectedEOB.totalBilled && (
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(15,23,42,0.06)" }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                          Total Billed
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>
                          ${Number(selectedEOB.totalBilled).toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    {selectedEOB.totalAllowed && (
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(15,23,42,0.06)" }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                          Allowed Amount
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>
                          ${Number(selectedEOB.totalAllowed).toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    {selectedEOB.planPaid && (
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(34,197,94,0.08)" }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                          Plan Paid
                        </Typography>
                        <Typography variant="body1" fontWeight={700} sx={{ color: "#16a34a" }}>
                          ${Number(selectedEOB.planPaid).toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    {selectedEOB.yourResponsibility && (
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(239,68,68,0.08)" }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                          Your Responsibility
                        </Typography>
                        <Typography variant="body1" fontWeight={700} sx={{ color: "#dc2626" }}>
                          ${Number(selectedEOB.yourResponsibility).toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {selectedEOB.claimReference && (
                  <Box>
                    <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                      CLAIM REFERENCE
                    </Typography>
                    <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                      <FileText size={18} color="#64748b" />
                      <Typography variant="body2" sx={{ color: "#64748b", fontFamily: "monospace" }}>
                        {selectedEOB.claimReference}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
    </LocalizationProvider>
    </ThemeProvider>
  );
}
