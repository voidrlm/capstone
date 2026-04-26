import { Box, Button, Card, CardContent, Chip, CircularProgress, Typography } from "@mui/material";
import { Clock3 } from "lucide-react";
import { type AccessRequestItem } from "../utils/recordHelpers";

interface AccessRequestsProps {
  pendingAccessRequests: AccessRequestItem[];
  handleAccessRequestResponse: (requestId: string, action: "approve" | "reject") => void;
  accessActionLoadingId: string | null;
}

export default function AccessRequests({ pendingAccessRequests, handleAccessRequestResponse, accessActionLoadingId }: AccessRequestsProps) {
  if (pendingAccessRequests.length === 0) {
    return null;
  }

  return (
    <Card sx={{ borderRadius: 5, border: "1px solid rgba(245,158,11,0.2)", boxShadow: "0 24px 50px rgba(245,158,11,0.08)" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexWrap: "wrap", mb: 2.2 }}>
          <Box>
            <Typography variant="h6" fontWeight={900}>
              Pending approval requests
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Review carefully before sharing your record timeline with an organization.
            </Typography>
          </Box>
          <Chip label={`${pendingAccessRequests.length} awaiting response`} sx={{ bgcolor: "rgba(245,158,11,0.14)", color: "#b45309", fontWeight: 700 }} />
        </Box>

        <Box sx={{ display: "grid", gap: 1.4 }}>
          {pendingAccessRequests.map((request) => (
            <Box
              key={request.id}
              sx={{
                p: 2.2,
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
                background: "linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
                gap: 2,
                alignItems: "center",
              }}
            >
              <Box>
                <Typography fontWeight={800}>{request.organization_name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Requested by {request.requested_by_name} ({request.requested_by_email})
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 1 }}>
                  <Clock3 size={14} color="#94a3b8" />
                  <Typography variant="caption" color="text.secondary">
                    Requested on {new Date(request.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => void handleAccessRequestResponse(request.id, "reject")}
                  disabled={accessActionLoadingId === request.id}
                  sx={{ borderRadius: 999 }}
                >
                  {accessActionLoadingId === request.id ? <CircularProgress size={18} color="inherit" /> : "Reject"}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => void handleAccessRequestResponse(request.id, "approve")}
                  disabled={accessActionLoadingId === request.id}
                  sx={{ borderRadius: 999 }}
                >
                  {accessActionLoadingId === request.id ? <CircularProgress size={18} color="inherit" /> : "Approve"}
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
