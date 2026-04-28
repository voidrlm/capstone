import { useEffect, useMemo, useState } from "react";
import { Alert, Avatar, Box, Card, CardContent, Chip, CircularProgress, Divider, List, ListItem, ListItemAvatar, ListItemText, Typography } from "@mui/material";
import { Building2, Globe, Mail, MapPin, Phone, Sparkles, Users } from "lucide-react";
import { API_URL } from "../lib/api";
import { getAuthHeaders } from "../lib/helpers";

type Organization = {
  id: string;
  name: string;
  type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  is_verified: boolean | null;
};

type OrganizationMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  member_role: string | null;
  status: string | null;
};

function formatOrgType(type: string | null) {
  if (!type) return "Healthcare Organization";
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .replace(".", "")
    .substring(0, 2)
    .toUpperCase();
}

export default function OrganizationPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetch(`${API_URL}/api/organizations/me`, { headers: getAuthHeaders() })
      .then(async (response) => {
        const json = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(json?.error?.message || "Failed to load organization");
        }
        return json?.data;
      })
      .then((data) => {
        if (!active) return;
        setOrganization(data?.organization || null);
        setMembers(Array.isArray(data?.members) ? data.members : []);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load organization");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const addressLines = useMemo(() => {
    if (!organization) return [];
    const cityLine = [organization.city, organization.state, organization.zip_code].filter(Boolean).join(", ");
    return [organization.address, cityLine].filter(Boolean);
  }, [organization]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!organization) {
    return <Alert severity="info">No organization is linked to this account.</Alert>;
  }

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
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.66)" }}>Real facility details and team members from your account</Typography>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, gap: 2.5 }}>
        <Card sx={{ height: "fit-content", borderRadius: 4, overflow: "hidden" }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 4, background: "linear-gradient(160deg, #04080f 0%, #0a1628 55%, #0c2820 100%)", color: "white", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <Box sx={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", bgcolor: "rgba(0,212,170,0.1)" }} />
              <Box sx={{ width: 80, height: 80, bgcolor: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2, border: "2px solid rgba(255,255,255,0.2)" }}>
                <Building2 size={36} />
              </Box>
              <Typography variant="h6" fontWeight={700}>{organization.name}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.68, mt: 0.5 }}>{formatOrgType(organization.type)}</Typography>
              {organization.is_verified ? (
                <Chip label="Verified" size="small" sx={{ mt: 1.5, bgcolor: "rgba(0,212,170,0.18)", color: "#7ef7de", fontWeight: 800 }} />
              ) : null}
            </Box>

            <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { icon: MapPin, text: addressLines.length ? addressLines.join("\n") : "Address not provided" },
                { icon: Phone, text: organization.phone || "Phone not provided" },
                { icon: Mail, text: organization.email || "Email not provided" },
                { icon: Globe, text: organization.website || "Website not provided" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <Box key={i}>
                    {i > 0 && <Divider sx={{ mb: 2 }} />}
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(0,212,170,0.1)", display: "flex" }}><Icon size={16} color="#00d4aa" /></Box>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line", wordBreak: "break-word" }}>{item.text}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, overflow: "hidden" }}>
          <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "background.default" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(0,212,170,0.1)", display: "flex" }}><Users size={18} color="#00d4aa" /></Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>Staff Directory</Typography>
                <Typography variant="caption" color="text.secondary">Members linked to this organization</Typography>
              </Box>
            </Box>
            <Chip label={`${members.length} Total`} size="small" sx={{ fontWeight: 700, bgcolor: "rgba(0,212,170,0.12)", color: "#00a98a", fontSize: "0.7rem" }} />
          </Box>

          {members.length === 0 ? (
            <Box sx={{ p: 5, textAlign: "center" }}>
              <Typography color="text.secondary">No organization members found.</Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {members.map((person, idx) => (
                <ListItem key={person.id} sx={{ py: 2.5, px: 3, borderBottom: idx < members.length - 1 ? "1px solid" : "none", borderColor: "divider", transition: "all 0.15s ease", "&:hover": { bgcolor: "action.hover" } }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "rgba(0,212,170,0.12)", color: "#00a98a", width: 44, height: 44, mr: 1, fontWeight: 700, fontSize: 14 }}>
                      {initials(person.name)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body1" fontWeight={600}>{person.name}</Typography>}
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">{formatOrgType(person.member_role || person.role)}</Typography>
                        <Typography variant="caption" color="text.secondary">{person.email}</Typography>
                      </Box>
                    }
                  />
                  <Chip
                    size="small"
                    label={formatOrgType(person.status || "active")}
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      height: 24,
                      ...(person.status === "active"
                        ? { bgcolor: "rgba(22,163,74,0.12)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.25)" }
                        : { bgcolor: "rgba(100,116,139,0.1)", color: "#64748b", border: "1px solid rgba(100,116,139,0.2)" }),
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Card>
      </Box>
    </Box>
  );
}
