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
