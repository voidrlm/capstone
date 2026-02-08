import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  Link,
  Avatar,
  IconButton,
  Paper,
} from "@mui/material";
import {
  Shield,
  Target,
  Heart,
  Users,
  GraduationCap,
  Lightbulb,
  Award,
  BookOpen,
  Github,
  Linkedin,
  Mail,
} from "lucide-react";

function AboutPage() {
  const team = [
    {
      name: "Arjun Vasu",
      role: "Full Stack Developer",
      bio: "Computer Science student at Clark University with a passion for healthcare technology and AI-driven solutions.",
      links: { github: "#", linkedin: "#", email: "mailto:avasu@clarku.edu" },
    },
    {
      name: "Uranbileg Enkhjargal",
      role: "Full Stack Developer",
      bio: "Computer Science student at Clark University focused on building scalable web applications and data systems.",
      links: {
        github: "#",
        linkedin: "#",
        email: "mailto:uenkhjargal@clarku.edu",
      },
    },
  ];

  const projectGoals = [
    {
      icon: Target,
      title: "Improve Medication Safety",
      description:
        "Reduce adverse drug reactions by providing healthcare providers with comprehensive risk assessment tools.",
    },
    {
      icon: Lightbulb,
      title: "Bridge Information Gaps",
      description:
        "Make complex drug interaction data accessible and actionable for both providers and patients.",
    },
    {
      icon: Users,
      title: "Empower Decision Making",
      description:
        "Support clinical decision-making with evidence-based analytics and personalized risk scores.",
    },
  ];

  const technologies = [
    { name: "React", category: "Frontend" },
    { name: "TypeScript", category: "Frontend" },
    { name: "Material UI", category: "Frontend" },
    { name: "Node.js", category: "Backend" },
    { name: "Express", category: "Backend" },
    { name: "PostgreSQL", category: "Database" },
    { name: "Docker", category: "DevOps" },
    { name: "JWT Auth", category: "Security" },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid",
          borderColor: "divider",
          py: 2,
          px: 3,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Link
              href="/"
              underline="none"
              sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: "primary.main",
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                }}
              >
                <Shield size={24} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  MediRisk
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Drug Safety Platform
                </Typography>
              </Box>
            </Link>

            <Stack direction="row" spacing={4} alignItems="center">
              <Link
                href="/features"
                underline="none"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                Features
              </Link>
              <Link
                href="/about"
                underline="none"
                sx={{ color: "primary.main", fontWeight: 600 }}
              >
                About
              </Link>
              <Button component={Link} href="/" variant="contained">
                Sign In
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          py: 10,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Chip
            icon={<GraduationCap size={16} />}
            label="Clark University Capstone Project"
            sx={{
              mb: 3,
              bgcolor: "primary.light",
              color: "primary.dark",
              fontWeight: 600,
            }}
          />
          <Typography variant="h2" fontWeight={800} gutterBottom>
            About{" "}
            <Box component="span" sx={{ color: "primary.main" }}>
              MediRisk
            </Box>
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ fontWeight: 400, lineHeight: 1.7 }}
          >
            A capstone demonstration project exploring how technology can
            enhance medication safety through intelligent drug interaction
            analysis and risk assessment.
          </Typography>
        </Container>
      </Box>

      {/* Mission Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Our Mission
            </Typography>
            <Typography
              variant="h5"
              color="primary.main"
              fontWeight={500}
              sx={{ mb: 3, fontStyle: "italic" }}
            >
              To demonstrate how modern web technologies and data-driven
              approaches can be applied to improve patient safety in healthcare
              settings.
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ lineHeight: 1.8 }}
            >
              MediRisk was developed as a capstone project to showcase the
              potential of technology in healthcare. While this is a
              demonstration project and not a certified medical device, it
              represents our vision of how drug safety platforms could help
              healthcare providers make more informed decisions.
            </Typography>
          </Grid>
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <Box
              sx={{
                width: 200,
                height: 200,
                bgcolor: "primary.light",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "primary.main",
              }}
            >
              <Heart size={100} strokeWidth={1} />
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Project Goals */}
      <Box sx={{ bgcolor: "rgba(59, 130, 246, 0.04)", py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Project Goals
            </Typography>
            <Typography variant="body1" color="text.secondary">
              What we set out to achieve with this capstone project
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {projectGoals.map((goal, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: "center" }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: "primary.light",
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "primary.main",
                        mx: "auto",
                        mb: 2,
                      }}
                    >
                      <goal.icon size={28} />
                    </Box>
                    <Typography variant="h5" fontWeight={600} gutterBottom>
                      {goal.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {goal.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Team Section */}
      <Container maxWidth="md" sx={{ py: 10 }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Meet the Team
          </Typography>
          <Typography variant="body1" color="text.secondary">
            The developers behind MediRisk
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {team.map((member, index) => (
            <Grid size={{ xs: 12, sm: 6 }} key={index}>
              <Card
                elevation={0}
                sx={{ boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)" }}
              >
                <CardContent sx={{ p: 4, textAlign: "center" }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: "primary.light",
                      color: "primary.main",
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    <Users size={36} />
                  </Avatar>
                  <Typography variant="h5" fontWeight={600}>
                    {member.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="primary.main"
                    fontWeight={500}
                    sx={{ mb: 2 }}
                  >
                    {member.role}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {member.bio}
                  </Typography>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                      component="a"
                      href={member.links.github}
                      size="small"
                      color="default"
                    >
                      <Github size={20} />
                    </IconButton>
                    <IconButton
                      component="a"
                      href={member.links.linkedin}
                      size="small"
                      color="default"
                    >
                      <Linkedin size={20} />
                    </IconButton>
                    <IconButton
                      component="a"
                      href={member.links.email}
                      size="small"
                      color="default"
                    >
                      <Mail size={20} />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Technology Stack */}
      <Box sx={{ bgcolor: "rgba(59, 130, 246, 0.04)", py: 10 }}>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <BookOpen size={36} color="#3b82f6" style={{ marginBottom: 16 }} />
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Technology Stack
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Built with modern, industry-standard technologies
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 2,
            }}
          >
            {technologies.map((tech, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  px: 3,
                  py: 2,
                  bgcolor: "white",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" fontWeight={600}>
                  {tech.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tech.category}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Academic Disclaimer */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card
          elevation={0}
          sx={{ boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)" }}
        >
          <CardContent
            sx={{ p: 4, display: "flex", gap: 3, alignItems: "flex-start" }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                bgcolor: "warning.light",
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "warning.dark",
                flexShrink: 0,
              }}
            >
              <Award size={28} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Academic Project Disclaimer
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                MediRisk is a <strong>capstone demonstration project</strong>{" "}
                developed for the Computer Science program at Clark University.
                This project is created for{" "}
                <strong>educational purposes only</strong> and is{" "}
                <strong>NOT</strong> a certified medical device.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All data presented in this application is synthetic and should{" "}
                <strong>NOT</strong> be used for actual clinical
                decision-making. Always consult qualified healthcare
                professionals for medical advice.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          color: "white",
          py: 10,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Explore the Platform
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, mb: 4 }}>
            See how MediRisk demonstrates the potential of technology in
            healthcare safety.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              component={Link}
              href="/features"
              variant="contained"
              size="large"
            >
              View Features
            </Button>
            <Button
              component={Link}
              href="/"
              variant="outlined"
              size="large"
              sx={{
                borderColor: "white",
                color: "white",
                "&:hover": {
                  borderColor: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              Try Demo
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 4,
          textAlign: "center",
          bgcolor: "white",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © 2026 MediRisk — Clark University Capstone Project
        </Typography>
        <Typography variant="caption" color="text.disabled">
          For Demonstration Purposes Only
        </Typography>
      </Box>
    </Box>
  );
}

export default AboutPage;
