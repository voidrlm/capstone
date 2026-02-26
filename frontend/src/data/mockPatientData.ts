export const medications = [
  {
    id: "1",
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    startDate: "2025-01-15",
    status: "active" as const,
    riskLevel: "low" as const,
  },
  {
    id: "2",
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily",
    startDate: "2025-02-01",
    status: "active" as const,
    riskLevel: "medium" as const,
  },
  {
    id: "3",
    name: "Atorvastatin",
    dosage: "20mg",
    frequency: "Once daily at bedtime",
    startDate: "2024-12-10",
    status: "active" as const,
    riskLevel: "low" as const,
  },
];

export const notifications = [
  {
    id: "1",
    type: "warning" as const,
    message: "Potential interaction detected between Metformin and new supplement",
    date: "2026-02-17",
    read: false,
  },
  {
    id: "2",
    type: "info" as const,
    message: "Your monthly risk assessment is ready for review",
    date: "2026-02-15",
    read: false,
  },
  {
    id: "3",
    type: "success" as const,
    message: "Lab results have been uploaded to your records",
    date: "2026-02-10",
    read: true,
  },
];

export const radarData = [
  { subject: "Nausea", value: 25 },
  { subject: "Fatigue", value: 40 },
  { subject: "Kidney", value: 15 },
  { subject: "Liver", value: 20 },
  { subject: "Cardiac", value: 10 },
  { subject: "Dizziness", value: 30 },
];

export const riskTrendData = [
  { date: "Sep", risk: 42 },
  { date: "Oct", risk: 38 },
  { date: "Nov", risk: 45 },
  { date: "Dec", risk: 35 },
  { date: "Jan", risk: 30 },
  { date: "Feb", risk: 28 },
];
