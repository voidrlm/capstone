import { Box, Typography } from "@mui/material";
import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md";
}

const sizes = {
  sm: { icon: 34, iconSize: 18, fontSize: "1rem" },
  md: { icon: 42, iconSize: 22, fontSize: "1.25rem" },
};

export default function Logo({ variant = "dark", size = "md" }: LogoProps) {
  const navigate = useNavigate();
  const s = sizes[size];

  return (
    <Box
      onClick={() => navigate("/")}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        cursor: "pointer",
        textDecoration: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: s.icon,
          height: s.icon,
          borderRadius: 3,
          background:
            variant === "light"
              ? "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(191,219,254,0.16) 100%)"
              : "linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)",
          color: "white",
          boxShadow: variant === "light" ? "none" : "0 12px 24px rgba(37,99,235,0.22)",
        }}
      >
        <Shield size={s.iconSize} />
      </Box>
      <Typography
        variant="h6"
        fontWeight={800}
        sx={{
          fontSize: s.fontSize,
          color: variant === "light" ? "white" : "#0f172a",
          letterSpacing: "-0.03em",
        }}
      >
        MediRisk
      </Typography>
    </Box>
  );
}
