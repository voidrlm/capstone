import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
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
  ReceiptText,
  Search,
  Shield,
  TrendingUp,
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

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
  },
});

function formatCurrency(value: string | number | null | undefined) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return "$0.00";
  }
  return `$${numberValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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

      <Box
        sx={{
          mb: 3,
          p: { xs: 2.5, md: 3.25 },
          borderRadius: 5,
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #ffffff 0%, #f3f7ff 48%, #f0fdfa 100%)",
          border: "1px solid rgba(148,163,184,0.16)",
          boxShadow: "0 24px 70px rgba(15,23,42,0.07)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 12% 18%, rgba(139,92,246,0.14), transparent 25%), radial-gradient(circle at 86% 16%, rgba(16,185,129,0.14), transparent 24%)",
            pointerEvents: "none",
          }}
        />
        <Box sx={{ position: "relative", display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ maxWidth: 680 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.25 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 3,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(139,92,246,0.12)",
                  border: "1px solid rgba(139,92,246,0.18)",
                }}
              >
                <Shield size={22} color="#7c3aed" />
              </Box>
              <Chip
                label={`${filteredEOBs.length} visible`}
                size="small"
                sx={{ bgcolor: "rgba(15,23,42,0.06)", color: "#334155", fontWeight: 800 }}
              />
            </Box>
            <Typography variant="h4" fontWeight={900} sx={{ color: "#0f172a", mb: 1, letterSpacing: 0 }}>
              Insurance
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748b", maxWidth: 590 }}>
              Track EOBs, payer payments, claim dates, and your out-of-pocket responsibility in one clean view.
            </Typography>
          </Box>
          <Box
            sx={{
              alignSelf: { xs: "stretch", md: "center" },
              minWidth: { xs: "100%", sm: 280 },
              p: 2,
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.75)",
              border: "1px solid rgba(148,163,184,0.18)",
              backdropFilter: "blur(16px)",
            }}
          >
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
              Average Coverage
            </Typography>
            <Typography variant="h5" fontWeight={900} sx={{ color: "#0f766e", lineHeight: 1.1, mt: 0.4 }}>
              {analytics.avgCoverage}%
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
              paid against total billed
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Analytics Summary */}
      {insuranceEOBs.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
          {[
            { label: "Total Claims", value: analytics.totalClaims, color: "#7c3aed", icon: ReceiptText },
            { label: "Total Billed", value: formatCurrency(analytics.totalBilled), color: "#2563eb", icon: DollarSign },
            { label: "Plan Paid", value: formatCurrency(analytics.totalPlanPaid), color: "#059669", icon: TrendingUp },
            { label: "Your Responsibility", value: formatCurrency(analytics.totalPatientResponsibility), color: "#dc2626", icon: CreditCard },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Box
                key={stat.label}
                sx={{
                  p: 2.25,
                  borderRadius: 3,
                  bgcolor: "#fff",
                  border: `1px solid ${alpha(stat.color, 0.16)}`,
                  boxShadow: `0 16px 36px ${alpha(stat.color, 0.08)}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  minHeight: 104,
                }}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2.5,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(stat.color, 0.1),
                    border: `1px solid ${alpha(stat.color, 0.18)}`,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={21} color={stat.color} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800, display: "block" }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={900} sx={{ color: stat.color, lineHeight: 1.15, wordBreak: "break-word" }}>
                    {stat.value}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Filters */}
      {insuranceEOBs.length > 0 && (
        <Box sx={{ mb: 3, p: { xs: 2, md: 2.5 }, borderRadius: 4, bgcolor: "#fff", border: "1px solid rgba(148,163,184,0.16)", boxShadow: "0 14px 42px rgba(15,23,42,0.06)" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: "rgba(139,92,246,0.1)", display: "grid", placeItems: "center" }}>
                <Filter size={18} color="#7c3aed" />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={900} sx={{ color: "#0f172a" }}>
                  Filter Insurance
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Narrow by payer, plan, claim reference, or statement date
                </Typography>
              </Box>
            </Box>
            <Button
              size="small"
              onClick={() => {
                setSearchFilter("");
                setInsurerFilter("All");
                setStartDateFilter(null);
                setEndDateFilter(null);
              }}
              sx={{ color: "#7c3aed", fontWeight: 800, textTransform: "none" }}
            >
              Reset
            </Button>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "0.95fr 1.35fr 1fr 1fr" }, gap: 1.5 }}>
            <TextField
              id="insurance-insurer-filter"
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
              id="insurance-search"
              fullWidth
              size="small"
              label="Search"
              placeholder="Insurer, plan, reference..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              InputProps={{
                startAdornment: <Search size={17} color="#64748b" style={{ marginRight: 8, flexShrink: 0 }} />,
              }}
            />
            <DatePicker
              label="From Date"
              value={startDateFilter}
              onChange={(newValue) => setStartDateFilter(newValue)}
              format="MM/DD/YYYY"
              slotProps={{
                textField: { size: "small", fullWidth: true },
                popper: { sx: { "& .MuiIconButton-root": { color: "#333" } } },
              }}
            />
            <DatePicker
              label="To Date"
              value={endDateFilter}
              onChange={(newValue) => setEndDateFilter(newValue)}
              format="MM/DD/YYYY"
              slotProps={{
                textField: { size: "small", fullWidth: true },
                popper: { sx: { "& .MuiIconButton-root": { color: "#333" } } },
              }}
            />
          </Box>
        </Box>
      )}

      {filteredEOBs.length === 0 && insuranceEOBs.length > 0 ? (
        <Alert severity="info">No insurance records match your filters.</Alert>
      ) : filteredEOBs.length === 0 ? (
        <Alert severity="info">No insurance records found. Upload insurance documents to see your EOBs here.</Alert>
      ) : (
        <Box sx={{ display: "grid", gap: 2.25 }}>
          {filteredEOBs.map((eob, index) => (
            <Card
              key={eob.id}
              component={motion.button}
              type="button"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: Math.min(index * 0.035, 0.3) }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              sx={{
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                borderRadius: 4,
                border: "1px solid rgba(124,58,237,0.18)",
                background: "linear-gradient(135deg, #ffffff 0%, #fbf8ff 54%, #f8fffd 100%)",
                boxShadow: "0 18px 44px rgba(15,23,42,0.07)",
                overflow: "hidden",
                position: "relative",
                "&:before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  width: 7,
                  bgcolor: "#7c3aed",
                },
                "&:after": {
                  content: '""',
                  position: "absolute",
                  right: -62,
                  top: -82,
                  width: 190,
                  height: 190,
                  borderRadius: "50%",
                  background: "rgba(124,58,237,0.09)",
                  pointerEvents: "none",
                },
              }}
              onClick={() => handleEOBClick(eob)}
            >
              <CardContent sx={{ p: { xs: 2.25, md: 2.75 }, position: "relative", zIndex: 1 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 2.25, alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: { xs: 1.75, md: 2.25 }, minWidth: 0 }}>
                    <Box
                      sx={{
                        width: { xs: 52, md: 60 },
                        height: { xs: 52, md: 60 },
                        borderRadius: 3,
                        bgcolor: "rgba(124,58,237,0.1)",
                        border: "1px solid rgba(124,58,237,0.2)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        boxShadow: "0 14px 30px rgba(124,58,237,0.12)",
                      }}
                    >
                      <Shield size={26} color="#7c3aed" />
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Chip
                        label="Explanation of Benefits"
                        size="small"
                        sx={{
                          bgcolor: "rgba(124,58,237,0.1)",
                          color: "#7c3aed",
                          border: "1px solid rgba(124,58,237,0.18)",
                          fontWeight: 900,
                          fontSize: "0.72rem",
                          mb: 1,
                        }}
                      />
                      <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", lineHeight: 1.22, wordBreak: "break-word" }}>
                        {eob.insurerName || "Insurance Claim"}
                      </Typography>
                      {eob.planName ? (
                        <Typography variant="body2" sx={{ color: "#64748b", mt: 0.6, fontWeight: 700 }}>
                          {eob.planName}
                        </Typography>
                      ) : null}

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.4, mt: 1.5, flexWrap: "wrap" }}>
                      {eob.statementDate && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.65 }}>
                          <Calendar size={16} color="#64748b" />
                          <Typography variant="body2" sx={{ color: "#475569", fontWeight: 700 }}>
                            Statement: {formatDate(eob.statementDate)}
                          </Typography>
                        </Box>
                      )}
                      {eob.serviceDate && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.65 }}>
                          <Calendar size={16} color="#64748b" />
                          <Typography variant="body2" sx={{ color: "#475569", fontWeight: 700 }}>
                            Service: {formatDate(eob.serviceDate)}
                          </Typography>
                        </Box>
                      )}
                      {eob.claimReference ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.65 }}>
                          <FileText size={16} color="#64748b" />
                          <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 700, fontFamily: "monospace" }}>
                            {eob.claimReference}
                          </Typography>
                        </Box>
                      ) : null}
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" },
                      gap: 1,
                      minWidth: { lg: 390 },
                    }}
                  >
                    {[
                      { label: "Billed", value: eob.totalBilled, color: "#2563eb" },
                      { label: "Plan Paid", value: eob.planPaid, color: "#059669" },
                      { label: "You Owe", value: eob.yourResponsibility, color: "#dc2626" },
                    ].map((amount) => (
                      <Box
                        key={amount.label}
                        sx={{
                          p: 1.35,
                          borderRadius: 2,
                          bgcolor: alpha(amount.color, 0.08),
                          border: `1px solid ${alpha(amount.color, 0.14)}`,
                          minWidth: 0,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800, display: "block" }}>
                          {amount.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: amount.color, fontWeight: 900, wordBreak: "break-word" }}>
                          {amount.value ? formatCurrency(amount.value) : "-"}
                        </Typography>
                      </Box>
                    ))}
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
