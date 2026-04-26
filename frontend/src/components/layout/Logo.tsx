import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface LogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md";
}

const sizes = {
  sm: { icon: 34, fontSize: "1rem" },
  md: { icon: 42, fontSize: "1.25rem" },
};

const PharmaLogsIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00d4aa" />
        <stop offset="100%" stopColor="#0099cc" />
      </linearGradient>
    </defs>
    {/* Background rounded square */}
    <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#logoGradient)" />
    {/* Pill/capsule shape */}
    <rect x="14" y="16" width="20" height="8" rx="4" fill="white" fillOpacity="0.95" />
    {/* Document lines */}
    <rect x="14" y="28" width="12" height="2" rx="1" fill="white" fillOpacity="0.8" />
    <rect x="14" y="32" width="16" height="2" rx="1" fill="white" fillOpacity="0.8" />
    <rect x="14" y="36" width="10" height="2" rx="1" fill="white" fillOpacity="0.8" />
    {/* Small accent dot */}
    <circle cx="32" cy="30" r="2" fill="white" fillOpacity="0.9" />
  </svg>
);

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
      <PharmaLogsIcon size={s.icon} />
      <Typography
        variant="h6"
        fontWeight={800}
        sx={{
          fontSize: s.fontSize,
          color: variant === "light" ? "white" : "#0f172a",
          letterSpacing: "-0.03em",
        }}
      >
        PharmaLogs
      </Typography>
    </Box>
  );
}
