import { Box, Typography, Card, CardContent, Avatar, Chip, Button, List, ListItem, ListItemAvatar, ListItemText, Divider, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { Building2, MapPin, Mail, Phone, MoreVertical, Plus, Sparkles, Users } from "lucide-react";
import { useState } from "react";

export default function OrganizationPage() {
    const [staff, setStaff] = useState([
        { name: "Dr. Sarah Jenkins", role: "Primary Care Physician", email: "s.jenkins@clinic.org", status: "Active" },
        { name: "Dr. Marcus Chen", role: "Cardiologist", email: "m.chen@clinic.org", status: "Active" },
        { name: "Elena Rodriguez", role: "Lead Nurse", email: "e.rodriguez@clinic.org", status: "On Leave" },
        { name: "James Wilson", role: "Clinical Pharmacist", email: "j.wilson@clinic.org", status: "Active" },
    ]);

    const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
    const [newStaff, setNewStaff] = useState({ name: "", role: "Primary Care Physician", email: "", status: "Active" });

    const handleAddStaff = () => {
        if (newStaff.name && newStaff.email) {
            setStaff([...staff, newStaff]);
            setIsAddStaffOpen(false);
            setNewStaff({ name: "", role: "Primary Care Physician", email: "", status: "Active" });
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 4, p: { xs: 3, sm: 4 }, borderRadius: 4, background: "linear-gradient(135deg, #04080f 0%, #0a1628 55%, #0c2820 100%)", color: "white", position: "relative", overflow: "hidden", display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                <Box sx={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.08)" }} />
                <Box sx={{ position: "absolute", bottom: -60, right: 100, width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.05)" }} />
                <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(0,212,170,0.07) 0%, transparent 70%)" }} />
                <Box sx={{ position: "relative", zIndex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Sparkles size={18} color="#00d4aa" />
                        <Chip label="Organization" size="small" sx={{ bgcolor: "rgba(0,212,170,0.18)", color: "#00d4aa", fontWeight: 600, height: 24, fontSize: "0.7rem" }} />
                    </Box>
                    <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>Organization Management</Typography>
                    <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>Manage your facility details, team members, and roles</Typography>
                </Box>
                <Button onClick={() => setIsAddStaffOpen(true)} variant="contained" startIcon={<Plus size={18} />} sx={{ position: "relative", zIndex: 1, bgcolor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>Add Staff</Button>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, gap: 2.5 }}>
                <Card sx={{ height: "fit-content" }}>
                    <CardContent sx={{ p: 0 }}>
                        <Box sx={{ p: 4, background: "linear-gradient(160deg, #04080f 0%, #0a1628 55%, #0c2820 100%)", color: "white", borderRadius: "16px 16px 0 0", textAlign: "center", position: "relative", overflow: "hidden" }}>
                            <Box sx={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.1)" }} />
                            <Box sx={{ width: 80, height: 80, bgcolor: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2, border: "2px solid rgba(255,255,255,0.2)" }}>
                                <Building2 size={36} />
                            </Box>
                            <Typography variant="h6" fontWeight={700}>Central Medical Partners</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.6, mt: 0.5 }}>Primary Care Clinic</Typography>
                        </Box>

                        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                            {[
                                { icon: MapPin, text: "1024 Healthcare Ave, Suite 200\nSan Francisco, CA 94107" },
                                { icon: Phone, text: "(555) 123-4567" },
                                { icon: Mail, text: "contact@centralmedical.org" },
                            ].map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <Box key={i}>
                                        {i > 0 && <Divider sx={{ mb: 2 }} />}
                                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(0,212,170,0.1)", display: "flex" }}><Icon size={16} color="#00d4aa" /></Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>{item.text}</Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                            <Button variant="outlined" fullWidth sx={{ mt: 1, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main" } }}>Edit Facility Details</Button>
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "background.default", borderRadius: "16px 16px 0 0" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(0,212,170,0.1)", display: "flex" }}><Users size={18} color="#00d4aa" /></Box>
                            <Box>
                                <Typography variant="h6" fontWeight={700}>Staff Directory</Typography>
                                <Typography variant="caption" color="text.secondary">Manage access and roles</Typography>
                            </Box>
                        </Box>
                        <Chip label={`${staff.length} Total`} size="small" sx={{ fontWeight: 700, bgcolor: "rgba(0,212,170,0.12)", color: "#00d4aa", fontSize: "0.7rem" }} />
                    </Box>

                    <List sx={{ p: 0 }}>
                        {staff.map((person, idx) => (
                            <ListItem key={idx} sx={{ py: 2.5, px: 3, borderBottom: idx < staff.length - 1 ? "1px solid" : "none", borderColor: "divider", transition: "all 0.15s ease", "&:hover": { bgcolor: "action.hover" } }}>
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: "rgba(0,212,170,0.12)", color: "#00d4aa", width: 44, height: 44, mr: 1, fontWeight: 700, fontSize: 14 }}>
                                        {person.name.split(" ").map(n => n[0]).join("").replace(".", "").substring(0, 2)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={<Typography variant="body1" fontWeight={600}>{person.name}</Typography>}
                                    secondary={
                                        <Box sx={{ mt: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">{person.role}</Typography>
                                            <Typography variant="caption" color="text.secondary">{person.email}</Typography>
                                        </Box>
                                    }
                                />
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <Chip
                                        size="small"
                                        label={person.status}
                                        sx={{
                                            fontWeight: 600,
                                            fontSize: "0.7rem",
                                            height: 24,
                                            ...(person.status === "Active"
                                                ? { bgcolor: "#f0fdf4", color: "#16a34a", border: "1px solid #dcfce7" }
                                                : { bgcolor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }),
                                        }}
                                    />
                                    <IconButton size="small" sx={{ color: "text.secondary" }}><MoreVertical size={18} /></IconButton>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </Card>
            </Box>

            <Dialog open={isAddStaffOpen} onClose={() => setIsAddStaffOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Add New Staff Member</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
                        <TextField 
                            label="Full Name" 
                            fullWidth 
                            value={newStaff.name} 
                            onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                        />
                        <TextField 
                            label="Email Address" 
                            type="email" 
                            fullWidth 
                            value={newStaff.email} 
                            onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select 
                                value={newStaff.role} 
                                label="Role"
                                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                            >
                                <MenuItem value="Primary Care Physician">Primary Care Physician</MenuItem>
                                <MenuItem value="Cardiologist">Cardiologist</MenuItem>
                                <MenuItem value="Lead Nurse">Lead Nurse</MenuItem>
                                <MenuItem value="Clinical Pharmacist">Clinical Pharmacist</MenuItem>
                                <MenuItem value="Medical Assistant">Medical Assistant</MenuItem>
                                <MenuItem value="Administrator">Administrator</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select 
                                value={newStaff.status} 
                                label="Status"
                                onChange={(e) => setNewStaff({ ...newStaff, status: e.target.value })}
                            >
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="On Leave">On Leave</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setIsAddStaffOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleAddStaff} variant="contained" disabled={!newStaff.name || !newStaff.email}>
                        Add Member
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
