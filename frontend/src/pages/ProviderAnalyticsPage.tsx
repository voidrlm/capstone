import { Box, Typography, Card, CardContent, Grid, Select, MenuItem, FormControl, Chip, CircularProgress, Alert } from "@mui/material";
import { Users, TrendingUp, AlertTriangle, Pill, Sparkles, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { fetchAnalytics, type AnalyticsData } from "../lib/patientApi";

export default function ProviderAnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        fetchAnalytics()
            .then((res) => {
                if (isMounted) {
                    setData(res);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err.message || "Failed to load analytics");
                    setLoading(false);
                }
            });
        return () => {
            isMounted = false;
        };
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !data) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">{error || "Failed to load"}</Alert>
            </Box>
        );
    }

    const { populationTrend, sideEffectsDist, activePatients, avgAdherenceRate, criticalRiskAlerts, predictedAdmissions } = data;

    const COLORS = ["#00d4aa", "#d97706", "#0284c7", "#7c3aed", "#64748b"];

    const kpis = [
        { title: "Active Patients", value: activePatients, badge: "Live", icon: Users, color: "#00d4aa", bg: "#e0fdf4" },
        { title: "Medication Data Complete", value: avgAdherenceRate, badge: "Live", icon: Pill, color: "#16a34a", bg: "#f0fdf4" },
        { title: "High Risk Patients", value: criticalRiskAlerts, badge: "Live", icon: AlertTriangle, color: "#dc2626", bg: "#fef2f2" },
        { title: "Admissions 30d", value: predictedAdmissions, badge: "Live", icon: TrendingUp, color: "#d97706", bg: "#fffbeb" },
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
                        <Chip label="Analytics" size="small" sx={{ bgcolor: "rgba(0,212,170,0.18)", color: "#00d4aa", fontWeight: 600, height: 24, fontSize: "0.7rem" }} />
                    </Box>
                    <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>Analytics & Population Health</Typography>
                    <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>Track trends, outcomes, and key performance indicators</Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 150, position: "relative", zIndex: 1, "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.2)", "& fieldset": { border: "none" } }, "& .MuiSelect-icon": { color: "rgba(255,255,255,0.6)" } }}>
                    <Select defaultValue="30days">
                        <MenuItem value="7days">Last 7 Days</MenuItem>
                        <MenuItem value="30days">Last 30 Days</MenuItem>
                        <MenuItem value="90days">Last 90 Days</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {kpis.map((kpi, idx) => {
                    const Icon = kpi.icon;
                    return (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                            <Card sx={{ position: "relative", overflow: "hidden", transition: "all 0.2s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" } }}>
                                <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: kpi.color }} />
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                        <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: kpi.bg, display: "flex" }}><Icon size={22} color={kpi.color} /></Box>
                                        <Chip size="small" label={kpi.badge} sx={{ height: 24, fontWeight: 700, fontSize: "0.7rem", bgcolor: "rgba(15,23,42,0.06)", color: "#475569" }} />
                                    </Box>
                                    <Typography variant="h4" fontWeight={800}>{kpi.value}</Typography>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.5 }}>{kpi.title}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card sx={{ height: "100%" }}>
                        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "background.default", borderRadius: "16px 16px 0 0" }}>
                            <Typography variant="h6" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <BarChart3 size={20} color="#00d4aa" /> Population Risk Stratification (6 mo)
                            </Typography>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ height: 300, width: "100%" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={populationTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                                        <RechartsTooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "0.8125rem" }} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                                        <Bar dataKey="High Risk" stackId="a" fill="#dc2626" radius={[0, 0, 4, 4]} />
                                        <Bar dataKey="Med Risk" stackId="a" fill="#d97706" />
                                        <Bar dataKey="Low Risk" stackId="a" fill="#16a34a" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ height: "100%" }}>
                        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.default", borderRadius: "16px 16px 0 0" }}>
                            <Typography variant="h6" fontWeight={700}>Top Side Effects Reported</Typography>
                            <Typography variant="caption" color="text.secondary">Based on recorded adverse reactions for accessible patients</Typography>
                        </Box>
                        <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "calc(100% - 80px)" }}>
                            <Box sx={{ flexGrow: 1, minHeight: 250 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={sideEffectsDist} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                            {sideEffectsDist.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "0.8125rem" }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
