import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { Plus } from "lucide-react";

interface PatientRecordSectionProps {
  title: string;
  count?: number;
  addLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
  sx?: object;
}

export function PatientRecordSection({
  title,
  count,
  addLabel,
  onAdd,
  children,
  sx,
}: PatientRecordSectionProps) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 5, ...sx }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            {title}
            {typeof count === "number" ? ` (${count})` : ""}
          </Typography>
          <Button size="small" startIcon={<Plus size={16} />} onClick={onAdd}>
            {addLabel}
          </Button>
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}
