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
        <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>Side Effects & Symptoms</Typography>

            <Grid container spacing={4}>
                {/* Form Column */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: "0 8px 30px rgba(0,0,0,0.06)", height: "100%" }}>
                        <Box sx={{ p: 3, bgcolor: "primary.main", color: "white", borderRadius: "12px 12px 0 0" }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Plus size={20} /> Report New Symptom
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                                Log any unusual feelings or side effects linked to your medications.
                            </Typography>
                        </Box>
                        <CardContent sx={{ p: 4 }}>
                            <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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

                                <Box sx={{ bgcolor: "info.50", p: 2, borderRadius: 2, display: "flex", gap: 2, alignItems: "flex-start", mt: 1 }}>
                                    <Info size={24} color="#0288d1" />
                                    <Typography variant="caption" color="info.main">
                                        For severe or life-threatening symptoms, please seek immediately emergency medical care. Do not use this form.
                                    </Typography>
                                </Box>

                                <Button variant="contained" size="large" fullWidth startIcon={<Send size={18} />} sx={{ mt: 1, borderRadius: 2, height: 48, fontWeight: "bold" }}>
                                    Submit Report
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* History Column */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Report History</Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {pastReports.map((report, idx) => (
                            <Card key={idx} sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>{report.symptom}</Typography>
                                            <Typography variant="body2" color="text.secondary">Reported on {report.date} for {report.medication}</Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Chip size="small" label={report.severity} color={report.severity === "Moderate" ? "warning" : "default"} />
                                            <Chip size="small" label={report.status} color={report.status === "Reviewed" ? "info" : "success"} variant="outlined" />
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 2, display: "flex", gap: 2 }}>
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>Dr</Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="bold">Provider Note</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>"{report.doctorNote}"</Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>

                    <Card sx={{ mt: 4, bgcolor: "warning.50", borderRadius: 3, border: "1px solid", borderColor: "warning.200", boxShadow: "none" }}>
                        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}>
                            <AlertCircle color="#ed6c02" size={24} />
                            <Typography variant="body2" color="warning.900">
                                You currently have 1 unresolved "Moderate" symptom report being reviewed by Dr. Sarah Jenkins. You will be notified when a note is added.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
