import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { Clock3 } from "lucide-react";
import { type RecordItem } from "../utils/recordHelpers";

interface RecordsTimelineProps {
  groupedRecords: Array<{ label: string; items: RecordItem[] }>;
  onRecordClick: (record: RecordItem) => void;
}

export default function RecordsTimeline({ groupedRecords, onRecordClick }: RecordsTimelineProps) {
  return (
    <>
      {groupedRecords.map((group) => (
        <Box key={group.label} sx={{ display: "grid", gap: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", display: "flex", alignItems: "center", gap: 1 }}>
            {group.label}
            <Chip label={group.items.length} size="small" sx={{ bgcolor: "rgba(0,212,170,0.12)", color: "#008f74", fontWeight: 700, height: 22 }} />
          </Typography>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {group.items.map((record) => (
              <Card
                key={record.id}
                onClick={() => onRecordClick(record)}
                sx={{
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: "divider",
                  background: "linear-gradient(180deg, #ffffff 0%, #fafbff 100%)",
                  boxShadow: "0 4px 20px rgba(148,163,184,0.08)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: `0 8px 30px ${record.accent}22`,
                    borderColor: `${record.accent}40`,
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flex: 1 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 3,
                          bgcolor: record.surface,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                          border: `1px solid ${record.accent}33`,
                        }}
                      >
                        <record.icon size={24} color={record.accent} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0f172a", mb: 0.5 }}>
                          {record.category}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
                          <Chip
                            label={record.type}
                            size="small"
                            sx={{
                              color: record.accent,
                              fontWeight: 800,
                              fontSize: "0.67rem",
                              height: 22,
                              border: `1px solid ${record.accent}33`,
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ color: record.accent, fontWeight: 700, opacity: 0.8, fontSize: "0.7rem" }}
                          >
                            {record.provider}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary", fontWeight: 500, opacity: 0.7, fontSize: "0.65rem", mt: 0.5 }}
                          >
                            Added by {record.addedBy}
                          </Typography>
                        </Box>
                        <Chip
                          label={record.status}
                          size="small"
                          sx={{
                            bgcolor: "rgba(16,185,129,0.12)",
                            color: "#059669",
                            fontWeight: 800,
                            fontSize: "0.65rem",
                            height: 20,
                          }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: "text.secondary" }}>
                      <Clock3 size={14} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {record.time}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Card content */}
                  <Box sx={{ p: 2.5 }}>
                    {record.details.map((detail, idx) => (
                      <Typography key={idx} variant="body2" sx={{ color: "#334155", mb: idx < record.details.length - 1 ? 0.5 : 0 }}>
                        {detail}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      ))}
    </>
  );
}
