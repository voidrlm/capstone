/**
 * Risk Classification Service
 *
 * Parses raw adverse-reactions text from OpenFDA drug labels and returns
 * structured side-effect classifications with risk levels and frequencies.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RiskLevel = 'high' | 'medium' | 'low';
export type Frequency = 'common' | 'uncommon' | 'rare';

export interface SideEffectClassification {
  effectName: string;
  riskLevel: RiskLevel;
  frequency: Frequency;
  description: string;
}

export interface ClassificationContext {
  warnings?: string;
  warningsAndCautions?: string;
  doNotUse?: string;
  stopUse?: string;
  geriatricUse?: string;
  pediatricUse?: string;
  pregnancy?: string;
}

// ---------------------------------------------------------------------------
// Curated keyword lists
// ---------------------------------------------------------------------------

const HIGH_RISK_KEYWORDS: string[] = [
  'cardiac arrest', 'heart attack', 'myocardial infarction',
  'anaphylaxis', 'anaphylactic', 'angioedema',
  'seizure', 'seizures', 'convulsion', 'convulsions',
  'liver failure', 'hepatic failure', 'hepatotoxicity', 'hepatic necrosis',
  'kidney failure', 'renal failure', 'nephrotoxicity',
  'hemorrhage', 'haemorrhage', 'bleeding', 'gastrointestinal bleeding',
  'stroke', 'cerebrovascular accident', 'cerebral hemorrhage',
  'death', 'fatal', 'fatality', 'lethal',
  'suicidal', 'suicide', 'suicidality', 'suicidal ideation',
  'cardiac arrhythmia', 'ventricular fibrillation', 'ventricular tachycardia',
  'torsades de pointes', 'qt prolongation',
  'pulmonary embolism', 'deep vein thrombosis', 'thromboembolism',
  'respiratory failure', 'respiratory arrest', 'respiratory depression',
  'sepsis', 'septic shock',
  'stevens-johnson syndrome', 'toxic epidermal necrolysis',
  'agranulocytosis', 'aplastic anemia', 'pancytopenia',
  'serotonin syndrome', 'neuroleptic malignant syndrome',
  'rhabdomyolysis',
  'pancreatitis',
  'paralysis',
  'coma',
  'cardiac failure', 'heart failure', 'congestive heart failure',
  'pulmonary edema',
  'intestinal perforation', 'bowel perforation', 'gastrointestinal perforation',
  'adrenal insufficiency',
  'lactic acidosis',
  'disseminated intravascular coagulation',
];

const MEDIUM_RISK_KEYWORDS: string[] = [
  'hypertension', 'hypotension', 'orthostatic hypotension',
  'tachycardia', 'bradycardia', 'palpitations', 'arrhythmia',
  'depression', 'anxiety', 'psychosis', 'hallucination', 'hallucinations',
  'mania', 'agitation', 'confusion', 'delirium',
  'vision changes', 'blurred vision', 'visual impairment', 'diplopia',
  'hearing loss', 'tinnitus',
  'syncope', 'fainting',
  'dyspnea', 'shortness of breath', 'bronchospasm',
  'edema', 'peripheral edema', 'swelling',
  'hyperglycemia', 'hypoglycemia',
  'hyponatremia', 'hyperkalemia', 'hypokalemia',
  'thrombocytopenia', 'leukopenia', 'neutropenia', 'anemia',
  'elevated liver enzymes', 'alt increased', 'ast increased', 'transaminases increased',
  'jaundice', 'cholestasis',
  'pneumonia', 'pneumonitis',
  'colitis', 'gastritis',
  'tendinitis', 'tendon rupture',
  'photosensitivity',
  'urinary retention',
  'tremor', 'ataxia', 'dyskinesia', 'dystonia',
  'peripheral neuropathy', 'neuropathy', 'paresthesia',
  'vertigo',
  'allergic reaction', 'hypersensitivity',
  'skin reaction', 'severe rash', 'dermatitis',
  'weight gain', 'weight loss',
  'insomnia', 'somnolence',
];

const LOW_RISK_KEYWORDS: string[] = [
  'headache', 'head ache',
  'nausea', 'vomiting', 'emesis',
  'dizziness', 'lightheadedness',
  'fatigue', 'tiredness', 'lethargy', 'asthenia', 'malaise',
  'dry mouth', 'xerostomia',
  'diarrhea', 'diarrhoea', 'loose stools',
  'constipation',
  'abdominal pain', 'stomach pain', 'abdominal discomfort',
  'dyspepsia', 'indigestion', 'heartburn',
  'flatulence', 'bloating',
  'rash', 'pruritus', 'itching', 'urticaria',
  'upper respiratory tract infection', 'nasopharyngitis', 'rhinitis',
  'cough',
  'back pain', 'arthralgia', 'myalgia', 'muscle pain', 'joint pain',
  'decreased appetite', 'anorexia',
  'flushing',
  'sweating', 'hyperhidrosis',
  'dry eyes',
  'taste disturbance', 'dysgeusia',
  'injection site reaction', 'injection site pain',
  'nasal congestion',
  'pharyngitis', 'sore throat',
  'drowsiness',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalise an effect name to lowercase trimmed form for comparison. */
function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Check whether `text` contains any of the given keywords. */
function containsAny(text: string, keywords: string[]): boolean {
  const lower = normalise(text);
  return keywords.some((kw) => lower.includes(kw));
}

/**
 * Build a combined "warning context" string from the optional context fields
 * so we can check whether an effect is explicitly mentioned in warnings.
 */
function buildWarningText(context?: ClassificationContext): string {
  if (!context) return '';
  return normalise(
    [
      context.warnings,
      context.warningsAndCautions,
      context.doNotUse,
      context.stopUse,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

// ---------------------------------------------------------------------------
// Frequency detection
// ---------------------------------------------------------------------------

/**
 * Frequency-section patterns.  Order matters – we test from top to bottom and
 * assign the *first* matching section's frequency to subsequent effects until
 * a new section header is encountered.
 */
const FREQUENCY_SECTION_PATTERNS: { pattern: RegExp; frequency: Frequency }[] = [
  { pattern: /(?:most\s+)?common(?:ly)?(?:\s+(?:reported|observed|adverse))?\s*(?:reactions?|events?|side\s+effects?|:)/i, frequency: 'common' },
  { pattern: /(?:≥|>=?)\s*10\s*%/i, frequency: 'common' },
  { pattern: /(?:less\s+common|uncommon)(?:ly)?(?:\s+(?:reported|observed|adverse))?\s*(?:reactions?|events?|side\s+effects?|:)/i, frequency: 'uncommon' },
  { pattern: /(?:1\s*%?\s*to\s*10\s*%|(?:≥|>=?)\s*1\s*%\s*(?:to|and)\s*(?:<|<=?)\s*10\s*%)/i, frequency: 'uncommon' },
  { pattern: /infrequent(?:ly)?/i, frequency: 'rare' },
  { pattern: /rare(?:ly)?(?:\s+(?:reported|observed|adverse))?\s*(?:reactions?|events?|side\s+effects?|:)/i, frequency: 'rare' },
  { pattern: /(?:<|<=?)\s*1\s*%/i, frequency: 'rare' },
  { pattern: /post-?marketing/i, frequency: 'rare' },
];

/**
 * Try to determine frequency from a line of surrounding context.
 * Returns `null` when no signal is found.
 */
function detectFrequencyFromLine(line: string): Frequency | null {
  for (const { pattern, frequency } of FREQUENCY_SECTION_PATTERNS) {
    if (pattern.test(line)) return frequency;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Text parsing – extract individual side effects
// ---------------------------------------------------------------------------

/** Strip HTML tags that sometimes appear in OpenFDA text. */
function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, ' ');
}

/**
 * Split a block of adverse-reactions text into individual effect names.
 *
 * The text may contain:
 *   - comma-separated lists
 *   - semicolon-separated lists
 *   - bullet / dash lists
 *   - parenthetical incidence rates that should be stripped
 *   - section headers that should be dropped
 */
function extractEffectNames(text: string): { name: string; lineContext: string }[] {
  const cleaned = stripHtml(text);

  // Split into paragraphs / lines first so we can track context per line.
  const lines = cleaned.split(/\n|\r|(?:\.\s+)/).filter((l) => l.trim().length > 0);

  const results: { name: string; lineContext: string }[] = [];

  for (const line of lines) {
    // Attempt to split by commas, semicolons, or bullet markers.
    const tokens = line
      .split(/[,;]|(?:•)|(?:[-–—]\s)/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    for (const token of tokens) {
      // Remove parenthetical content like "(10%)" or "(n=42)"
      let name = token
        .replace(/\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .trim();

      // Remove leading numbers / bullets / dashes
      name = name.replace(/^\d+[\.\)]\s*/, '').replace(/^[-–—•*]\s*/, '');

      // Remove trailing periods and whitespace
      name = name.replace(/[.;:]+$/, '').trim();

      // Skip entries that are too short, purely numeric, or look like headers
      if (name.length < 3) continue;
      if (/^\d+$/.test(name)) continue;
      if (/^(table|figure|section|note|see)\b/i.test(name)) continue;
      if (name.split(/\s+/).length > 8) continue; // likely a sentence, not an effect name

      // Normalise casing
      const effectName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

      results.push({ name: effectName, lineContext: line });
    }
  }

  // De-duplicate by normalised name, keeping the first occurrence.
  const seen = new Set<string>();
  return results.filter(({ name }) => {
    const key = normalise(name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify the risk level of a single side effect.
 *
 * Decision order:
 * 1. If the effect is in the HIGH keyword list → high
 * 2. If the effect appears in the drug's warnings / do-not-use text → high
 * 3. If the effect is in the MEDIUM keyword list → medium (promoted to high if common)
 * 4. If the effect is common + not explicitly low → medium
 * 5. Otherwise → low
 */
export function classifyRisk(
  effectName: string,
  frequency: Frequency,
  context?: ClassificationContext,
): RiskLevel {
  const lower = normalise(effectName);
  const warningText = buildWarningText(context);

  // 1. Inherently high-risk effects
  if (containsAny(lower, HIGH_RISK_KEYWORDS)) {
    return 'high';
  }

  // 2. Effect appears in warning sections → high regardless of frequency
  if (warningText && warningText.length > 0 && warningText.includes(lower)) {
    return 'high';
  }

  // 3. Medium-severity effects
  if (containsAny(lower, MEDIUM_RISK_KEYWORDS)) {
    // Common frequency with moderate severity is still medium, but if
    // the effect also shows up in warnings we already returned high above.
    return frequency === 'common' ? 'high' : 'medium';
  }

  // 4. Explicitly low-risk effects stay low regardless of frequency
  if (containsAny(lower, LOW_RISK_KEYWORDS)) {
    return 'low';
  }

  // 5. Unknown effect – base decision on frequency
  switch (frequency) {
    case 'common':
      return 'medium';
    case 'uncommon':
      return 'medium';
    case 'rare':
      return 'low';
    default:
      return 'low';
  }
}

/**
 * Parse raw adverse-reactions text and return structured classifications.
 */
export function classifySideEffects(
  adverseReactionsText: string,
  context?: ClassificationContext,
): SideEffectClassification[] {
  if (!adverseReactionsText || adverseReactionsText.trim().length === 0) {
    return [];
  }

  const extracted = extractEffectNames(adverseReactionsText);
  const results: SideEffectClassification[] = [];

  // Track the "current section frequency" as we iterate.  Effects that appear
  // under a frequency header inherit that frequency unless their own line
  // provides an override.
  let sectionFrequency: Frequency = 'common'; // default when no header found

  for (const { name, lineContext } of extracted) {
    // Check if the line context itself indicates a frequency section
    const lineFreq = detectFrequencyFromLine(lineContext);
    if (lineFreq) {
      sectionFrequency = lineFreq;
    }

    // Per-effect frequency override (e.g., "nausea (rare)")
    const effectFreq = detectFrequencyFromLine(name) ?? sectionFrequency;

    const riskLevel = classifyRisk(name, effectFreq, context);

    const description = buildDescription(name, riskLevel, effectFreq);

    results.push({
      effectName: name,
      riskLevel,
      frequency: effectFreq,
      description,
    });
  }

  return results;
}

/**
 * Build a human-readable description for a classified side effect.
 */
function buildDescription(
  effectName: string,
  riskLevel: RiskLevel,
  frequency: Frequency,
): string {
  const riskDescriptor: Record<RiskLevel, string> = {
    high: 'Serious adverse effect requiring immediate medical attention',
    medium: 'Moderately serious adverse effect that should be monitored',
    low: 'Generally mild and self-limiting adverse effect',
  };

  const frequencyDescriptor: Record<Frequency, string> = {
    common: 'commonly reported',
    uncommon: 'less commonly reported',
    rare: 'rarely reported',
  };

  return `${effectName} is a ${frequencyDescriptor[frequency]} side effect. ${riskDescriptor[riskLevel]}.`;
}
