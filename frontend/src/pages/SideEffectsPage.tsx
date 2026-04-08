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
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Side Effects & Symptoms
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Report new symptoms and track your side effect history
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{ height: "100%", overflow: "hidden" }}>
                        <Box
                            sx={{
                                p: 3,
                                background: "linear-gradient(135deg, #04080f 0%, #0a1628 55%, #0c2820 100%)",
                                color: "white",
                                position: "relative",
                                overflow: "hidden",
                            }}
                        >
                            <Box sx={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.1)" }} />
                            <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(0,212,170,0.07) 0%, transparent 70%)" }} />
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
                                        bgcolor: "rgba(2,132,199,0.08)",
                                        p: 2,
                                        borderRadius: 3,
                                        display: "flex",
                                        gap: 2,
                                        alignItems: "flex-start",
                                        border: "1px solid",
                                        borderColor: "rgba(2,132,199,0.2)",
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
                                    sx={{ mt: 0.5, py: 1.5 }}
                                >
                                    Submit Report
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

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
                                                    bgcolor: report.severity === "Moderate" ? "rgba(217,119,6,0.12)" : "rgba(100,116,139,0.1)",
                                                    color: report.severity === "Moderate" ? "#d97706" : "#64748b",
                                                    fontWeight: 600,
                                                    border: "1px solid",
                                                    borderColor: report.severity === "Moderate" ? "rgba(217,119,6,0.25)" : "rgba(100,116,139,0.2)",
                                                }}
                                            />
                                            <Chip
                                                size="small"
                                                label={report.status}
                                                sx={{
                                                    bgcolor: report.status === "Reviewed" ? "rgba(2,132,199,0.12)" : "rgba(22,163,74,0.12)",
                                                    color: report.status === "Reviewed" ? "#0284c7" : "#16a34a",
                                                    fontWeight: 600,
                                                    border: "1px solid",
                                                    borderColor: report.status === "Reviewed" ? "rgba(2,132,199,0.25)" : "rgba(22,163,74,0.25)",
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    <Box
                                        sx={{
                                            bgcolor: "action.hover",
                                            p: 2,
                                            borderRadius: 3,
                                            display: "flex",
                                            gap: 2,
                                            border: "1px solid",
                                            borderColor: "divider",
                                        }}
                                    >
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: "rgba(0,212,170,0.15)", color: "#00d4aa", fontSize: "0.75rem", fontWeight: 700 }}>Dr</Avatar>
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
                            bgcolor: "rgba(217,119,6,0.08)",
                            border: "1px solid",
                            borderColor: "rgba(217,119,6,0.25)",
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
