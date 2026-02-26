import { Box, Container, Typography, Grid, Link } from "@mui/material";
import { Shield } from "lucide-react";

const columns = [
  {
    title: "Company",
    links: ["About Us", "Careers", "Contact", "Blog"],
  },
  {
    title: "Product",
    links: ["Features", "Pricing", "Integrations", "API Docs"],
  },
  {
    title: "Resources",
    links: ["Help Center", "Documentation", "Tutorials", "Community"],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Terms of Service", "HIPAA Compliance", "BAA"],
  },
];

export default function Footer() {
  return (
    <Box sx={{ bgcolor: "#1e293b", pt: { xs: 6, md: 8 }, pb: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* Brand column */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: "rgba(59,130,246,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#60a5fa",
                }}
              >
                <Shield size={18} />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: "white" }}>
                MediRisk
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
              AI-powered drug safety platform helping healthcare providers make
              safer prescribing decisions.
            </Typography>
          </Grid>

          {/* Link columns */}
          {columns.map((col) => (
            <Grid size={{ xs: 6, sm: 3, md: 2.25 }} key={col.title}>
              <Typography
                variant="subtitle2"
                sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, mb: 2 }}
              >
                {col.title}
              </Typography>
              {col.links.map((link) => (
                <Link
                  key={link}
                  href="#"
                  underline="none"
                  display="block"
                  sx={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.875rem",
                    py: 0.5,
                    "&:hover": { color: "rgba(255,255,255,0.8)" },
                  }}
                >
                  {link}
                </Link>
              ))}
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            pt: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)" }}>
            &copy; {new Date().getFullYear()} MediRisk. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
