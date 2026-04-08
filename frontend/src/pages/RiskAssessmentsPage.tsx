import { Box, Typography, Card, CardContent, Grid, Chip } from "@mui/material";
import { Activity, TrendingUp, AlertTriangle, ShieldCheck, Target } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const performanceData = [
    { month: "Sep", score: 85 }, { month: "Oct", score: 82 }, { month: "Nov", score: 88 },
    { month: "Dec", score: 79 }, { month: "Jan", score: 75 }, { month: "Feb", score: 68 }, { month: "Mar", score: 74 },
];

export default function RiskAssessmentsPage() {
    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Risk Assessments</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Monitor your health scores and get personalized insights</Typography>
                </Box>
                <Chip icon={<Activity size={14} />} label="Last updated: Today, 08:30 AM" sx={{ bgcolor: "rgba(22,163,74,0.12)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.25)", fontWeight: 600, "& .MuiChip-icon": { color: "#16a34a" } }} />
            </Box>

            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ height: "100%", background: "linear-gradient(160deg, #04080f 0%, #0a1628 55%, #0c2820 100%)", color: "white", border: "none" }}>
                        <CardContent sx={{ p: 4, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", position: "relative", overflow: "hidden" }}>
                            <Box sx={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.1)" }} />
                            <Box sx={{ position: "relative", zIndex: 1 }}>
                                <Typography variant="body2" sx={{ opacity: 0.6, mb: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.7rem" }}>Overall Health Score</Typography>
                                <Typography sx={{ fontSize: "4rem", fontWeight: 800, lineHeight: 1, mb: 1 }}>74</Typography>
                                <Chip label="Fair condition" size="small" sx={{ bgcolor: "rgba(251,191,36,0.2)", color: "#fbbf24", fontWeight: 600, mb: 4, height: 24, fontSize: "0.7rem" }} />
                                <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
                                    <Box sx={{ flex: 1, bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", p: 2, borderRadius: 3 }}>
                                        <TrendingUp size={20} style={{ marginBottom: 8 }} color="#00d4aa" />
                                        <Typography variant="h5" fontWeight={800}>+6</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.5 }}>vs last month</Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", p: 2, borderRadius: 3 }}>
                                        <Target size={20} style={{ marginBottom: 8 }} color="#00d4aa" />
                                        <Typography variant="h5" fontWeight={800}>78</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.5 }}>Target Score</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <Card sx={{ height: "100%" }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Health Score Trend (6 Months)</Typography>
                            <Box sx={{ height: 300, width: "100%" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs><linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4aa" stopOpacity={0.2} /><stop offset="95%" stopColor="#00d4aa" stopOpacity={0} /></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} domain={[60, 100]} />
                                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "0.8125rem" }} cursor={{ stroke: '#00d4aa', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                        <Area type="monotone" dataKey="score" stroke="#00d4aa" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2, mt: 1 }}>AI-Generated Insights</Typography>
                    <Grid container spacing={2}>
                        {[
                            { title: "Medication Adherence", desc: "Your missed Atorvastatin doses in Feb contributed to the score drop. Adherence has improved this month.", status: "warning", icon: AlertTriangle },
                            { title: "Blood Pressure", desc: "Latest readings show stabilization within normal limits since adjusting Lisinopril dosage.", status: "success", icon: ShieldCheck },
                            { title: "Follow-up Required", desc: "You are due for your semi-annual lipid panel. Scheduling this will impact your risk predictability.", status: "info", icon: Activity }
                        ].map((insight, index) => {
                            const Icon = insight.icon;
                            const colors = { warning: { accent: "#d97706", bg: "rgba(217,119,6,0.1)", border: "rgba(217,119,6,0.2)" }, success: { accent: "#16a34a", bg: "rgba(22,163,74,0.1)", border: "rgba(22,163,74,0.2)" }, info: { accent: "#0284c7", bg: "rgba(2,132,199,0.1)", border: "rgba(2,132,199,0.2)" } }[insight.status]!;
                            return (
                                <Grid size={{ xs: 12, md: 4 }} key={index}>
                                    <Card sx={{ height: "100%", position: "relative", overflow: "visible", transition: "all 0.2s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)" } }}>
                                        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: colors.accent, borderRadius: "16px 16px 0 0" }} />
                                        <CardContent sx={{ p: 3, pt: 3.5 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5, gap: 1.5 }}>
                                                <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: colors.bg, border: `1px solid ${colors.border}`, display: "flex" }}><Icon size={18} color={colors.accent} /></Box>
                                                <Typography variant="body1" fontWeight={700}>{insight.title}</Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" lineHeight={1.6}>{insight.desc}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}
