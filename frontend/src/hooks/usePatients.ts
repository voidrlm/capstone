import { useState, useCallback, useEffect } from "react";
import { API_URL } from "../lib/api";
import { getAuthHeaders } from "../lib/helpers";

interface UsePatientsOptions {
  page?: number;
  limit?: number;
  search?: string;
}

interface UsePatientsResult {
  patients: any[];
  total: number;
  loading: boolean;
  error: string;
  fetchPatients: () => Promise<void>;
  toggleFavorite: (patientId: string, nextFavorite: boolean) => Promise<void>;
}

export function usePatients(options: UsePatientsOptions = {}): UsePatientsResult {
  const { page = 1, limit = 10, search = "" } = options;
  const [patients, setPatients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String((page - 1) * limit),
      });
      if (search) params.set("search", search);
      const res = await fetch(`${API_URL}/api/patients?${params}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load patients");
      const json = await res.json();
      const data = json.data || {};
      setPatients(data.patients || []);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load patients.");
    } finally {
      setLoading(false);
    }
  }, [page, search, limit]);

  const toggleFavorite = useCallback(async (patientId: string, nextFavorite: boolean) => {
    setPatients((current) =>
      current.map((p) => (p.id === patientId ? { ...p, is_favorite: nextFavorite } : p)),
    );
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/patients/${patientId}/favorite`, {
        method: nextFavorite ? "POST" : "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error?.message || "Failed to update favorite");
      }

      await fetchPatients();
    } catch (err) {
      setPatients((current) =>
        current.map((p) => (p.id === patientId ? { ...p, is_favorite: !nextFavorite } : p)),
      );
      setError(err instanceof Error ? err.message : "Failed to update favorite.");
    }
  }, [fetchPatients]);

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  return {
    patients,
    total,
    loading,
    error,
    fetchPatients,
    toggleFavorite,
  };
}
