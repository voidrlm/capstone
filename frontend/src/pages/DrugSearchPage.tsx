import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Search,
  ChevronDown,
  AlertTriangle,
  Shield,
  Pill,
  Info,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface DrugSearchResult {
  id: string;
  name: string;
  generic_name: string;
  manufacturer_name: string;
  manufacturer_names?: string[];
  route: string;
  category: string;
}

interface SideEffect {
  effectName: string;
  riskLevel: "high" | "medium" | "low";
  frequency: "common" | "uncommon" | "rare";
  description: string;
}

interface DrugProfile {
  id: string;
  name: string;
  generic_name: string;
  manufacturer_name: string;
  manufacturer_names?: string[];
  route: string;
  category: string;
  description: string;
  indications_and_usage: string;
  dosage_and_administration: string;
  warnings: string;
  adverse_reactions: string;
  active_ingredients: string;
  drug_interactions: string;
  pregnancy: string;
  geriatric_use: string;
  pediatric_use: string;
  sideEffects: {
    high: SideEffect[];
    medium: SideEffect[];
    low: SideEffect[];
  };
}

interface DrugInteraction {
  drug1Name: string;
  drug2Name: string;
  severity: "high" | "medium" | "low";
  description: string;
  recommendation: string;
}

const riskColors = {
  high: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  medium: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  low: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
};

const frequencyLabels = {
  common: "Common (>10%)",
  uncommon: "Uncommon (1-10%)",
  rare: "Rare (<1%)",
};

export default function DrugSearchPage() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<DrugSearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<DrugSearchResult[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<DrugProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Interaction checker state
  const [checkerDrugs, setCheckerDrugs] = useState<DrugSearchResult[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [checkerDialogOpen, setCheckerDialogOpen] = useState(false);

  // Autocomplete
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/drugs/autocomplete?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json();
        setSuggestions(json.data?.suggestions || []);
      }
    } catch {
      // Silently fail for autocomplete
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(query), 300);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  // Full search
  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setShowSuggestions(false);
    try {
      const res = await fetch(`${API_URL}/api/drugs/search?q=${encodeURIComponent(q)}&limit=20`);
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      const drugs = json.data?.drugs || [];
      setSearchResults(drugs);
      if (drugs.length === 0) {
        setError("No drugs found matching your search.");
      }
    } catch {
      setError("Failed to search drugs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load drug profile
  const loadDrugProfile = async (drugId: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/drugs/${drugId}`);
      if (!res.ok) throw new Error("Failed to load drug profile");
      const json = await res.json();
      const data = json.data || {};
      setSelectedDrug({ ...data.drug, sideEffects: data.sideEffects });
    } catch {
      setError("Failed to load drug details.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Check interactions
  const checkInteractions = async () => {
    if (checkerDrugs.length < 2) return;
    setInteractionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/drugs/check-interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugIds: checkerDrugs.map((d) => d.id) }),
      });
      if (!res.ok) throw new Error("Failed to check interactions");
      const json = await res.json();
      setInteractions(json.data?.interactions || []);
    } catch {
      setError("Failed to check drug interactions.");
    } finally {
      setInteractionLoading(false);
    }
  };

  const addToChecker = (drug: DrugSearchResult) => {
    if (!checkerDrugs.find((d) => d.id === drug.id)) {
      setCheckerDrugs([...checkerDrugs, drug]);
    }
  };

  const removeFromChecker = (drugId: string) => {
    setCheckerDrugs(checkerDrugs.filter((d) => d.id !== drugId));
    setInteractions([]);
  };

  const renderSideEffectGroup = (
    effects: SideEffect[],
    level: "high" | "medium" | "low",
    label: string
  ) => {
    if (!effects || effects.length === 0) return null;

    // Enhanced color palettes for each risk level
    const enhancedColors = {
      high: { bg: "#fef2f2", color: "#b91c1c", border: "#fca5a5", icon: "#ef4444" },
      medium: { bg: "#fffbeb", color: "#b45309", border: "#fcd34d", icon: "#f59e0b" },
      low: { bg: "#f0fdf4", color: "#15803d", border: "#86efac", icon: "#22c55e" },
    };

    const colors = enhancedColors[level];

    return (
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              bgcolor: colors.icon,
              boxShadow: `0 0 0 4px ${colors.bg}`,
            }}
          />
          <Typography variant="h6" fontWeight={700} color="text.primary">
            {label} <Typography component="span" variant="subtitle1" color="text.secondary" fontWeight={600}>({effects.length})</Typography>
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          {effects.map((effect, i) => (
            <Chip
              key={i}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>{effect.effectName}</Typography>
                  {effect.frequency && (
                    <Typography variant="caption" sx={{ opacity: 0.8, ml: 0.5 }}>
                      • {frequencyLabels[effect.frequency]}
                    </Typography>
                  )}
                </Box>
              }
              sx={{
                bgcolor: colors.bg,
                color: colors.color,
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                py: 2,
                px: 0.5,
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: `0 4px 12px ${colors.border}40`,
                  transform: "translateY(-1px)"
                }
              }}
            />
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Drug Search
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search for medications to view side effects, risk levels, and interaction warnings
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ position: "relative", mb: 6, zIndex: 10 }}>
        <TextField
          fullWidth
          placeholder="Search for a medication (e.g., Metformin, Lisinopril)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 4,
              bgcolor: "background.paper",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              transition: "all 0.3s ease",
              fontSize: "1.1rem",
              py: 0.5,
              "&:hover": {
                boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                transform: "translateY(-1px)",
              },
              "&.Mui-focused": {
                boxShadow: "0 12px 48px rgba(37, 99, 235, 0.15)",
                transform: "translateY(-2px)",
              },
              "& fieldset": {
                borderColor: "transparent",
              },
              "&:hover fieldset": {
                borderColor: "transparent",
              },
              "&.Mui-focused fieldset": {
                borderColor: "primary.main",
                borderWidth: 2,
              },
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ pl: 1 }}>
                  <Search size={24} color="#64748b" />
                </InputAdornment>
              ),
              endAdornment: query && (
                <InputAdornment position="end" sx={{ pr: 1 }}>
                  <Button
                    variant="contained"
                    onClick={() => handleSearch()}
                    disabled={loading}
                    sx={{
                      borderRadius: 3,
                      px: 3,
                      py: 1,
                      textTransform: "none",
                      fontWeight: 600,
                      boxShadow: "none",
                      "&:hover": {
                        boxShadow: "0 4px 12px rgba(37,99,235,0.2)"
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : "Search"}
                  </Button>
                </InputAdornment>
              )
            },
          }}
        />

        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <Paper
            elevation={24}
            sx={{
              position: "absolute",
              top: "calc(100% + 12px)",
              left: 0,
              right: 0,
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              maxHeight: 350,
              display: "flex",
              flexDirection: "column",
              animation: "slideDown 0.2s ease-out",
              "@keyframes slideDown": {
                from: { opacity: 0, transform: "translateY(-10px)" },
                to: { opacity: 1, transform: "translateY(0)" }
              }
            }}
          >
            <Box sx={{ p: 2, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                Suggestions
              </Typography>
            </Box>
            <List disablePadding sx={{ overflow: "auto" }}>
              {suggestions.map((drug, index) => (
                <Box key={drug.id}>
                  {index > 0 && <Divider />}
                  <ListItemButton
                    onClick={() => {
                      setQuery(drug.name);
                      setShowSuggestions(false);
                      loadDrugProfile(drug.id);
                    }}
                    sx={{
                      py: 1.5,
                      px: 2,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "primary.50",
                        pl: 3,
                      }
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        bgcolor: "grey.100",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "text.secondary"
                      }}>
                        <Pill size={18} />
                      </Box>
                      <ListItemText
                        primary={
                          <Typography fontWeight={600} color="text.primary">
                            {drug.name}
                          </Typography>
                        }
                        secondary={drug.generic_name ? `Generic: ${drug.generic_name}` : undefined}
                        secondaryTypographyProps={{ variant: "caption", color: "text.secondary", mt: 0.5 }}
                      />
                      <ChevronDown size={16} color="#cbd5e1" style={{ transform: "rotate(-90deg)" }} />
                    </Box>
                  </ListItemButton>
                </Box>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 6 }}>
        <Button
          variant="outlined"
          startIcon={<Shield size={20} />}
          onClick={() => setCheckerDialogOpen(true)}
          sx={{
            py: 1.5,
            px: 4,
            borderRadius: 4,
            borderWidth: 2,
            fontWeight: 600,
            fontSize: "1.05rem",
            color: "primary.main",
            borderColor: "primary.main",
            bgcolor: "primary.50",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.1)",
            "&:hover": {
              borderWidth: 2,
              bgcolor: "primary.main",
              color: "white",
              transform: "translateY(-2px)",
              boxShadow: "0 6px 20px rgba(37, 99, 235, 0.25)",
            }
          }}
        >
          Open Interaction Checker
          {checkerDrugs.length > 0 && (
            <Chip
              label={checkerDrugs.length}
              size="small"
              sx={{
                ml: 1.5,
                bgcolor: checkerDrugs.length >= 2 ? "error.main" : "primary.main",
                color: "white",
                fontWeight: 700
              }}
            />
          )}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Search Results */}
        {!selectedDrug && searchResults.length > 0 && (
          <Grid size={12}>
            <Typography variant="h5" fontWeight={700} mb={3} color="text.primary">
              Search Results <Typography component="span" variant="h6" color="primary.main" fontWeight={700}>({searchResults.length})</Typography>
            </Typography>
            <Grid container spacing={2}>
              {searchResults.map((drug) => (
                <Grid size={{ xs: 12, md: 6 }} key={drug.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 4,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                      transition: "all 0.3s ease",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      "&:hover": {
                        borderColor: "primary.300",
                        boxShadow: "0 12px 32px rgba(37, 99, 235, 0.08)",
                        transform: "translateY(-2px)"
                      }
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
                      <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: "primary.50",
                        color: "primary.main",
                        display: "flex"
                      }}>
                        <Pill size={24} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                          {drug.name}
                        </Typography>
                        {drug.generic_name && (
                          <Typography variant="subtitle2" color="text.secondary" mt={0.5}>
                            Generic: {drug.generic_name}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
                      {drug.manufacturer_names?.length ? (
                        <Chip
                          label={
                            drug.manufacturer_names.length === 1
                              ? drug.manufacturer_names[0]
                              : `${drug.manufacturer_names.length} manufacturers`
                          }
                          size="small"
                          sx={{ bgcolor: "grey.100", fontWeight: 500 }}
                        />
                      ) : drug.manufacturer_name ? (
                        <Chip label={drug.manufacturer_name} size="small" sx={{ bgcolor: "grey.100", fontWeight: 500 }} />
                      ) : null}
                      {drug.route && <Chip label={drug.route} size="small" variant="outlined" sx={{ borderColor: "divider" }} />}
                    </Box>

                    <Box sx={{ mt: "auto", display: "flex", gap: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        disableElevation
                        onClick={() => loadDrugProfile(drug.id)}
                        sx={{
                          borderRadius: 2,
                          py: 1,
                          bgcolor: "grey.900",
                          "&:hover": { bgcolor: "black" }
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToChecker(drug);
                        }}
                        sx={{
                          borderRadius: 2,
                          py: 1,
                          borderWidth: 2,
                          "&:hover": { borderWidth: 2 }
                        }}
                      >
                        + Checker
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}

        {/* Drug Detail View */}
        {detailLoading && (
          <Grid size={12}>
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={48} thickness={4} />
            </Box>
          </Grid>
        )}

        {selectedDrug && !detailLoading && (
          <Grid size={12}>
            <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
              <Box sx={{ p: 4, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
                {/* Drug Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 3, flexWrap: "wrap" }}>
                  <Box>
                    <Typography variant="h4" fontWeight={800} color="text.primary" mb={0.5}>
                      {selectedDrug.name}
                    </Typography>
                    {selectedDrug.generic_name && (
                      <Typography variant="subtitle1" color="text.secondary" fontWeight={500} mb={2}>
                        Generic: {selectedDrug.generic_name}
                      </Typography>
                    )}
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                      {selectedDrug.manufacturer_names?.length
                        ? selectedDrug.manufacturer_names.map((manufacturer) => (
                          <Chip
                            key={manufacturer}
                            label={manufacturer}
                            size="medium"
                            sx={{ fontWeight: 600, bgcolor: "white", border: "1px solid", borderColor: "divider" }}
                          />
                        ))
                        : selectedDrug.manufacturer_name ? (
                          <Chip label={selectedDrug.manufacturer_name} size="medium" sx={{ fontWeight: 600, bgcolor: "white", border: "1px solid", borderColor: "divider" }} />
                        ) : null}
                      {selectedDrug.route && <Chip label={selectedDrug.route} size="medium" variant="outlined" sx={{ fontWeight: 500, borderColor: "divider", bgcolor: "white" }} />}
                      {selectedDrug.category && (
                        <Chip label={selectedDrug.category} size="medium" sx={{ fontWeight: 600, bgcolor: "primary.50", color: "primary.700" }} />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Button
                      variant="contained"
                      sx={{ borderRadius: 3, py: 1, px: 3, fontWeight: 600, boxShadow: "none" }}
                      onClick={() => {
                        addToChecker({
                          id: selectedDrug.id,
                          name: selectedDrug.name,
                          generic_name: selectedDrug.generic_name,
                          manufacturer_name: selectedDrug.manufacturer_name,
                          manufacturer_names: selectedDrug.manufacturer_names,
                          route: selectedDrug.route,
                          category: selectedDrug.category,
                        });
                      }}
                    >
                      + Interaction Checker
                    </Button>
                    <Button
                      variant="outlined"
                      sx={{ borderRadius: 3, py: 1, px: 3, fontWeight: 600, borderColor: "divider", color: "text.primary", "&:hover": { bgcolor: "grey.100", borderColor: "grey.300" } }}
                      onClick={() => {
                        setSelectedDrug(null);
                      }}
                    >
                      Back to Results
                    </Button>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ p: 0 }}>
                {/* Tabs */}
                <Tabs
                  value={activeTab}
                  onChange={(_, v) => setActiveTab(v)}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    px: 2,
                    bgcolor: "white",
                    "& .MuiTab-root": {
                      fontWeight: 600,
                      fontSize: "1rem",
                      textTransform: "none",
                      py: 2.5
                    }
                  }}
                >
                  <Tab label="Side Effects & Risks" />
                  <Tab label="Drug Information" />
                  <Tab label="Warnings" />
                </Tabs>

                <Box sx={{ p: 4, bgcolor: "white" }}>
                  {/* Tab: Side Effects & Risks */}
                  {activeTab === 0 && (
                    <Box>
                      {selectedDrug.sideEffects ? (
                        <>
                          {renderSideEffectGroup(selectedDrug.sideEffects.high, "high", "High Risk")}
                          {renderSideEffectGroup(selectedDrug.sideEffects.medium, "medium", "Medium Risk")}
                          {renderSideEffectGroup(selectedDrug.sideEffects.low, "low", "Low Risk")}
                          {selectedDrug.sideEffects.high.length === 0 &&
                            selectedDrug.sideEffects.medium.length === 0 &&
                            selectedDrug.sideEffects.low.length === 0 && (
                              <Alert severity="info" sx={{ borderRadius: 3 }}>
                                No structured side effect data available for this drug.
                              </Alert>
                            )}
                        </>
                      ) : (
                        <Alert severity="info" sx={{ borderRadius: 3 }}>
                          No side effect data available.
                        </Alert>
                      )}
                    </Box>
                  )}

                  {/* Tab: Drug Information */}
                  {activeTab === 1 && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {[
                        { label: "Description", value: selectedDrug.description },
                        { label: "Indications & Usage", value: selectedDrug.indications_and_usage },
                        { label: "Dosage & Administration", value: selectedDrug.dosage_and_administration },
                        { label: "Active Ingredients", value: selectedDrug.active_ingredients },
                      ]
                        .filter((s) => s.value)
                        .map((section, i) => (
                          <Accordion key={i} defaultExpanded={i === 0} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, "&:before": { display: "none" } }}>
                            <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ bgcolor: "grey.50", borderRadius: 3, "&.Mui-expanded": { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: "1px solid", borderColor: "divider" } }}>
                              <Typography variant="h6" fontWeight={700}>{section.label}</Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3 }}>
                              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>
                                {section.value}
                              </Typography>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                    </Box>
                  )}

                  {/* Tab: Warnings */}
                  {activeTab === 2 && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {[
                        { label: "Warnings", value: selectedDrug.warnings },
                        { label: "Drug Interactions", value: selectedDrug.drug_interactions },
                        { label: "Pregnancy", value: selectedDrug.pregnancy },
                        { label: "Geriatric Use", value: selectedDrug.geriatric_use },
                        { label: "Pediatric Use", value: selectedDrug.pediatric_use },
                      ]
                        .filter((s) => s.value)
                        .map((section, i) => (
                          <Accordion key={i} defaultExpanded={i === 0} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, "&:before": { display: "none" } }}>
                            <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ bgcolor: "grey.50", borderRadius: 3, "&.Mui-expanded": { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: "1px solid", borderColor: "divider" } }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <AlertTriangle size={20} color="#d97706" />
                                <Typography variant="h6" fontWeight={700}>{section.label}</Typography>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3 }}>
                              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>
                                {section.value}
                              </Typography>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      {!selectedDrug.warnings && !selectedDrug.drug_interactions && (
                        <Alert severity="info" sx={{ borderRadius: 3 }}>No warning information available.</Alert>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Interaction Checker Dialog */}
      <Dialog
        open={checkerDialogOpen}
        onClose={() => setCheckerDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, overflow: "hidden" }
        }}
      >
        <DialogTitle sx={{ bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider", py: 3, px: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "primary.50", color: "primary.main", display: "flex" }}>
              <Shield size={28} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} color="text.primary">
                Drug Interaction Checker
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Analyze potential risks between multiple medications
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {checkerDrugs.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>
              <Shield size={48} opacity={0.2} style={{ marginBottom: 16 }} />
              <Typography variant="h6" fontWeight={600} mb={1}>No Drugs Selected</Typography>
              <Typography>Add medications from the search results to check for interactions.</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 4, mt: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, mb: 2 }}>
                  Selected Medications
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                  {checkerDrugs.map((drug) => (
                    <Chip
                      key={drug.id}
                      label={drug.name}
                      onDelete={() => removeFromChecker(drug.id)}
                      deleteIcon={<X size={16} />}
                      sx={{
                        py: 2.5,
                        px: 1,
                        borderRadius: 3,
                        bgcolor: "white",
                        border: "2px solid",
                        borderColor: "primary.200",
                        fontWeight: 600,
                        fontSize: "1rem",
                        "& .MuiChip-deleteIcon": {
                          color: "primary.300",
                          "&:hover": { color: "error.main" }
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {checkerDrugs.length >= 2 && (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={checkInteractions}
                  disabled={interactionLoading}
                  sx={{
                    mb: 4,
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    boxShadow: "0 8px 24px rgba(37, 99, 235, 0.2)",
                    "&:hover": {
                      boxShadow: "0 12px 32px rgba(37, 99, 235, 0.3)",
                      transform: "translateY(-1px)"
                    }
                  }}
                >
                  {interactionLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Analyze Interactions"
                  )}
                </Button>
              )}

              {checkerDrugs.length < 2 && checkerDrugs.length > 0 && (
                <Alert severity="info" sx={{ borderRadius: 3 }}>
                  Add at least one more medication to check for interactions.
                </Alert>
              )}

              {interactions.length > 0 && (
                <Box>
                  <Typography variant="h6" fontWeight={800} mb={3} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <AlertTriangle color="#ef4444" size={24} />
                    Found {interactions.length} Interaction(s)
                  </Typography>
                  {interactions.map((interaction, i) => {
                    const colors = riskColors[interaction.severity];
                    return (
                      <Paper
                        elevation={0}
                        key={i}
                        sx={{
                          mb: 3,
                          p: 3,
                          borderRadius: 4,
                          border: "2px solid",
                          borderColor: colors.border,
                          bgcolor: colors.bg,
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <Box sx={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 6, bgcolor: colors.color }} />

                        <Box sx={{ pl: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 2 }}>
                            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              {interaction.drug1Name} <X size={16} color={colors.color} style={{ margin: "0 4px" }} /> {interaction.drug2Name}
                            </Typography>
                            <Chip
                              label={`${interaction.severity.toUpperCase()} RISK`}
                              sx={{
                                bgcolor: colors.color,
                                color: "#fff",
                                fontWeight: 800,
                                letterSpacing: 0.5,
                                borderRadius: 2
                              }}
                            />
                          </Box>

                          <Typography variant="body1" color="text.primary" sx={{ mb: 2.5, lineHeight: 1.6, fontWeight: 500 }}>
                            {interaction.description}
                          </Typography>

                          {interaction.recommendation && (
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: 2, bgcolor: "white", borderRadius: 3, border: "1px solid", borderColor: colors.border }}>
                              <Info size={20} color={colors.color} style={{ flexShrink: 0, marginTop: 2 }} />
                              <Box>
                                <Typography variant="subtitle2" fontWeight={700} color={colors.color} mb={0.5}>
                                  Clinical Recommendation
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontWeight={500} lineHeight={1.5}>
                                  {interaction.recommendation}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              )}

              {interactions.length === 0 &&
                checkerDrugs.length >= 2 &&
                !interactionLoading && (
                  <Alert severity="success" sx={{ borderRadius: 3, py: 2, "& .MuiAlert-message": { width: "100%" } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography fontWeight={700} color="success.800">No known interactions found.</Typography>
                    </Box>
                    <Typography variant="body2" color="success.700" mt={0.5}>
                      The selected combination appears to be generally safe based on available data.
                    </Typography>
                  </Alert>
                )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: "grey.50", borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setCheckerDialogOpen(false)} sx={{ fontWeight: 600, color: "text.secondary" }}>
            Close Checker
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
