import { Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem, Chip, Divider, Avatar } from "@mui/material";
import { AlertCircle, Plus, Send, Info } from "lucide-react";

export default function SideEffectsPage() {
    const pastReports = [
        {
            date: "Mar 01, 2026",
            medication: "Atorvastatin",
            symptom: "Muscle Aches",
            severity: "Moderate",
            status: "Reviewed",
            doctorNote: "Suggested taking CoQ10 supplement. Will monitor at next visit.",
        },
        {
            date: "Jan 10, 2026",
            medication: "Lisinopril",
            symptom: "Dry Cough",
            severity: "Mild",
            status: "Resolved",
            doctorNote: "Common side effect. Has subsided over time.",
        }
    ];

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Side Effects & Symptoms
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Report new symptoms and track your side effect history
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Form Column */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{ height: "100%", overflow: "hidden" }}>
                        <Box
                            sx={{
                                p: 3,
                                background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #2563eb 100%)",
                                color: "white",
                                position: "relative",
                                overflow: "hidden",
                            }}
                        >
                            <Box sx={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", bgcolor: "rgba(96,165,250,0.1)" }} />
                            <Box sx={{ position: "relative", zIndex: 1 }}>
                                <Typography variant="h6" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Plus size={20} /> Report New Symptom
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
                                    Log any unusual feelings or side effects linked to your medications.
                                </Typography>
                            </Box>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                                <TextField select label="Select Medication" fullWidth defaultValue="Atorvastatin" variant="outlined">
                                    <MenuItem value="Lisinopril">Lisinopril</MenuItem>
                                    <MenuItem value="Atorvastatin">Atorvastatin</MenuItem>
                                    <MenuItem value="Metformin">Metformin</MenuItem>
                                    <MenuItem value="Other">Other / Not Sure</MenuItem>
                                </TextField>

                                <TextField label="Symptom Experienced" placeholder="E.g., Dizziness, Nausea, Muscle Aches" fullWidth />

                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField select label="Severity" fullWidth defaultValue="Mild">
                                            <MenuItem value="Mild">Mild</MenuItem>
                                            <MenuItem value="Moderate">Moderate</MenuItem>
                                            <MenuItem value="Severe">Severe</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField type="date" label="Onset Date" InputLabelProps={{ shrink: true }} fullWidth defaultValue="2026-03-11" />
                                    </Grid>
                                </Grid>

                                <TextField label="Additional Details" multiline rows={4} placeholder="Describe how often it happens, time of day, etc." fullWidth />

                                <Box
                                    sx={{
                                        bgcolor: "#f0f9ff",
                                        p: 2,
                                        borderRadius: 3,
                                        display: "flex",
                                        gap: 2,
                                        alignItems: "flex-start",
                                        border: "1px solid",
                                        borderColor: "#bae6fd",
                                    }}
                                >
                                    <Info size={22} color="#0284c7" style={{ flexShrink: 0, marginTop: 2 }} />
                                    <Typography variant="caption" color="text.secondary">
                                        For severe or life-threatening symptoms, please seek immediate emergency medical care. Do not use this form.
                                    </Typography>
                                </Box>

                                <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    startIcon={<Send size={18} />}
                                    sx={{
                                        mt: 0.5,
                                        py: 1.5,
                                        bgcolor: "#0f172a",
                                        "&:hover": { bgcolor: "#1e293b" },
                                    }}
                                >
                                    Submit Report
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* History Column */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
                        Report History
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                        {pastReports.map((report, idx) => (
                            <Card key={idx}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                        <Box>
                                            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>{report.symptom}</Typography>
                                            <Typography variant="body2" color="text.secondary">Reported on {report.date} for {report.medication}</Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Chip
                                                size="small"
                                                label={report.severity}
                                                sx={{
                                                    bgcolor: report.severity === "Moderate" ? "#fffbeb" : "#f1f5f9",
                                                    color: report.severity === "Moderate" ? "#d97706" : "#64748b",
                                                    fontWeight: 600,
                                                    border: "1px solid",
                                                    borderColor: report.severity === "Moderate" ? "#fde68a" : "#e2e8f0",
                                                }}
                                            />
                                            <Chip
                                                size="small"
                                                label={report.status}
                                                sx={{
                                                    bgcolor: report.status === "Reviewed" ? "#f0f9ff" : "#f0fdf4",
                                                    color: report.status === "Reviewed" ? "#0284c7" : "#16a34a",
                                                    fontWeight: 600,
                                                    border: "1px solid",
                                                    borderColor: report.status === "Reviewed" ? "#bae6fd" : "#bbf7d0",
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    <Box
                                        sx={{
                                            bgcolor: "#f8fafc",
                                            p: 2,
                                            borderRadius: 3,
                                            display: "flex",
                                            gap: 2,
                                            border: "1px solid",
                                            borderColor: "divider",
                                        }}
                                    >
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: "#2563eb", fontSize: "0.75rem", fontWeight: 700 }}>Dr</Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={700}>Provider Note</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>"{report.doctorNote}"</Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>

                    <Card
                        sx={{
                            mt: 3,
                            bgcolor: "#fffbeb",
                            border: "1px solid",
                            borderColor: "#fde68a",
                            boxShadow: "none",
                        }}
                    >
                        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, "&:last-child": { pb: 2 } }}>
                            <AlertCircle color="#d97706" size={22} />
                            <Typography variant="body2" color="text.primary">
                                You currently have 1 unresolved "Moderate" symptom report being reviewed by Dr. Sarah Jenkins. You will be notified when a note is added.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
