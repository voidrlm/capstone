import { memo, useCallback } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Edit2, Eye, Search, Star, Trash2, UserPlus, Users } from "lucide-react";
import { calculateAge } from "../../lib/helpers";
import { type Patient } from "../../types/patient";

type PatientsListPanelProps = {
  search: string;
  setSearch: (value: string) => void;
  setPage: (page: number) => void;
  loading: boolean;
  patients: Patient[];
  canRequestInsteadOfCreate: boolean;
  onToggleFavorite: (patientId: string, nextFavorite: boolean) => void;
  onViewPatient: (patientId: string, editable: boolean) => void;
  onDeletePatient: (patientId: string) => void;
  total: number;
  limit: number;
  page: number;
};

const headerCellSx = { fontWeight: 900, color: "#334155", py: 1.5 };
const headerCellShortSx = { fontWeight: 900, color: "#334155" };
const rowHoverSx = { "&:hover": { bgcolor: "rgba(0,212,170,0.04)" } };
const avatarSx = { width: 34, height: 34, bgcolor: "rgba(0,212,170,0.12)", color: "#00d4aa", fontSize: 13, fontWeight: 700 };
const actionBoxSx = { display: "flex", justifyContent: "flex-end", gap: 0.5 };

type PatientRowProps = {
  patient: Patient;
  onToggleFavorite: (patientId: string, nextFavorite: boolean) => void;
  onViewPatient: (patientId: string, editable: boolean) => void;
  onDeletePatient: (patientId: string) => void;
};

const PatientRow = memo(function PatientRow({ patient, onToggleFavorite, onViewPatient, onDeletePatient }: PatientRowProps) {
  const handleToggleFavorite = useCallback(
    () => onToggleFavorite(patient.id, !patient.is_favorite),
    [patient.id, patient.is_favorite, onToggleFavorite],
  );
  const handleView = useCallback(() => onViewPatient(patient.id, false), [patient.id, onViewPatient]);
  const handleEdit = useCallback(() => onViewPatient(patient.id, true), [patient.id, onViewPatient]);
  const handleDelete = useCallback(() => onDeletePatient(patient.id), [patient.id, onDeletePatient]);

  return (
    <TableRow hover sx={rowHoverSx}>
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={avatarSx}>
            {patient.name.split(" ").map((part) => part[0]).join("").substring(0, 2)}
          </Avatar>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography fontWeight={600}>{patient.name}</Typography>
            {patient.is_favorite ? <Star size={14} fill="#f59e0b" color="#f59e0b" /> : null}
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : "-"}
          {patient.date_of_birth ? ` / ${calculateAge(patient.date_of_birth) ?? "-"}` : ""}
        </Typography>
      </TableCell>
      <TableCell><Typography variant="body2" color="text.secondary">{patient.gender || "-"}</Typography></TableCell>
      <TableCell><Typography variant="body2" color="text.secondary">{new Date(patient.created_at).toLocaleDateString()}</Typography></TableCell>
      <TableCell align="right">
        <Box sx={actionBoxSx}>
          <IconButton
            size="small"
            onClick={handleToggleFavorite}
            title={patient.is_favorite ? "Remove favorite" : "Add favorite"}
            sx={{ color: patient.is_favorite ? "#f59e0b" : "#94a3b8" }}
          >
            <Star size={16} fill={patient.is_favorite ? "currentColor" : "none"} />
          </IconButton>
          <IconButton size="small" onClick={handleView} title="View" sx={{ color: "#00d4aa" }}><Eye size={16} /></IconButton>
          <IconButton size="small" onClick={handleEdit} title="Edit" sx={{ color: "#64748b" }}><Edit2 size={16} /></IconButton>
          <IconButton size="small" onClick={handleDelete} title="Delete" sx={{ color: "#dc2626" }}><Trash2 size={16} /></IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
});

export default memo(function PatientsListPanel({
  search,
  setSearch,
  setPage,
  loading,
  patients,
  canRequestInsteadOfCreate,
  onToggleFavorite,
  onViewPatient,
  onDeletePatient,
  total,
  limit,
  page,
}: PatientsListPanelProps) {
  return (
    <>
      <Card sx={{ mb: 2.5, borderRadius: 5, border: "1px solid rgba(148,163,184,0.16)", boxShadow: "0 18px 48px rgba(15,23,42,0.06)" }}>
        <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={900} sx={{ color: "#0f172a" }}>
                Approved Patients
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Search patients already connected to your organization.
              </Typography>
            </Box>
            <Chip label={`${total} total`} size="small" sx={{ bgcolor: "rgba(15,23,42,0.06)", color: "#334155", fontWeight: 800 }} />
          </Box>
          <TextField
            fullWidth
            placeholder="Search patients by name or email..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: 2.5 } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} color="#94a3b8" /></InputAdornment> } }}
          />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 5, border: "1px solid rgba(148,163,184,0.16)", boxShadow: "0 18px 48px rgba(15,23,42,0.06)", overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(248,250,252,0.92)" }}>
                <TableCell sx={headerCellSx}>Patient</TableCell>
                <TableCell sx={headerCellShortSx}>DOB / Age</TableCell>
                <TableCell sx={headerCellShortSx}>Gender</TableCell>
                <TableCell sx={headerCellShortSx}>Created</TableCell>
                <TableCell align="right" sx={headerCellShortSx}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: { xs: 8, md: 10 } }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, maxWidth: 520, mx: "auto" }}>
                      <Box sx={{ width: 74, height: 74, borderRadius: 4, bgcolor: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.18)", display: "grid", placeItems: "center" }}>
                        {canRequestInsteadOfCreate ? <UserPlus size={36} color="#008f74" /> : <Users size={36} color="#008f74" />}
                      </Box>
                      <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 900 }}>
                        {search ? "No matching patients" : canRequestInsteadOfCreate ? "No approved access yet" : "No patients yet"}
                      </Typography>
                      <Typography color="text.secondary" fontWeight={600} sx={{ lineHeight: 1.7 }}>
                        {search
                          ? "Try a different name or clear the search field."
                          : canRequestInsteadOfCreate
                            ? "Search by patient email above and request approval. Approved patients will appear here."
                            : "Add your first patient to begin building their care record."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <PatientRow
                    key={patient.id}
                    patient={patient}
                    onToggleFavorite={onToggleFavorite}
                    onViewPatient={onViewPatient}
                    onDeletePatient={onDeletePatient}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {total > limit ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Pagination count={Math.ceil(total / limit)} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="primary" />
          </Box>
        ) : null}
      </Card>
    </>
  );
});
