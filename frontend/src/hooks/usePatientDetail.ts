import { useState, useCallback } from "react";
import { getAuthHeaders } from "../lib/helpers";
import { toForm } from "../pages/PatientsPage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface UsePatientDetailResult {
  selectedPatient: any;
  loading: boolean;
  error: string;
  viewPatient: (id: string, edit?: boolean) => Promise<void>;
}

export function usePatientDetail(setForm: (form: any) => void, setIsEditing: (editing: boolean) => void, setIsCreating: (creating: boolean) => void): UsePatientDetailResult {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const viewPatient = useCallback(async (id: string, edit = false) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/patients/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load patient");
      const json = await res.json();
      const detail = json.data || null;
      setSelectedPatient(detail);
      setForm(toForm(detail));
      setIsEditing(edit);
      setIsCreating(false);
    } catch {
      setError("Failed to load patient details.");
    } finally {
      setLoading(false);
    }
  }, [setForm, setIsEditing, setIsCreating]);

  return {
    selectedPatient,
    loading,
    error,
    viewPatient,
  };
}
