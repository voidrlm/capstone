import { Box, Card, CardContent, Chip, Typography, Divider } from "@mui/material";
import { Clock3, Calendar } from "lucide-react";
import { type RecordItem } from "../utils/recordHelpers";

interface RecordsTimelineProps {
  groupedRecords: Array<{ label: string; items: RecordItem[] }>;
  onRecordClick: (record: RecordItem) => void;
}

export default function RecordsTimeline({ groupedRecords, onRecordClick }: RecordsTimelineProps) {
  return (
    <Box sx={{ position: "relative" }}>
      {/* Timeline line */}
      <Box
        sx={{
          position: "absolute",
          left: 24,
          top: 20,
          bottom: 20,
          width: 2,
          bgcolor: "rgba(0,212,170,0.15)",
          borderRadius: 1,
        }}
      />

      {groupedRecords.map((group, groupIdx) => (
        <Box key={group.label} sx={{ mb: groupIdx < groupedRecords.length - 1 ? 4 : 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, pl: 12 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                bgcolor: "linear-gradient(135deg, #00d4aa 0%, #00a388 100%)",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 4px 20px rgba(0,212,170,0.3)",
                zIndex: 1,
              }}
            >
              <Calendar size={22} color="#fff" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={900} sx={{ color: "#0f172a" }}>
                {group.label}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {group.items.length} record{group.items.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ pl: 12, display: "grid", gap: 2 }}>
            {group.items.map((record) => (
              <Box key={record.id} sx={{ position: "relative" }}>
                {/* Timeline dot */}
                <Box
                  sx={{
                    position: "absolute",
                    left: -40,
                    top: 20,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: record.accent,
                    border: "3px solid #fff",
                    boxShadow: `0 0 0 3px ${record.accent}33`,
                    zIndex: 1,
                  }}
                />

                <Card
                  onClick={() => onRecordClick(record)}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    background: "#fff",
                    boxShadow: "0 2px 12px rgba(148,163,184,0.08)",
                    cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateX(4px)",
                      boxShadow: `0 8px 30px ${record.accent}25`,
                      borderColor: record.accent,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 3,
                          bgcolor: record.surface,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                          border: `1px solid ${record.accent}30`,
                        }}
                      >
                        <record.icon size={28} color={record.accent} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                          <Box>
                            <Typography variant="h6" fontWeight={800} sx={{ color: "#0f172a", mb: 0.5 }}>
                              {record.category}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                              <Chip
                                label={record.type}
                                size="small"
                                sx={{
                                  bgcolor: `${record.accent}15`,
                                  color: record.accent,
                                  fontWeight: 700,
                                  fontSize: "0.7rem",
                                  height: 24,
                                  px: 1,
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem" }}
                              >
                                {record.provider}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                            <Clock3 size={14} />
                            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                              {record.time}
                            </Typography>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                          <Chip
                            label={record.status}
                            size="small"
                            sx={{
                              bgcolor: "rgba(16,185,129,0.1)",
                              color: "#059669",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              height: 22,
                            }}
                          />
                          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                            Added by {record.addedBy}
                          </Typography>
                        </Box>

                        {record.details.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#475569",
                                lineHeight: 1.6,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {record.details[0]}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
