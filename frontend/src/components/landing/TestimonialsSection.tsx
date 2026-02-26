import { Box, Container, Typography, Card, CardContent, Avatar, Grid } from "@mui/material";

const testimonials = [
  {
    quote:
      "MediRisk has transformed how we handle prescriptions. The drug interaction alerts alone have prevented several potentially dangerous situations.",
    name: "Dr. Sarah Chen",
    title: "Chief of Internal Medicine",
    initials: "SC",
    color: "#3b82f6",
  },
  {
    quote:
      "As a pharmacist, having instant access to comprehensive side-effect data helps me counsel patients more effectively. It's become indispensable.",
    name: "James Okafor, PharmD",
    title: "Clinical Pharmacist",
    initials: "JO",
    color: "#10b981",
  },
  {
    quote:
      "The analytics dashboard gives our team clear visibility into risk patterns across our entire patient population. Decision-making has never been easier.",
    name: "Dr. Maria Rodriguez",
    title: "Medical Director",
    initials: "MR",
    color: "#8b5cf6",
  },
];

export default function TestimonialsSection() {
  return (
    <Box
      id="testimonials"
      sx={{ py: { xs: 8, md: 12 }, bgcolor: "background.paper" }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="overline"
            sx={{ color: "primary.main", fontWeight: 600, letterSpacing: 2 }}
          >
            TESTIMONIALS
          </Typography>
          <Typography variant="h2" sx={{ mt: 1, mb: 2 }}>
            Trusted by Healthcare Professionals
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {testimonials.map((t) => (
            <Grid size={{ xs: 12, md: 4 }} key={t.name}>
              <Card
                sx={{
                  height: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "none",
                  "&:hover": { boxShadow: "0 10px 40px rgba(0,0,0,0.08)" },
                  transition: "box-shadow 0.2s ease",
                }}
              >
                <CardContent sx={{ p: 3.5 }}>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 3, lineHeight: 1.8, fontStyle: "italic" }}
                  >
                    "{t.quote}"
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: t.color, width: 44, height: 44, fontWeight: 600 }}>
                      {t.initials}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {t.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.title}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
