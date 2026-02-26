import {
  Box,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
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
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Current Medications
          </Typography>
          <Button variant="outlined" size="small" endIcon={<ChevronRight size={16} />}>
            View All
          </Button>
        </Box>

        <List sx={{ p: 0 }}>
          {medications.map((med, index) => (
            <Box key={med.id}>
              <ListItem sx={{ px: 0, py: 2 }}>
                <ListItemIcon sx={{ minWidth: 48 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: "background.default" }}>
                    <Pill size={20} color="#3b82f6" />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {med.name}
                      </Typography>
                      <Chip
                        label={med.riskLevel}
                        size="small"
                        color={getRiskColor(med.riskLevel) as "success" | "warning" | "error" | "default"}
                        sx={{ textTransform: "capitalize" }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {med.dosage} &bull; {med.frequency}
                    </Typography>
                  }
                />
                <Button variant="text" size="small" endIcon={<ChevronRight size={16} />}>
                  Details
                </Button>
              </ListItem>
              {index < medications.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
