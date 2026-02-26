export const patients = [
  {
    id: "1",
    name: "John Smith",
    age: 58,
    riskLevel: "high" as const,
    medications: 4,
    lastAssessment: "2026-02-16",
    status: "active" as const,
  },
  {
    id: "2",
    name: "Sarah Johnson",
    age: 45,
    riskLevel: "medium" as const,
    medications: 2,
    lastAssessment: "2026-02-10",
    status: "active" as const,
  },
  {
    id: "3",
    name: "Michael Brown",
    age: 72,
    riskLevel: "low" as const,
    medications: 3,
    lastAssessment: "2026-02-14",
    status: "active" as const,
  },
  {
    id: "4",
    name: "Emily Davis",
    age: 34,
    riskLevel: "medium" as const,
    medications: 1,
    lastAssessment: "2026-02-08",
    status: "inactive" as const,
  },
  {
    id: "5",
    name: "Robert Wilson",
    age: 65,
    riskLevel: "high" as const,
    medications: 5,
    lastAssessment: "2026-02-17",
    status: "active" as const,
  },
];

export const alerts = [
  {
    id: "1",
    type: "interaction" as const,
    patientName: "John Smith",
    message: "Potential drug interaction: Warfarin + Aspirin",
    severity: "high" as const,
    timestamp: "2026-02-18T09:30:00",
  },
  {
    id: "2",
    type: "assessment_due" as const,
    patientName: "Emily Davis",
    message: "Risk assessment overdue by 10 days",
    severity: "medium" as const,
    timestamp: "2026-02-17T14:20:00",
  },
  {
    id: "3",
    type: "side_effect" as const,
    patientName: "Sarah Johnson",
    message: "Patient reported increased fatigue",
    severity: "medium" as const,
    timestamp: "2026-02-17T11:15:00",
  },
  {
    id: "4",
    type: "interaction" as const,
    patientName: "Robert Wilson",
    message: "Dosage adjustment recommended for Metformin",
    severity: "low" as const,
    timestamp: "2026-02-16T16:45:00",
  },
];

export const stats = [
  { label: "Total Patients", value: 48, change: "+3 this month", trend: "up" as const },
  { label: "High Risk", value: 8, change: "-2 from last week", trend: "down" as const },
  { label: "Assessments", value: 24, change: "This week", trend: "neutral" as const },
  { label: "Pending Reviews", value: 5, change: "Needs attention", trend: "up" as const },
];

export const riskDistribution = [
  { name: "Low Risk", value: 28 },
  { name: "Medium Risk", value: 14 },
  { name: "High Risk", value: 6 },
];

export const medicationCategories = [
  { name: "Cardiovascular", value: 32, color: "#3b82f6" },
  { name: "Diabetes", value: 24, color: "#10b981" },
  { name: "Pain Mgmt", value: 18, color: "#f59e0b" },
  { name: "Antibiotics", value: 12, color: "#ef4444" },
  { name: "Other", value: 14, color: "#8b5cf6" },
];

export const schedule = [
  {
    time: "09:00 AM",
    patient: "John Smith",
    type: "Risk Assessment",
    duration: "30 min",
  },
  {
    time: "10:30 AM",
    patient: "Sarah Johnson",
    type: "Follow-up",
    duration: "15 min",
  },
  {
    time: "02:00 PM",
    patient: "Michael Brown",
    type: "Medication Review",
    duration: "45 min",
  },
];
