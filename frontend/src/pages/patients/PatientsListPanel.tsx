import {
  Avatar,
  Box,
  Card,
  CardContent,
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
import { Edit2, Eye, Search, Star, Trash2, Users } from "lucide-react";
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

export default function PatientsListPanel({
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
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: 2 }}>
          <TextField
            fullWidth
            placeholder="Search patients by name..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.paper" } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} color="#94a3b8" /></InputAdornment> } }}
          />
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>DOB / Age</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ p: 2, borderRadius: 3, bgcolor: "action.hover" }}><Users size={40} color="#94a3b8" /></Box>
                      <Typography color="text.secondary" fontWeight={500}>
                        {search
                          ? "No patients match your search."
                          : canRequestInsteadOfCreate
                            ? "No approved patient access yet. Search by patient email and request approval above."
                            : "No patients yet. Add your first patient."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(0,212,170,0.12)", color: "#00d4aa", fontSize: 13, fontWeight: 700 }}>
                          {patient.name.split(" ").map((part) => part[0]).join("").substring(0, 2)}
                        </Avatar>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography fontWeight={600}>{patient.name}</Typography>
                          {patient.is_favorite ? (
                            <Star size={14} fill="#f59e0b" color="#f59e0b" />
                          ) : null}
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
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => onToggleFavorite(patient.id, !patient.is_favorite)}
                          title={patient.is_favorite ? "Remove favorite" : "Add favorite"}
                          sx={{ color: patient.is_favorite ? "#f59e0b" : "#94a3b8" }}
                        >
                          <Star size={16} fill={patient.is_favorite ? "currentColor" : "none"} />
                        </IconButton>
                        <IconButton size="small" onClick={() => onViewPatient(patient.id, false)} title="View" sx={{ color: "#00d4aa" }}><Eye size={16} /></IconButton>
                        <IconButton size="small" onClick={() => onViewPatient(patient.id, true)} title="Edit" sx={{ color: "#64748b" }}><Edit2 size={16} /></IconButton>
                        <IconButton size="small" onClick={() => onDeletePatient(patient.id)} title="Delete" sx={{ color: "#dc2626" }}><Trash2 size={16} /></IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
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
}
