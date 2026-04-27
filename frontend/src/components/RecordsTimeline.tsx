import { Box, Card, CardContent, Chip, Typography, Divider } from "@mui/material";
import { Clock3, Calendar } from "lucide-react";
import { type RecordItem } from "../utils/recordHelpers";

interface RecordsTimelineProps {
  groupedRecords: Array<{ label: string; items: RecordItem[] }>;
  onRecordClick: (record: RecordItem) => void;
}

export default function RecordsTimeline({ groupedRecords, onRecordClick }: RecordsTimelineProps) {
  if (groupedRecords.length === 0) {
    return (
      <Card
        sx={{
          borderRadius: 5,
          border: "1px dashed rgba(148,163,184,0.35)",
          bgcolor: "rgba(255,255,255,0.72)",
          boxShadow: "0 16px 40px rgba(148,163,184,0.06)",
        }}
      >
        <CardContent sx={{ py: 7, textAlign: "center" }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: "#0f172a", mb: 1 }}>
            No records match these filters
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", maxWidth: 420, mx: "auto" }}>
            Try clearing the search or date filters to bring your full timeline back into view.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ position: "relative", pl: { xs: 0, md: 1 } }}>
      {/* Timeline line */}
      <Box
        sx={{
          position: "absolute",
          left: { xs: 18, md: 30 },
          top: 32,
          bottom: 20,
          width: 2,
          bgcolor: "rgba(0,212,170,0.18)",
          borderRadius: 1,
        }}
      />

      {groupedRecords.map((group, groupIdx) => (
        <Box key={group.label} sx={{ mb: groupIdx < groupedRecords.length - 1 ? 4 : 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, mb: 2.25, pl: { xs: 5.5, md: 10.5 } }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #dffaf4 0%, #f3fbff 100%)",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(0,212,170,0.2)",
                boxShadow: "0 10px 24px rgba(0,212,170,0.14)",
                zIndex: 1,
              }}
            >
              <Calendar size={18} color="#00b894" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={900} sx={{ color: "#0f172a", fontSize: { xs: "1.35rem", md: "1.6rem" } }}>
                {group.label}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                {group.items.length} record{group.items.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ pl: { xs: 5.5, md: 10.5 }, display: "grid", gap: 2 }}>
            {group.items.map((record) => (
              <Box key={record.id} sx={{ position: "relative" }}>
                {/* Timeline dot */}
                <Box
                  sx={{
                    position: "absolute",
                    left: { xs: -24, md: -33 },
                    top: 26,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: record.accent,
                    border: "3px solid #fff",
                    boxShadow: `0 0 0 3px ${record.accent}2a`,
                    zIndex: 1,
                  }}
                />

                <Card
                  onClick={() => onRecordClick(record)}
                  sx={{
                    borderRadius: 4,
                    border: `1px solid ${record.accent}1f`,
                    background: "linear-gradient(180deg, #ffffff 0%, #fcfdff 100%)",
                    boxShadow: "0 18px 40px rgba(148,163,184,0.08)",
                    cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: `0 18px 42px ${record.accent}20`,
                      borderColor: record.accent,
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.25, md: 2.75 } }}>
                    <Box sx={{ display: "flex", gap: { xs: 2, md: 2.5 }, alignItems: "flex-start" }}>
                      <Box
                        sx={{
                          width: { xs: 48, md: 54 },
                          height: { xs: 48, md: 54 },
                          borderRadius: 3,
                          bgcolor: record.surface,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                          border: `1px solid ${record.accent}30`,
                          boxShadow: `inset 0 1px 0 ${record.accent}12`,
                        }}
                      >
                        <record.icon size={24} color={record.accent} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5, mb: 1.25, flexWrap: "wrap" }}>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="h6"
                              fontWeight={800}
                              sx={{
                                color: "#0f172a",
                                mb: 0.75,
                                fontSize: { xs: "1rem", md: "1.08rem" },
                                lineHeight: 1.3,
                                wordBreak: "break-word",
                              }}
                            >
                              {record.category}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.85, flexWrap: "wrap" }}>
                              <Chip
                                label={record.type}
                                size="small"
                                sx={{
                                  bgcolor: `${record.accent}14`,
                                  color: record.accent,
                                  fontWeight: 700,
                                  fontSize: "0.68rem",
                                  height: 24,
                                  px: 1,
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ color: "#64748b", fontWeight: 700, fontSize: "0.75rem" }}
                              >
                                {record.provider}
                              </Typography>
                            </Box>
                          </Box>
                          {record.time ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "#64748b", flexShrink: 0, pt: 0.25 }}>
                              <Clock3 size={13} />
                              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.74rem" }}>
                                {record.time}
                              </Typography>
                            </Box>
                          ) : null}
                        </Box>

                        <Divider sx={{ my: 1.75, borderColor: "rgba(148,163,184,0.18)" }} />

                        <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", flexWrap: "wrap" }}>
                          <Chip
                            label={record.status}
                            size="small"
                            sx={{
                              bgcolor: "rgba(16,185,129,0.1)",
                              color: "#059669",
                              fontWeight: 800,
                              fontSize: "0.7rem",
                              height: 22,
                            }}
                          />
                          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.76rem", fontWeight: 600 }}>
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
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                fontSize: "0.9rem",
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
