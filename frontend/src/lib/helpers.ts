export function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export function calculateAge(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export function updateListItem<T>(items: T[], index: number, patch: Partial<T>) {
  return items.map((item, currentIndex) =>
    currentIndex === index ? { ...item, ...patch } : item,
  );
}

export function compactSpacedChunks(text: string) {
  let current = text.replace(/\s+/g, " ").trim();
  for (let i = 0; i < 5; i += 1) {
    const next = current.replace(/\b(?:[A-Za-z]{1,2}\s+){2,}[A-Za-z]{1,2}\b/g, (match) =>
      match.replace(/\s+/g, ""),
    );
    if (next === current) {
      break;
    }
    current = next;
  }
  return current;
}

export function compactSpacedLine(text: string) {
  return compactSpacedChunks(text)
    .replace(/\s*([:;|,])\s*/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePhraseSpacing(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/\bOnceADay\b/gi, "Once A Day")
    .replace(/\bOnceDaily\b/gi, "Once Daily")
    .replace(/\bTwiceDaily\b/gi, "Twice Daily")
    .replace(/\bThreeTimesDaily\b/gi, "Three Times Daily")
    .replace(/\bFourTimesDaily\b/gi, "Four Times Daily")
    .replace(/\bEvery(\d+)(Hours?|Days?)\b/gi, "Every $1 $2")
    .replace(/\bAfterMeal\b/gi, "After Meal")
    .replace(/\bWithFood\b/gi, "With Food")
    .replace(/\bBeforeBreakfast\b/gi, "Before Breakfast")
    .replace(/\bAtBedtime\b/gi, "At Bedtime")
    .replace(/\bEmptyStomach\b/gi, "Empty Stomach")
    .replace(/\bMorningDose\b/gi, "Morning Dose")
    .replace(/\s*,\s*/g, ", ")
    .trim();
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

export function formatDateParts(value?: string | null) {
  if (!value) {
    return { date: "-", time: "", monthLabel: "Undated" };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { date: value, time: "", monthLabel: "Undated" };
  }

  return {
    date: parsed.toLocaleDateString(),
    time: parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    monthLabel: parsed.toLocaleDateString([], { month: "long", year: "numeric" }),
  };
}

export function getMedicationStatus(endDate?: string | null) {
  if (!endDate) {
    return "Active";
  }
  const today = new Date();
  const end = new Date(endDate);
  return end < today ? "Completed" : "Active";
}

export function getStatusStyle(status: string) {
  return status === "Completed"
    ? { bgcolor: "rgba(100,116,139,0.12)", color: "#64748b", border: "rgba(100,116,139,0.25)", accent: "#64748b", surface: "rgba(100,116,139,0.08)" }
    : { bgcolor: "rgba(16,185,129,0.12)", color: "#059669", border: "rgba(16,185,129,0.22)", accent: "#10b981", surface: "rgba(16,185,129,0.08)" };
}

export function getRelativeEndLabel(endDate?: string | null) {
  if (!endDate) return "No end date set";
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return `Ends ${endDate}`;

  const diffMs = end.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Ended ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} ago`;
  if (diffDays === 0) return "Ends today";
  if (diffDays === 1) return "Ends tomorrow";
  return `${diffDays} days remaining`;
}

export function downloadStoredFile(fileName: string, mimeType: string, content: string) {
  const byteCharacters = atob(content);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getStoredFileHref(content: string, mimeType: string) {
  const byteCharacters = atob(content);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
