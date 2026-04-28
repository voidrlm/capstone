import { memo } from "react";
import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { Building2, Clock3, Mail, Phone } from "lucide-react";
import { type AccessRequestItem } from "../utils/recordHelpers";

interface ApprovedProvidersProps {
  accessRequests: AccessRequestItem[];
}

export default memo(function ApprovedProviders({ accessRequests }: ApprovedProvidersProps) {
  const approvedRequests = accessRequests.filter((r) => r.status === "approved");

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Card sx={{ borderRadius: 5, border: "1px solid rgba(0,212,170,0.2)", boxShadow: "0 24px 50px rgba(0,212,170,0.08)" }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.4 }}>
            <Box sx={{ width: 42, height: 42, borderRadius: 3, bgcolor: "rgba(0,212,170,0.14)", display: "grid", placeItems: "center" }}>
              <Building2 size={20} color="#00d4aa" />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>
                Approved Healthcare Providers
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Organizations with access to your records
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.8 }}>
            These healthcare providers have been granted access to your medical records. Contact them directly for any questions about your care.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Chip label={`${approvedRequests.length} approved`} size="small" sx={{ bgcolor: "rgba(0,212,170,0.14)", color: "#008f74", fontWeight: 700 }} />
          </Box>
        </CardContent>
      </Card>

      {approvedRequests.length > 0 ? (
        <Box sx={{ display: "grid", gap: 2 }}>
          {approvedRequests.map((request) => (
            <Card key={request.id} sx={{ borderRadius: 5, border: "1px solid rgba(0,212,170,0.15)", boxShadow: "0 8px 30px rgba(0,212,170,0.06)" }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: "rgba(0,212,170,0.1)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Building2 size={28} color="#00d4aa" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a" }}>
                      {request.organization_name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                      {request.organization_type || "Healthcare Organization"}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 1.5 }}>
                      <Clock3 size={14} color="#94a3b8" />
                      <Typography variant="caption" color="text.secondary">
                        Approved on {new Date(request.updated_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mt: 2.5, pt: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    CONTACT INFORMATION
                  </Typography>
                  <Box sx={{ mt: 2, display: "grid", gap: 1.5 }}>
                    {request.organization_address && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Building2 size={18} color="#64748b" />
                        <Typography variant="body2" sx={{ color: "#334155" }}>
                          {request.organization_address}, {request.organization_city}, {request.organization_state} {request.organization_zip_code}
                        </Typography>
                      </Box>
                    )}
                    {request.organization_phone && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Phone size={18} color="#64748b" />
                        <Typography variant="body2" sx={{ color: "#334155" }}>
                          {request.organization_phone}
                        </Typography>
                      </Box>
                    )}
                    {request.organization_email && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Mail size={18} color="#64748b" />
                        <Typography variant="body2" sx={{ color: "#334155" }}>
                          {request.organization_email}
                        </Typography>
                      </Box>
                    )}
                    {request.organization_website && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Typography variant="body2" sx={{ color: "#00d4aa", fontWeight: 600 }}>
                          {request.organization_website}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                <Box sx={{ mt: 2.5, pt: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
                  <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "text.secondary", fontWeight: 800, fontSize: "0.7rem" }}>
                    REQUESTED BY
                  </Typography>
                  <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#334155" }}>
                      {request.requested_by_name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      ({request.requested_by_email})
                    </Typography>
                    {request.requested_by_role && (
                      <Chip label={request.requested_by_role} size="small" sx={{ bgcolor: "rgba(0,212,170,0.1)", color: "#008f74", fontWeight: 600, fontSize: "0.7rem" }} />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Card sx={{ borderRadius: 5, border: "1px solid rgba(148,163,184,0.2)" }}>
          <CardContent sx={{ p: 6, textAlign: "center" }}>
            <Box sx={{ mb: 2 }}>
              <Building2 size={48} color="#cbd5e1" />
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#64748b" }}>
              No approved providers yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Healthcare providers that you approve will appear here with their contact information.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
});
