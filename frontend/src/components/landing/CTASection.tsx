import { Box, Container, Typography, Button } from "@mui/material";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 50%, #9333ea 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.05)",
          top: -250,
          right: -100,
        }}
      />
      <Container maxWidth="md" sx={{ textAlign: "center", position: "relative" }}>
        <Typography
          variant="h2"
          sx={{
            color: "white",
            mb: 2,
            fontSize: { xs: "1.75rem", md: "2.5rem" },
          }}
        >
          Ready to Make Prescribing Safer?
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "rgba(255,255,255,0.8)",
            mb: 5,
            maxWidth: 540,
            mx: "auto",
            lineHeight: 1.7,
          }}
        >
          Join thousands of healthcare professionals who trust MediRisk to
          protect their patients from adverse drug events.
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowRight size={18} />}
            onClick={() => navigate("/signup/patient")}
            sx={{
              bgcolor: "white",
              color: "primary.dark",
              px: 4,
              "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
            }}
          >
            Get Started Free
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/signup/provider")}
            sx={{
              borderColor: "rgba(255,255,255,0.4)",
              color: "white",
              px: 4,
              "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.1)" },
            }}
          >
            Register Organization
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
