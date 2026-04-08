import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Button, Avatar } from "@mui/material";
import { AlertCircle, CheckCircle, Search, Filter, MessageSquare, FileText, Activity, Users, AlertTriangle, Sparkles } from "lucide-react";

export default function ProviderAssessmentsPage() {
    const assessments = [
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

    const stats = [
        { label: "Total Monitored", value: "128", secondary: "Active Cohort", color: "#00d4aa", bg: "rgba(0,212,170,0.1)", icon: Users },
        { label: "Critical Risk", value: "3", secondary: "Requires immediate action", color: "#dc2626", bg: "rgba(220,38,38,0.1)", icon: AlertTriangle },
        { label: "High Risk", value: "14", secondary: "Review within 48h", color: "#d97706", bg: "rgba(217,119,6,0.1)", icon: AlertCircle },
        { label: "Assessments Today", value: "42", secondary: "Automated runs", color: "#16a34a", bg: "rgba(22,163,74,0.1)", icon: Activity },
    ];

    return (
        <Box>
            <Box sx={{ mb: 4, p: { xs: 3, sm: 4 }, borderRadius: 4, background: "linear-gradient(135deg, #04080f 0%, #0a1628 55%, #0c2820 100%)", color: "white", position: "relative", overflow: "hidden", display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                <Box sx={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.08)" }} />
                <Box sx={{ position: "absolute", bottom: -60, right: 100, width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.05)" }} />
                <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(0,212,170,0.07) 0%, transparent 70%)" }} />
                <Box sx={{ position: "relative", zIndex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Sparkles size={18} color="#00d4aa" />
                        <Chip label="Risk Assessments" size="small" sx={{ bgcolor: "rgba(0,212,170,0.18)", color: "#00d4aa", fontWeight: 600, height: 24, fontSize: "0.7rem" }} />
                    </Box>
                    <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>Patient Risk Assessments</Typography>
                    <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>Monitor and manage patient risk scores across your cohort</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1.5, position: "relative", zIndex: 1 }}>
                    <Button variant="contained" startIcon={<Filter size={18} />} sx={{ bgcolor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>Filter by Risk</Button>
                    <Button variant="contained" sx={{ bgcolor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>Run Batch Assessment</Button>
                </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" }, gap: 2.5, mb: 3 }}>
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={i} sx={{ position: "relative", overflow: "hidden", transition: "all 0.2s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" } }}>
                            <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: stat.color }} />
                            <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
                                <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: stat.bg, display: "flex" }}><Icon size={22} color={stat.color} /></Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>{stat.label}</Typography>
                                    <Typography variant="h4" fontWeight={800} sx={{ color: stat.color }}>{stat.value}</Typography>
                                    <Typography variant="caption" color="text.secondary">{stat.secondary}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>

            <Card>
                <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "background.default", borderRadius: "16px 16px 0 0" }}>
                    <Typography variant="h6" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Activity size={20} color="#00d4aa" /> Active Risk Queue
                    </Typography>
                    <IconButton sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}><Search size={18} /></IconButton>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Patient</TableCell>
                                <TableCell>Risk Score & Trend</TableCell>
                                <TableCell>Risk Level</TableCell>
                                <TableCell>Primary Flag</TableCell>
                                <TableCell>Last Assessed</TableCell>
                                <TableCell align="right">Clinical Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {assessments.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(0,212,170,0.12)", color: "#00d4aa", fontSize: 13, fontWeight: 700 }}>
                                                {row.patient.split(" ").map(n => n[0]).join("")}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>{row.patient}</Typography>
                                                <Typography variant="caption" color="text.secondary">DOB: {row.dob}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Typography variant="body2" fontWeight={700}>{row.riskScore}</Typography>
                                            <Chip size="small" label={row.trend} sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700, bgcolor: row.trend.startsWith("+") ? "rgba(220,38,38,0.12)" : "rgba(22,163,74,0.12)", color: row.trend.startsWith("+") ? "#dc2626" : "#16a34a" }} />
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip size="small" label={row.riskLevel} color={getRiskColor(row.riskLevel) as any} sx={{ fontWeight: 600, fontSize: "0.7rem" }} />
                                    </TableCell>
                                    <TableCell>
                                        {row.flag !== "None" ? (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                                <AlertCircle size={14} color="#d97706" />
                                                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }} noWrap>{row.flag}</Typography>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "#16a34a" }}>
                                                <CheckCircle size={14} />
                                                <Typography variant="body2" fontWeight={500}>Stable</Typography>
                                            </Box>
                                        )}
                                    </TableCell>
                                    <TableCell><Typography variant="body2" color="text.secondary">{row.lastAssessed}</Typography></TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                                            <IconButton size="small" title="View Report" sx={{ color: "#00d4aa" }}><FileText size={16} /></IconButton>
                                            <IconButton size="small" title="Message Patient" sx={{ color: "#0284c7" }}><MessageSquare size={16} /></IconButton>
                                            <Button size="small" variant="text" sx={{ fontWeight: 600, fontSize: "0.75rem", color: "primary.main" }}>Review</Button>
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
