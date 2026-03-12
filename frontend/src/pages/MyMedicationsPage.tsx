import { Box, Typography, Card, CardContent, Chip, Button, IconButton, LinearProgress, Avatar } from "@mui/material";
import { Pill, AlertCircle, Calendar, RefreshCcw, Clock } from "lucide-react";

export default function MyMedicationsPage() {
    const medications = [
        { id: 1, name: "Lisinopril", dosage: "10mg initially, then 20mg once daily", prescriber: "Dr. Sarah Jenkins", refillsLeft: 2, progress: 60, status: "Active", lastFilled: "2026-02-15", frequency: "Once daily" },
        { id: 2, name: "Atorvastatin", dosage: "40mg once daily in the evening", prescriber: "Dr. Sarah Jenkins", refillsLeft: 0, progress: 90, status: "Refill Needed", lastFilled: "2026-01-20", frequency: "Once daily (evening)" },
        { id: 3, name: "Metformin", dosage: "500mg twice daily with meals", prescriber: "Dr. Marcus Chen", refillsLeft: 5, progress: 25, status: "Active", lastFilled: "2026-03-01", frequency: "Twice daily" },
    ];

    const getStatusStyle = (status: string) => status === "Refill Needed"
        ? { bgcolor: "#fef2f2", color: "#dc2626", border: "#fecaca" }
        : { bgcolor: "#f0fdf4", color: "#16a34a", border: "#dcfce7" };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>My Medications</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Track your prescriptions and manage refills</Typography>
                </Box>
                <Button variant="contained" startIcon={<Pill size={18} />} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>Add Medication</Button>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2.5, mb: 4 }}>
                {[
                    { label: "Active Prescriptions", value: "3", icon: Pill, color: "#2563eb", bg: "#eff6ff" },
                    { label: "Upcoming Refills", value: "1", icon: Clock, color: "#d97706", bg: "#fffbeb" },
                    { label: "Doses Taken Today", value: "2/3", icon: AlertCircle, color: "#16a34a", bg: "#f0fdf4" },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={i} sx={{ position: "relative", overflow: "hidden" }}>
                            <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: stat.color, opacity: 0.7 }} />
                            <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
                                <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: stat.bg, display: "flex" }}><Icon size={22} color={stat.color} /></Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>{stat.label}</Typography>
                                    <Typography variant="h4" fontWeight={800} color="text.primary">{stat.value}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>

            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Current Prescriptions</Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {medications.map((med) => {
                    const statusStyle = getStatusStyle(med.status);
                    return (
                        <Card key={med.id} sx={{ overflow: "visible", position: "relative" }}>
                            <Box sx={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, bgcolor: med.status === "Refill Needed" ? "#d97706" : "#2563eb", borderRadius: "16px 0 0 16px" }} />
                            <CardContent sx={{ p: 3, pl: 4 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                                        <Avatar sx={{ width: 44, height: 44, bgcolor: med.status === "Refill Needed" ? "#fffbeb" : "#eff6ff", color: med.status === "Refill Needed" ? "#d97706" : "#2563eb" }}><Pill size={22} /></Avatar>
                                        <Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                <Typography variant="h6" fontWeight={700}>{med.name}</Typography>
                                                <Chip size="small" label={med.status} sx={{ bgcolor: statusStyle.bgcolor, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontWeight: 600, height: 24, fontSize: "0.7rem" }} />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">{med.dosage}</Typography>
                                            <Typography variant="caption" color="text.secondary">{med.frequency} &bull; Prescribed by {med.prescriber}</Typography>
                                        </Box>
                                    </Box>
                                    <IconButton size="small" sx={{ color: "text.secondary" }}><AlertCircle size={18} /></IconButton>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9", flexWrap: "wrap", gap: 2 }}>
                                    <Box sx={{ display: "flex", gap: 3 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "text.secondary" }}><Calendar size={14} /><Typography variant="caption" fontWeight={500}>Last: {med.lastFilled}</Typography></Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "text.secondary" }}><RefreshCcw size={14} /><Typography variant="caption" fontWeight={500}>{med.refillsLeft} refills left</Typography></Box>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
                                        <Box sx={{ flexGrow: 1, minWidth: 100 }}>
                                            <LinearProgress variant="determinate" value={med.progress} sx={{ height: 6, borderRadius: 4, bgcolor: "#e2e8f0", "& .MuiLinearProgress-bar": { bgcolor: med.status === "Refill Needed" ? "#d97706" : "#2563eb", borderRadius: 4 } }} />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ minWidth: 30, textAlign: "right" }}>{med.progress}%</Typography>
                                        <Button variant={med.status === "Refill Needed" ? "contained" : "outlined"} size="small" sx={{ borderRadius: 2, fontWeight: 600, fontSize: "0.75rem", ...(med.status === "Refill Needed" ? { bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } } : { borderColor: "#e2e8f0", color: "text.primary", "&:hover": { borderColor: "#cbd5e1" } }) }}>Request Refill</Button>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        </Box>
    );
}
