import { Box, Typography, Card, CardContent, Grid, TextField, Button, Switch, Divider, Avatar } from "@mui/material";
import { User, Bell, Shield, Save } from "lucide-react";

export default function SettingsPage() {
    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800}>Account Settings</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage your profile, notifications, and security</Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <Card>
                            <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", gap: 2, alignItems: "center" }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: "#eff6ff", display: "flex" }}><User size={20} color="#2563eb" /></Box>
                                <Typography variant="h6" fontWeight={700}>Personal Information</Typography>
                            </Box>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
                                    <Avatar sx={{ width: 72, height: 72, bgcolor: "#2563eb", fontSize: 28, fontWeight: 700 }}>JS</Avatar>
                                    <Button variant="outlined" size="small" sx={{ borderColor: "#e2e8f0", color: "text.primary", "&:hover": { borderColor: "#cbd5e1" } }}>Change Photo</Button>
                                </Box>
                                <Grid container spacing={2.5}>
                                    <Grid size={{ xs: 12, sm: 6 }}><TextField label="First Name" defaultValue="John" fullWidth /></Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}><TextField label="Last Name" defaultValue="Smith" fullWidth /></Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}><TextField label="Email Address" defaultValue="john.smith@example.com" fullWidth /></Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}><TextField label="Phone Number" defaultValue="(555) 123-4567" fullWidth /></Grid>
                                </Grid>
                                <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                                    <Button variant="contained" startIcon={<Save size={18} />} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>Save Changes</Button>
                                </Box>
                            </CardContent>
                        </Card>

                        <Card>
                            <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", gap: 2, alignItems: "center" }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: "#fffbeb", display: "flex" }}><Bell size={20} color="#d97706" /></Box>
                                <Typography variant="h6" fontWeight={700}>Notification Preferences</Typography>
                            </Box>
                            <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 0 }}>
                                {[
                                    { title: "Email Notifications", desc: "Receive daily summaries and critical alerts via email", defaultChecked: true },
                                    { title: "SMS Alerts", desc: "Get text messages for high-priority risk score changes", defaultChecked: true },
                                    { title: "Marketing Communications", desc: "Receive updates about new features and clinic news", defaultChecked: false },
                                ].map((item, i) => (
                                    <Box key={i}>
                                        {i > 0 && <Divider sx={{ my: 1 }} />}
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5 }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>{item.title}</Typography>
                                                <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                                            </Box>
                                            <Switch defaultChecked={item.defaultChecked} color="primary" />
                                        </Box>
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>
                    </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", gap: 2, alignItems: "center" }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: "#f0fdf4", display: "flex" }}><Shield size={20} color="#16a34a" /></Box>
                            <Typography variant="h6" fontWeight={700}>Security</Typography>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Two-Factor Authentication</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>Add an extra layer of security to your account.</Typography>
                            <Button variant="outlined" fullWidth sx={{ mb: 3, borderColor: "#e2e8f0", color: "text.primary", "&:hover": { borderColor: "#cbd5e1" } }}>Enable 2FA</Button>
                            <Divider sx={{ mb: 3 }} />
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>Password</Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <TextField label="Current Password" type="password" size="small" fullWidth />
                                <TextField label="New Password" type="password" size="small" fullWidth />
                                <Button variant="contained" fullWidth sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>Update Password</Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
