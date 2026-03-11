import { Box, Typography, Card, CardContent, Grid, TextField, Button, Switch, Divider, Avatar } from "@mui/material";
import { User, Bell, Shield, Save } from "lucide-react";

export default function SettingsPage() {
    return (
        <Box sx={{ p: 4, maxWidth: 1000, mx: "auto" }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>Account Settings</Typography>

            <Grid container spacing={4}>
                {/* Profile Settings */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>

                        {/* Personal Info */}
                        <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                            <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", gap: 2, alignItems: "center" }}>
                                <User size={24} color="#1976d2" />
                                <Typography variant="h6" fontWeight="bold">Personal Information</Typography>
                            </Box>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
                                    <Avatar sx={{ width: 80, height: 80, bgcolor: "primary.main", fontSize: 32 }}>JS</Avatar>
                                    <Button variant="outlined" size="small" sx={{ borderRadius: 2 }}>Change Photo</Button>
                                </Box>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField label="First Name" defaultValue="John" fullWidth />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField label="Last Name" defaultValue="Smith" fullWidth />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField label="Email Address" defaultValue="john.smith@example.com" fullWidth />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField label="Phone Number" defaultValue="(555) 123-4567" fullWidth />
                                    </Grid>
                                </Grid>
                                <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                                    <Button variant="contained" startIcon={<Save size={18} />} sx={{ borderRadius: 2 }}>Save Changes</Button>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Notification Preferences */}
                        <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                            <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", gap: 2, alignItems: "center" }}>
                                <Bell size={24} color="#ed6c02" />
                                <Typography variant="h6" fontWeight="bold">Notification Preferences</Typography>
                            </Box>
                            <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">Email Notifications</Typography>
                                        <Typography variant="body2" color="text.secondary">Receive daily summaries and critical alerts via email</Typography>
                                    </Box>
                                    <Switch defaultChecked color="primary" />
                                </Box>
                                <Divider />
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">SMS Alerts</Typography>
                                        <Typography variant="body2" color="text.secondary">Get text messages for high-priority risk score changes</Typography>
                                    </Box>
                                    <Switch defaultChecked color="primary" />
                                </Box>
                                <Divider />
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">Marketing Communications</Typography>
                                        <Typography variant="body2" color="text.secondary">Receive updates about new features and clinic news</Typography>
                                    </Box>
                                    <Switch color="primary" />
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Grid>

                {/* Security / Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", gap: 2, alignItems: "center" }}>
                            <Shield size={24} color="#2e7d32" />
                            <Typography variant="h6" fontWeight="bold">Security</Typography>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Two-Factor Authentication</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Add an extra layer of security to your account.</Typography>
                            <Button variant="outlined" color="primary" fullWidth sx={{ mb: 4, borderRadius: 2 }}>Enable 2FA</Button>

                            <Divider sx={{ mb: 3 }} />

                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>Password</Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <TextField label="Current Password" type="password" size="small" fullWidth />
                                <TextField label="New Password" type="password" size="small" fullWidth />
                                <Button variant="contained" fullWidth sx={{ borderRadius: 2 }}>Update Password</Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
