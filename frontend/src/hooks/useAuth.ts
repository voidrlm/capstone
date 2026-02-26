import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function useAuth(requiredRole?: string) {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userStr || !token) {
      navigate("/login");
      return;
    }

    try {
      const userData: UserData = JSON.parse(userStr);
      if (requiredRole && userData.role !== requiredRole) {
        navigate(
          userData.role === "patient"
            ? "/dashboard/patient"
            : "/dashboard/provider"
        );
        return;
      }
      setUser(userData);
    } catch {
      navigate("/login");
      return;
    }

    setLoading(false);
  }, [navigate, requiredRole]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  return { user, loading, logout };
}
