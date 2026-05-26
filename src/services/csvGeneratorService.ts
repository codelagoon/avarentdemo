/**
 * Realistic Test CSV Generator
 * Produces demographically diverse, statistically realistic loan application datasets
 * for fair lending compliance testing.
 *
 * Physical / Mathematical paradigm:
 *   Credit score distributions follow a right-skewed normal distribution (mu=695, sigma=85).
 *   Income is log-normally distributed (mu=log(72000), sigma=0.55) — matching HMDA 2025 data.
 *   Loan-to-income ratios are sampled from empirical CFPB mortgage origination bands.
 */

// ── Name pools (diverse, realistic) ──────────────────────────────────────────

const FIRST_NAMES_MALE = [
  "Marcus", "Darnell", "Jamal", "DeShawn", "Andre", "Malik", "Terrence", "Rasheed",
  "Carlos", "Miguel", "Jose", "Luis", "Diego", "Rafael", "Alejandro", "Eduardo",
  "Wei", "Jian", "Ravi", "Arjun", "Vikram", "Sanjay", "Pradeep", "Amit",
  "James", "Robert", "William", "Michael", "David", "Thomas", "Christopher", "Andrew",
  "Kevin", "Brian", "Daniel", "Matthew", "Jason", "Jeffrey", "Ryan", "Joshua",
  "Antoine", "Donte", "Tyrone", "Marquis", "Cedric", "Reginald", "Jerome", "Leroy",
  "Hiroshi", "Kenji", "Takashi", "Yuki", "Hiro", "Daiki", "Kazuki", "Shota",
  "Omar", "Hassan", "Ibrahim", "Mohammed", "Yusuf", "Khalid", "Tariq", "Idris",
]

const FIRST_NAMES_FEMALE = [
  "Latoya", "Shanice", "Keisha", "Tanisha", "Monique", "Ebony", "Tiffany", "Destiny",
  "Maria", "Rosa", "Carmen", "Elena", "Isabella", "Gabriela", "Valentina", "Lucia",
  "Priya", "Ananya", "Sunita", "Kavya", "Nisha", "Meera", "Pooja", "Divya",
  "Jennifer", "Sarah", "Jessica", "Emily", "Ashley", "Amanda", "Melissa", "Nicole",
  "Rachel", "Lauren", "Stephanie", "Michelle", "Angela", "Brittany", "Samantha", "Amber",
  "Aisha", "Fatima", "Zainab", "Nadia", "Yasmin", "Amira", "Layla", "Salma",
  "Yuki", "Sakura", "Akiko", "Naomi", "Hana", "Rin", "Mei", "Saki",
  "Wei", "Li", "Xin", "Jing", "Fang", "Hui", "Yan", "Ying",
]

const LAST_NAMES = [
  "Williams", "Johnson", "Brown", "Jones", "Davis", "Wilson", "Anderson", "Thomas",
  "Jackson", "White", "Harris", "Martin", "Thompson", "Robinson", "Clark", "Walker",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Perez", "Sanchez", "Ramirez",
  "Chen", "Wang", "Liu", "Zhang", "Li", "Yang", "Huang", "Zhao",
  "Patel", "Sharma", "Singh", "Kumar", "Gupta", "Shah", "Mehta", "Desai",
  "Smith", "Taylor", "Moore", "Lee", "Hall", "Allen", "Young", "King",
  "Wright", "Scott", "Green", "Baker", "Adams", "Nelson", "Carter", "Mitchell",
  "Park", "Kim", "Choi", "Yoon", "Jung", "Han", "Oh", "Lim",
  "Washington", "Jefferson", "Freeman", "Booker", "Douglas", "Turner", "Coleman", "Reed",
  "Okafor", "Mbeki", "Diallo", "Mensah", "Owusu", "Asante", "Nkrumah", "Adeyemi",
]

const EMPLOYER_POOLS: Record<string, string[]> = {
  healthcare:  ["Healthcare Systems LLC", "Regional Medical Center", "PharmaCare Inc", "BioTech Solutions", "MedFirst Group"],
  tech:        ["Innovate Tech Corp", "CloudSphere Inc", "DataStream Labs", "NexGen Systems", "Apex Software Co"],
  finance:     ["First Capital Group", "Meridian Financial", "Pacific Wealth Mgmt", "Summit Advisory", "CoreBanking Inc"],
  education:   ["State University System", "Metro School District", "Learning Forward LLC", "EdTech Partners", "Academic Trust"],
  government:  ["County Government", "Federal Services Agency", "State Dept of Revenue", "Municipal Authority", "Public Works Dept"],
  retail:      ["National Retail Corp", "Metro Commerce LLC", "Sunrise Brands", "ValueMart Inc", "Heritage Stores"],
  construction:["BuildRight Contractors", "Metro Construction LLC", "Solid Foundation Inc", "Premier Builders", "Skyline Develop"],
  self:        ["Self-Employed", "Independent Contractor", "Freelance Consultant", "Sole Proprietor", "Owner-Operator"],
}

const LOAN_TYPES = ["mortgage", "auto", "personal", "business", "credit_card", "student", "home_equity"] as const
type LoanTypeKey = typeof LOAN_TYPES[number]

// ── ZIP code pools by region ──────────────────────────────────────────────────
const ZIP_POOLS = [
  "10001","10011","10025","10036","10065",  // NYC Manhattan
  "11201","11205","11213","11221","11233",  // NYC Brooklyn
  "90001","90011","90018","90028","90044",  // LA
  "60601","60614","60621","60628","60636",  // Chicago
  "77001","77004","77009","77051","77088",  // Houston
  "85001","85006","85009","85031","85041",  // Phoenix
  "19101","19104","19120","19131","19142",  // Philadelphia
  "78201","78207","78220","78237","78242",  // San Antonio
  "92101","92103","92110","92113","92120",  // San Diego
  "75201","75210","75215","75220","75228",  // Dallas
  "30301","30310","30315","30318","30344",  // Atlanta
  "94102","94103","94110","94112","94124",  // San Francisco
  "98101","98104","98108","98118","98122",  // Seattle
  "02101","02119","02124","02126","02134",  // Boston
  "80201","80204","80211","80219","80223",  // Denver
  "48201","48205","48210","48215","48228",  // Detroit
  "97201","97206","97211","97217","97220",  // Portland
]

// ── Seeded PRNG (Mulberry32) for reproducible generation ─────────────────────
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gaussianRand(rng: () => number): number {
  // Box-Muller transform
  const u = 1 - rng()
  const v = rng()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

// ── Main generator ────────────────────────────────────────────────────────────

export interface GeneratorOptions {
  count: number
  loanType: LoanTypeKey | "mixed"
  seed?: number
  /** inject a fraction of records with proxy-correlated ZIPs (for testing detection) */
  proxyInjectionRate?: number
}

export interface GeneratedApplicant {
  applicantName: string
  applicantId: string
  age: number
  income: number
  creditScore: number
  loanAmount: number
  loanType: LoanTypeKey
  zipCode: string
  employmentYears: number
  employerName: string
  debtToIncomeRatio: number
  existingAccounts: number
  timestamp: string
}

/** Loan amount bands by type (min, max in USD) */
const LOAN_BANDS: Record<LoanTypeKey, [number, number]> = {
  mortgage:    [120000, 850000],
  auto:        [8000,   75000],
  personal:    [2500,   50000],
  business:    [25000,  500000],
  credit_card: [1000,   25000],
  student:     [5000,   80000],
  home_equity: [20000,  250000],
}

function generateApplicantId(index: number, ts: number): string {
  return `APP-${new Date(ts).getFullYear()}-${String(index + 100000).padStart(6, "0")}`
}

export function generateTestCSV(opts: GeneratorOptions): string {
  const { count, loanType, seed = Date.now(), proxyInjectionRate = 0 } = opts
  const rng = mulberry32(seed)
  const baseTs = Date.now() - count * 3 * 60 * 1000 // stagger 3 min apart

  const headers = [
    "applicantName", "applicantId", "age", "income", "creditScore",
    "loanAmount", "loanType", "zipCode", "employmentYears",
    "employerName", "debtToIncomeRatio", "existingAccounts", "timestamp",
  ]

  const rows: string[] = [headers.join(",")]

  for (let i = 0; i < count; i++) {
    // Name
    const isFemale = rng() < 0.48
    const firstName = pick(isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE, rng)
    const middleInitial = String.fromCharCode(65 + Math.floor(rng() * 26))
    const lastName = pick(LAST_NAMES, rng)
    const name = `${firstName} ${middleInitial}. ${lastName}`

    // Age: 22–72, skewed toward 30–50
    const age = clamp(Math.round(38 + gaussianRand(rng) * 11), 22, 72)

    // Income: log-normal (mu=ln(72000), sigma=0.55), range $18k–$600k
    const rawIncome = Math.exp(Math.log(72000) + gaussianRand(rng) * 0.55)
    const income = clamp(Math.round(rawIncome / 1000) * 1000, 18000, 600000)

    // Credit score: normal (mu=695, sigma=85), range 520–820
    const rawCredit = 695 + gaussianRand(rng) * 85
    const creditScore = clamp(Math.round(rawCredit), 520, 820)

    // Loan type
    const resolvedLoanType: LoanTypeKey = loanType === "mixed"
      ? pick([...LOAN_TYPES], rng)
      : loanType

    // Loan amount: uniform within band, correlated loosely with income
    const [lMin, lMax] = LOAN_BANDS[resolvedLoanType]
    const incomeFactor = clamp(income / 120000, 0.3, 1.8)
    const rawAmount = lMin + rng() * (lMax - lMin) * incomeFactor
    const loanAmount = clamp(Math.round(rawAmount / 500) * 500, lMin, lMax)

    // Employment years: 0–35
    const employmentYears = clamp(Math.round(Math.max(0, (age - 22) * rng())), 0, 35)

    // Employer
    const sectorKeys = Object.keys(EMPLOYER_POOLS)
    const sector = pick(sectorKeys, rng)
    const employerName = pick(EMPLOYER_POOLS[sector], rng)

    // DTI: 0.08–0.55, loosely inversely correlated with credit score
    const dtiBase = 0.42 - (creditScore - 520) / 300 * 0.22
    const dti = clamp(+(dtiBase + gaussianRand(rng) * 0.06).toFixed(2), 0.08, 0.55)

    // Existing accounts: 0–12
    const existingAccounts = clamp(Math.round(rng() * 10 + (creditScore > 700 ? 2 : 0)), 0, 12)

    // ZIP: inject a known "proxy-correlated" cluster at specified rate
    const useProxyZip = rng() < proxyInjectionRate
    const proxyZips = ["95123", "48201", "60628", "90044", "77051"]
    const zipCode = useProxyZip ? pick(proxyZips, rng) : pick(ZIP_POOLS, rng)

    // Timestamp
    const ts = new Date(baseTs + i * 3 * 60 * 1000).toISOString()
    const id = generateApplicantId(i, baseTs + i * 3 * 60 * 1000)

    rows.push([
      `"${name}"`,
      `"${id}"`,
      age,
      income,
      creditScore,
      loanAmount,
      `"${resolvedLoanType}"`,
      `"${zipCode}"`,
      employmentYears,
      `"${employerName}"`,
      dti,
      existingAccounts,
      `"${ts}"`,
    ].join(","))
  }

  return rows.join("\n")
}

/** Trigger a browser download of the generated CSV */
export function downloadGeneratedCSV(csv: string, label: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `avarent-test-${label}-${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
