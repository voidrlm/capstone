import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Button, Avatar } from "@mui/material";
import { AlertCircle, CheckCircle, Search, Filter, MessageSquare, FileText } from "lucide-react";

export default function ProviderAssessmentsPage() {
    const assesments = [
        { id: "A-001", patient: "Michael Chen", dob: "1984-05-12", riskScore: 82, trend: "+5", riskLevel: "High", flag: "Medication Adherence drop", lastAssessed: "Today, 09:15 AM" },
        { id: "A-002", patient: "Sarah Jenkins", dob: "1979-11-23", riskScore: 45, trend: "-2", riskLevel: "Low", flag: "None", lastAssessed: "Yesterday" },
        { id: "A-003", patient: "Robert Smith", dob: "1965-02-08", riskScore: 94, trend: "+12", riskLevel: "Critical", flag: "Elevated BP, Severe Side Effect", lastAssessed: "Today, 08:30 AM" },
        { id: "A-004", patient: "Emily Davis", dob: "1992-07-30", riskScore: 68, trend: "+1", riskLevel: "Medium", flag: "Missed Appointment", lastAssessed: "Mar 09, 2026" },
    ];

    const getRiskColor = (level: string) => {
        switch (level) {
            case "Critical": return "error";
            case "High": return "warning";
            case "Medium": return "info";
            default: return "success";
        }
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Typography variant="h4" fontWeight="bold">Patient Risk Assessments</Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button variant="outlined" startIcon={<Filter size={18} />} sx={{ borderRadius: 2 }}>Filter by Risk</Button>
                    <Button variant="contained" sx={{ borderRadius: 2 }}>Run Batch Assessment</Button>
                </Box>
            </Box>

            {/* Summary Stats */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" }, gap: 3, mb: 4 }}>
                {[
                    { label: "Total Monitored", value: "128", secondary: "Active Cohort" },
                    { label: "Critical Risk", value: "3", secondary: "Requires immediate action", color: "error.main" },
                    { label: "High Risk", value: "14", secondary: "Review within 48h", color: "warning.main" },
                    { label: "Assessments Today", value: "42", secondary: "Automated runs" },
                ].map((stat, i) => (
                    <Card key={i} sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>{stat.label}</Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, color: stat.color || "text.primary" }}>{stat.value}</Typography>
                            <Typography variant="caption" color="text.secondary">{stat.secondary}</Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* Action Queue */}
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6" fontWeight="bold">Active Risk Queue</Typography>
                    <IconButton><Search size={20} /></IconButton>
                </Box>
                <TableContainer component={Box} sx={{ overflowX: "auto" }}>
                    <Table>
                        <TableHead sx={{ bgcolor: "grey.50" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Risk Score & Trend</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Risk Level</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Primary Flag</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Last Assessed</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Clinical Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {assesments.map((row) => (
                                <TableRow key={row.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.light", color: "primary.dark", fontSize: 14 }}>
                                                {row.patient.split(" ").map(n => n[0]).join("")}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">{row.patient}</Typography>
                                                <Typography variant="caption" color="text.secondary">DOB: {row.dob}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">{row.riskScore} <span style={{ color: row.trend.startsWith("+") ? "#d32f2f" : "#2e7d32", fontSize: 12, marginLeft: 4 }}>({row.trend})</span></Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip size="small" label={row.riskLevel} color={getRiskColor(row.riskLevel)} sx={{ fontWeight: 600 }} />
                                    </TableCell>
                                    <TableCell>
                                        {row.flag !== "None" ? (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "warning.800" }}>
                                                <AlertCircle size={14} />
                                                <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>{row.flag}</Typography>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "success.main" }}>
                                                <CheckCircle size={14} />
                                                <Typography variant="body2">Stable</Typography>
                                            </Box>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ color: "text.secondary", fontSize: "0.875rem" }}>{row.lastAssessed}</TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                                            <IconButton size="small" color="primary" title="View Report"><FileText size={18} /></IconButton>
                                            <IconButton size="small" color="info" title="Message Patient"><MessageSquare size={18} /></IconButton>
                                            <Button size="small" variant="outlined" sx={{ borderRadius: 2, ml: 1, fontSize: "0.75rem" }}>Review</Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Box>
    );
}
