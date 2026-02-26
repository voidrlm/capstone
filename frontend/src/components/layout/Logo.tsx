import { Box, Typography } from "@mui/material";
import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md";
}

const sizes = {
  sm: { icon: 32, iconSize: 18, fontSize: "1rem" },
  md: { icon: 40, iconSize: 22, fontSize: "1.25rem" },
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
          borderRadius: "50%",
          bgcolor: variant === "light" ? "rgba(255,255,255,0.2)" : "primary.main",
          color: "white",
        }}
      >
        <Shield size={s.iconSize} />
      </Box>
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{
          fontSize: s.fontSize,
          color: variant === "light" ? "white" : "primary.main",
        }}
      >
        MediRisk
      </Typography>
    </Box>
  );
}
