import { Box, Container, Typography, Grid } from "@mui/material";

const stats = [
  { value: "500+", label: "Drugs Analyzed" },
  { value: "10,000+", label: "Risk Assessments" },
  { value: "50+", label: "Healthcare Providers" },
  { value: "99.9%", label: "Uptime" },
];

export default function StatsSection() {
  return (
    <Box
      id="stats"
      sx={{
        py: { xs: 8, md: 10 },
        background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {stats.map((stat) => (
            <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="h2"
                  sx={{
                    color: "white",
                    fontWeight: 800,
                    fontSize: { xs: "2rem", md: "2.75rem" },
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5 }}
                >
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
