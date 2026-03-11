import { Box, Typography, Card, CardContent, Chip, Button, IconButton, LinearProgress, Divider } from "@mui/material";
import { Pill, AlertCircle, Calendar, RefreshCcw } from "lucide-react";

export default function MyMedicationsPage() {
    const medications = [
        {
            id: 1,
            name: "Lisinopril",
            dosage: "10mg initially, then 20mg once daily",
            prescriber: "Dr. Sarah Jenkins",
            refillsLeft: 2,
            progress: 60,
            status: "Active",
            lastFilled: "2026-02-15",
        },
        {
            id: 2,
            name: "Atorvastatin",
            dosage: "40mg once daily in the evening",
            prescriber: "Dr. Sarah Jenkins",
            refillsLeft: 0,
            progress: 90,
            status: "Refill Needed",
            lastFilled: "2026-01-20",
        },
        {
            id: 3,
            name: "Metformin",
            dosage: "500mg twice daily with meals",
            prescriber: "Dr. Marcus Chen",
            refillsLeft: 5,
            progress: 25,
            status: "Active",
            lastFilled: "2026-03-01",
        },
    ];

    return (
        <Box sx={{ p: 4, maxWidth: 1000, mx: "auto" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Typography variant="h4" fontWeight="bold">My Medications</Typography>
                <Button variant="contained" startIcon={<Pill size={18} />} sx={{ borderRadius: 2 }}>
                    Add Medication
                </Button>
            </Box>

            {/* Stats row */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 3, mb: 4 }}>
                {[
                    { label: "Active Prescriptions", value: "3", color: "primary.main" },
                    { label: "Upcoming Refills", value: "1", color: "warning.main" },
                    { label: "Doses Taken Today", value: "2/3", color: "success.main" },
                ].map((stat, i) => (
                    <Card key={i} sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>{stat.label}</Typography>
                            <Typography variant="h3" fontWeight="bold" sx={{ color: stat.color, mt: 1 }}>{stat.value}</Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Current Prescriptions</Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {medications.map((med) => (
                    <Card key={med.id} sx={{ borderRadius: 3, overflow: "visible", position: "relative" }}>
                        <Box sx={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 6, bgcolor: med.status === "Refill Needed" ? "warning.main" : "primary.main", borderRadius: "12px 0 0 12px" }} />
                        <CardContent sx={{ p: 3, pl: 4 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        {med.name}
                                        <Chip size="small" label={med.status} color={med.status === "Refill Needed" ? "warning" : "success"} sx={{ fontWeight: 600, height: 24 }} />
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{med.dosage}</Typography>
                                </Box>
                                <IconButton size="small"><AlertCircle size={20} /></IconButton>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                                    <Calendar size={16} />
                                    <Typography variant="body2">Last Filled: {med.lastFilled}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                                    <RefreshCcw size={16} />
                                    <Typography variant="body2">{med.refillsLeft} Refills remaining</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Box sx={{ flexGrow: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={med.progress}
                                        sx={{ height: 8, borderRadius: 4, bgcolor: "grey.100", "& .MuiLinearProgress-bar": { bgcolor: med.status === "Refill Needed" ? "warning.main" : "primary.main" } }}
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {med.progress}%
                                </Typography>
                                <Button variant={med.status === "Refill Needed" ? "contained" : "outlined"} color={med.status === "Refill Needed" ? "warning" : "primary"} size="small" sx={{ borderRadius: 2 }}>
                                    Request Refill
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Box>
    );
}
