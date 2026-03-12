import { Box, Typography, Card, CardContent, Button, Chip, IconButton, useTheme } from "@mui/material";
import { Download, Search, Filter, Activity, Stethoscope, FileImage, FileText } from "lucide-react";
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineOppositeContent, { timelineOppositeContentClasses } from '@mui/lab/TimelineOppositeContent';
import TimelineDot from '@mui/lab/TimelineDot';

export default function MyRecordsPage() {
    const theme = useTheme();
    const records = [
        { id: "REC-2026-04", date: "Mar 05, 2026", time: "09:30 AM", type: "Lab Result", category: "Lipid Panel", provider: "Quest Diagnostics", status: "Available", icon: Activity, color: "primary" },
        { id: "REC-2026-03", date: "Feb 28, 2026", time: "02:15 PM", type: "Visit Summary", category: "Routine Checkup", provider: "Dr. Sarah Jenkins", status: "Available", icon: Stethoscope, color: "secondary" },
        { id: "REC-2026-02", date: "Jan 15, 2026", time: "11:00 AM", type: "Imaging", category: "Chest X-Ray", provider: "City Imaging Center", status: "Archived", icon: FileImage, color: "info" },
        { id: "REC-2025-11", date: "Nov 12, 2025", time: "08:45 AM", type: "Lab Result", category: "Comprehensive Metabolic", provider: "Quest Diagnostics", status: "Available", icon: Activity, color: "primary" },
        { id: "REC-2025-08", date: "Aug 02, 2025", time: "04:00 PM", type: "Visit Summary", category: "Consultation", provider: "Dr. Marcus Chen", status: "Available", icon: Stethoscope, color: "secondary" },
        { id: "REC-2025-02", date: "Feb 10, 2025", time: "10:30 AM", type: "Prescription", category: "Lisinopril 10mg", provider: "Dr. Sarah Jenkins", status: "Available", icon: FileText, color: "success" }
    ];

    const getStatusColor = (status: string) => status === "Available" ? "success" : "default";

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>My Medical History</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>A comprehensive timeline of your visits, labs, and imaging.</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button variant="outlined" startIcon={<Filter size={18} />} sx={{ borderColor: "#e2e8f0", color: "text.primary", "&:hover": { borderColor: "#cbd5e1" } }}>Filter</Button>
                    <Button variant="contained" startIcon={<Download size={18} />} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>Export</Button>
                </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2.5, mb: 4 }}>
                {[
                    { title: "Total Records", value: "24", color: "#2563eb" },
                    { title: "Recent Labs", value: "2", color: "#0284c7" },
                    { title: "Visit Summaries", value: "15", color: "#0d9488" },
                    { title: "Imaging", value: "7", color: "#d97706" },
                ].map((item, i) => (
                    <Card key={i} sx={{ position: "relative", overflow: "hidden" }}>
                        <Box sx={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, bgcolor: item.color }} />
                        <CardContent sx={{ p: 3, pl: 3.5 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>{item.title}</Typography>
                            <Typography variant="h4" fontWeight={800} sx={{ mt: 1, color: "text.primary" }}>{item.value}</Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Card>
                <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#f8fafc", borderRadius: "16px 16px 0 0" }}>
                    <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Activity size={20} color="#2563eb" /> Chronological Records
                    </Typography>
                    <IconButton sx={{ bgcolor: "white", border: "1px solid #e2e8f0" }}><Search size={18} /></IconButton>
                </Box>

                <Box sx={{ p: { xs: 1, md: 3 } }}>
                    <Timeline sx={{ [`& .${timelineOppositeContentClasses.root}`]: { flex: 0.2, minWidth: 150 } }}>
                        {records.map((record, index) => {
                            const IconCmp = record.icon;
                            return (
                                <TimelineItem key={record.id}>
                                    <TimelineOppositeContent sx={{ m: 'auto 0' }}>
                                        <Typography variant="body2" fontWeight={700} color="text.primary">{record.date}</Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>{record.time}</Typography>
                                    </TimelineOppositeContent>
                                    <TimelineSeparator>
                                        <TimelineConnector sx={{ bgcolor: index === 0 ? "transparent" : `${record.color}.light`, opacity: 0.5, width: 2 }} />
                                        <TimelineDot color={record.color as any} sx={{ p: 1.5, boxShadow: `0 4px 15px ${theme.palette[record.color as 'primary' | 'secondary' | 'info' | 'success' | 'warning'].main}40`, border: `4px solid ${theme.palette.background.paper}` }}>
                                            <IconCmp size={22} color="#fff" />
                                        </TimelineDot>
                                        <TimelineConnector sx={{ bgcolor: index === records.length - 1 ? "transparent" : `${record.color}.light`, opacity: 0.5, width: 2 }} />
                                    </TimelineSeparator>
                                    <TimelineContent sx={{ py: '24px', px: { xs: 2, md: 4 } }}>
                                        <Card sx={{ transition: "all 0.2s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" } }}>
                                            <CardContent sx={{ p: 3, pb: "24px !important" }}>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
                                                    <Box>
                                                        <Chip label={record.type} size="small" color={record.color as any} variant="outlined" sx={{ mb: 1.5, fontWeight: 700 }} />
                                                        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>{record.category}</Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: "text.secondary", mt: 0.5 }}>
                                                            <Stethoscope size={14} />
                                                            <Typography variant="caption" fontWeight={500}>{record.provider}</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                                                        <Chip label={record.status} size="small" color={getStatusColor(record.status) as any} sx={{ fontWeight: 600, height: 24, fontSize: "0.7rem" }} />
                                                        <Button variant="text" size="small" startIcon={<Download size={14} />} sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Download PDF</Button>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </TimelineContent>
                                </TimelineItem>
                            );
                        })}
                    </Timeline>
                </Box>
            </Card>
        </Box>
    );
}
