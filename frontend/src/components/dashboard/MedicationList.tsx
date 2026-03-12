import {
  Box,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
} from "@mui/material";
import { Pill, ChevronRight } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  riskLevel: "low" | "medium" | "high";
}

function getRiskColor(risk: string) {
  switch (risk) {
    case "low":
      return "success";
    case "medium":
      return "warning";
    case "high":
      return "error";
    default:
      return "default";
  }
}

export default function MedicationList({ medications }: { medications: Medication[] }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            Current Medications
          </Typography>
          <Button
            variant="text"
            size="small"
            endIcon={<ChevronRight size={16} />}
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            View All
          </Button>
        </Box>

        <List sx={{ p: 0 }}>
          {medications.map((med, index) => (
            <ListItem
              key={med.id}
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 2.5,
                mb: index < medications.length - 1 ? 1 : 0,
                bgcolor: "#f8fafc",
                border: "1px solid #f1f5f9",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: "#f1f5f9",
                  borderColor: "#e2e8f0",
                },
              }}
            >
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: "#eff6ff",
                  display: "flex",
                  mr: 2,
                }}
              >
                <Pill size={18} color="#2563eb" />
              </Box>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {med.name}
                    </Typography>
                    <Chip
                      label={med.riskLevel}
                      size="small"
                      color={getRiskColor(med.riskLevel) as "success" | "warning" | "error" | "default"}
                      sx={{ textTransform: "capitalize", height: 22, fontSize: "0.7rem" }}
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {med.dosage} &bull; {med.frequency}
                  </Typography>
                }
              />
              <ChevronRight size={16} color="#94a3b8" />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
