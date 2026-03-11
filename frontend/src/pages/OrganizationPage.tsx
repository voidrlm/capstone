import { Box, Typography, Card, CardContent, Grid, Avatar, Chip, Button, List, ListItem, ListItemAvatar, ListItemText, Divider, IconButton } from "@mui/material";
import { Building2, MapPin, Mail, Phone, MoreVertical, Plus } from "lucide-react";

export default function OrganizationPage() {
    const staff = [
        { name: "Dr. Sarah Jenkins", role: "Primary Care Physician", email: "s.jenkins@clinic.org", status: "Active" },
        { name: "Dr. Marcus Chen", role: "Cardiologist", email: "m.chen@clinic.org", status: "Active" },
        { name: "Elena Rodriguez", role: "Lead Nurse", email: "e.rodriguez@clinic.org", status: "On Leave" },
        { name: "James Wilson", role: "Clinical Pharmacist", email: "j.wilson@clinic.org", status: "Active" },
    ];

    return (
        <Box sx={{ p: 4, maxWidth: 1000, mx: "auto" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Typography variant="h4" fontWeight="bold">Organization Management</Typography>
                <Button variant="contained" startIcon={<Plus size={18} />} sx={{ borderRadius: 2 }}>Add Staff</Button>
            </Box>

            <Grid container spacing={4}>
                {/* Facility Info Card */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                        <CardContent sx={{ p: 0 }}>
                            <Box sx={{ p: 3, bgcolor: "primary.main", color: "white", borderRadius: "12px 12px 0 0", textAlign: "center" }}>
                                <Box sx={{ width: 80, height: 80, bgcolor: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                                    <Building2 size={40} />
                                </Box>
                                <Typography variant="h6" fontWeight="bold">Central Medical Partners</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>Primary Care Clinic</Typography>
                            </Box>

                            <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, color: "text.secondary" }}>
                                    <MapPin size={18} />
                                    <Typography variant="body2">1024 Healthcare Ave, Suite 200<br />San Francisco, CA 94107</Typography>
                                </Box>
                                <Divider />
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, color: "text.secondary" }}>
                                    <Phone size={18} />
                                    <Typography variant="body2">(555) 123-4567</Typography>
                                </Box>
                                <Divider />
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, color: "text.secondary" }}>
                                    <Mail size={18} />
                                    <Typography variant="body2">contact@centralmedical.org</Typography>
                                </Box>
                                <Button variant="outlined" fullWidth sx={{ mt: 2, borderRadius: 2 }}>Edit Facility Details</Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Staff Directory */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", height: "100%" }}>
                        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">Staff Directory</Typography>
                                <Typography variant="body2" color="text.secondary">Manage access and roles</Typography>
                            </Box>
                            <Chip label="4 Total" size="small" sx={{ fontWeight: "bold" }} />
                        </Box>

                        <List sx={{ p: 0 }}>
                            {staff.map((person, idx) => (
                                <Box key={idx}>
                                    <ListItem sx={{ py: 2.5, px: 3 }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: "primary.light", color: "primary.dark", width: 48, height: 48, mr: 1 }}>
                                                {person.name.split(" ").map(n => n[0]).join("").substring(0, 2).replace(".", "")}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography variant="subtitle1" fontWeight="bold">{person.name}</Typography>}
                                            secondary={
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Typography variant="body2" color="text.primary">{person.role}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{person.email}</Typography>
                                                </Box>
                                            }
                                        />
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                            <Chip
                                                size="small"
                                                label={person.status}
                                                color={person.status === "Active" ? "success" : "default"}
                                                variant={person.status === "Active" ? "filled" : "outlined"}
                                            />
                                            <IconButton size="small"><MoreVertical size={20} /></IconButton>
                                        </Box>
                                    </ListItem>
                                    {idx < staff.length - 1 && <Divider component="li" />}
                                </Box>
                            ))}
                        </List>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
