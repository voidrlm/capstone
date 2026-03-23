import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

function hasRequiredRole(userRole: string, requiredRole?: string) {
  if (!requiredRole) {
    return true;
  }

  if (requiredRole === "provider") {
    return userRole === "provider" || userRole === "org_admin";
  }

  return userRole === requiredRole;
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
      if (!hasRequiredRole(userData.role, requiredRole)) {
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
