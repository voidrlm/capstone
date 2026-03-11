import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
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
    const colors = riskColors[level];
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: colors.color,
            }}
          />
          <Typography variant="subtitle1" fontWeight={600}>
            {label} ({effects.length})
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {effects.map((effect, i) => (
            <Chip
              key={i}
              label={`${effect.effectName}${effect.frequency ? ` - ${frequencyLabels[effect.frequency]}` : ""}`}
              size="small"
              sx={{
                bgcolor: colors.bg,
                color: colors.color,
                border: `1px solid ${colors.border}`,
                fontWeight: 500,
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
      <Box sx={{ position: "relative", mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search by drug name (e.g., Metformin, Lisinopril)..."
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
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <Paper
            elevation={8}
            sx={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 10,
              maxHeight: 300,
              overflow: "auto",
              mt: 0.5,
            }}
          >
            <List disablePadding>
              {suggestions.map((drug) => (
                <ListItemButton
                  key={drug.id}
                  onClick={() => {
                    setQuery(drug.name);
                    setShowSuggestions(false);
                    loadDrugProfile(drug.id);
                  }}
                >
                  <ListItemText
                    primary={drug.name}
                    secondary={drug.generic_name ? `Generic: ${drug.generic_name}` : undefined}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <Button variant="contained" onClick={() => handleSearch()} disabled={loading || !query.trim()}>
          {loading ? <CircularProgress size={20} color="inherit" /> : "Search"}
        </Button>
        <Button
          variant="outlined"
          startIcon={<Shield size={18} />}
          onClick={() => setCheckerDialogOpen(true)}
        >
          Interaction Checker
          {checkerDrugs.length > 0 && ` (${checkerDrugs.length})`}
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
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Search Results ({searchResults.length})
                </Typography>
                <List>
                  {searchResults.map((drug, idx) => (
                    <Box key={drug.id}>
                      {idx > 0 && <Divider />}
                      <ListItemButton
                        onClick={() => loadDrugProfile(drug.id)}
                        sx={{ borderRadius: 2 }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Pill size={16} />
                              <Typography fontWeight={600}>{drug.name}</Typography>
                              {drug.generic_name && (
                                <Typography variant="body2" color="text.secondary">
                                  ({drug.generic_name})
                                </Typography>
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                              {drug.manufacturer_name && (
                                <Chip label={drug.manufacturer_name} size="small" variant="outlined" />
                              )}
                              {drug.route && <Chip label={drug.route} size="small" variant="outlined" />}
                            </Box>
                          }
                        />
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToChecker(drug);
                          }}
                        >
                          + Checker
                        </Button>
                      </ListItemButton>
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Drug Detail View */}
        {detailLoading && (
          <Grid size={12}>
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          </Grid>
        )}

        {selectedDrug && !detailLoading && (
          <Grid size={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                {/* Drug Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {selectedDrug.name}
                    </Typography>
                    {selectedDrug.generic_name && (
                      <Typography variant="body1" color="text.secondary">
                        Generic: {selectedDrug.generic_name}
                      </Typography>
                    )}
                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                      {selectedDrug.manufacturer_name && (
                        <Chip label={selectedDrug.manufacturer_name} size="small" />
                      )}
                      {selectedDrug.route && <Chip label={selectedDrug.route} size="small" variant="outlined" />}
                      {selectedDrug.category && (
                        <Chip label={selectedDrug.category} size="small" variant="outlined" />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        addToChecker({
                          id: selectedDrug.id,
                          name: selectedDrug.name,
                          generic_name: selectedDrug.generic_name,
                          manufacturer_name: selectedDrug.manufacturer_name,
                          route: selectedDrug.route,
                          category: selectedDrug.category,
                        });
                      }}
                    >
                      + Interaction Checker
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedDrug(null);
                      }}
                    >
                      Back to Results
                    </Button>
                  </Box>
                </Box>

                {/* Tabs */}
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
                  <Tab label="Side Effects & Risks" />
                  <Tab label="Drug Information" />
                  <Tab label="Warnings" />
                </Tabs>

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
                            <Alert severity="info">
                              No structured side effect data available for this drug.
                            </Alert>
                          )}
                      </>
                    ) : (
                      <Alert severity="info">
                        No side effect data available.
                      </Alert>
                    )}
                  </Box>
                )}

                {/* Tab: Drug Information */}
                {activeTab === 1 && (
                  <Box>
                    {[
                      { label: "Description", value: selectedDrug.description },
                      { label: "Indications & Usage", value: selectedDrug.indications_and_usage },
                      { label: "Dosage & Administration", value: selectedDrug.dosage_and_administration },
                      { label: "Active Ingredients", value: selectedDrug.active_ingredients },
                    ]
                      .filter((s) => s.value)
                      .map((section, i) => (
                        <Accordion key={i} defaultExpanded={i === 0}>
                          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
                            <Typography fontWeight={600}>{section.label}</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                              {section.value}
                            </Typography>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                  </Box>
                )}

                {/* Tab: Warnings */}
                {activeTab === 2 && (
                  <Box>
                    {[
                      { label: "Warnings", value: selectedDrug.warnings },
                      { label: "Drug Interactions", value: selectedDrug.drug_interactions },
                      { label: "Pregnancy", value: selectedDrug.pregnancy },
                      { label: "Geriatric Use", value: selectedDrug.geriatric_use },
                      { label: "Pediatric Use", value: selectedDrug.pediatric_use },
                    ]
                      .filter((s) => s.value)
                      .map((section, i) => (
                        <Accordion key={i} defaultExpanded={i === 0}>
                          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <AlertTriangle size={16} color="#d97706" />
                              <Typography fontWeight={600}>{section.label}</Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                              {section.value}
                            </Typography>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    {!selectedDrug.warnings && !selectedDrug.drug_interactions && (
                      <Alert severity="info">No warning information available.</Alert>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Interaction Checker Dialog */}
      <Dialog
        open={checkerDialogOpen}
        onClose={() => setCheckerDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Shield size={24} />
            Drug Interaction Checker
          </Box>
        </DialogTitle>
        <DialogContent>
          {checkerDrugs.length === 0 ? (
            <Alert severity="info" sx={{ mt: 1 }}>
              Add drugs from search results to check for interactions.
            </Alert>
          ) : (
            <>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3, mt: 1 }}>
                {checkerDrugs.map((drug) => (
                  <Chip
                    key={drug.id}
                    label={drug.name}
                    onDelete={() => removeFromChecker(drug.id)}
                    deleteIcon={<X size={14} />}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>

              {checkerDrugs.length >= 2 && (
                <Button
                  variant="contained"
                  onClick={checkInteractions}
                  disabled={interactionLoading}
                  sx={{ mb: 3 }}
                >
                  {interactionLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Check Interactions"
                  )}
                </Button>
              )}

              {checkerDrugs.length < 2 && (
                <Alert severity="info">Add at least 2 drugs to check interactions.</Alert>
              )}

              {interactions.length > 0 && (
                <Box>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    Found {interactions.length} Interaction(s)
                  </Typography>
                  {interactions.map((interaction, i) => {
                    const colors = riskColors[interaction.severity];
                    return (
                      <Card
                        key={i}
                        sx={{
                          mb: 2,
                          border: `1px solid ${colors.border}`,
                          bgcolor: colors.bg,
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                            <AlertTriangle size={18} color={colors.color} />
                            <Typography fontWeight={600}>
                              {interaction.drug1Name} + {interaction.drug2Name}
                            </Typography>
                            <Chip
                              label={interaction.severity.toUpperCase()}
                              size="small"
                              sx={{ bgcolor: colors.color, color: "#fff", fontWeight: 700 }}
                            />
                          </Box>
                          <Typography variant="body2" mb={1}>
                            {interaction.description}
                          </Typography>
                          {interaction.recommendation && (
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mt: 1 }}>
                              <Info size={16} color={colors.color} />
                              <Typography variant="body2" fontWeight={500}>
                                {interaction.recommendation}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}

              {interactions.length === 0 &&
                checkerDrugs.length >= 2 &&
                !interactionLoading && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    No known interactions found between the selected drugs.
                  </Alert>
                )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckerDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
