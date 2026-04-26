import { Activity, FileStack, FileText, ShieldCheck, Stethoscope } from "lucide-react";

export type RecordItem = {
  id: string;
  rawDate: string | null;
  date: string;
  time: string;
  monthLabel: string;
  type: "Lab Result" | "Visit Summary" | "Diagnosis" | "Prescription" | "Patient Document" | "Vaccination" | "Medication" | "Discharge Summary" | "Insurance EOB" | "Allergy";
  category: string;
  provider: string;
  addedBy: string;
  status: "Available" | "Active" | "Completed";
  accent: string;
  surface: string;
  icon: typeof Activity;
  fileName?: string | null;
  fileMimeType?: string | null;
  fileContent?: string | null;
  details: string[];
  documentType?: string | null;
  extractedData?: {
    medications?: Array<{ name: string; dosage?: string }>;
    labResults?: Array<{ testName: string; result: string }>;
    vaccinations?: Array<{ vaccineName: string; date: string; dose?: string }>;
  };
};

export type AccessRequestItem = {
  id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  organization_id: string;
  organization_name: string;
  organization_type?: string;
  organization_address?: string;
  organization_city?: string;
  organization_state?: string;
  organization_zip_code?: string;
  organization_phone?: string;
  organization_email?: string;
  organization_website?: string;
  organization_is_verified?: boolean;
  requested_by: string;
  requested_by_name: string;
  requested_by_email: string;
  requested_by_phone?: string;
  requested_by_role?: string;
  requested_by_member_role?: string;
  requested_by_member_status?: string;
};

export function getRecordVisual(type: RecordItem["type"]) {
  switch (type) {
    case "Lab Result":
      return { accent: "#3b82f6", surface: "rgba(59,130,246,0.1)", icon: Activity };
    case "Visit Summary":
      return { accent: "#0f766e", surface: "rgba(15,118,110,0.1)", icon: Stethoscope };
    case "Diagnosis":
      return { accent: "#8b5cf6", surface: "rgba(139,92,246,0.1)", icon: FileText };
    case "Prescription":
      return { accent: "#10b981", surface: "rgba(16,185,129,0.1)", icon: FileStack };
    case "Patient Document":
      return { accent: "#f59e0b", surface: "rgba(245,158,11,0.12)", icon: FileText };
    case "Vaccination":
      return { accent: "#ec4899", surface: "rgba(236,72,153,0.1)", icon: ShieldCheck };
    case "Medication":
      return { accent: "#06b6d4", surface: "rgba(6,182,212,0.1)", icon: FileStack };
    case "Discharge Summary":
      return { accent: "#8b5cf6", surface: "rgba(139,92,246,0.1)", icon: FileText };
    case "Insurance EOB":
      return { accent: "#f97316", surface: "rgba(249,115,22,0.1)", icon: FileText };
    case "Allergy":
      return { accent: "#ef4444", surface: "rgba(239,68,68,0.1)", icon: ShieldCheck };
    default:
      return { accent: "#00d4aa", surface: "rgba(0,212,170,0.1)", icon: FileText };
  }
}
