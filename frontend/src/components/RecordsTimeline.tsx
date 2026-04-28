import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Card, CardContent, Chip, Divider, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { motion } from "framer-motion";
import { ArrowUpRight, Calendar, Clock3, Layers3, Orbit } from "lucide-react";
import { type RecordItem } from "../utils/recordHelpers";

interface RecordsTimelineProps {
  groupedRecords: Array<{ label: string; items: RecordItem[] }>;
  onRecordClick: (record: RecordItem) => void;
}

const railPulse = keyframes`
  0%, 100% { opacity: 0.52; filter: blur(0px); }
  50% { opacity: 1; filter: blur(1px); }
`;

const floatNode = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50% { transform: translate3d(0, -9px, 18px) rotate(5deg); }
`;

const scanSweep = keyframes`
  0% { transform: translateX(-120%) skewX(-16deg); opacity: 0; }
  18% { opacity: 0.36; }
  56% { opacity: 0.12; }
  100% { transform: translateX(160%) skewX(-16deg); opacity: 0; }
`;

function getDepthOffset(index: number) {
  const pattern = [0, 24, -10, 36, 8, 48];
  return pattern[index % pattern.length];
}

function formatRecordCount(count: number) {
  return `${count} record${count === 1 ? "" : "s"}`;
}

function formatMonthYear(label: string) {
  const date = new Date(label);
  if (Number.isNaN(date.getTime())) {
    return label;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function RecordsTimeline({ groupedRecords, onRecordClick }: RecordsTimelineProps) {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const groupRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [showFloatingDate, setShowFloatingDate] = useState(false);

  const activeGroup = groupedRecords[Math.min(activeGroupIndex, groupedRecords.length - 1)];
  const activeMonthYear = useMemo(() => (activeGroup ? formatMonthYear(activeGroup.label) : ""), [activeGroup]);

  useEffect(() => {
    groupRefs.current = groupRefs.current.slice(0, groupedRecords.length);
    setActiveGroupIndex(0);
  }, [groupedRecords.length]);

  useEffect(() => {
    const timelineEl = timelineRef.current;
    if (!timelineEl) return;

    const updateVisibility = () => {
      const rect = timelineEl.getBoundingClientRect();
      setShowFloatingDate(rect.top < window.innerHeight - 120 && rect.bottom > 180);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  useEffect(() => {
    const groups = groupRefs.current.filter(Boolean) as HTMLDivElement[];
    if (groups.length === 0) return;

    const updateActiveGroup = () => {
      const targetLine = window.innerHeight * 0.42;
      let nextIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      groups.forEach((groupEl) => {
        const index = Number(groupEl.dataset.groupIndex || 0);
        const rect = groupEl.getBoundingClientRect();
        const distance = Math.abs(rect.top - targetLine);

        if (rect.top <= window.innerHeight && rect.bottom >= 0 && distance < closestDistance) {
          closestDistance = distance;
          nextIndex = index;
        }
      });

      setActiveGroupIndex(nextIndex);
    };

    updateActiveGroup();
    window.addEventListener("scroll", updateActiveGroup, { passive: true });
    window.addEventListener("resize", updateActiveGroup);

    return () => {
      window.removeEventListener("scroll", updateActiveGroup);
      window.removeEventListener("resize", updateActiveGroup);
    };
  }, [groupedRecords]);

  if (groupedRecords.length === 0) {
    return (
      <Card
        sx={{
          borderRadius: 5,
          border: "1px dashed rgba(0,212,170,0.35)",
          bgcolor: "rgba(248,250,252,0.86)",
          boxShadow: "0 24px 70px rgba(15,23,42,0.08)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: -80,
            background:
              "radial-gradient(circle at 30% 20%, rgba(0,212,170,0.18), transparent 30%), radial-gradient(circle at 78% 74%, rgba(59,130,246,0.16), transparent 28%)",
          }}
        />
        <CardContent sx={{ py: 6, px: 3, textAlign: "center", position: "relative" }}>
          <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", mb: 1 }}>
            No records match these filters
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", maxWidth: 420, mx: "auto" }}>
            Clear the search or date filters to bring the full timeline back into view.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box
      ref={timelineRef}
      sx={{
        position: "relative",
        mt: 1,
        borderRadius: 6,
        overflow: "hidden",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,253,250,0.96) 42%, rgba(239,246,255,0.98) 100%)",
        border: "1px solid rgba(148,163,184,0.18)",
        boxShadow: "0 24px 70px rgba(15,23,42,0.08)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.045) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.62), rgba(0,0,0,0.18))",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          left: { xs: 26, md: 56 },
          top: 40,
          bottom: 36,
          width: 8,
          borderRadius: 999,
          background:
            "linear-gradient(180deg, rgba(0,212,170,0.08), rgba(0,212,170,0.78), rgba(59,130,246,0.58), rgba(245,158,11,0.54))",
          boxShadow: "0 0 28px rgba(0,212,170,0.28), 0 0 70px rgba(59,130,246,0.16)",
          animation: `${railPulse} 3.2s ease-in-out infinite`,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          left: { xs: 8, md: 35 },
          top: 32,
          bottom: 28,
          width: 44,
          borderRadius: 999,
          background: "linear-gradient(90deg, transparent, rgba(0,212,170,0.18), transparent)",
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "relative",
          p: { xs: 2, sm: 2.5, md: 4 },
          perspective: "1400px",
          transformStyle: "preserve-3d",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: { xs: "flex-start", md: "flex-end" },
            gap: 1,
            pl: { xs: 5, md: 8 },
            mb: { xs: 2.75, md: 3.25 },
            flexWrap: "wrap",
          }}
        >
          <Chip
            icon={<Layers3 size={15} />}
            label={`${groupedRecords.length} date layers`}
            size="small"
            sx={{
              color: "#1e3a8a",
              bgcolor: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.16)",
              fontWeight: 800,
            }}
          />
          <Chip
            icon={<Orbit size={15} />}
            label={formatRecordCount(groupedRecords.reduce((sum, group) => sum + group.items.length, 0))}
            size="small"
            sx={{
              color: "#0f766e",
              bgcolor: "rgba(20,184,166,0.12)",
              border: "1px solid rgba(20,184,166,0.18)",
              fontWeight: 800,
            }}
          />
        </Box>

        <Box sx={{ display: "grid", gap: { xs: 3.5, md: 4.5 } }}>
          {groupedRecords.map((group, groupIdx) => (
            <Box
              key={group.label}
              ref={(node: HTMLDivElement | null) => {
                groupRefs.current[groupIdx] = node;
              }}
              data-group-index={groupIdx}
              sx={{ position: "relative", pl: { xs: 6.5, md: 10 } }}
            >
              <Box
                sx={{
                  position: "absolute",
                  left: { xs: 11, md: 35 },
                  top: 4,
                  width: { xs: 32, md: 42 },
                  height: { xs: 32, md: 42 },
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: "#04111f",
                  background: "linear-gradient(135deg, #67e8f9 0%, #00d4aa 52%, #bef264 100%)",
                  border: "2px solid rgba(255,255,255,0.9)",
                  boxShadow: "0 0 0 8px rgba(0,212,170,0.12), 0 16px 36px rgba(0,212,170,0.26)",
                  zIndex: 2,
                  animation: `${floatNode} ${4 + groupIdx * 0.25}s ease-in-out infinite`,
                }}
              >
                <Calendar size={18} />
              </Box>

              <Box
                sx={{
                  mb: 1.75,
                  ml: { xs: 1.5, md: 2 + getDepthOffset(groupIdx) / 2 },
                  transform: { xs: "none", md: `translateZ(${18 + groupIdx * 3}px)` },
                }}
              >
                <Typography variant="h5" fontWeight={900} sx={{ color: "#0f172a", fontSize: { xs: "1.18rem", md: "1.45rem" } }}>
                  {group.label}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 700 }}>
                  {formatRecordCount(group.items.length)}
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gap: { xs: 2, md: 2.4 } }}>
                {group.items.map((record, recordIdx) => {
                  const depth = getDepthOffset(recordIdx + groupIdx);
                  return (
                    <Box
                      key={record.id}
                      component={motion.div}
                      initial={{ opacity: 0, y: 28, rotateX: -7 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ duration: 0.46, delay: Math.min((groupIdx + recordIdx) * 0.045, 0.45) }}
                      sx={{
                        position: "relative",
                        ml: { xs: 0, md: depth },
                        transformStyle: "preserve-3d",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          left: { xs: -39, md: -56 - depth },
                          top: 34,
                          width: { xs: 36, md: 58 + depth },
                          height: 2,
                          background: `linear-gradient(90deg, ${alpha(record.accent, 0.85)}, ${alpha(record.accent, 0.08)})`,
                          boxShadow: `0 0 18px ${alpha(record.accent, 0.42)}`,
                          pointerEvents: "none",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          left: { xs: -46, md: -63 - depth },
                          top: 25,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          bgcolor: record.accent,
                          border: "3px solid #e0f2fe",
                          boxShadow: `0 0 0 8px ${alpha(record.accent, 0.16)}, 0 0 26px ${alpha(record.accent, 0.64)}`,
                          zIndex: 3,
                          pointerEvents: "none",
                        }}
                      />

                      <Card
                        component={motion.div}
                        whileHover={{ y: -7, rotateX: 4, rotateY: -4, scale: 1.012 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => onRecordClick(record)}
                        sx={{
                          width: "100%",
                          textAlign: "left",
                          display: "block",
                          borderRadius: 4,
                          border: `1px solid ${alpha(record.accent, 0.34)}`,
                          background:
                            "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(239,246,255,0.92) 48%, rgba(240,253,250,0.9) 100%)",
                          boxShadow: `0 22px 48px rgba(2,6,23,0.22), 0 18px 56px ${alpha(record.accent, 0.14)}`,
                          cursor: "pointer",
                          overflow: "hidden",
                          position: "relative",
                          transformOrigin: "left center",
                          transform: { xs: "none", md: `rotateY(-4deg) translateZ(${24 + recordIdx * 2}px)` },
                          transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                          "&:before": {
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            background: `radial-gradient(circle at 14% 20%, ${alpha(record.accent, 0.24)}, transparent 28%)`,
                            pointerEvents: "none",
                          },
                          "&:after": {
                            content: '""',
                            position: "absolute",
                            insetBlock: 0,
                            width: "42%",
                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.76), transparent)",
                            animation: `${scanSweep} 5.8s ease-in-out infinite`,
                            animationDelay: `${(recordIdx % 4) * 0.7}s`,
                            pointerEvents: "none",
                          },
                          "&:hover": {
                            borderColor: record.accent,
                            boxShadow: `0 30px 70px rgba(2,6,23,0.28), 0 24px 70px ${alpha(record.accent, 0.24)}`,
                          },
                        }}
                      >
                        <CardContent sx={{ p: { xs: 2, md: 2.55 }, position: "relative", zIndex: 1 }}>
                          <Box sx={{ display: "flex", gap: { xs: 1.6, md: 2.2 }, alignItems: "flex-start" }}>
                            <Box
                              sx={{
                                width: { xs: 52, md: 62 },
                                height: { xs: 52, md: 62 },
                                borderRadius: 3,
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                                color: record.accent,
                                background: `linear-gradient(135deg, ${alpha(record.accent, 0.16)}, rgba(255,255,255,0.88))`,
                                border: `1px solid ${alpha(record.accent, 0.28)}`,
                                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.82), 0 14px 32px ${alpha(record.accent, 0.18)}`,
                              }}
                            >
                              <record.icon size={27} color={record.accent} />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.4, flexWrap: "wrap", mb: 1.2 }}>
                                <Box sx={{ minWidth: 0, flex: "1 1 240px" }}>
                                  <Typography
                                    variant="h6"
                                    fontWeight={900}
                                    sx={{
                                      color: "#08111f",
                                      fontSize: { xs: "1rem", md: "1.12rem" },
                                      lineHeight: 1.22,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {record.category}
                                  </Typography>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.85, mt: 1, flexWrap: "wrap" }}>
                                    <Chip
                                      label={record.type}
                                      size="small"
                                      sx={{
                                        bgcolor: alpha(record.accent, 0.12),
                                        color: record.accent,
                                        border: `1px solid ${alpha(record.accent, 0.2)}`,
                                        fontWeight: 900,
                                        fontSize: "0.68rem",
                                        height: 24,
                                      }}
                                    />
                                    <Typography variant="caption" sx={{ color: "#475569", fontWeight: 800, fontSize: "0.74rem" }}>
                                      {record.provider}
                                    </Typography>
                                  </Box>
                                </Box>

                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, color: "#334155", flexShrink: 0 }}>
                                  {record.time ? (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.65 }}>
                                      <Clock3 size={14} />
                                      <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                        {record.time}
                                      </Typography>
                                    </Box>
                                  ) : null}
                                  <ArrowUpRight size={18} color={record.accent} />
                                </Box>
                              </Box>

                              <Divider sx={{ my: 1.5, borderColor: alpha(record.accent, 0.14) }} />

                              <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                                <Chip
                                  label={record.status}
                                  size="small"
                                  sx={{
                                    bgcolor: "rgba(16,185,129,0.1)",
                                    color: "#047857",
                                    border: "1px solid rgba(16,185,129,0.16)",
                                    fontWeight: 900,
                                    fontSize: "0.69rem",
                                    height: 22,
                                  }}
                                />
                                <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 800 }}>
                                  Added by {record.addedBy}
                                </Typography>
                              </Box>

                              {record.details.length > 0 ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    mt: 1.5,
                                    color: "#334155",
                                    lineHeight: 1.55,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    fontSize: "0.88rem",
                                  }}
                                >
                                  {record.details[0]}
                                </Typography>
                              ) : null}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        component={motion.div}
        initial={false}
        animate={{
          opacity: showFloatingDate ? 1 : 0,
          y: showFloatingDate ? 0 : 18,
          scale: showFloatingDate ? 1 : 0.96,
        }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        sx={{
          position: "fixed",
          left: "50%",
          bottom: { xs: 14, md: 22 },
          transform: "translateX(-50%)",
          zIndex: 1200,
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            minWidth: { xs: 180, md: 220 },
            px: { xs: 2, md: 2.4 },
            py: 1.15,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            color: "#0f172a",
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(148,163,184,0.24)",
            boxShadow: "0 18px 48px rgba(15,23,42,0.18)",
            backdropFilter: "blur(18px)",
          }}
        >
          <Calendar size={17} color="#0f766e" />
          <Typography variant="subtitle2" fontWeight={900} sx={{ lineHeight: 1, whiteSpace: "nowrap" }}>
            {activeMonthYear}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
