"use client";

import { useState, useRef, useEffect } from "react";

// ponytail: mock data — swap for Supabase query later
const INITIAL_CLIENTS = [
  {
    id: "acc_Harbor",
    name: "Harbor Financial",
    industry: "Financial Services",
    targetCustomerType: "business",
    email: "contact@harborfin.com",
    contact: "+1 (555) 120-3456",
    contactName: "Marcus Reid",
    contactPhone: "+1 (555) 120-3456",
    timezone: "America/New_York",
    avatar: "HF",
    color: "#0F172A",
    leads: "210 Ready Leads",
    services: ["Do Everything (Full Funnel)", "Lead Generation"],
    activeServices: ["Lead Generation"], // demo: Harbor has actually created a Lead Generation service → scraping unlocked
    serviceConfigs: { "Lead Generation": { isDraft: false } },
    health: "Operational",
    retainer: "$5,000.00",
    payment: "Paid",
    score: 99,
    onboarded: "2026-06-28"
  },
  {
    id: "acc_Acme",
    name: "Acme Realty",
    email: "ops@acmerealty.com",
    contact: "+1 (555) 104-2345",
    timezone: "America/New_York",
    avatar: "AR",
    color: "#4F46FF",
    leads: "24 Ready Leads",
    services: ["Answer My Phones", "Call Leads & Book", "Fix Lead List"],
    health: "Operational",
    retainer: "$1,200.00",
    payment: "Paid",
    score: 74,
    onboarded: "2026-03-10"
  },
  {
    id: "acc_Northwind",
    name: "Northwind Logistics",
    email: "team@northwind.co",
    contact: "+1 (555) 113-0456",
    timezone: "America/Chicago",
    avatar: "NL",
    color: "#10B981",
    leads: "152 Ready Leads",
    services: ["Find New Leads", "Fix Lead List"],
    health: "Operational",
    retainer: "$2,500.00",
    payment: "Paid",
    score: 95,
    onboarded: "2026-05-28"
  },
  {
    id: "acc_1199",
    name: "1199 SEIU",
    email: "info@1199seiu.org",
    contact: "+1 (555) 119-9234",
    timezone: "America/New_York",
    avatar: "SE",
    color: "#F59E0B",
    leads: "85 Ready Leads",
    services: ["Answer My Phones", "Appointment Reminders"],
    health: "Operational",
    retainer: "$3,800.00",
    payment: "Paid",
    score: 98,
    onboarded: "2026-06-10"
  },
  {
    id: "acc_Sunrise",
    name: "Sunrise Dental",
    email: "front@sunrisedental.com",
    contact: "+1 (555) 115-6234",
    timezone: "America/Denver",
    avatar: "SD",
    color: "#EF4444",
    leads: "45 Ready Leads",
    services: ["Call Leads & Qualify", "Fix Lead List", "Find New Leads"],
    health: "Operational",
    retainer: "$1,500.00",
    payment: "Unpaid",
    score: 35,
    onboarded: "2026-06-18"
  },
  {
    id: "acc_Oakwood",
    name: "Oakwood Estates",
    email: "management@oakwoodestates.com",
    contact: "+1 (555) 120-7456",
    timezone: "America/Los_Angeles",
    avatar: "OE",
    color: "#8B5CF6",
    leads: "42 Ready Leads",
    services: ["Call Leads & Book", "Find New Leads"],
    health: "Operational",
    retainer: "$950.00",
    payment: "Paid",
    score: 92,
    onboarded: "2026-06-25"
  },
  {
    id: "acc_Golden",
    name: "Golden Years Care",
    email: "care@goldenyears.com",
    contact: "+1 (555) 121-1456",
    timezone: "America/New_York",
    avatar: "GY",
    color: "#EC4899",
    leads: "18 Ready Leads",
    services: ["Answer My Phones", "Call Leads & Qualify"],
    health: "Operational",
    retainer: "$1,800.00",
    payment: "Paid",
    score: 88,
    onboarded: "2026-04-15"
  },
  {
    id: "acc_Apex",
    name: "Apex Health",
    email: "contact@apexhealth.com",
    contact: "+1 (555) 121-5456",
    timezone: "America/Phoenix",
    avatar: "AH",
    color: "#06B6D4",
    leads: "64 Ready Leads",
    services: ["Call Leads & Book", "Appointment Reminders", "Find New Leads"],
    health: "Operational",
    retainer: "$2,100.00",
    payment: "Paid",
    score: 85,
    onboarded: "2026-05-02"
  },
  {
    id: "acc_1087",
    name: "BlueSky Insurance",
    email: "hello@bluesky.io",
    contact: "+1 (555) 108-7234",
    timezone: "America/New_York",
    avatar: "BI",
    color: "#3B82F6",
    leads: "12 Ready Leads",
    services: ["Call Leads & Qualify", "Appointment Reminders"],
    health: "Operational",
    retainer: "$1,200.00",
    payment: "Paid",
    score: 80,
    onboarded: "2026-05-10"
  }
];


const RECENT = ["Acme Realty", "Northwind Logistics", "acc_1199"];

const TIMEFRAME_DATA = {
  "7d": {
    label: "Last 7 days",
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    revenue: [130, 118, 105, 95, 78, 60, 42],
    cost: [120, 115, 110, 108, 105, 100, 95]
  },
  "14d": {
    label: "Last 14 days",
    labels: ["Jun 15", "Jun 17", "Jun 19", "Jun 21", "Jun 23", "Jun 25", "Jun 28"],
    revenue: [135, 125, 110, 102, 85, 70, 45],
    cost: [122, 118, 115, 110, 104, 98, 92]
  },
  "30d": {
    label: "Last 30 days",
    labels: ["May 30", "Jun 4", "Jun 9", "Jun 14", "Jun 19", "Jun 24", "Jun 28"],
    revenue: [140, 130, 115, 98, 88, 65, 38],
    cost: [125, 120, 114, 108, 102, 95, 88]
  },
  "3m": {
    label: "Last 3 months",
    labels: ["Apr 1", "Apr 15", "May 1", "May 15", "Jun 1", "Jun 15", "Jun 28"],
    revenue: [142, 128, 112, 90, 75, 55, 32],
    cost: [128, 122, 115, 108, 100, 92, 82]
  },
  "6m": {
    label: "Last 6 months",
    labels: ["Dec '25", "Jan '26", "Feb '26", "Mar '26", "Apr '26", "May '26", "Jun '26"],
    revenue: [145, 132, 118, 95, 80, 58, 30],
    cost: [130, 124, 118, 110, 102, 94, 80]
  },
  "12m": {
    label: "Last 12 months",
    labels: ["Jul '25", "Sep '25", "Nov '25", "Jan '26", "Mar '26", "May '26", "Jun '26"],
    revenue: [148, 135, 120, 105, 78, 52, 25],
    cost: [135, 128, 120, 112, 105, 95, 75]
  },
  "all": {
    label: "All time",
    labels: ["2024 H1", "2024 H2", "2025 H1", "2025 H2", "2026 Q1", "2026 Q2", "Present"],
    revenue: [150, 140, 125, 110, 85, 48, 20],
    cost: [140, 132, 122, 115, 108, 92, 70]
  }
};

const TIMEZONE_GROUPS = [
  { label: "North America", zones: [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Phoenix", label: "Mountain Standard Time (Phoenix)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  ]},
  { label: "Europe & GMT", zones: [
    { value: "Europe/London", label: "London / GMT" },
    { value: "Europe/Paris", label: "Paris / CET" },
  ]},
  { label: "Asia & Pacific", zones: [
    { value: "Asia/Kolkata", label: "Kolkata / IST" },
    { value: "Asia/Tokyo", label: "Tokyo / JST" },
    { value: "Australia/Sydney", label: "Sydney / AEDT" },
  ]},
  { label: "Other", zones: [
    { value: "UTC", label: "Coordinated Universal Time (UTC)" },
  ]},
];
const TIMEZONE_LABEL = (v) => TIMEZONE_GROUPS.flatMap(g => g.zones).find(z => z.value === v)?.label ?? "Select timezone";

const SERVICE_SUB_OPTIONS = {
  "Answer My Phones": [
    "Receptionist",
    "Support Line"
  ],
  "Call Leads & Book": [
    "AI SDR (pitch → book)",
    "Appointment Setting",
    "Database Reactivation",
    "Renewals & Win-back"
  ],
  "Call Leads & Qualify": [
    "Lead Qualification (score)",
    "Survey / Research",
    "Recruitment Screening"
  ],
  "Appointment Reminders": [
    "Confirmation Calls",
    "No-Show Recovery",
    "Event / Webinar Reminders"
  ],
  "Find New Leads": [
    "Lead Generation",
    "ICP Prospecting"
  ],
  "Fix Lead List": [
    "Phone Validation",
    "Deduplication",
    "Opt-Out Scrub",
    "Timezone Tagging"
  ],
  "Do Everything (Full Funnel)": [
    "Full Funnel Bundle"
  ]
};

const generateMockPayments = () => {
  const clients = [
    "Harbor Financial",
    "Acme Realty",
    "Northwind Logistics",
    "Sunrise Dental",
    "Vertex Solar",
    "Apex Labs",
    "Pulse Media",
    "Nova Retail"
  ];
  
  const remarks = {
    "Paid": ["Monthly Retainer", "CRM setup fee", "Lead generation bundle", "API usage fee"],
    "Partial": ["Retainer deposit", "First milestone payment", "Platform access fee"],
    "Unpaid": ["Overdue invoice (Net 30)", "Pending billing cycle", "Awaiting authorization"]
  };

  const statusOptions = ["Paid", "Paid", "Paid", "Partial", "Unpaid"]; // 60% Paid, 20% Partial, 20% Unpaid
  const amountOptions = [1200, 1500, 2500, 3000, 5000, 6000];

  const data = [];
  data.push({ id: "pay_1", client: "Harbor Financial", amount: 5000, status: "Paid", date: "2026-06-28", remark: "June Monthly Retainer" });
  data.push({ id: "pay_2", client: "Acme Realty", amount: 1200, status: "Paid", date: "2026-06-15", remark: "Google Ads & CRM management" });
  data.push({ id: "pay_3", client: "Northwind Logistics", amount: 2500, status: "Paid", date: "2026-06-10", remark: "B2B SDR Prospecting" });
  data.push({ id: "pay_4", client: "Sunrise Dental", amount: 1500, status: "Unpaid", date: "2026-06-01", remark: "Inbound answering line (Overdue)" });

  let dateSeed = new Date("2026-06-20");
  for (let i = 5; i <= 100; i++) {
    dateSeed.setDate(dateSeed.getDate() - 3);
    const dateStr = dateSeed.toISOString().split("T")[0];
    
    const client = clients[i % clients.length];
    const status = statusOptions[i % statusOptions.length];
    const amount = amountOptions[i % amountOptions.length];
    const possibleRemarks = remarks[status];
    const remark = possibleRemarks[i % possibleRemarks.length];

    data.push({
      id: `pay_${i}`,
      client,
      amount,
      status,
      date: dateStr,
      remark: `${remark} - Month ${dateSeed.toLocaleString('default', { month: 'short' })}`
    });
  }
  return data;
};

// Account status derives from the enable toggle + whether any service is live.
// ponytail: `enabled` and active-service count are mock fields today; persist via the accounts table later.
function clientStatus(c) {
  if (c?.enabled === false) return { label: "Disabled", color: "#EF4444", bg: "#FEF2F2" };
  const hasActiveService = (c?.activeServices?.length ?? 0) > 0;
  return hasActiveService
    ? { label: "Active", color: "#10B981", bg: "#ECFDF5" }
    : { label: "Onboarded", color: "#64748B", bg: "#F1F5F9" };
}

// Client name + avatar + score/onboarded line — the identical first cell of the dashboard and
// directory client tables.
function ClientIdentityCell({ client }) {
  return (
    <td style={{ padding: "12px 10px", display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: client.color, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600, flexShrink: 0 }}>
        {client.avatar}
      </span>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#1F2433", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {client.name}
        </span>
        <span style={{ fontSize: "9px", color: "#8A90A0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          Score: {client.score}% • Onboarded {new Date(client.onboarded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
    </td>
  );
}

// Timeframe selector used on both the dashboard "Overall Sales" and revenue "Revenue & Cost" cards.
// Caller owns the value/open state + the ref (so the existing outside-click handler keeps working).
function TimeframeDropdown({ value, onChange, open, setOpen, triggerRef }) {
  return (
    <div ref={triggerRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", fontWeight: 500, color: "#5A6072", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit", transition: "all 150ms ease" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4F46FF"; e.currentTarget.style.color = "#1F2433"; }}
        onMouseLeave={(e) => { if (!open) { e.currentTarget.style.borderColor = "#ECEEF2"; e.currentTarget.style.color = "#5A6072"; } }}
      >
        {TIMEFRAME_DATA[value].label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "10px", boxShadow: "0 8px 24px rgba(31,36,51,0.08)", padding: "4px", zIndex: 50, minWidth: "130px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {Object.entries(TIMEFRAME_DATA).map(([key, data]) => (
            <div
              key={key}
              onClick={() => { onChange(key); setOpen(false); }}
              style={{ padding: "6px 10px", fontSize: "12px", borderRadius: "6px", cursor: "pointer", color: value === key ? "#4F46FF" : "#5A6072", background: value === key ? "#F4F5FF" : "transparent", fontWeight: value === key ? 600 : 500, transition: "all 150ms ease" }}
              onMouseEnter={(e) => { if (value !== key) e.currentTarget.style.background = "#F7F8FA"; }}
              onMouseLeave={(e) => { if (value !== key) e.currentTarget.style.background = "transparent"; }}
            >
              {data.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  
  // Onboard New Organization Form State
  const [orgName, setOrgName] = useState("");
  const [orgIndustry, setOrgIndustry] = useState("");
  const [orgCustomerType, setOrgCustomerType] = useState(""); // "business" | "consumer" — gates scrape/enrich
  const [contactName, setContactName] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgTimezone, setOrgTimezone] = useState("America/New_York");
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const timezoneRef = useRef(null);
  const [onboardErrors, setOnboardErrors] = useState({});
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardSuccessMessage, setOnboardSuccessMessage] = useState("");
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardedClient, setOnboardedClient] = useState(null);
  const [editingClientId, setEditingClientId] = useState(null); // null = onboarding new; else editing this client
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState("");
  const [modalStep, setModalStep] = useState(1);
  const [selectedSubService, setSelectedSubService] = useState("");

  const [configuringService, setConfiguringService] = useState(null);
  
  // Section 1: Agent & Script states
  const [scriptVariant, setScriptVariant] = useState("default");
  const [isVariantDropdownOpen, setIsVariantDropdownOpen] = useState(false);
  const [scriptText, setScriptText] = useState("");
  const [openingLine, setOpeningLine] = useState("");
  const [successMetric, setSuccessMetric] = useState("");
  const [voiceSelection, setVoiceSelection] = useState("default");
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);
  const [modelSelection, setModelSelection] = useState("gpt-4o-mini");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isDepthDropdownOpen, setIsDepthDropdownOpen] = useState(false);
  const variantRef = useRef(null);
  const voiceRef = useRef(null);
  const modelRef = useRef(null);
  const depthRef = useRef(null);

  // Section 3: Who it calls
  const [icpDescription, setIcpDescription] = useState("");
  const [isUploadListChecked, setIsUploadListChecked] = useState(true);
  const [isScrapeChecked, setIsScrapeChecked] = useState(false);
  const [scrapeCity, setScrapeCity] = useState("");
  const [scrapeState, setScrapeState] = useState("");
  const [scrapeRadius, setScrapeRadius] = useState("10");
  const [scrapeBusinessType, setScrapeBusinessType] = useState("");
  
  // Lead Qualification (service 3): the questions to ask + what counts as qualified + recruitment toggle.
  const [qualifyingQuestions, setQualifyingQuestions] = useState([""]);
  const [qualifiedCriteria, setQualifiedCriteria] = useState("");
  const [recruitmentEnabled, setRecruitmentEnabled] = useState(false); // only meaningful in Qualify mode → reveals booking

  // Appointment Reminders states
  const [remindSourceBooked, setRemindSourceBooked] = useState(false);
  const [remindSourceCalendar, setRemindSourceCalendar] = useState(false);
  const [remindSourceUpload, setRemindSourceUpload] = useState(false);
  const [reminderTimingValue, setReminderTimingValue] = useState("1");
  const [reminderTimingUnit, setReminderTimingUnit] = useState("hours");

  // Section 4: Offer & Knowledge
  const [clientOffer, setClientOffer] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [attachedDocuments, setAttachedDocuments] = useState([]);

  // Section 5: The meeting
  const [meetingMode, setMeetingMode] = useState(""); // 'Online', 'In-person', 'Both', ''
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingAddress, setMeetingAddress] = useState("");
  const [availabilityWindows, setAvailabilityWindows] = useState([
    { day: "Monday", start: "09:00", end: "17:00" }
  ]);
  const [meetingLength, setMeetingLength] = useState("30");
  const [meetingBuffer, setMeetingBuffer] = useState("15");
  const [bookingCapacity, setBookingCapacity] = useState("20");

  // Section 6: Phone line & numbers
  const [phoneNumbers, setPhoneNumbers] = useState([
    { number: "", cap: 40 }
  ]);
  const [callingHoursStart, setCallingHoursStart] = useState("09:00");
  const [callingHoursEnd, setCallingHoursEnd] = useState("18:00");
  const [callingTimezone, setCallingTimezone] = useState("America/New_York");
  const [isTimezoneDropdownOpen, setIsTimezoneDropdownOpen] = useState(false);

  // Surfaced Auto-Config Collapse States
  const [isRetryPacingCollapsed, setIsRetryPacingCollapsed] = useState(true);
  const [isVoicemailCollapsed, setIsVoicemailCollapsed] = useState(true);
  const [isComplianceCollapsed, setIsComplianceCollapsed] = useState(true);
  const [isEnrichmentCollapsed, setIsEnrichmentCollapsed] = useState(true);
  const [isScrapeSourcesCollapsed, setIsScrapeSourcesCollapsed] = useState(true);
  const [isCallLimitsCollapsed, setIsCallLimitsCollapsed] = useState(true);
  // Advanced auto-config values (preset defaults, editable). No voicemail field — we never leave one.
  const [maxCallAttempts, setMaxCallAttempts] = useState("3");
  const [retryGapDays, setRetryGapDays] = useState("3");
  const [dailyCapPerNumber, setDailyCapPerNumber] = useState("40");
  const [enrichEnabled, setEnrichEnabled] = useState(true);
  const [enrichmentDepth, setEnrichmentDepth] = useState("Standard Profile + Website");
  const [scrapeSources, setScrapeSources] = useState(["Google Maps", "Yellow Pages", "Hotfrog"]);
  const [maxCallLength, setMaxCallLength] = useState("5");
  const [maxLeadsPerRun, setMaxLeadsPerRun] = useState("100");

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [timeframe, setTimeframe] = useState("7d");
  const [selectHovered, setSelectHovered] = useState(false);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const boxRef = useRef(null);
  const timeframeRef = useRef(null);
  const paymentClientRef = useRef(null);

  const [paymentClientOpen, setPaymentClientOpen] = useState(false);
  const [paymentClientSearch, setPaymentClientSearch] = useState("");
  const [hoveredIdx, setHoveredIdx] = useState(4);
  const [clientFilter, setClientFilter] = useState("recent");
  const [hoveredServiceClientId, setHoveredServiceClientId] = useState(null);
  const [directorySearch, setDirectorySearch] = useState("");

  const [revenueTimeframe, setRevenueTimeframe] = useState("7d");
  const [showRevenueTimeframeDropdown, setShowRevenueTimeframeDropdown] = useState(false);
  const [revenueHoveredIdx, setRevenueHoveredIdx] = useState(4);
  const revenueTimeframeRef = useRef(null);

  const [paymentLogs, setPaymentLogs] = useState(() => generateMockPayments());
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingStatus, setEditingStatus] = useState("Paid");
  const [editingAmount, setEditingAmount] = useState("");
  const [editingRemark, setEditingRemark] = useState("");

  const [activeFilterColumn, setActiveFilterColumn] = useState(null); // 'client', 'amount', 'status', 'date', 'remark'
  const [filterSearches, setFilterSearches] = useState({ client: "", amount: "", status: "", date: "", remark: "" });
  const [selectedFilters, setSelectedFilters] = useState({ client: {}, amount: {}, status: {}, date: {}, remark: {} });
  const filterDropdownRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
      if (timeframeRef.current && !timeframeRef.current.contains(e.target)) setShowTimeframeDropdown(false);
      if (revenueTimeframeRef.current && !revenueTimeframeRef.current.contains(e.target)) setShowRevenueTimeframeDropdown(false);
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) setActiveFilterColumn(null);
      if (paymentClientRef.current && !paymentClientRef.current.contains(e.target)) setPaymentClientOpen(false);
      if (timezoneRef.current && !timezoneRef.current.contains(e.target)) setTimezoneOpen(false);
      if (variantRef.current && !variantRef.current.contains(e.target)) setIsVariantDropdownOpen(false);
      if (voiceRef.current && !voiceRef.current.contains(e.target)) setIsVoiceDropdownOpen(false);
      if (modelRef.current && !modelRef.current.contains(e.target)) setIsModelDropdownOpen(false);
      if (depthRef.current && !depthRef.current.contains(e.target)) setIsDepthDropdownOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const [paymentClient, setPaymentClient] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("full");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentRemark, setPaymentRemark] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isRowVisible = (row) => {
    if (selectedFilters.client && Object.values(selectedFilters.client).includes(false)) {
      if (selectedFilters.client[row.client] === false) return false;
    }
    const amtStr = row.amount.toString();
    if (selectedFilters.amount && Object.values(selectedFilters.amount).includes(false)) {
      if (selectedFilters.amount[amtStr] === false) return false;
    }
    if (selectedFilters.status && Object.values(selectedFilters.status).includes(false)) {
      if (selectedFilters.status[row.status] === false) return false;
    }
    if (selectedFilters.date && Object.values(selectedFilters.date).includes(false)) {
      if (selectedFilters.date[row.date] === false) return false;
    }
    if (selectedFilters.remark && Object.values(selectedFilters.remark).includes(false)) {
      if (selectedFilters.remark[row.remark] === false) return false;
    }
    return true;
  };

  const getFilteredLogsExcludingCol = (exclColName) => {
    return paymentLogs.filter(row => {
      if (exclColName !== 'client' && selectedFilters.client && Object.values(selectedFilters.client).includes(false)) {
        if (selectedFilters.client[row.client] === false) return false;
      }
      const amtStr = row.amount.toString();
      if (exclColName !== 'amount' && selectedFilters.amount && Object.values(selectedFilters.amount).includes(false)) {
        if (selectedFilters.amount[amtStr] === false) return false;
      }
      if (exclColName !== 'status' && selectedFilters.status && Object.values(selectedFilters.status).includes(false)) {
        if (selectedFilters.status[row.status] === false) return false;
      }
      if (exclColName !== 'date' && selectedFilters.date && Object.values(selectedFilters.date).includes(false)) {
        if (selectedFilters.date[row.date] === false) return false;
      }
      if (exclColName !== 'remark' && selectedFilters.remark && Object.values(selectedFilters.remark).includes(false)) {
        if (selectedFilters.remark[row.remark] === false) return false;
      }
      return true;
    });
  };

  const renderFilterDropdown = (colName) => {
    const visibleLogs = getFilteredLogsExcludingCol(colName);
    const uniqueValues = Array.from(new Set(visibleLogs.map(p => colName === 'amount' ? p.amount.toString() : p[colName]))).sort();
    const searchQuery = filterSearches[colName] || "";
    const filteredValues = uniqueValues.filter(val => val.toLowerCase().includes(searchQuery.toLowerCase()));

    const allSelected = filteredValues.every(val => selectedFilters[colName]?.[val] !== false);

    return (
      <div
        ref={filterDropdownRef}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: "100%",
          left: "12px",
          background: "#FFFFFF",
          border: "1px solid #ECEEF2",
          borderRadius: "10px",
          boxShadow: "0 8px 24px rgba(31,36,51,0.12)",
          padding: "10px",
          zIndex: 100,
          minWidth: "180px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          textTransform: "none",
          fontWeight: "normal"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #ECEEF2", borderRadius: "6px", padding: "4px 8px" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setFilterSearches(prev => ({ ...prev, [colName]: e.target.value }))}
            style={{
              border: "none",
              outline: "none",
              fontSize: "10px",
              color: "#1F2433",
              width: "100%",
              fontFamily: "inherit"
            }}
          />
        </div>

        <div style={{ maxHeight: "120px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#1F2433", cursor: "pointer", padding: "2px 4px", borderRadius: "4px" }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => {
                setSelectedFilters(prev => {
                  const colFilters = { ...prev[colName] };
                  filteredValues.forEach(val => {
                    colFilters[val] = !allSelected;
                  });
                  return { ...prev, [colName]: colFilters };
                });
              }}
              style={{ cursor: "pointer" }}
            />
            <span style={{ fontWeight: 600 }}>Select All</span>
          </label>

          {filteredValues.map((val) => {
            const isChecked = selectedFilters[colName]?.[val] !== false;
            const displayVal = colName === 'amount' ? `$${parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : val;

            return (
              <label
                key={val}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  color: "#5A6072",
                  cursor: "pointer",
                  padding: "2px 4px",
                  borderRadius: "4px",
                  transition: "background 150ms ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#F7F8FA"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    setSelectedFilters(prev => {
                      const colFilters = { ...prev[colName] };
                      colFilters[val] = !isChecked;
                      return { ...prev, [colName]: colFilters };
                    });
                  }}
                  style={{ cursor: "pointer" }}
                />
                <span>{displayVal}</span>
              </label>
            );
          })}
        </div>

        {Object.values(selectedFilters[colName] || {}).includes(false) && (
          <button
            onClick={() => {
              setSelectedFilters(prev => ({ ...prev, [colName]: {} }));
              setFilterSearches(prev => ({ ...prev, [colName]: "" }));
            }}
            style={{
              border: "none",
              background: "none",
              color: "#EF4444",
              fontSize: "10px",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              padding: "4px 4px 0 4px",
              borderTop: "1px solid #F0F1F4",
              marginTop: "4px"
            }}
          >
            Clear Filter
          </button>
        )}
      </div>
    );
  };

  const handleLogPayment = (e) => {
    e.preventDefault();
    if (!paymentClient || !paymentAmount) return;

    const newPayment = {
      id: `pay_${Date.now()}`,
      client: paymentClient,
      amount: parseFloat(paymentAmount),
      status: paymentStatus === "unpaid" ? "Unpaid" : paymentStatus === "partial" ? "Partial" : "Paid",
      date: paymentDate,
      remark: paymentRemark || "-"
    };

    setPaymentLogs(prev => [newPayment, ...prev]);

    setPaymentClient("");
    setPaymentAmount("");
    setPaymentStatus("full");
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentRemark("");

    setSuccessMessage("Payment logged successfully!");
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  const [currentView, setCurrentView] = useState("dashboard"); // "dashboard" or "health"
  const [resolvingId, setResolvingId] = useState(null);
  const [errors, setErrors] = useState([
    { id: 1, client: "Acme Realty", tool: "Google Calendar", message: "OAuth token expired; unable to read busy slots or write events.", time: "10 mins ago", actionLabel: "Reconnect" },
    { id: 2, client: "Sunrise Dental", tool: "Lead Queue", message: "0 ready leads left in 'scrubbed' state. Scraping refills paused.", time: "1 hour ago", actionLabel: "Refill Queue" },
    { id: 3, client: "Vertex Solar", tool: "Vapi API", message: "LLM completion timed out during inbound call handling.", time: "2 hours ago", actionLabel: "Retry Agent" }
  ]);
  const [terminalLogs, setTerminalLogs] = useState([
    `[${new Date().toLocaleTimeString()}] INFO: Daily sweep scheduled and running...`,
    `[${new Date().toLocaleTimeString()}] WARNING: Acme Realty calendar access denied.`,
    `[${new Date().toLocaleTimeString()}] WARNING: Sunrise Dental lead queue empty.`,
    `[${new Date().toLocaleTimeString()}] INFO: Logged payment of $1200.00 for Harbor Financial.`,
    `[${new Date().toLocaleTimeString()}] INFO: Inbound call from +1 (943) 219-8479 answered successfully.`
  ]);

  const resolveError = (id) => {
    setResolvingId(id);
    setTimeout(() => {
      const err = errors.find(e => e.id === id);
      setErrors(prev => prev.filter(e => e.id !== id));
      setResolvingId(null);
      if (err) {
        setTerminalLogs(prev => [
          `[${new Date().toLocaleTimeString()}] SUCCESS: Resolved ${err.tool} connection for ${err.client}.`,
          ...prev
        ]);
      }
    }, 1200);
  };

  // Enable/disable the whole client account (e.g. flip off on non-payment). Status follows from it.
  const toggleClientEnabled = () => {
    const c = onboardedClient;
    if (!c) return;
    const next = c.enabled === false; // currently disabled → enable; else disable
    setClients(prev => prev.map(x => x.id === c.id ? { ...x, enabled: next } : x));
    setOnboardedClient(prev => prev ? { ...prev, enabled: next } : prev);
  };

  // Open the onboarding popup pre-filled with the current client, in edit mode.
  const startEditOnboarding = () => {
    const c = onboardedClient;
    if (!c) return;
    setOrgName(c.name || "");
    setOrgIndustry(c.industry || "");
    setOrgCustomerType(c.targetCustomerType || "");
    setContactName(c.contactName || "");
    setOrgEmail(c.email || "");
    setOrgPhone(c.contactPhone || c.contact || "");
    setOrgTimezone(c.timezone || "America/New_York");
    setOnboardErrors({});
    setEditingClientId(c.id);
    setShowOnboardModal(true);
  };

  const handleGenerateScript = () => {
    const modeText = meetingMode ? `via ${meetingMode} mode` : "";
    const offerText = clientOffer ? `the offer: "${clientOffer}"` : "our services";
    const icpText = icpDescription ? `targeting: ${icpDescription}` : "our target audience";
    
    let generated = "";
    if (configuringService === "Reactivation & Renewals") {
      if (scriptVariant === "renewals_winback") {
        generated = `You are calling customers of the business described in your context whose contract or subscription is expiring or recently lapsed.
Your primary goal is to save the account, discuss renewing their subscription, and explain the value of continuing.
Warmly reference their relationship with us, highlight the value they stand to lose if they lapse, and handle any hesitation or objections calmly.
When they agree to set up a renewal or continue their service, check calendar availability and book the slot.
Never pressure; make staying easy and pleasant.`;
      } else {
        generated = `You are calling past or dormant leads on behalf of the business described in your context who previously showed interest but went quiet.
Your primary goal is to re-engage them, check if their need or interest is still active, and offer ${offerText}.
Warmly reference that they connected with us previously, check if their need is still live, and re-spark interest.
If they are open, check calendar availability and book a time to get them back on the calendar.
Be gracious, warm, and helpful. If they've moved on, thank them politely.`;
      }
    } else {
      generated = `You are a warm, sharp, persuasive outbound sales rep calling on behalf of the business.
Your primary goal is to pitch ${offerText} to prospects ${icpText}.
Speak naturally, asking one question at a time. Qualify the prospect lightly.
When they express interest in booking a demo/meeting ${modeText}, check calendar availability and book the slot.
Always handle objections politely.`;
    }
    
    setScriptText(generated);
  };

  const handleActivateService = () => {
    // Lead Qualification (capture-only) and Appointment Reminders need no meeting; otherwise required.
    const needsMeeting = !(configuringService === "Lead Qualification" && !recruitmentEnabled) && configuringService !== "Appointment Reminders";
    if (needsMeeting && !meetingMode) return; // required check
    const c = onboardedClient;
    if (!c) return;

    const active = c.activeServices || [];
    const updatedActive = active.includes(configuringService) ? active : [...active, configuringService];
    // Clone, don't mutate the existing state object.
    const serviceConfigs = { ...(c.serviceConfigs || {}) };
    serviceConfigs[configuringService] = {
      scriptVariant, scriptText, openingLine, successMetric, voiceSelection, modelSelection,
      icpDescription, isUploadListChecked, isScrapeChecked, scrapeCity, scrapeState, scrapeRadius, scrapeBusinessType,
      clientOffer, knowledgeBase, attachedDocuments, meetingMode, meetingLink, meetingAddress, availabilityWindows,
      meetingLength, meetingBuffer, bookingCapacity,
      qualifyingQuestions, qualifiedCriteria, recruitmentEnabled,
      remindSourceBooked, remindSourceCalendar, remindSourceUpload, reminderTimingValue, reminderTimingUnit,
      phoneNumbers: phoneNumbers.filter(p => p.number.trim() !== ""),
      callingHoursStart, callingHoursEnd, callingTimezone,
      maxCallAttempts, retryGapDays, dailyCapPerNumber,
      enrichEnabled, enrichmentDepth, scrapeSources,
      maxCallLength, maxLeadsPerRun,
      isDraft: false
    };

    const updated = {
      ...c,
      activeServices: updatedActive,
      services: Array.from(new Set([...(c.services || []), configuringService])),
      serviceConfigs
    };
    setClients(prev => prev.map(x => x.id === c.id ? updated : x));
    setOnboardedClient(updated);
    setConfiguringService(null);
  };

  const handleSaveDraft = () => {
    const c = onboardedClient;
    if (!c) return;

    // Clone, don't mutate the existing state object.
    const serviceConfigs = { ...(c.serviceConfigs || {}) };
    serviceConfigs[configuringService] = {
      scriptVariant, scriptText, openingLine, successMetric, voiceSelection, modelSelection,
      icpDescription, isUploadListChecked, isScrapeChecked, scrapeCity, scrapeState, scrapeRadius, scrapeBusinessType,
      clientOffer, knowledgeBase, attachedDocuments, meetingMode, meetingLink, meetingAddress, availabilityWindows,
      meetingLength, meetingBuffer, bookingCapacity,
      qualifyingQuestions, qualifiedCriteria, recruitmentEnabled,
      remindSourceBooked, remindSourceCalendar, remindSourceUpload, reminderTimingValue, reminderTimingUnit,
      phoneNumbers: phoneNumbers.filter(p => p.number.trim() !== ""),
      callingHoursStart, callingHoursEnd, callingTimezone,
      maxCallAttempts, retryGapDays, dailyCapPerNumber,
      enrichEnabled, enrichmentDepth, scrapeSources,
      maxCallLength, maxLeadsPerRun,
      isDraft: true
    };

    const updatedServices = c.services?.includes(configuringService) ? c.services : [...(c.services || []), configuringService];
    const updatedActive = (c.activeServices || []).filter(s => s !== configuringService);

    const updated = {
      ...c,
      activeServices: updatedActive,
      services: updatedServices,
      serviceConfigs
    };
    setClients(prev => prev.map(x => x.id === c.id ? updated : x));
    setOnboardedClient(updated);
    setConfiguringService(null);
  };

  const handleConfigureService = (serviceId) => {
    setConfiguringService(serviceId);
    // Lead-qual fields reset clean on every open; saved/defaults override below.
    setQualifyingQuestions([""]); setQualifiedCriteria(""); setRecruitmentEnabled(false);
    
    // Appointment Reminders fields reset clean:
    setRemindSourceBooked(false);
    setRemindSourceCalendar(false);
    setRemindSourceUpload(false);
    setReminderTimingValue("1");
    setReminderTimingUnit("hours");

    if (serviceId === "Outbound Sales / Appt Setting" || serviceId === "Reactivation & Renewals" || serviceId === "Lead Qualification" || serviceId === "Appointment Reminders") {
      const saved = onboardedClient?.serviceConfigs?.[serviceId];
      if (saved) {
        setScriptVariant(saved.scriptVariant || (serviceId === "Reactivation & Renewals" ? "db_reactivation" : serviceId === "Appointment Reminders" ? "confirmation" : "default"));
        setScriptText(saved.scriptText || "");
        setOpeningLine(saved.openingLine || "");
        setSuccessMetric(saved.successMetric || "");
        setVoiceSelection(saved.voiceSelection || "default");
        setModelSelection(saved.modelSelection || "gpt-4o-mini");
        setIcpDescription(saved.icpDescription || "");
        setIsUploadListChecked(saved.isUploadListChecked !== undefined ? saved.isUploadListChecked : true);
        setIsScrapeChecked(saved.isScrapeChecked !== undefined ? saved.isScrapeChecked : false);
        setScrapeCity(saved.scrapeCity || "");
        setScrapeState(saved.scrapeState || "");
        setScrapeRadius(saved.scrapeRadius || "10");
        setScrapeBusinessType(saved.scrapeBusinessType || "");
        setClientOffer(saved.clientOffer || "");
        setKnowledgeBase(saved.knowledgeBase || "");
        setAttachedDocuments(saved.attachedDocuments || []);
        setMeetingMode(saved.meetingMode || "");
        setMeetingLink(saved.meetingLink || "");
        setMeetingAddress(saved.meetingAddress || "");
        setAvailabilityWindows(saved.availabilityWindows || [{ day: "Monday", start: "09:00", end: "17:00" }]);
        setMeetingLength(saved.meetingLength || "30");
        setMeetingBuffer(saved.meetingBuffer || "15");
        setBookingCapacity(saved.bookingCapacity || "20");
        setPhoneNumbers(saved.phoneNumbers?.length ? saved.phoneNumbers : [{ number: "", cap: 40 }]);
        setCallingHoursStart(saved.callingHoursStart || "09:00");
        setCallingHoursEnd(saved.callingHoursEnd || "18:00");
        setCallingTimezone(saved.callingTimezone || onboardedClient?.timezone || "America/New_York");
        setMaxCallAttempts(saved.maxCallAttempts || "3");
        setRetryGapDays(saved.retryGapDays || "3");
        setDailyCapPerNumber(saved.dailyCapPerNumber || "40");
        setEnrichEnabled(saved.enrichEnabled !== undefined ? saved.enrichEnabled : true);
        setEnrichmentDepth(saved.enrichmentDepth || "Standard Profile + Website");
        setScrapeSources(saved.scrapeSources || ["Google Maps", "Yellow Pages", "Hotfrog"]);
        setMaxCallLength(saved.maxCallLength || "5");
        setMaxLeadsPerRun(saved.maxLeadsPerRun || "100");
        setQualifyingQuestions(saved.qualifyingQuestions?.length ? saved.qualifyingQuestions : [""]);
        setQualifiedCriteria(saved.qualifiedCriteria || "");
        setRecruitmentEnabled(saved.recruitmentEnabled || false);
        setRemindSourceBooked(saved.remindSourceBooked || false);
        setRemindSourceCalendar(saved.remindSourceCalendar || false);
        setRemindSourceUpload(saved.remindSourceUpload !== undefined ? saved.remindSourceUpload : false);
        setReminderTimingValue(saved.reminderTimingValue || "1");
        setReminderTimingUnit(saved.reminderTimingUnit || "hours");
      } else if (serviceId === "Lead Qualification") {
        // No saved config yet — qualification defaults (capture-only). Questions/criteria start empty.
        setScriptVariant("default");
        setScriptText("You are calling to qualify prospects for the business described in your context. Ask the qualifying questions naturally, one at a time. Once you've gathered the answers, call capture_fields to save them along with whether the prospect is a good fit (qualified true or false). Be efficient and respectful of their time.");
        setOpeningLine("Hi, this is the team — do you have a quick minute?");
        setSuccessMetric("Qualification answers captured for every reachable lead.");
        setVoiceSelection("default");
        setModelSelection("gpt-4o-mini");
        setIcpDescription("");
        setIsUploadListChecked(true);
        setIsScrapeChecked(false);
        setScrapeCity(""); setScrapeState(""); setScrapeRadius("10"); setScrapeBusinessType("");
        setClientOffer("");
        setKnowledgeBase("");
        setAttachedDocuments([]);
        setMeetingMode(""); setMeetingLink(""); setMeetingAddress("");
        setAvailabilityWindows([{ day: "Monday", start: "09:00", end: "17:00" }]);
        setMeetingLength("30"); setMeetingBuffer("15"); setBookingCapacity("20");
        setPhoneNumbers([{ number: "", cap: 40 }]);
        setCallingHoursStart("09:00"); setCallingHoursEnd("18:00");
        setCallingTimezone(onboardedClient?.timezone || "America/New_York");
        setMaxCallAttempts("3"); setRetryGapDays("3"); setDailyCapPerNumber("40");
        setEnrichEnabled(true); setEnrichmentDepth("Standard Profile + Website");
        setScrapeSources(["Google Maps", "Yellow Pages", "Hotfrog"]);
        setMaxCallLength("5"); setMaxLeadsPerRun("100");
      } else if (serviceId === "Appointment Reminders") {
        // No saved config yet — Appointment Reminders defaults.
        setScriptVariant("confirmation");
        setScriptText("You are calling to remind someone about an upcoming appointment for the business described in your context. Be friendly and clear. Confirm the date, time, and location. Ask if they can make it. If they need to reschedule, call check_availability and then book_appointment with the new time. If they can't make it, capture the reason with capture_fields. Always end with a clear next step.");
        setOpeningLine("Hi, this is a reminder from the team about your upcoming appointment — can you confirm you'll be there?");
        setSuccessMetric("Appointment confirmed, rescheduled, or cancellation reason captured.");
        setVoiceSelection("default");
        setModelSelection("gpt-4o-mini");
        setIcpDescription("");
        setIsUploadListChecked(true);
        setIsScrapeChecked(false);
        setScrapeCity(""); setScrapeState(""); setScrapeRadius("10"); setScrapeBusinessType("");
        setClientOffer("");
        setKnowledgeBase("");
        setAttachedDocuments([]);
        setMeetingMode(""); setMeetingLink(""); setMeetingAddress("");
        setAvailabilityWindows([{ day: "Monday", start: "09:00", end: "17:00" }]);
        setMeetingLength("30"); setMeetingBuffer("15"); setBookingCapacity("20");
        setPhoneNumbers([{ number: "", cap: 40 }]);
        setCallingHoursStart("09:00"); setCallingHoursEnd("18:00");
        setCallingTimezone(onboardedClient?.timezone || "America/New_York");
        setMaxCallAttempts("3"); setRetryGapDays("3"); setDailyCapPerNumber("40");
        setEnrichEnabled(true); setEnrichmentDepth("Standard Profile + Website");
        setScrapeSources(["Google Maps", "Yellow Pages", "Hotfrog"]);
        setMaxCallLength("5"); setMaxLeadsPerRun("100");
        setRemindSourceBooked(false);
        setRemindSourceCalendar(false);
        setRemindSourceUpload(true);
        setReminderTimingValue("1");
        setReminderTimingUnit("hours");
      } else if (onboardedClient?.id === "acc_Harbor") {
        if (serviceId === "Outbound Sales / Appt Setting") {
          setScriptVariant("appointment_setting");
          setScriptText("You are a friendly outbound rep for Harbor Financial. Your only goal is to get a short portfolio & coverage review on the calendar — keep the pitch light, don't oversell. Confirm you're speaking with the right person, give a one-line reason for the call, then move straight to scheduling: call check_availability, offer a couple of times, and book_appointment to lock it in.");
          setOpeningLine("Hi, this is Harbor Financial — did I catch you at an okay moment?");
          setSuccessMetric("A booked, qualified portfolio review on the calendar.");
          setVoiceSelection("default");
          setModelSelection("gpt-4o-mini");
          setIcpDescription("Independent insurance brokers and small financial advisory firms in the US (5–50 staff) who handle their own client outreach and want more booked policy-review meetings.");
          setIsUploadListChecked(true);
          setIsScrapeChecked(true);
          setScrapeCity("Austin");
          setScrapeState("TX");
          setScrapeRadius("25");
          setScrapeBusinessType("Insurance brokers");
          setClientOffer("A free 15-minute portfolio & coverage review with a licensed fiduciary advisor.");
          setKnowledgeBase("Harbor Financial is a fee-only fiduciary advisory firm based in Austin, TX (founded 2014). Services: retirement planning, insurance, and wealth management. Known for transparent, commission-free advice. Typical client: business owners and professionals aged 35–60.");
          setAttachedDocuments(["Harbor-Services-Overview.pdf", "FAQ-2026.docx"]);
          setMeetingMode("Both");
          setMeetingLink("https://meet.google.com/hbr-review-team");
          setMeetingAddress("120 Congress Ave, Suite 400, Austin, TX 78701");
          setAvailabilityWindows([
            { day: "Monday", start: "09:00", end: "17:00" },
            { day: "Wednesday", start: "10:00", end: "16:00" },
            { day: "Friday", start: "09:00", end: "13:00" },
          ]);
          setMeetingLength("30");
          setMeetingBuffer("15");
          setBookingCapacity("20");
          setPhoneNumbers([{ number: "+1 (512) 555-0142", cap: 40 }, { number: "+1 (512) 555-0188", cap: 40 }]);
          setCallingHoursStart("09:00");
          setCallingHoursEnd("18:00");
          setCallingTimezone(onboardedClient?.timezone || "America/New_York");
          setMaxCallAttempts("3");
          setRetryGapDays("3");
          setDailyCapPerNumber("40");
          setEnrichEnabled(true);
          setEnrichmentDepth("Deep (profile + website + email + ICP fit)");
          setScrapeSources(["Google Maps", "Yellow Pages", "Hotfrog"]);
          setMaxCallLength("5");
          setMaxLeadsPerRun("100");
        } else {
          setScriptVariant("db_reactivation");
          setScriptText("You are calling past or dormant leads on behalf of Harbor Financial who previously showed interest in our insurance policy reviews but went quiet. Warmly reference that they connected with us previously, check if their insurance needs are still live, and re-spark interest. If they're open, call check_availability and book_appointment to get them back on the calendar for a coverage review.");
          setOpeningLine("Hi, this is Harbor Financial — did I catch you at an okay moment?");
          setSuccessMetric("A re-engaged meeting or renewal confirmed on the calendar.");
          setVoiceSelection("default");
          setModelSelection("gpt-4o-mini");
          setIcpDescription("Past leads and dormant clients who showed interest in insurance advisory services in the US.");
          setIsUploadListChecked(true);
          setIsScrapeChecked(false);
          setScrapeCity("");
          setScrapeState("");
          setScrapeRadius("10");
          setScrapeBusinessType("");
          setClientOffer("A free 15-minute portfolio & coverage review with a licensed fiduciary advisor.");
          setKnowledgeBase("Harbor Financial is a fee-only fiduciary advisory firm based in Austin, TX (founded 2014). Services: retirement planning, insurance, and wealth management. Known for transparent, commission-free advice. Typical client: business owners and professionals aged 35–60.");
          setAttachedDocuments(["Harbor-Services-Overview.pdf", "FAQ-2026.docx"]);
          setMeetingMode("Both");
          setMeetingLink("https://meet.google.com/hbr-review-team");
          setMeetingAddress("120 Congress Ave, Suite 400, Austin, TX 78701");
          setAvailabilityWindows([
            { day: "Monday", start: "09:00", end: "17:00" },
            { day: "Wednesday", start: "10:00", end: "16:00" },
            { day: "Friday", start: "09:00", end: "13:00" },
          ]);
          setMeetingLength("30");
          setMeetingBuffer("15");
          setBookingCapacity("20");
          setPhoneNumbers([{ number: "+1 (512) 555-0142", cap: 40 }, { number: "+1 (512) 555-0188", cap: 40 }]);
          setCallingHoursStart("09:00");
          setCallingHoursEnd("18:00");
          setCallingTimezone(onboardedClient?.timezone || "America/New_York");
          setMaxCallAttempts("3");
          setRetryGapDays("3");
          setDailyCapPerNumber("40");
          setEnrichEnabled(true);
          setEnrichmentDepth("Standard Profile + Website");
          setScrapeSources(["Google Maps", "Yellow Pages", "Hotfrog"]);
          setMaxCallLength("5");
          setMaxLeadsPerRun("100");
        }
      } else {
        if (serviceId === "Reactivation & Renewals") {
          setScriptVariant("db_reactivation");
          setScriptText("You are calling past or dormant leads on behalf of the business described in your context — people who showed interest before but went quiet. Warmly reference that they connected with us previously, check if their need is still live, and re-spark interest. If they're open, call check_availability and book_appointment to get them back on the calendar. Be gracious if they've moved on.");
          setOpeningLine("Hi, this is the team calling — did I catch you at an okay moment?");
          setSuccessMetric("A re-engaged meeting or renewal confirmed on the calendar.");
          setIcpDescription("");
          setIsUploadListChecked(true);
          setIsScrapeChecked(false);
        } else {
          setScriptVariant("default");
          setScriptText("You are a warm, sharp, persuasive (never pushy) outbound sales rep calling on behalf of the business described in your context. Your goal is to book a short meeting or demo. Ask one question at a time and keep it natural. Qualify lightly and handle objections politely. When they agree, call check_availability, offer the times, then book_appointment to lock it in.");
          setOpeningLine("Hi, this is the team calling — did I catch you at an okay moment?");
          setSuccessMetric("A booked, qualified meeting on the calendar.");
          setIcpDescription("");
          setIsUploadListChecked(true);
          setIsScrapeChecked(false);
        }
        setVoiceSelection("default");
        setModelSelection("gpt-4o-mini");
        setScrapeCity("");
        setScrapeState("");
        setScrapeRadius("10");
        setScrapeBusinessType("");
        setClientOffer("");
        setKnowledgeBase("");
        setAttachedDocuments([]);
        setMeetingMode("");
        setMeetingLink("");
        setMeetingAddress("");
        setAvailabilityWindows([{ day: "Monday", start: "09:00", end: "17:00" }]);
        setMeetingLength("30");
        setMeetingBuffer("15");
        setBookingCapacity("20");
        setPhoneNumbers([{ number: "", cap: 40 }]);
        setCallingHoursStart("09:00");
        setCallingHoursEnd("18:00");
        setCallingTimezone(onboardedClient?.timezone || "America/New_York");
        setMaxCallAttempts("3");
        setRetryGapDays("3");
        setDailyCapPerNumber("40");
        setEnrichEnabled(true);
        setEnrichmentDepth("Standard Profile + Website");
        setScrapeSources(["Google Maps", "Yellow Pages", "Hotfrog"]);
        setMaxCallLength("5");
        setMaxLeadsPerRun("100");
      }
    }
  };

  const handleDeactivateService = (serviceId) => {
    const c = onboardedClient;
    if (!c) return;
    const updated = { ...c, activeServices: (c.activeServices || []).filter(s => s !== serviceId) };
    setClients(prev => prev.map(x => x.id === c.id ? updated : x));
    setOnboardedClient(updated);
  };

  const handleDeleteService = (serviceId) => {
    const c = onboardedClient;
    if (!c) return;
    const serviceConfigs = { ...(c.serviceConfigs || {}) };
    delete serviceConfigs[serviceId];
    const updated = {
      ...c,
      services: (c.services || []).filter(s => s !== serviceId),
      activeServices: (c.activeServices || []).filter(s => s !== serviceId),
      serviceConfigs
    };
    setClients(prev => prev.map(x => x.id === c.id ? updated : x));
    setOnboardedClient(updated);
  };

  const handleOnboardSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!orgName.trim()) errs.name = "Business name is required.";
    if (!contactName.trim()) errs.contactName = "Contact name is required.";
    if (!orgEmail.trim()) {
      errs.email = "Contact email is required.";
    } else if (!/\S+@\S+\.\S+/.test(orgEmail)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!orgPhone.trim()) {
      errs.phone = "Contact phone is required.";
    } else if (!/^\+?[\d\s-()]{7,20}$/.test(orgPhone.trim())) {
      errs.phone = "Please enter a valid phone number.";
    }
    if (!orgTimezone) errs.timezone = "Please select a timezone.";
    if (!orgCustomerType) errs.customerType = true;

    if (Object.keys(errs).length > 0) {
      setOnboardErrors(errs);
      return;
    }

    setOnboardErrors({});
    setIsOnboarding(true);

    setTimeout(() => {
      const words = orgName.trim().split(/\s+/);
      const avatar = words.map(w => w[0]).join("").substring(0, 2).toUpperCase() || "OR";

      // Edit mode: patch the existing client in place (keep id/color/score/billing), stay on this page.
      if (editingClientId) {
        const patch = {
          name: orgName.trim(),
          industry: orgIndustry.trim(),
          targetCustomerType: orgCustomerType,
          email: orgEmail.trim(),
          contact: `${contactName.trim()} (${orgPhone.trim()})`,
          contactName: contactName.trim(),
          contactPhone: orgPhone.trim(),
          timezone: orgTimezone,
          avatar,
        };
        setClients(prev => prev.map(c => c.id === editingClientId ? { ...c, ...patch } : c));
        setOnboardedClient(prev => prev ? { ...prev, ...patch } : prev);
        setOrgName(""); setOrgIndustry(""); setOrgCustomerType(""); setContactName(""); setOrgEmail(""); setOrgPhone(""); setOrgTimezone("America/New_York");
        setIsOnboarding(false);
        setShowOnboardModal(false);   // just close — details are already updated
        setEditingClientId(null);
        return;
      }

      const colors = ["#4F46FF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#6366F1", "#14B8A6"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newId = "acc_" + orgName.trim().replace(/[^a-zA-Z0-9]/g, "").substring(0, 8);
      
      const newClient = {
        id: newId,
        name: orgName.trim(),
        industry: orgIndustry.trim(),
        targetCustomerType: orgCustomerType,
        email: orgEmail.trim(),
        contact: `${contactName.trim()} (${orgPhone.trim()})`,
        contactName: contactName.trim(),
        contactPhone: orgPhone.trim(),
        timezone: orgTimezone,
        avatar,
        color: randomColor,
        leads: "0 Leads (Paused)",
        services: ["Do Everything (Full Funnel)"],
        health: "Operational",
        retainer: "$1,500.00",
        payment: "Unpaid",
        score: 100,
        onboarded: new Date().toISOString().split("T")[0]
      };

      setClients(prev => [...prev, newClient]);
      setOnboardedClient(newClient);

      const timestamp = new Date().toLocaleTimeString();
      setTerminalLogs(prev => [
        `[${timestamp}] SUCCESS: Onboarded organization "${orgName.trim()}" (Contact: ${contactName.trim()}, TZ: ${orgTimezone})`,
        ...prev
      ]);

      setIsOnboarding(false);
      setOnboardSuccessMessage(`Successfully onboarded ${orgName.trim()}!`);

      setOrgName("");
      setOrgIndustry("");
      setOrgCustomerType("");
      setContactName("");
      setOrgEmail("");
      setOrgPhone("");
      setOrgTimezone("America/New_York");

      setTimeout(() => {
        setOnboardSuccessMessage("");
        setShowOnboardModal(false);
        setCurrentView("create-service");
      }, 1500);
      
    }, 1200);
  };

  const q = query.trim().toLowerCase();
  const matches = q
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      )
    : [];

  return (
    <div style={{ backgroundColor: "#F7F8FA", minHeight: "100vh", display: "flex" }}>

      {/* Sidebar */}
      <div style={{ width: "56px", flexShrink: 0, backgroundColor: "#FFFFFF", borderRight: "1px solid #ECEEF2", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "16px", gap: "16px" }}>
        <img src="/logo.png" alt="Reacher AI" style={{ width: "36px", height: "36px", marginBottom: "8px" }} />
        
        {/* Navigation Items */}
        <div
          onClick={() => setCurrentView("dashboard")}
          title="Overview Dashboard"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backgroundColor: currentView === "dashboard" ? "#F4F5FF" : "transparent",
            color: currentView === "dashboard" ? "#4F46FF" : "#8A90A0",
            transition: "all 150ms ease"
          }}
          onMouseEnter={(e) => {
            if (currentView !== "dashboard") {
              e.currentTarget.style.backgroundColor = "#F7F8FA";
              e.currentTarget.style.color = "#1F2433";
            }
          }}
          onMouseLeave={(e) => {
            if (currentView !== "dashboard") {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#8A90A0";
            }
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
        </div>

         <div
          onClick={() => setCurrentView("health")}
          title="System Health"
          style={{
            position: "relative",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backgroundColor: currentView === "health" ? "#F4F5FF" : "transparent",
            color: currentView === "health" ? "#4F46FF" : "#8A90A0",
            transition: "all 150ms ease"
          }}
          onMouseEnter={(e) => {
            if (currentView !== "health") {
              e.currentTarget.style.backgroundColor = "#F7F8FA";
              e.currentTarget.style.color = "#1F2433";
            }
          }}
          onMouseLeave={(e) => {
            if (currentView !== "health") {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#8A90A0";
            }
          }}
        >
          {errors.length > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 rounded-full bg-red-500" />
          )}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>

        {/* Revenue & Payments Switcher */}
        <div
          onClick={() => setCurrentView("revenue")}
          title="Revenue & Payments"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backgroundColor: currentView === "revenue" ? "#F4F5FF" : "transparent",
            color: currentView === "revenue" ? "#4F46FF" : "#8A90A0",
            transition: "all 150ms ease"
          }}
          onMouseEnter={(e) => {
            if (currentView !== "revenue") {
              e.currentTarget.style.backgroundColor = "#F7F8FA";
              e.currentTarget.style.color = "#1F2433";
            }
          }}
          onMouseLeave={(e) => {
            if (currentView !== "revenue") {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#8A90A0";
            }
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>

        {/* Client Directory Switcher */}
        <div
          onClick={() => setCurrentView("directory")}
          title="Client Directory"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backgroundColor: currentView === "directory" ? "#F4F5FF" : "transparent",
            color: currentView === "directory" ? "#4F46FF" : "#8A90A0",
            transition: "all 150ms ease"
          }}
          onMouseEnter={(e) => {
            if (currentView !== "directory") {
              e.currentTarget.style.backgroundColor = "#F7F8FA";
              e.currentTarget.style.color = "#1F2433";
            }
          }}
          onMouseLeave={(e) => {
            if (currentView !== "directory") {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#8A90A0";
            }
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>

        <div style={{ flex: 1 }} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, padding: "20px 24px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: "20px", fontWeight: 600, color: (currentView === "add-organization" || currentView === "create-service") ? "#4F46FF" : "#1F2433" }}>
              {currentView === "dashboard" ? "Overview" : currentView === "health" ? "System Health" : currentView === "revenue" ? "Revenue & Payments" : currentView === "directory" ? "Client Directory" : currentView === "create-service" ? "Create Service" : "Onboard Organization"}
            </div>
            <div style={{ fontSize: "12px", color: "#8A90A0", marginTop: "2px" }}>
              {currentView === "dashboard" ? "Agency dashboard" : currentView === "health" ? "Real-time operational status" : currentView === "revenue" ? "Billing logs and revenue metrics" : currentView === "directory" ? "Full client roster and search" : currentView === "create-service" ? "Choose the service this client's AI agent will run" : "Register a new client organization on the Reacher AI calling platform"}
            </div>
          </div>

          {currentView === "dashboard" && (
            <div ref={boxRef} style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", width: open ? "560px" : "432px", transition: "width 320ms cubic-bezier(0.4, 0, 0.2, 1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#F7F8FA", border: open ? "1px solid #4F46FF" : "1px solid #E2E5EA", borderRadius: "10px", padding: "8px 14px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A8AEBC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input
                  type="text"
                  placeholder="Search"
                  value={query}
                  onFocus={() => setOpen(true)}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ border: "none", background: "none", outline: "none", fontSize: "13px", color: "#1F2433", width: "100%", fontFamily: "inherit" }}
                />
              </div>
              {open && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "6px", background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "10px", boxShadow: "0 8px 24px rgba(31,36,51,0.08)", overflow: "hidden", zIndex: 50 }}>
                  {q === "" ? (
                    <>
                      <div style={{ padding: "8px 14px", fontSize: "11px", color: "#A0A6B4", textTransform: "uppercase", letterSpacing: "0.04em" }}>Recent searches</div>
                      {RECENT.map((r) => (
                        <div key={r} onClick={() => setQuery(r)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 14px", fontSize: "13px", color: "#1F2433", cursor: "pointer" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8AEBC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          {r}
                        </div>
                      ))}
                    </>
                  ) : matches.length > 0 ? (
                    matches.map((c) => (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", fontSize: "13px", color: "#1F2433", cursor: "pointer", borderTop: "1px solid #F4F5F7" }}>
                        <span style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 500 }}>{c.name}</span>
                          <span style={{ fontSize: "11px", color: "#8A90A0" }}>{c.email}</span>
                        </span>
                        <span style={{ fontSize: "11px", color: "#A0A6B4" }}>{c.id}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "12px 14px", fontSize: "13px", color: "#8A90A0" }}>No clients found</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {/* Notification Bell Button — hidden on the service-setup page */}
            {currentView !== "create-service" && (
            <div
              onClick={() => setCurrentView(currentView === "health" ? "dashboard" : "health")}
              title="System Health Alerts"
              style={{
                position: "relative",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: errors.length > 0 ? "none" : "1px solid #ECEEF2",
                background: errors.length > 0 ? "#FEE2E2" : "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 150ms ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = errors.length > 0 ? "#FCD5D5" : "#F4F5FF";
                if (errors.length === 0) e.currentTarget.style.borderColor = "#4F46FF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = errors.length > 0 ? "#FEE2E2" : "#FFFFFF";
                if (errors.length === 0) e.currentTarget.style.borderColor = "#ECEEF2";
              }}
            >
              {errors.length === 0 && (
                <span style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  display: "inline-flex",
                  borderRadius: "9999px",
                  height: "8px",
                  width: "8px",
                  background: "#1D9E75",
                  border: "1.5px solid #FFFFFF",
                  zIndex: 10
                }} />
              )}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={errors.length > 0 ? "#EF4444" : "#5A6072"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            )}

            {currentView !== "create-service" && (
              <button
                onClick={() => setShowOnboardModal(true)}
                style={{ background: "#4F46FF", color: "#FFFFFF", border: "none", borderRadius: "10px", padding: "9px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "background 150ms ease" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#3F37D9"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#4F46FF"}
              >
                Add Organization
              </button>
            )}
          </div>
        </div>

        {currentView === "dashboard" && (
          <>
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
              <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "16px 18px" }}>
                <div style={{ fontSize: "11px", color: "#8A90A0", display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Total active clients
                </div>
                <div style={{ fontSize: "26px", fontWeight: 600, color: "#1F2433" }}>6</div>
                <div style={{ fontSize: "11px", color: "#1D9E75", marginTop: "4px" }}>All accounts live</div>
              </div>

              <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "16px 18px" }}>
                <div style={{ fontSize: "11px", color: "#8A90A0", display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Calls placed today
                </div>
                <div style={{ fontSize: "26px", fontWeight: 600, color: "#1F2433" }}>1,240</div>
                <div style={{ fontSize: "11px", color: "#8A90A0", marginTop: "4px" }}>Across all clients</div>
              </div>

              <div style={{ background: "#FFFFFF", border: "2px solid #4F46FF", borderRadius: "12px", padding: "16px 18px" }}>
                <div style={{ fontSize: "11px", color: "#8A90A0", display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>
                  Meetings booked today
                </div>
                <div style={{ fontSize: "26px", fontWeight: 600, color: "#4F46FF" }}>128</div>
                <div style={{ fontSize: "11px", color: "#8A90A0", marginTop: "4px" }}>Primary success metric</div>
              </div>

              <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "16px 18px" }}>
                <div style={{ fontSize: "11px", color: "#8A90A0", display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  Connect rate
                </div>
                <div style={{ fontSize: "26px", fontWeight: 600, color: "#1F2433" }}>84%</div>
                <div style={{ fontSize: "11px", color: "#8A90A0", marginTop: "4px" }}>Human answered</div>
              </div>
            </div>

            {/* Bottom row — chart and form */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {/* Chart Card */}
              <div style={{ gridColumn: "span 2", background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px 24px", display: "flex", flexDirection: "column", position: "relative" }}>
                {(() => {
                  const scale = {
                    "7d": 12,
                    "14d": 25,
                    "30d": 50,
                    "3m": 150,
                    "6m": 350,
                    "12m": 800,
                    "all": 2500
                  }[timeframe] || 10;

                  const totalRevVal = TIMEFRAME_DATA[timeframe].revenue.reduce((acc, val) => acc + (150 - val) * scale, 0);
                  const formattedTotalRevenue = `$${totalRevVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                  const growthMapper = {
                    "7d": "+12.4%",
                    "14d": "+14.8%",
                    "30d": "+18.2%",
                    "3m": "+21.5%",
                    "6m": "+23.5%",
                    "12m": "+27.1%",
                    "all": "+34.6%"
                  };

                  const getTooltipValue = (val) => {
                    const dollar = (150 - val) * scale;
                    return `$${dollar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  };

                  const xCoords = [40, 123, 207, 290, 373, 457, 540];
                  
                  const getBezierPath = (data) => {
                    let path = `M ${xCoords[0]} ${data[0]}`;
                    for (let i = 0; i < data.length - 1; i++) {
                      const x0 = xCoords[i];
                      const y0 = data[i];
                      const x1 = xCoords[i + 1];
                      const y1 = data[i + 1];
                      const cpX1 = x0 + 28;
                      const cpY1 = y0;
                      const cpX2 = x1 - 28;
                      const cpY2 = y1;
                      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x1} ${y1}`;
                    }
                    return path;
                  };

                  const revenue = TIMEFRAME_DATA[timeframe].revenue;
                  const cost = TIMEFRAME_DATA[timeframe].cost;
                  const revFillPath = `${getBezierPath(revenue)} L 540,140 L 40,140 Z`;

                  return (
                    <>
                      {/* Card Header Row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#1F2433" }}>Overall Sales</span>
                        
                        {/* Timeframe selector button */}
                        <TimeframeDropdown value={timeframe} onChange={setTimeframe} open={showTimeframeDropdown} setOpen={setShowTimeframeDropdown} triggerRef={timeframeRef} />
                      </div>

                      {/* Stats & Legend Row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "22px", fontWeight: 700, color: "#1F2433", fontFamily: "inherit" }}>
                            {formattedTotalRevenue}
                          </span>
                          {/* Growth badge */}
                          <span style={{
                            background: "#F4F5FF",
                            color: "#4F46FF",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "9999px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px"
                          }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="7" y1="17" x2="17" y2="7" />
                              <polyline points="7 7 17 7 17 17" />
                            </svg>
                            {growthMapper[timeframe]}
                          </span>
                        </div>

                        {/* Legends */}
                        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#8A90A0", fontWeight: 500 }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4F46FF", display: "inline-block" }}></span>Revenue
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#8A90A0", fontWeight: 500 }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#A8AEBC", display: "inline-block" }}></span>Cost
                          </span>
                        </div>
                      </div>

                      {/* Chart Plot Area */}
                      <div style={{ position: "relative", width: "100%", height: "220px" }}>
                        <svg viewBox="0 0 540 150" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4F46FF" />
                              <stop offset="100%" stopColor="#4F46FF" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="activeColGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4F46FF" />
                              <stop offset="100%" stopColor="#4F46FF" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          {[20, 50, 80, 110, 140].map((y) => (
                            <line key={y} x1="40" y1={y} x2="540" y2={y} stroke="#F0F1F4" strokeWidth="1" />
                          ))}

                          {/* Y-Axis Labels */}
                          {[
                            { y: 20, lbl: "100k" },
                            { y: 50, lbl: "75k" },
                            { y: 80, lbl: "50k" },
                            { y: 110, lbl: "25k" },
                            { y: 140, lbl: "0" }
                          ].map((axis) => (
                            <text
                              key={axis.y}
                              x="10"
                              y={axis.y + 3}
                              fill="#8A90A0"
                              fontSize="8"
                              fontWeight="600"
                              style={{ fontFamily: "inherit" }}
                            >
                              {axis.lbl}
                            </text>
                          ))}

                          {/* Background capsule bars */}
                          {xCoords.map((x, idx) => (
                            <rect
                              key={`bg-cap-${idx}`}
                              x={x - 18}
                              y="15"
                              width="36"
                              height="130"
                              rx="18"
                              fill={hoveredIdx === idx ? "url(#activeColGrad)" : "#F1F5F9"}
                              opacity={hoveredIdx === idx ? "0.12" : "0.02"}
                              style={{ transition: "all 150ms ease" }}
                            />
                          ))}

                          {/* Dotted indicator line on active column */}
                          {hoveredIdx !== null && (
                            <line
                              x1={xCoords[hoveredIdx]}
                              y1="20"
                              x2={xCoords[hoveredIdx]}
                              y2="140"
                              stroke="#4F46FF"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                          )}

                          {/* Paths */}
                          <polygon
                            points={revFillPath}
                            fill="url(#revGrad)"
                            opacity="0.1"
                          />
                          <path
                            d={getBezierPath(revenue)}
                            fill="none"
                            stroke="#4F46FF"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d={getBezierPath(cost)}
                            fill="none"
                            stroke="#A8AEBC"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Invisible hover rectangles */}
                          {xCoords.map((x, idx) => (
                            <rect
                              key={`hover-trigger-${idx}`}
                              x={x - 41}
                              y="0"
                              width="82"
                              height="150"
                              fill="transparent"
                              cursor="pointer"
                              onMouseEnter={() => setHoveredIdx(idx)}
                            />
                          ))}
                        </svg>

                        {/* Active Dot Indicators (HTML to prevent stretching) */}
                        {hoveredIdx !== null && (
                          <>
                            <div
                              style={{
                                position: "absolute",
                                left: `${(xCoords[hoveredIdx] / 540) * 100}%`,
                                top: `${(revenue[hoveredIdx] / 150) * 100}%`,
                                transform: "translate(-50%, -50%)",
                                width: "11px",
                                height: "11px",
                                borderRadius: "50%",
                                backgroundColor: "#FFFFFF",
                                border: "2.5px solid #4F46FF",
                                pointerEvents: "none",
                                zIndex: 10
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                left: `${(xCoords[hoveredIdx] / 540) * 100}%`,
                                top: `${(cost[hoveredIdx] / 150) * 100}%`,
                                transform: "translate(-50%, -50%)",
                                width: "11px",
                                height: "11px",
                                borderRadius: "50%",
                                backgroundColor: "#FFFFFF",
                                border: "2.5px solid #A8AEBC",
                                pointerEvents: "none",
                                zIndex: 10
                              }}
                            />
                          </>
                        )}

                        {/* Hover Tooltip Overlay */}
                        {hoveredIdx !== null && (
                          <div
                            style={{
                              position: "absolute",
                              left: `${((xCoords[hoveredIdx] / 540) * 100)}%`,
                              top: `${(revenue[hoveredIdx] / 150) * 100 - 24}%`,
                              transform: "translate(-50%, -100%)",
                              background: "#FFFFFF",
                              border: "1px solid #ECEEF2",
                              borderRadius: "8px",
                              boxShadow: "0 6px 16px rgba(31,36,51,0.06)",
                              padding: "6px 10px",
                              zIndex: 20,
                              pointerEvents: "none",
                              transition: "left 150ms ease, top 150ms ease",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center"
                            }}
                          >
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#1F2433" }}>
                              {getTooltipValue(revenue[hoveredIdx])}
                            </span>
                            <span style={{ fontSize: "8px", color: "#8A90A0", marginTop: "1px", fontWeight: 500 }}>
                              Net sales
                            </span>
                            <div style={{
                              position: "absolute",
                              bottom: "-4px",
                              left: "50%",
                              transform: "translateX(-50%) rotate(45deg)",
                              width: "8px",
                              height: "8px",
                              background: "#FFFFFF",
                              borderRight: "1px solid #ECEEF2",
                              borderBottom: "1px solid #ECEEF2"
                            }} />
                          </div>
                        )}
                      </div>

                      {/* X-Axis labels */}
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", paddingLeft: "36px", paddingRight: "0px" }}>
                        {TIMEFRAME_DATA[timeframe].labels.map((lbl, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: "10px",
                              color: hoveredIdx === idx ? "#1F2433" : "#8A90A0",
                              fontWeight: hoveredIdx === idx ? 600 : 500,
                              width: "36px",
                              textAlign: "center",
                              transition: "all 150ms ease"
                            }}
                          >
                            {lbl}
                          </span>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Form Card */}
              <div style={{ gridColumn: "span 2", background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1F2433", marginBottom: "2px" }}>Log Client Payment</div>
                  <div style={{ fontSize: "11px", color: "#8A90A0", marginBottom: "16px" }}>Record manual bank transfer logs</div>

                  <form onSubmit={handleLogPayment} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", position: "relative" }} ref={paymentClientRef}>
                        <label style={{ fontSize: "10px", fontWeight: 600, color: "#5A6072" }}>Client</label>
                        <div
                          onClick={() => setPaymentClientOpen(!paymentClientOpen)}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            fontSize: "12px",
                            border: paymentClientOpen ? "1px solid #4F46FF" : "1px solid #ECEEF2",
                            borderRadius: "8px",
                            background: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            userSelect: "none",
                            minHeight: "33px",
                            boxSizing: "border-box"
                          }}
                        >
                          <span style={{ color: paymentClient ? "#1F2433" : "#8A90A0" }}>
                            {paymentClient ? CLIENTS.find(c => c.id === paymentClient)?.name : "Select client"}
                          </span>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#8A90A0"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transform: paymentClientOpen ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 200ms ease"
                            }}
                          >
                            <path d="m6 9 6 6 6-6"/>
                          </svg>
                        </div>

                        {paymentClientOpen && (
                          <div style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            marginTop: "4px",
                            background: "#FFFFFF",
                            border: "1px solid #ECEEF2",
                            borderRadius: "8px",
                            boxShadow: "0 8px 24px rgba(31,36,51,0.08)",
                            zIndex: 100,
                            padding: "6px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px"
                          }}>
                            {/* Search Input inside popover */}
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              background: "#F7F8FA",
                              border: "1px solid #E2E5EA",
                              borderRadius: "6px",
                              padding: "6px 8px"
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                              <input
                                type="text"
                                placeholder="Search client..."
                                value={paymentClientSearch}
                                onChange={(e) => setPaymentClientSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()} // Prevent clicking search input from closing popover
                                style={{
                                  border: "none",
                                  background: "none",
                                  outline: "none",
                                  fontSize: "11px",
                                  color: "#1F2433",
                                  width: "100%",
                                  fontFamily: "inherit"
                                }}
                              />
                            </div>

                            {/* List */}
                            <div style={{
                              maxHeight: "150px",
                              overflowY: "auto",
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px"
                            }}>
                              {clients.filter(c => c.name.toLowerCase().includes(paymentClientSearch.toLowerCase())).length > 0 ? (
                                clients.filter(c => c.name.toLowerCase().includes(paymentClientSearch.toLowerCase())).map((c) => (
                                  <div
                                    key={c.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPaymentClient(c.id);
                                      setPaymentClientOpen(false);
                                      setPaymentClientSearch("");
                                    }}
                                    style={{
                                      padding: "6px 8px",
                                      fontSize: "12px",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      color: paymentClient === c.id ? "#4F46FF" : "#5A6072",
                                      backgroundColor: paymentClient === c.id ? "#F4F5FF" : "transparent",
                                      fontWeight: paymentClient === c.id ? 600 : 500,
                                      transition: "all 150ms ease"
                                    }}
                                    onMouseEnter={(e) => {
                                      if (paymentClient !== c.id) e.currentTarget.style.backgroundColor = "#F7F8FA";
                                    }}
                                    onMouseLeave={(e) => {
                                      if (paymentClient !== c.id) e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                  >
                                    {c.name}
                                  </div>
                                ))
                              ) : (
                                <div style={{ padding: "8px", fontSize: "11px", color: "#8A90A0", textAlign: "center" }}>
                                  No clients found
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "10px", fontWeight: 600, color: "#5A6072" }}>Amount ($)</label>
                        <input
                          type="number"
                          placeholder="e.g. 1500"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            fontSize: "12px",
                            border: "1px solid #ECEEF2",
                            borderRadius: "8px",
                            outline: "none",
                            color: "#1F2433",
                            fontFamily: "inherit",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "10px", fontWeight: 600, color: "#5A6072" }}>Payment Status</label>
                        <select
                          value={paymentStatus}
                          onChange={(e) => setPaymentStatus(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            fontSize: "12px",
                            border: "1px solid #ECEEF2",
                            borderRadius: "8px",
                            background: "#FFFFFF",
                            outline: "none",
                            color: "#1F2433",
                            fontFamily: "inherit",
                          }}
                        >
                          <option value="full">Full Paid</option>
                          <option value="partial">Partial Paid</option>
                          <option value="unpaid">Unpaid</option>
                        </select>
                      </div>

                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "10px", fontWeight: 600, color: "#5A6072" }}>Payment Date</label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "7px 10px",
                            fontSize: "12px",
                            border: "1px solid #ECEEF2",
                            borderRadius: "8px",
                            outline: "none",
                            color: "#1F2433",
                            fontFamily: "inherit",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "10px", fontWeight: 600, color: "#5A6072" }}>Remark Comment</label>
                      <input
                        type="text"
                        placeholder="Reference details or comments..."
                        value={paymentRemark}
                        onChange={(e) => setPaymentRemark(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          fontSize: "12px",
                          border: "1px solid #ECEEF2",
                          borderRadius: "8px",
                          outline: "none",
                          color: "#1F2433",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>

                    {/* Submit Button & Success Message */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px" }}>
                      <div style={{ minHeight: "20px" }}>
                        {successMessage && (
                          <span style={{ fontSize: "12px", color: "#1D9E75", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            {successMessage}
                          </span>
                        )}
                      </div>
                      <button
                        type="submit"
                        style={{
                          background: "#4F46FF",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "10px",
                          padding: "9px 18px",
                          fontSize: "12px",
                          fontWeight: 500,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "background 150ms ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#3F37D9"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#4F46FF"}
                      >
                        Log Payment
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Client Directory Card */}
            <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px 24px", marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1F2433" }}>Client Directory</div>
                  <div style={{ fontSize: "11px", color: "#8A90A0" }}>Overview of client integrations, active leads, health status, and monthly billing</div>
                </div>

                {/* Filtration Tabs */}
                <div style={{ display: "flex", background: "#F7F8FA", padding: "3px", borderRadius: "8px", border: "1px solid #ECEEF2" }}>
                  {[
                    { id: "recent", label: "Recent Onboarded" },
                    { id: "top", label: "Top Performing" },
                    { id: "bottom", label: "Least Performing" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setClientFilter(tab.id)}
                      style={{
                        padding: "5px 12px",
                        fontSize: "11px",
                        fontWeight: 600,
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        background: clientFilter === tab.id ? "#FFFFFF" : "transparent",
                        color: clientFilter === tab.id ? "#4F46FF" : "#5A6072",
                        boxShadow: clientFilter === tab.id ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                        transition: "all 150ms ease",
                        fontFamily: "inherit"
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", tableLayout: "fixed" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #ECEEF2" }}>
                      <th style={{ width: "23%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Client Name</th>
                      <th style={{ width: "13%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Account ID</th>
                      <th style={{ width: "15%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Lead Scrubbing</th>
                      <th style={{ width: "24%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Active Services</th>
                      <th style={{ width: "12%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Health Status</th>
                      <th style={{ width: "13%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Monthly Retainer</th>
                      <th style={{ width: "10%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const allClients = clients;

                      // Sort based on selected filter
                      let sortedClients = [...allClients];
                      if (clientFilter === "recent") {
                        sortedClients.sort((a, b) => new Date(b.onboarded) - new Date(a.onboarded));
                      } else if (clientFilter === "top") {
                        sortedClients.sort((a, b) => b.score - a.score);
                      } else if (clientFilter === "bottom") {
                        sortedClients.sort((a, b) => a.score - b.score);
                      }

                      // Take top 5
                      const displayClients = sortedClients.slice(0, 5);

                      return displayClients.map((client) => (
                        <tr
                          key={client.id}
                          onClick={() => { setOnboardedClient(client); setConfiguringService(null); setCurrentView("create-service"); }}
                          title="Open service setup"
                          style={{
                            borderBottom: "1px solid #F0F1F4",
                            transition: "background-color 150ms ease",
                            cursor: "pointer"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9FAFB"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          {/* Client Name with Avatar */}
                          <ClientIdentityCell client={client} />

                          {/* Account ID */}
                          <td style={{ padding: "12px 10px", fontSize: "11px", color: "#5A6072", fontFamily: "monospace" }}>
                            {client.id}
                          </td>

                          {/* Leads */}
                          <td style={{ padding: "12px 10px", fontSize: "11px", color: client.leads.includes("0") || client.leads.includes("Paused") ? "#EF4444" : "#1F2433", fontWeight: 500 }}>
                            {client.leads}
                          </td>

                          {/* Services with Hover Tooltip */}
                          <td style={{ padding: "12px 10px", position: "relative" }}>
                            <div
                              onMouseEnter={() => setHoveredServiceClientId(client.id)}
                              onMouseLeave={() => setHoveredServiceClientId(null)}
                              style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center", cursor: "help" }}
                            >
                              {client.services.slice(0, 2).map(s => (
                                <span
                                  key={s}
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 600,
                                    color: "#4F46FF",
                                    background: "#F4F5FF",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  {s}
                                </span>
                              ))}
                              {client.services.length > 2 && (
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 600,
                                    color: "#4F46FF",
                                    background: "#E0E7FF",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  +{client.services.length - 2} more
                                </span>
                              )}

                              {/* Hover Tooltip Card */}
                              {hoveredServiceClientId === client.id && (
                                <div style={{
                                  position: "absolute",
                                  bottom: "calc(100% + 8px)",
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  background: "#FFFFFF",
                                  border: "1px solid #ECEEF2",
                                  borderRadius: "10px",
                                  boxShadow: "0 10px 30px rgba(31,36,51,0.08)",
                                  padding: "12px 14px",
                                  zIndex: 150,
                                  width: "280px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px",
                                  pointerEvents: "none"
                                }}>
                                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#1F2433", borderBottom: "1px solid #F1F5F9", paddingBottom: "4px", textAlign: "left" }}>
                                    Active Service Sub-Options
                                  </div>
                                  {client.services.map(service => (
                                    <div key={service} style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
                                      <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#4F46FF" }}>{service}</span>
                                      <div style={{ display: "flex", flexDirection: "column", paddingLeft: "6px" }}>
                                        {(SERVICE_SUB_OPTIONS[service] || []).map(sub => (
                                          <span key={sub} style={{ fontSize: "9px", color: "#5A6072", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#8A90A0" }} />
                                            {sub}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                  {/* Caret */}
                                  <div style={{
                                    position: "absolute",
                                    bottom: "-5px",
                                    left: "50%",
                                    transform: "translateX(-50%) rotate(45deg)",
                                    width: "8px",
                                    height: "8px",
                                    background: "#FFFFFF",
                                    borderRight: "1px solid #ECEEF2",
                                    borderBottom: "1px solid #ECEEF2"
                                  }} />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Health Status */}
                          <td style={{ padding: "12px 10px" }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "10px",
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: "9999px",
                              background: client.health === "Operational" ? "#ECFDF5" : client.health === "Paused" ? "#FEF3C7" : "#FEF2F2",
                              color: client.health === "Operational" ? "#10B981" : client.health === "Paused" ? "#D97706" : "#EF4444"
                            }}>
                              <span style={{
                                width: "5px",
                                height: "5px",
                                borderRadius: "50%",
                                background: client.health === "Operational" ? "#10B981" : client.health === "Paused" ? "#F59E0B" : "#EF4444"
                              }} />
                              {client.health}
                            </span>
                          </td>

                          {/* Retainer */}
                          <td style={{ padding: "12px 10px", fontSize: "11px", fontWeight: 600, color: "#1F2433" }}>
                            {client.retainer}
                          </td>

                          {/* Payment Status */}
                          <td style={{ padding: "12px 10px" }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              fontSize: "10px",
                              fontWeight: 600,
                              color: client.payment === "Paid" ? "#1D9E75" : "#D97706"
                            }}>
                              {client.payment}
                            </span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        
        {currentView === "health" && (
          /* System Health View */
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Incident Alert Banner */}
            {errors.length > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "12px", padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "9999px", background: "#FEE2E2", color: "#EF4444", flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#991B1B" }}>System requires attention</div>
                  <div style={{ fontSize: "12px", color: "#B91C1C", marginTop: "2px" }}>
                    There are {errors.length} active operational errors impacting client services.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "12px", padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "9999px", background: "#D1FAE5", color: "#10B981", flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#065F46" }}>All systems fully operational</div>
                  <div style={{ fontSize: "12px", color: "#047857", marginTop: "2px" }}>
                    All client campaigns, scrapers, and communication integrations are healthy.
                  </div>
                </div>
              </div>
            )}

            {/* Infrastructure Services Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {[
                { name: "Vapi Telephony API", desc: "Outbound & Inbound calls", status: "Healthy" },
                { name: "Apify Scrapers", desc: "B2B lead generation", status: errors.some(e => e.tool === "Lead Queue") ? "Degraded" : "Healthy" },
                { name: "Tavily Research API", desc: "Website data extraction", status: "Healthy" },
                { name: "OpenRouter LLM API", desc: "Lead scoring & profiles", status: errors.some(e => e.tool === "Vapi API") ? "Degraded" : "Healthy" }
              ].map((service) => (
                <div key={service.name} style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "16px 18px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#1F2433" }}>{service.name}</div>
                  <div style={{ fontSize: "11px", color: "#8A90A0", marginTop: "2px" }}>{service.desc}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px" }}>
                    <span style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "9999px",
                      backgroundColor: service.status === "Healthy" ? "#10B981" : "#F59E0B"
                    }} />
                    <span style={{ fontSize: "12px", fontWeight: 500, color: service.status === "Healthy" ? "#10B981" : "#D97706" }}>
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Errors & Terminal Logs Layout */}
            <div style={{ display: "grid", gridTemplateColumns: "span 2 / 2fr 1.2fr", gap: "12px" }}>
              
              {/* Errors List */}
              <div style={{ gridColumn: "span 2", background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px 24px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1F2433", marginBottom: "16px" }}>Active Service Errors ({errors.length})</div>
                
                {errors.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {errors.map((err) => (
                      <div key={err.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", padding: "14px 16px", border: "1px solid #FEE2E2", background: "#FFFDFD", borderRadius: "10px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#1F2433" }}>{err.client}</span>
                            <span style={{ fontSize: "10px", fontWeight: 500, color: "#EF4444", background: "#FEE2E2", padding: "2px 6px", borderRadius: "4px" }}>{err.tool}</span>
                            <span style={{ fontSize: "10px", color: "#A0A6B4" }}>{err.time}</span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#5A6072" }}>{err.message}</div>
                        </div>
                        <button
                          onClick={() => resolveError(err.id)}
                          disabled={resolvingId === err.id}
                          style={{
                            flexShrink: 0,
                            padding: "6px 12px",
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "#FFFFFF",
                            background: resolvingId === err.id ? "#8A90A0" : "#4F46FF",
                            border: "none",
                            borderRadius: "6px",
                            cursor: resolvingId === err.id ? "not-allowed" : "pointer",
                            transition: "background 150ms ease"
                          }}
                        >
                          {resolvingId === err.id ? "Resolving..." : err.actionLabel}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "150px", color: "#8A90A0" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#10B981", marginBottom: "8px" }}>
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>No active errors reported. All client workflows healthy.</span>
                  </div>
                )}
              </div>

              {/* Terminal Logs */}
              <div style={{ gridColumn: "span 2", background: "#1E293B", borderRadius: "12px", padding: "20px 24px", color: "#E2E8F0", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#94A3B8" }}>Real-time System Logs</div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EF4444" }}></span>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B" }}></span>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981" }}></span>
                  </div>
                </div>
                <div style={{ flex: 1, fontFamily: "monospace", fontSize: "11px", overflowY: "auto", maxHeight: "150px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {terminalLogs.map((log, idx) => (
                    <div key={idx} style={{
                      color: log.includes("WARNING") ? "#F59E0B" : log.includes("SUCCESS") ? "#10B981" : "#94A3B8"
                    }}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          </div>
        )}

        {currentView === "revenue" && (
          /* Revenue & Payments Performance & Ledger View */
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Chart Card */}
            <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px 24px", display: "flex", flexDirection: "column", position: "relative" }}>
              {(() => {
                const scale = {
                  "7d": 12,
                  "14d": 25,
                  "30d": 50,
                  "3m": 150,
                  "6m": 350,
                  "12m": 800,
                  "all": 2500
                }[revenueTimeframe] || 10;

                const totalRevVal = TIMEFRAME_DATA[revenueTimeframe].revenue.reduce((acc, val) => acc + (150 - val) * scale, 0);
                const formattedTotalRevenue = `$${totalRevVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                const growthMapper = {
                  "7d": "+12.4%",
                  "14d": "+14.8%",
                  "30d": "+18.2%",
                  "3m": "+21.5%",
                  "6m": "+23.5%",
                  "12m": "+27.1%",
                  "all": "+34.6%"
                };

                const getTooltipValue = (val) => {
                  const dollar = (150 - val) * scale;
                  return `$${dollar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                };

                const xCoords = [10, 173.3, 336.7, 500, 663.3, 826.7, 990];
                
                const getBezierPath = (data) => {
                  let path = `M ${xCoords[0]} ${data[0]}`;
                  for (let i = 0; i < data.length - 1; i++) {
                    const x0 = xCoords[i];
                    const y0 = data[i];
                    const x1 = xCoords[i + 1];
                    const y1 = data[i + 1];
                    const cpX1 = x0 + 54;
                    const cpY1 = y0;
                    const cpX2 = x1 - 54;
                    const cpY2 = y1;
                    path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x1} ${y1}`;
                  }
                  return path;
                };

                const revenue = TIMEFRAME_DATA[revenueTimeframe].revenue;
                const cost = TIMEFRAME_DATA[revenueTimeframe].cost;
                const revFillPath = `${getBezierPath(revenue)} L 990,140 L 10,140 Z`;

                return (
                  <>
                    {/* Card Header Row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#1F2433" }}>Revenue & Cost Performance</span>
                      
                      {/* Timeframe selector button */}
                      <TimeframeDropdown value={revenueTimeframe} onChange={setRevenueTimeframe} open={showRevenueTimeframeDropdown} setOpen={setShowRevenueTimeframeDropdown} triggerRef={revenueTimeframeRef} />
                    </div>

                    {/* Stats & Revenue numbers */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "28px", fontWeight: 700, color: "#1F2433", letterSpacing: "-0.02em" }}>
                        {formattedTotalRevenue}
                      </span>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#4F46FF",
                        background: "#F4F5FF",
                        padding: "2px 8px",
                        borderRadius: "9999px"
                      }}>
                        {growthMapper[revenueTimeframe]} growth
                      </span>
                    </div>

                    {/* HTML Chart Layout Wrapper */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                      <div style={{ display: "flex", position: "relative", height: "150px", width: "100%" }}>
                        {/* Y Axis Labels (HTML) */}
                        <div style={{ position: "relative", width: "35px", height: "150px" }}>
                          <div style={{ position: "absolute", top: "13.3%", transform: "translateY(-50%)", right: "8px", fontSize: "9px", color: "#A3AED0", fontWeight: "500" }}>100k</div>
                          <div style={{ position: "absolute", top: "33.3%", transform: "translateY(-50%)", right: "8px", fontSize: "9px", color: "#A3AED0", fontWeight: "500" }}>75k</div>
                          <div style={{ position: "absolute", top: "53.3%", transform: "translateY(-50%)", right: "8px", fontSize: "9px", color: "#A3AED0", fontWeight: "500" }}>50k</div>
                          <div style={{ position: "absolute", top: "73.3%", transform: "translateY(-50%)", right: "8px", fontSize: "9px", color: "#A3AED0", fontWeight: "500" }}>25k</div>
                          <div style={{ position: "absolute", top: "93.3%", transform: "translateY(-50%)", right: "8px", fontSize: "9px", color: "#A3AED0", fontWeight: "500" }}>0</div>
                        </div>

                        {/* SVG Chart Container */}
                        <div style={{ flex: 1, position: "relative", height: "150px" }}>
                          <svg
                            viewBox="0 0 1000 150"
                            preserveAspectRatio="none"
                            style={{ width: "100%", height: "150px", overflow: "visible" }}
                          >
                            {/* Horizontal Grid Lines */}
                            <line x1="10" y1="20" x2="990" y2="20" stroke="#F1F3F6" strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="10" y1="50" x2="990" y2="50" stroke="#F1F3F6" strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="10" y1="80" x2="990" y2="80" stroke="#F1F3F6" strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="10" y1="110" x2="990" y2="110" stroke="#F1F3F6" strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="10" y1="140" x2="990" y2="140" stroke="#E2E8F0" strokeWidth="1" />

                            {/* Defs for gradients */}
                            <defs>
                              <linearGradient id="revenueGradRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4F46FF" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#4F46FF" stopOpacity="0.00" />
                              </linearGradient>
                            </defs>

                            {/* Fill path for area under revenue curve */}
                            <path d={revFillPath} fill="url(#revenueGradRev)" />

                            {/* Dashed vertical line for active column */}
                            {revenueHoveredIdx !== null && (
                              <line
                                x1={xCoords[revenueHoveredIdx]}
                                y1="20"
                                x2={xCoords[revenueHoveredIdx]}
                                y2="140"
                                stroke="#4F46FF"
                                strokeWidth="1.5"
                                strokeDasharray="4 4"
                              />
                            )}

                            {/* Cost Line (Reddish Orange) */}
                            <path
                              d={getBezierPath(cost)}
                              fill="none"
                              stroke="#F59E0B"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />

                            {/* Revenue Line (Indigo) */}
                            <path
                              d={getBezierPath(revenue)}
                              fill="none"
                              stroke="#4F46FF"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />

                            {/* Hover Overlay Columns */}
                            {xCoords.map((x, idx) => (
                              <rect
                                key={idx}
                                x={x - 81.6}
                                y="10"
                                width="163.3"
                                height="130"
                                fill="transparent"
                                style={{ cursor: "pointer" }}
                                onMouseEnter={() => setRevenueHoveredIdx(idx)}
                              />
                            ))}
                          </svg>

                          {/* Active Dots on Hover (HTML to avoid stretching) */}
                          {revenueHoveredIdx !== null && (
                            <>
                              <div
                                style={{
                                  position: "absolute",
                                  left: `${(xCoords[revenueHoveredIdx] / 1000) * 100}%`,
                                  top: `${(revenue[revenueHoveredIdx] / 150) * 100}%`,
                                  transform: "translate(-50%, -50%)",
                                  width: "14px",
                                  height: "14px",
                                  borderRadius: "50%",
                                  backgroundColor: "#4F46FF",
                                  border: "2px solid #FFFFFF",
                                  boxShadow: "0px 2px 4px rgba(79, 70, 255, 0.4)",
                                  pointerEvents: "none",
                                  zIndex: 5
                                }}
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  left: `${(xCoords[revenueHoveredIdx] / 1000) * 100}%`,
                                  top: `${(cost[revenueHoveredIdx] / 150) * 100}%`,
                                  transform: "translate(-50%, -50%)",
                                  width: "14px",
                                  height: "14px",
                                  borderRadius: "50%",
                                  backgroundColor: "#F59E0B",
                                  border: "2px solid #FFFFFF",
                                  boxShadow: "0px 2px 4px rgba(245, 158, 11, 0.4)",
                                  pointerEvents: "none",
                                  zIndex: 5
                                }}
                              />
                            </>
                          )}

                          {/* Tooltip Overlay */}
                          {revenueHoveredIdx !== null && (
                            <div
                              style={{
                                position: "absolute",
                                left: `${(xCoords[revenueHoveredIdx] / 1000) * 100}%`,
                                top: `${(revenue[revenueHoveredIdx] / 150) * 100 - 30}%`,
                                transform: "translateX(-50%)",
                                background: "#1E293B",
                                color: "#FFFFFF",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                zIndex: 10,
                                pointerEvents: "none"
                              }}
                            >
                              <div style={{ fontSize: "9px", color: "#94A3B8", fontWeight: 500 }}>Revenue</div>
                              {getTooltipValue(revenue[revenueHoveredIdx])}
                              {/* Tooltip Arrow */}
                              <div style={{
                                position: "absolute",
                                bottom: "-4px",
                                left: "50%",
                                transform: "translateX(-50%) rotate(45deg)",
                                width: "8px",
                                height: "8px",
                                background: "#1E293B"
                              }} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* X Axis Labels (HTML) */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingLeft: "calc(35px + 1%)",
                        paddingRight: "1%",
                        fontSize: "9px",
                        color: "#A3AED0",
                        fontWeight: "500",
                        marginTop: "6px"
                      }}>
                        {TIMEFRAME_DATA[revenueTimeframe].labels.map((lbl, idx) => (
                          <span
                            key={lbl}
                            style={{
                              width: "50px",
                              textAlign: "center",
                              marginLeft: idx === 0 ? "-25px" : "0px",
                              marginRight: idx === 6 ? "-25px" : "0px",
                              color: revenueHoveredIdx === idx ? "#1F2433" : "#A3AED0",
                              fontWeight: revenueHoveredIdx === idx ? "600" : "500",
                              transition: "color 150ms ease"
                            }}
                          >
                            {lbl}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Payment Logs Ledger Card */}
            <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px 24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1F2433" }}>Payment Ledger</div>
                <div style={{ fontSize: "11px", color: "#8A90A0" }}>Detailed logs of client retainers, transaction status, and comments. Click Edit to mark unpaid accounts as paid.</div>
              </div>

              <div style={{ overflowX: "auto", minHeight: "280px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", tableLayout: "fixed" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #ECEEF2" }}>
                      
                      {/* Client Name Column */}
                      <th style={{ position: "relative", width: "25%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          Client Name
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterColumn(activeFilterColumn === "client" ? null : "client");
                            }}
                            style={{
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              padding: "2px",
                              display: "flex",
                              alignItems: "center",
                              color: Object.values(selectedFilters.client || {}).includes(false) ? "#4F46FF" : "#8A90A0",
                              transition: "color 150ms ease"
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                          </button>
                        </div>
                        {activeFilterColumn === "client" && renderFilterDropdown("client")}
                      </th>

                      {/* Amount Column */}
                      <th style={{ position: "relative", width: "15%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          Amount
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterColumn(activeFilterColumn === "amount" ? null : "amount");
                            }}
                            style={{
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              padding: "2px",
                              display: "flex",
                              alignItems: "center",
                              color: Object.values(selectedFilters.amount || {}).includes(false) ? "#4F46FF" : "#8A90A0",
                              transition: "color 150ms ease"
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                          </button>
                        </div>
                        {activeFilterColumn === "amount" && renderFilterDropdown("amount")}
                      </th>

                      {/* Status Column */}
                      <th style={{ position: "relative", width: "18%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          Status
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterColumn(activeFilterColumn === "status" ? null : "status");
                            }}
                            style={{
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              padding: "2px",
                              display: "flex",
                              alignItems: "center",
                              color: Object.values(selectedFilters.status || {}).includes(false) ? "#4F46FF" : "#8A90A0",
                              transition: "color 150ms ease"
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                          </button>
                        </div>
                        {activeFilterColumn === "status" && renderFilterDropdown("status")}
                      </th>

                      {/* Payment Date Column */}
                      <th style={{ position: "relative", width: "15%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          Payment Date
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterColumn(activeFilterColumn === "date" ? null : "date");
                            }}
                            style={{
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              padding: "2px",
                              display: "flex",
                              alignItems: "center",
                              color: Object.values(selectedFilters.date || {}).includes(false) ? "#4F46FF" : "#8A90A0",
                              transition: "color 150ms ease"
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                          </button>
                        </div>
                        {activeFilterColumn === "date" && renderFilterDropdown("date")}
                      </th>

                      {/* Remark Column */}
                      <th style={{ position: "relative", width: "20%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          Remark
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterColumn(activeFilterColumn === "remark" ? null : "remark");
                            }}
                            style={{
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              padding: "2px",
                              display: "flex",
                              alignItems: "center",
                              color: Object.values(selectedFilters.remark || {}).includes(false) ? "#4F46FF" : "#8A90A0",
                              transition: "color 150ms ease"
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                          </button>
                        </div>
                        {activeFilterColumn === "remark" && renderFilterDropdown("remark")}
                      </th>

                      <th style={{ width: "12%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentLogs.filter(isRowVisible).map((log) => {
                      const isEditing = editingPaymentId === log.id;

                      return (
                        <tr
                          key={log.id}
                          style={{
                            borderBottom: "1px solid #F0F1F4",
                            transition: "background-color 150ms ease"
                          }}
                          onMouseEnter={(e) => {
                            if (!isEditing) e.currentTarget.style.backgroundColor = "#F9FAFB";
                          }}
                          onMouseLeave={(e) => {
                            if (!isEditing) e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          {/* Client Name */}
                          <td style={{ padding: "12px 10px", fontSize: "12px", fontWeight: 600, color: "#1F2433" }}>
                            {log.client}
                          </td>

                          {/* Amount */}
                          <td style={{ padding: "12px 10px", fontSize: "12px", fontWeight: 600, color: "#1F2433" }}>
                            {isEditing ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <span style={{ fontSize: "11px", color: "#5A6072" }}>$</span>
                                <input
                                  type="number"
                                  value={editingAmount}
                                  onChange={(e) => setEditingAmount(e.target.value)}
                                  style={{
                                    width: "80px",
                                    padding: "4px 8px",
                                    fontSize: "11px",
                                    border: "1px solid #ECEEF2",
                                    borderRadius: "6px",
                                    outline: "none",
                                    color: "#1F2433",
                                    fontFamily: "inherit"
                                  }}
                                />
                              </div>
                            ) : (
                              `$${log.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            )}
                          </td>

                          {/* Status */}
                          <td style={{ padding: "12px 10px" }}>
                            {isEditing ? (
                              <select
                                value={editingStatus}
                                onChange={(e) => setEditingStatus(e.target.value)}
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "11px",
                                  border: "1px solid #ECEEF2",
                                  borderRadius: "6px",
                                  background: "#FFFFFF",
                                  outline: "none",
                                  color: "#1F2433",
                                  fontFamily: "inherit"
                                }}
                              >
                                <option value="Paid">Paid</option>
                                <option value="Partial">Partial</option>
                                <option value="Unpaid">Unpaid</option>
                              </select>
                            ) : (
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "10px",
                                fontWeight: 600,
                                padding: "2px 8px",
                                borderRadius: "9999px",
                                background: log.status === "Paid" ? "#ECFDF5" : log.status === "Partial" ? "#FEF3C7" : "#FEF2F2",
                                color: log.status === "Paid" ? "#10B981" : log.status === "Partial" ? "#D97706" : "#EF4444"
                              }}>
                                <span style={{
                                  width: "5px",
                                  height: "5px",
                                  borderRadius: "50%",
                                  background: log.status === "Paid" ? "#10B981" : log.status === "Partial" ? "#F59E0B" : "#EF4444"
                                }} />
                                {log.status}
                              </span>
                            )}
                          </td>

                          {/* Payment Date */}
                          <td style={{ padding: "12px 10px", fontSize: "11px", color: "#5A6072" }}>
                            {log.date}
                          </td>

                          {/* Remark */}
                          <td style={{ padding: "12px 10px", fontSize: "11px", color: "#5A6072", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingRemark}
                                onChange={(e) => setEditingRemark(e.target.value)}
                                style={{
                                  width: "90%",
                                  padding: "4px 8px",
                                  fontSize: "11px",
                                  border: "1px solid #ECEEF2",
                                  borderRadius: "6px",
                                  outline: "none",
                                  color: "#1F2433",
                                  fontFamily: "inherit"
                                }}
                              />
                            ) : (
                              log.remark
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: "12px 10px" }}>
                            {isEditing ? (
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  onClick={() => {
                                    setPaymentLogs(prev => prev.map(p => p.id === log.id ? {
                                      ...p,
                                      amount: parseFloat(editingAmount) || 0,
                                      status: editingStatus,
                                      remark: editingRemark || "-"
                                    } : p));
                                    setEditingPaymentId(null);
                                  }}
                                  style={{
                                    border: "none",
                                    background: "none",
                                    color: "#10B981",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    padding: 0
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingPaymentId(null)}
                                  style={{
                                    border: "none",
                                    background: "none",
                                    color: "#8A90A0",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    padding: 0
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingPaymentId(log.id);
                                  setEditingStatus(log.status);
                                  setEditingAmount(log.amount.toString());
                                  setEditingRemark(log.remark);
                                }}
                                style={{
                                  border: "none",
                                  background: "none",
                                  color: "#4F46FF",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  padding: 0
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {currentView === "directory" && (
          /* Full Screen Client Directory View */
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Search Bar at the Top */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "10px", padding: "10px 16px", width: "100%", maxWidth: "480px", boxSizing: "border-box" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                placeholder="Search clients by name, ID, or active services..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: "13px",
                  color: "#1F2433",
                  width: "100%",
                  fontFamily: "inherit"
                }}
              />
            </div>

            {/* Client Directory Table */}
            <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1F2433" }}>All Registered Clients</div>
                  <div style={{ fontSize: "11px", color: "#8A90A0" }}>Complete directory listing of client onboarding status, billing, and active presets</div>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", tableLayout: "fixed" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #ECEEF2" }}>
                      <th style={{ width: "23%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Client Name</th>
                      <th style={{ width: "13%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Account ID</th>
                      <th style={{ width: "15%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Lead Scrubbing</th>
                      <th style={{ width: "24%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Active Services</th>
                      <th style={{ width: "12%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Health Status</th>
                      <th style={{ width: "13%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Monthly Retainer</th>
                      <th style={{ width: "10%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const allClients = clients;

                      // Search filter logic
                      const queryClean = directorySearch.trim().toLowerCase();
                      const filteredClients = queryClean
                        ? allClients.filter(c =>
                            c.name.toLowerCase().includes(queryClean) ||
                            c.id.toLowerCase().includes(queryClean) ||
                            c.services.some(s => s.toLowerCase().includes(queryClean))
                          )
                        : allClients;

                      return filteredClients.map((client) => (
                        <tr
                          key={client.id}
                          onClick={() => { setOnboardedClient(client); setConfiguringService(null); setCurrentView("create-service"); }}
                          title="Open service setup"
                          style={{
                            borderBottom: "1px solid #F0F1F4",
                            transition: "background-color 150ms ease",
                            cursor: "pointer"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9FAFB"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          {/* Client Name with Avatar */}
                          <ClientIdentityCell client={client} />

                          {/* Account ID */}
                          <td style={{ padding: "12px 10px", fontSize: "11px", color: "#5A6072", fontFamily: "monospace" }}>
                            {client.id}
                          </td>

                          {/* Leads */}
                          <td style={{ padding: "12px 10px", fontSize: "11px", color: client.leads.includes("0") || client.leads.includes("Paused") ? "#EF4444" : "#1F2433", fontWeight: 500 }}>
                            {client.leads}
                          </td>

                          {/* Services with Hover Tooltip */}
                          <td style={{ padding: "12px 10px", position: "relative" }}>
                            <div
                              onMouseEnter={() => setHoveredServiceClientId(`full_${client.id}`)}
                              onMouseLeave={() => setHoveredServiceClientId(null)}
                              style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center", cursor: "help" }}
                            >
                              {client.services.slice(0, 2).map(s => (
                                <span
                                  key={s}
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 600,
                                    color: "#4F46FF",
                                    background: "#F4F5FF",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  {s}
                                </span>
                              ))}
                              {client.services.length > 2 && (
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 600,
                                    color: "#4F46FF",
                                    background: "#E0E7FF",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  +{client.services.length - 2} more
                                </span>
                              )}

                              {/* Hover Tooltip Card */}
                              {hoveredServiceClientId === `full_${client.id}` && (
                                <div style={{
                                  position: "absolute",
                                  bottom: "calc(100% + 8px)",
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  background: "#FFFFFF",
                                  border: "1px solid #ECEEF2",
                                  borderRadius: "10px",
                                  boxShadow: "0 10px 30px rgba(31,36,51,0.08)",
                                  padding: "12px 14px",
                                  zIndex: 150,
                                  width: "280px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px",
                                  pointerEvents: "none"
                                }}>
                                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#1F2433", borderBottom: "1px solid #F1F5F9", paddingBottom: "4px", textAlign: "left" }}>
                                    Active Service Sub-Options
                                  </div>
                                  {client.services.map(service => (
                                    <div key={service} style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
                                      <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#4F46FF" }}>{service}</span>
                                      <div style={{ display: "flex", flexDirection: "column", paddingLeft: "6px" }}>
                                        {(SERVICE_SUB_OPTIONS[service] || []).map(sub => (
                                          <span key={sub} style={{ fontSize: "9px", color: "#5A6072", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#8A90A0" }} />
                                            {sub}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                  {/* Caret */}
                                  <div style={{
                                    position: "absolute",
                                    bottom: "-5px",
                                    left: "50%",
                                    transform: "translateX(-50%) rotate(45deg)",
                                    width: "8px",
                                    height: "8px",
                                    background: "#FFFFFF",
                                    borderRight: "1px solid #ECEEF2",
                                    borderBottom: "1px solid #ECEEF2"
                                  }} />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Health Status */}
                          <td style={{ padding: "12px 10px" }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "10px",
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: "9999px",
                              background: client.health === "Operational" ? "#ECFDF5" : client.health === "Paused" ? "#FEF3C7" : "#FEF2F2",
                              color: client.health === "Operational" ? "#10B981" : client.health === "Paused" ? "#D97706" : "#EF4444"
                            }}>
                              <span style={{
                                width: "5px",
                                height: "5px",
                                borderRadius: "50%",
                                background: client.health === "Operational" ? "#10B981" : client.health === "Paused" ? "#F59E0B" : "#EF4444"
                              }} />
                              {client.health}
                            </span>
                          </td>

                          {/* Retainer */}
                          <td style={{ padding: "12px 10px", fontSize: "11px", fontWeight: 600, color: "#1F2433" }}>
                            {client.retainer}
                          </td>

                          {/* Payment Status */}
                          <td style={{ padding: "12px 10px" }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              fontSize: "10px",
                              fontWeight: 600,
                              color: client.payment === "Paid" ? "#1D9E75" : "#D97706"
                            }}>
                              {client.payment}
                            </span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {showOnboardModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(17,24,39,0.35)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <div style={{ width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto", background: "#FFFFFF", borderRadius: "16px", boxShadow: "0 24px 60px rgba(31,36,51,0.25)", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>

            <div style={{ marginBottom: "0px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#4F46FF", background: "#F4F5FF", padding: "3px 8px", borderRadius: "6px" }}>
                {editingClientId ? "Edit · Client details" : "Step 1 of 2 · Client details"}
              </span>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1F2433", margin: 0, marginTop: "10px" }}>{editingClientId ? "Edit Client Details" : "Onboard New Client"}</h3>
              <p style={{ fontSize: "12px", color: "#8A90A0", marginTop: "4px", margin: 0 }}>
                {editingClientId ? "Update this client's onboarding details." : "Tell us who this client is. Next, you'll set up the service their AI agent runs."}
              </p>
            </div>

            {onboardSuccessMessage ? (
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "flex-start", 
                padding: "24px 0",
                gap: "12px"
              }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  width: "40px", 
                  height: "40px", 
                  borderRadius: "50%", 
                  background: "#ECFDF5", 
                  color: "#10B981" 
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#065F46", margin: 0 }}>Onboarding Successful</h4>
                  <p style={{ fontSize: "12px", color: "#047857", marginTop: "4px", margin: 0 }}>
                    {onboardSuccessMessage} Loading service setup...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOnboardSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* Horizontal side-by-side fields grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "18px 20px" }}>
                  
                  {/* Business Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072" }}>
                      Business name <span style={{ color: "#EF4444", marginLeft: "2px" }}>*</span>
                    </label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <span style={{ position: "absolute", left: "12px", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                          <line x1="9" y1="22" x2="9" y2="16" />
                          <line x1="15" y1="22" x2="15" y2="16" />
                          <line x1="9" y1="16" x2="15" y2="16" />
                          <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. BlueSky Insurance"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px 10px 36px",
                          fontSize: "12px",
                          border: onboardErrors.name ? "1px solid #EF4444" : "1px solid #ECEEF2",
                          borderRadius: "8px",
                          outline: "none",
                          color: "#1F2433",
                          fontFamily: "inherit",
                          background: "#FFFFFF",
                          transition: "all 150ms ease"
                        }}
                      />
                    </div>
                    {onboardErrors.name && (
                      <span style={{ fontSize: "11px", color: "#EF4444", fontWeight: 500 }}>{onboardErrors.name}</span>
                    )}
                  </div>

                  {/* Contact Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072" }}>
                      Contact name <span style={{ color: "#EF4444", marginLeft: "2px" }}>*</span>
                    </label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <span style={{ position: "absolute", left: "12px", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px 10px 36px",
                          fontSize: "12px",
                          border: onboardErrors.contactName ? "1px solid #EF4444" : "1px solid #ECEEF2",
                          borderRadius: "8px",
                          outline: "none",
                          color: "#1F2433",
                          fontFamily: "inherit",
                          background: "#FFFFFF",
                          transition: "all 150ms ease"
                        }}
                      />
                    </div>
                    {onboardErrors.contactName && (
                      <span style={{ fontSize: "11px", color: "#EF4444", fontWeight: 500 }}>{onboardErrors.contactName}</span>
                    )}
                  </div>

                  {/* Contact Email */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072" }}>
                      Contact email <span style={{ color: "#EF4444", marginLeft: "2px" }}>*</span>
                    </label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <span style={{ position: "absolute", left: "12px", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </span>
                      <input
                        type="email"
                        placeholder="e.g. contact@bluesky.io"
                        value={orgEmail}
                        onChange={(e) => setOrgEmail(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px 10px 36px",
                          fontSize: "12px",
                          border: onboardErrors.email ? "1px solid #EF4444" : "1px solid #ECEEF2",
                          borderRadius: "8px",
                          outline: "none",
                          color: "#1F2433",
                          fontFamily: "inherit",
                          background: "#FFFFFF",
                          transition: "all 150ms ease"
                        }}
                      />
                    </div>
                    {onboardErrors.email && (
                      <span style={{ fontSize: "11px", color: "#EF4444", fontWeight: 500 }}>{onboardErrors.email}</span>
                    )}
                  </div>

                  {/* Contact Phone */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072" }}>
                      Contact phone <span style={{ color: "#EF4444", marginLeft: "2px" }}>*</span>
                    </label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <span style={{ position: "absolute", left: "12px", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. +1 (555) 123-4567"
                        value={orgPhone}
                        onChange={(e) => setOrgPhone(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px 10px 36px",
                          fontSize: "12px",
                          border: onboardErrors.phone ? "1px solid #EF4444" : "1px solid #ECEEF2",
                          borderRadius: "8px",
                          outline: "none",
                          color: "#1F2433",
                          fontFamily: "inherit",
                          background: "#FFFFFF",
                          transition: "all 150ms ease"
                        }}
                      />
                    </div>
                    {onboardErrors.phone && (
                      <span style={{ fontSize: "11px", color: "#EF4444", fontWeight: 500 }}>{onboardErrors.phone}</span>
                    )}
                  </div>

                  {/* Client Timezone */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072" }}>
                      Client timezone <span style={{ color: "#EF4444", marginLeft: "2px" }}>*</span>
                    </label>
                    <div ref={timezoneRef} style={{ position: "relative" }}>
                      <div
                        onClick={() => setTimezoneOpen((o) => !o)}
                        style={{
                          width: "100%",
                          padding: "10px 12px 10px 36px",
                          fontSize: "12px",
                          border: onboardErrors.timezone ? "1px solid #EF4444" : timezoneOpen ? "1px solid #4F46FF" : "1px solid #ECEEF2",
                          borderRadius: "8px",
                          background: "#FFFFFF",
                          color: "#1F2433",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                          cursor: "pointer",
                          userSelect: "none",
                          position: "relative",
                          boxSizing: "border-box",
                          transition: "all 150ms ease"
                        }}
                      >
                        <span style={{ position: "absolute", left: "12px", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{TIMEZONE_LABEL(orgTimezone)}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: timezoneOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease" }}>
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>

                      {timezoneOpen && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px", background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "8px", boxShadow: "0 8px 24px rgba(31,36,51,0.08)", zIndex: 100, padding: "6px", maxHeight: "260px", overflowY: "auto" }}>
                          {TIMEZONE_GROUPS.map((group) => (
                            <div key={group.label}>
                              <div style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#A0A6B4", padding: "6px 8px 2px" }}>{group.label}</div>
                              {group.zones.map((z) => {
                                const selected = orgTimezone === z.value;
                                return (
                                  <div
                                    key={z.value}
                                    onClick={() => { setOrgTimezone(z.value); setTimezoneOpen(false); }}
                                    onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "#F7F8FA"; }}
                                    onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "transparent"; }}
                                    style={{ padding: "7px 8px", fontSize: "12px", borderRadius: "6px", cursor: "pointer", color: selected ? "#4F46FF" : "#5A6072", background: selected ? "#F4F5FF" : "transparent", fontWeight: selected ? 600 : 500 }}
                                  >
                                    {z.label}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {onboardErrors.timezone && (
                      <span style={{ fontSize: "11px", color: "#EF4444", fontWeight: 500 }}>{onboardErrors.timezone}</span>
                    )}
                  </div>

                  {/* Industry */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072" }}>
                      Industry
                    </label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <span style={{ position: "absolute", left: "12px", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 21h18" />
                          <path d="M5 21V7l8-4v18" />
                          <path d="M19 21V11l-6-4" />
                          <path d="M9 9h.01M9 12h.01M9 15h.01M9 18h.01" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Insurance, Real Estate, Dental"
                        value={orgIndustry}
                        onChange={(e) => setOrgIndustry(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px 10px 36px",
                          fontSize: "12px",
                          border: "1px solid #ECEEF2",
                          borderRadius: "8px",
                          outline: "none",
                          color: "#1F2433",
                          fontFamily: "inherit",
                          background: "#FFFFFF",
                          transition: "all 150ms ease"
                        }}
                      />
                    </div>
                  </div>

                  {/* Target customer type — gates scraping/enrichment (legal) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072" }}>
                      Who does this client sell to? <span style={{ color: "#EF4444", marginLeft: "2px" }}>*</span>
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {[
                        { value: "business", label: "Businesses (B2B)", hint: "Can scrape + enrich leads" },
                        { value: "consumer", label: "Consumers (B2C)", hint: "No scraping/enrichment — upload only" },
                      ].map((opt) => {
                        const sel = orgCustomerType === opt.value;
                        return (
                          <div
                            key={opt.value}
                            onClick={() => setOrgCustomerType(opt.value)}
                            style={{ flex: 1, padding: "10px 12px", borderRadius: "8px", cursor: "pointer", border: sel ? "2px solid #4F46FF" : (onboardErrors.customerType ? "1px solid #EF4444" : "1px solid #ECEEF2"), background: sel ? "#F4F5FF" : "#FFFFFF", transition: "all 150ms ease" }}
                          >
                            <div style={{ fontSize: "12px", fontWeight: 600, color: sel ? "#4F46FF" : "#1F2433" }}>{opt.label}</div>
                            <div style={{ fontSize: "10.5px", color: "#8A90A0", marginTop: "2px" }}>{opt.hint}</div>
                          </div>
                        );
                      })}
                    </div>
                    {onboardErrors.customerType && (
                      <span style={{ fontSize: "11px", color: "#EF4444", fontWeight: 500 }}>Please choose who this client sells to.</span>
                    )}
                  </div>

                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setOrgName("");
                      setOrgIndustry("");
                      setOrgCustomerType("");
                      setContactName("");
                      setOrgEmail("");
                      setOrgPhone("");
                      setOrgTimezone("America/New_York");
                      setOnboardErrors({});
                      setShowOnboardModal(false);
                      setEditingClientId(null);
                    }}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #ECEEF2",
                      color: "#5A6072",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 150ms ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#4F46FF";
                      e.currentTarget.style.color = "#4F46FF";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#ECEEF2";
                      e.currentTarget.style.color = "#5A6072";
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isOnboarding}
                    style={{
                      background: isOnboarding ? "#A8AEBC" : "#4F46FF",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 24px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: isOnboarding ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 150ms ease"
                    }}
                    onMouseEnter={(e) => {
                      if (!isOnboarding) e.currentTarget.style.background = "#3F37D9";
                    }}
                    onMouseLeave={(e) => {
                      if (!isOnboarding) e.currentTarget.style.background = "#4F46FF";
                    }}
                  >
                    {isOnboarding ? (
                      <>
                        <span style={{
                          width: "12px",
                          height: "12px",
                          border: "2px solid #FFFFFF",
                          borderTop: "2px solid transparent",
                          borderRadius: "50%",
                          display: "inline-block",
                          animation: "spin 1s linear infinite"
                        }}></span>
                        Saving...
                      </>
                    ) : (
                      editingClientId ? "Save changes" : "Proceed"
                    )}
                  </button>
                </div>

              </form>
            )}
            </div>
          </div>
        )}

        {showAddServiceModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(17,24,39,0.35)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <div style={{ width: "100%", maxWidth: "560px", background: "#FFFFFF", borderRadius: "16px", boxShadow: "0 24px 60px rgba(31,36,51,0.25)", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
              
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1F2433", margin: 0 }}>Choose Service Preset</h3>
                <p style={{ fontSize: "12px", color: "#8A90A0", marginTop: "4px", margin: 0 }}>
                  Select the main service preset to configure for this client.
                </p>
              </div>

              {/* Service Cards list container */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "380px", overflowY: "auto", paddingRight: "6px" }}>
                {[
                  {
                    id: "Outbound Sales / Appt Setting",
                    title: "1. Outbound Sales / Appointment Setting",
                    desc: "Outbound voice: Calls prospects, pitches value, and books calendar slots.",
                    useCase: "Use Case: Cold outreach, SDR prospecting campaigns, and booking sales demos.",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    )
                  },
                  {
                    id: "Reactivation & Renewals",
                    title: "2. Database Reactivation & Renewals",
                    desc: "Outbound voice: Calls your own dormant or expiring contacts to win them back.",
                    useCase: "Use Case: Re-engaging old leads, contract renewals, and win-back offers.",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                      </svg>
                    )
                  },
                  {
                    id: "Lead Qualification",
                    title: "3. Lead Qualification & Surveys",
                    desc: "Outbound voice: Calls fresh leads, asks qualifying Qs, and scores responses.",
                    useCase: "Use Case: Pre-screening job applicants, market research, and lead scoring.",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    )
                  },
                  {
                    id: "Appointment Reminders",
                    title: "4. Appointment Reminders & Recovery",
                    desc: "Outbound voice: Calls bookings to confirm attendance or recover missed appointments.",
                    useCase: "Use Case: Cutting no-shows, webinar reminders, and rebooking missed slots.",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    )
                  },
                  {
                    id: "AI Receptionist",
                    title: "5. AI Receptionist (Inbound)",
                    desc: "Inbound voice: Answers calls 24/7, schedules meetings, and answers FAQs.",
                    useCase: "Use Case: Front-desk coverage, after-hours answering, and FAQ deflection.",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    )
                  },
                  {
                    id: "Support / Complaint Line",
                    title: "6. Support / Complaint Line",
                    desc: "Inbound voice: Answers calls, logs customer ticket details without booking.",
                    useCase: "Use Case: Ticket intake, capturing client issues, and customer reassurance.",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                      </svg>
                    )
                  },
                  {
                    id: "Lead Generation",
                    title: "7. Lead Generation (Lists)",
                    desc: "Data only: Scrapes business contact databases to build fresh phone lists.",
                    useCase: "Use Case: Compiling target lists (Google Maps, hotfrog) for outreach campaigns.",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    )
                  },
                  {
                    id: "List Cleaning",
                    title: "8. List Cleaning & DNC Scrubbing",
                    desc: "Data only: Formats phone numbers, removes duplicates, scrubs DNC lists.",
                    useCase: "Use Case: Deduplication, timezone tagging, and ensuring compliance on lead lists.",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    )
                  },
                  {
                    id: "Lead Enrichment",
                    title: "9. Lead Enrichment",
                    desc: "Data only: Deeply researches custom lead lists to extract emails and context.",
                    useCase: "Use Case: Gathering profile data, company details, and lead intelligence.",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                      </svg>
                    )
                  }
                ].map((svc) => {
                  const isSelected = selectedServiceCategory === svc.id;
                  // Lead Generation = scraping → B2B only. Block it for consumer clients (legal).
                  const isBlocked = svc.id === "Lead Generation" && onboardedClient?.targetCustomerType !== "business";
                  return (
                    <div
                      key={svc.id}
                      onClick={() => { if (!isBlocked) setSelectedServiceCategory(svc.id); }}
                      title={isBlocked ? "Lead Generation (scraping) is only available for B2B clients." : undefined}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "14px 18px",
                        background: isSelected ? "#F4F5FF" : "#FFFFFF",
                        border: isSelected ? "2px solid #4F46FF" : "1px solid #ECEEF2",
                        borderRadius: "10px",
                        cursor: isBlocked ? "not-allowed" : "pointer",
                        opacity: isBlocked ? 0.45 : 1,
                        transition: "all 150ms ease"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected && !isBlocked) {
                          e.currentTarget.style.borderColor = "#CBD2DD";
                          e.currentTarget.style.background = "#F9FAFB";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected && !isBlocked) {
                          e.currentTarget.style.borderColor = "#ECEEF2";
                          e.currentTarget.style.background = "#FFFFFF";
                        }
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: isSelected ? "#4F46FF" : "#F4F5FF",
                        color: isSelected ? "#FFFFFF" : "#4F46FF",
                        flexShrink: 0,
                        transition: "all 150ms ease"
                      }}>
                        {svc.icon}
                      </div>

                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#1F2433" }}>{svc.title}</span>
                        <span style={{ fontSize: "11px", color: "#8A90A0", lineHeight: "1.4" }}>{svc.desc}</span>
                        <span style={{ fontSize: "10.5px", fontWeight: 600, color: isSelected ? "#3F37D9" : "#4F46FF", marginTop: "2px" }}>{svc.useCase}</span>
                      </div>

                      {/* Radio dot */}
                      <div style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        border: isSelected ? "5px solid #4F46FF" : "2px solid #CBD2DD",
                        background: "#FFFFFF",
                        flexShrink: 0,
                        transition: "all 150ms ease"
                      }} />
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  style={{
                    background: "#F4F5FF",
                    color: "#4F46FF",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 20px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 150ms ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#EBEFFD"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#F4F5FF"}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedServiceCategory}
                  onClick={() => {
                    if (selectedServiceCategory) {
                      handleConfigureService(selectedServiceCategory);
                      setShowAddServiceModal(false);
                    }
                  }}
                  style={{
                    background: selectedServiceCategory ? "#22C55E" : "#CBD2DD",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 20px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: selectedServiceCategory ? "pointer" : "not-allowed",
                    fontFamily: "inherit",
                    transition: "background 150ms ease"
                  }}
                  onMouseEnter={(e) => { if (selectedServiceCategory) e.currentTarget.style.background = "#16A34A"; }}
                  onMouseLeave={(e) => { if (selectedServiceCategory) e.currentTarget.style.background = "#22C55E"; }}
                >
                  Add Service
                </button>
              </div>

            </div>
          </div>
        )}

        {currentView === "create-service" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>

            {/* Separator between the page heading and the content */}
            <div style={{ height: "1px", background: "#ECEEF2", marginBottom: "4px" }} />

            {/* Header — service-detail style, populated with the onboarded client */}
            {onboardedClient && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Breadcrumb path — client › current service (last = selected, lighter pill) */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", flexWrap: "wrap" }}>
                  <span
                    onClick={() => setCurrentView("directory")}
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#4F46FF", fontWeight: 600, cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#3F37D9"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#4F46FF"}
                  >‹ Back</span>
                  <span style={{ color: "#C7CBF5" }}>|</span>
                  <span style={{ color: "#4F46FF", fontWeight: 600 }}>{onboardedClient.name}</span>
                  <span style={{ color: "#A0A6B4" }}>›</span>
                  <span style={{ background: "#F4F5FF", color: "#4F46FF", fontWeight: 600, padding: "2px 8px", borderRadius: "6px" }}>
                    {configuringService ? configuringService : "New Service"}
                  </span>
                </div>

                {/* Title */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1F2433", margin: 0 }}>{onboardedClient.name}</h2>
                    {/* Edit onboarding details — pencil beside the name */}
                    <button
                      onClick={startEditOnboarding}
                      title="Edit details"
                      style={{ width: "30px", height: "30px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid #ECEEF2", borderRadius: "8px", color: "#8A90A0", cursor: "pointer", flexShrink: 0, transition: "all 150ms ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4F46FF"; e.currentTarget.style.color = "#4F46FF"; e.currentTarget.style.background = "#F4F5FF"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#ECEEF2"; e.currentTarget.style.color = "#8A90A0"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    {/* Account enable/disable — off disables the whole client (e.g. non-payment) */}
                    <button
                      onClick={toggleClientEnabled}
                      title={onboardedClient.enabled === false ? "Account disabled — click to enable" : "Account active — click to disable"}
                      style={{ width: "40px", height: "22px", borderRadius: "999px", background: onboardedClient.enabled === false ? "#CBD2DD" : "#22C55E", border: "none", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 150ms ease" }}
                    >
                      <span style={{ position: "absolute", top: "2px", left: onboardedClient.enabled === false ? "2px" : "20px", width: "18px", height: "18px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 1px 2px rgba(0,0,0,0.2)", transition: "left 150ms ease" }} />
                    </button>
                  </div>
                  {configuringService ? (
                    <button
                      onClick={handleSaveDraft}
                      style={{
                        background: "#FFFBEB",
                        color: "#D97706",
                        border: "1px solid #FCD34D",
                        borderRadius: "10px",
                        padding: "9px 16px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexShrink: 0,
                        transition: "all 150ms ease"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF3C7"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFBEB"; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      Save as Draft
                    </button>
                  ) : (
                    /* ponytail: action wired on user's say-so */
                    <button
                      onClick={() => {
                        setShowAddServiceModal(true);
                        setSelectedServiceCategory("");
                        setModalStep(1);
                        setSelectedSubService("");
                      }}
                      style={{ background: "#4F46FF", color: "#FFFFFF", border: "none", borderRadius: "10px", padding: "9px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, transition: "background 150ms ease" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#3F37D9"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#4F46FF"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add Service
                    </button>
                  )}
                </div>

                {/* Status / meta line — pulled left so the first pill's text aligns with the title/breadcrumb */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "12px", color: "#5A6072", marginLeft: "-10px" }}>
                  {[
                    ["Status", clientStatus(onboardedClient).label, clientStatus(onboardedClient).color, clientStatus(onboardedClient).bg],
                    ["Industry", onboardedClient.industry || "—", "#8B5CF6", "#F5F3FF"],
                    ["Timezone", onboardedClient.timezone ? TIMEZONE_LABEL(onboardedClient.timezone) : "—", "#06B6D4", "#ECFEFF"],
                    ["Contact", onboardedClient.contactName || "—", "#4F46FF", "#F4F5FF"],
                    ["Email", onboardedClient.email || "—", "#F59E0B", "#FFFBEB"],
                    ["Phone", onboardedClient.contactPhone || onboardedClient.contact || "—", "#EC4899", "#FDF2F8"],
                  ].map(([label, value, color, bg]) => (
                    <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "8px", background: bg }}>
                      <span style={{ fontWeight: 700, color }}>{label}</span>
                      <span style={{ color: "#1F2433", fontWeight: 500 }}>{value}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {configuringService ? (
              (configuringService === "Outbound Sales / Appt Setting" || configuringService === "Reactivation & Renewals" || configuringService === "Lead Qualification" || configuringService === "Appointment Reminders") ? (
                /* Configuration Form — shared by Outbound Sales, Reactivation, Lead Qualification, and Appointment Reminders */
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "10px" }}>
                  
                  {/* Section 3: Who it calls / Appointment Source & Timing */}
                  {configuringService === "Appointment Reminders" ? (
                    (() => {
                      const hasBookingService = onboardedClient?.activeServices?.includes("Outbound Sales / Appt Setting") || onboardedClient?.activeServices?.includes("Reactivation & Renewals");
                      const isConfigured = (remindSourceBooked || remindSourceCalendar || remindSourceUpload) && reminderTimingValue.trim() !== "";
                      return (
                        <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ECEEF2", paddingBottom: "12px", marginBottom: "4px" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: "14px", fontWeight: 700, color: "#1F2433" }}>1. Appointment Source &amp; Reminder Timing</span>
                              <span style={{ fontSize: "11px", color: "#8A90A0" }}>Choose where we fetch appointments and configure when the agent should call.</span>
                            </div>
                            {isConfigured ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 600, color: "#22C55E", background: "#ECFDF5", padding: "4px 10px", borderRadius: "20px" }}>
                                Configured ✓
                              </span>
                            ) : (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 600, color: "#D97706", background: "#FEF3C7", padding: "4px 10px", borderRadius: "20px" }}>
                                Needs input
                              </span>
                            )}
                          </div>

                          {/* Reminder Type choice */}
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "6px", display: "block" }}>Reminder Type</label>
                            <div style={{ display: "flex", gap: "8px" }}>
                              {[
                                {
                                  value: "confirmation",
                                  label: "Confirmation",
                                  desc: "Confirm upcoming meetings",
                                  template: "You are calling to remind someone about an upcoming appointment for the business described in your context. Be friendly and clear. Confirm the date, time, and location. Ask if they can make it. If they need to reschedule, call check_availability and then book_appointment with the new time. If they can't make it, capture the reason with capture_fields. Always end with a clear next step."
                                },
                                {
                                  value: "no_show_recovery",
                                  label: "No-Show Recovery",
                                  desc: "Rebook missed appointments",
                                  template: "You are calling someone who missed a recent appointment with the business described in your context. Be warm and non-judgmental — things come up. Confirm you've reached the right person, let them know they were missed, and offer to find a new time. Call check_availability and book_appointment to rebook. If they no longer want to come, capture the reason with capture_fields."
                                },
                                {
                                  value: "event_reminder",
                                  label: "Event Reminder",
                                  desc: "Remind event registrants",
                                  template: "You are calling people registered for an upcoming event run by the business described in your context. Remind them of the event date, time, and location, and confirm whether they still plan to attend. Record their answer with capture_fields. If they can't make it, thank them and note it. Keep it brief and upbeat."
                                }
                              ].map((opt) => {
                                const isSelected = scriptVariant === opt.value;
                                return (
                                  <div
                                    key={opt.value}
                                    onClick={() => {
                                      setScriptVariant(opt.value);
                                      setScriptText(opt.template);
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: "10px 12px",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      border: isSelected ? "2px solid #4F46FF" : "1px solid #ECEEF2",
                                      background: isSelected ? "#F4F5FF" : "#FFFFFF",
                                      transition: "all 150ms ease"
                                    }}
                                  >
                                    <div style={{ fontSize: "12px", fontWeight: 700, color: isSelected ? "#4F46FF" : "#1F2433" }}>{opt.label}</div>
                                    <div style={{ fontSize: "10px", color: "#8A90A0", marginTop: "2px" }}>{opt.desc}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Appointment Sources Checkboxes */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid #ECEEF2", paddingTop: "14px" }}>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072" }}>Appointment Source (Select all that apply)</label>
                            
                            {/* Checkbox 1 */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: hasBookingService ? "#1F2433" : "#A0A6B4", cursor: hasBookingService ? "pointer" : "not-allowed" }}>
                                <input
                                  type="checkbox"
                                  disabled={!hasBookingService}
                                  checked={remindSourceBooked && hasBookingService}
                                  onChange={(e) => setRemindSourceBooked(e.target.checked)}
                                  style={{ accentColor: "#4F46FF", cursor: hasBookingService ? "pointer" : "not-allowed" }}
                                />
                                <span>Remind the meetings we book (auto)</span>
                              </label>
                              {!hasBookingService && (
                                <span style={{ fontSize: "11px", color: "#D97706", marginLeft: "22px" }}>
                                  Create an Outbound service first to auto-remind the meetings it books.
                                </span>
                              )}
                            </div>

                            {/* Checkbox 2 */}
                            <div>
                              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#1F2433", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={remindSourceCalendar}
                                  onChange={(e) => setRemindSourceCalendar(e.target.checked)}
                                  style={{ accentColor: "#4F46FF", cursor: "pointer" }}
                                />
                                <span>Connect a calendar (Google Calendar / Outlook Sync)</span>
                              </label>
                              <span style={{ fontSize: "11px", color: "#8A90A0", marginLeft: "22px", display: "block" }}>
                                Mock connection only. In production, this hooks into the client&apos;s live calendar feed.
                              </span>
                            </div>

                            {/* Checkbox 3 */}
                            <div>
                              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#1F2433", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={remindSourceUpload}
                                  onChange={(e) => setRemindSourceUpload(e.target.checked)}
                                  style={{ accentColor: "#4F46FF", cursor: "pointer" }}
                                />
                                <span>Upload an appointment list (CSV: name, phone, appointment time)</span>
                              </label>
                              <span style={{ fontSize: "11px", color: "#8A90A0", marginLeft: "22px", display: "block" }}>
                                Provide scheduled appointments manually using the document zone below.
                              </span>
                            </div>
                          </div>

                          {/* Reminder Timing */}
                          <div style={{ borderTop: "1px solid #ECEEF2", paddingTop: "14px" }}>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "6px", display: "block" }}>Reminder Timing</label>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <input
                                type="number"
                                min="1"
                                value={reminderTimingValue}
                                onChange={(e) => setReminderTimingValue(e.target.value)}
                                style={{ width: "80px", padding: "8px 12px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "13px", color: "#1F2433", outline: "none" }}
                              />
                              <select
                                value={reminderTimingUnit}
                                onChange={(e) => setReminderTimingUnit(e.target.value)}
                                style={{ padding: "8px 12px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "13px", color: "#1F2433", outline: "none", background: "#FFFFFF", cursor: "pointer" }}
                              >
                                {scriptVariant === "no_show_recovery" ? (
                                  <>
                                    <option value="minutes">minutes</option>
                                    <option value="hours">hours</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="hours">hours</option>
                                    <option value="days">days</option>
                                  </>
                                )}
                              </select>
                              <span style={{ fontSize: "12.5px", fontWeight: 500, color: "#1F2433", marginLeft: "4px" }}>
                                {scriptVariant === "confirmation" && `before the appointment.`}
                                {scriptVariant === "no_show_recovery" && `after a missed appointment.`}
                                {scriptVariant === "event_reminder" && `before the event.`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    (() => {
                      const isConfigured = icpDescription.trim() !== "" && (isUploadListChecked || (isScrapeChecked && scrapeCity.trim() !== "" && scrapeState.trim() !== "" && scrapeBusinessType.trim() !== ""));
                      return (
                        <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ECEEF2", paddingBottom: "12px", marginBottom: "4px" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: "14px", fontWeight: 700, color: "#1F2433" }}>1. Who it calls (Leads &amp; Target ICP)</span>
                              <span style={{ fontSize: "11px", color: "#8A90A0" }}>Set targeting parameters for Lead Scraper or upload a custom CSV contact list.</span>
                            </div>
                            {isConfigured ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 600, color: "#22C55E", background: "#ECFDF5", padding: "4px 10px", borderRadius: "20px" }}>
                                Configured ✓
                              </span>
                            ) : (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 600, color: "#D97706", background: "#FEF3C7", padding: "4px 10px", borderRadius: "20px" }}>
                                Needs input
                              </span>
                            )}
                          </div>

                          {/* ICP Description Textarea */}
                          {(() => {
                            const isBusiness = onboardedClient?.targetCustomerType === "business";
                            return (
                              <>
                                <div>
                                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "4px", display: "block" }}>
                                    {isBusiness ? "Ideal Customer Profile (ICP) Description" : "Target Audience / Demographic Description"}
                                  </label>
                                  <textarea
                                    placeholder={isBusiness ? "e.g. Dental clinics, roofers, HVAC companies in Austin, TX..." : "e.g. Past retail customers, homeowners who requested a roofing quote..."}
                                    value={icpDescription}
                                    onChange={(e) => setIcpDescription(e.target.value)}
                                    style={{
                                      width: "100%",
                                      minHeight: "70px",
                                      padding: "10px 12px",
                                      border: "1px solid #ECEEF2",
                                      borderRadius: "8px",
                                      fontSize: "13px",
                                      color: "#1F2433",
                                      fontFamily: "inherit",
                                      resize: "vertical",
                                      outline: "none"
                                    }}
                                  />
                                  <p style={{ fontSize: "11px", color: "#8A90A0", margin: 0, marginTop: "4px" }}>
                                    {isBusiness 
                                      ? "Search terms and scraping keywords will auto-generate from this text description." 
                                      : "This helps the AI agent understand who it is calling and tailor its conversation style."
                                    }
                                  </p>
                                </div>

                                {/* Checkboxes for Lead Source */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072" }}>Lead Acquisition Source</label>
                                  
                                  {isBusiness ? (
                                    <>
                                      {/* Checkbox 1: Upload a list */}
                                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#1F2433", cursor: configuringService === "Reactivation & Renewals" ? "default" : "pointer" }}>
                                        <input
                                          type="checkbox"
                                          disabled={configuringService === "Reactivation & Renewals"}
                                          checked={isUploadListChecked || configuringService === "Reactivation & Renewals"}
                                          onChange={(e) => setIsUploadListChecked(e.target.checked)}
                                          style={{ accentColor: "#4F46FF", cursor: configuringService === "Reactivation & Renewals" ? "default" : "pointer" }}
                                        />
                                        <span>Upload a list (CSV file)</span>
                                      </label>

                                      {/* Checkbox 2: Scrape / find leads */}
                                      {configuringService !== "Reactivation & Renewals" && (() => {
                                        // Only an actually-created, active Lead Generation service unlocks scraping — not a mock display tag.
                                        const hasLeadGen = onboardedClient?.activeServices?.includes("Lead Generation");
                                        return (
                                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: hasLeadGen ? "#1F2433" : "#A0A6B4", cursor: hasLeadGen ? "pointer" : "not-allowed" }}>
                                              <input
                                                type="checkbox"
                                                disabled={!hasLeadGen}
                                                checked={isScrapeChecked && hasLeadGen}
                                                onChange={(e) => setIsScrapeChecked(e.target.checked)}
                                                style={{ accentColor: "#4F46FF", cursor: hasLeadGen ? "pointer" : "not-allowed" }}
                                              />
                                              <span>Scrape / find leads</span>
                                            </label>
                                            {!hasLeadGen && (
                                              <span style={{ fontSize: "11px", color: "#D97706", marginLeft: "22px" }}>
                                                You need to create a Lead Generation service for this client first to start scraping.
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </>
                                  ) : (
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#1F2433" }}>
                                      <input
                                        type="checkbox"
                                        checked
                                        disabled
                                        style={{ accentColor: "#4F46FF", cursor: "not-allowed" }}
                                      />
                                      <span style={{ color: "#5A6072" }}>Upload a list (Consumer B2C calls require uploading a custom contact list)</span>
                                    </label>
                                  )}
                                </div>
                              </>
                            );
                          })()}

                          {isScrapeChecked && (onboardedClient?.activeServices?.includes("Lead Generation") || onboardedClient?.services?.includes("Lead Generation")) && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid #ECEEF2", paddingTop: "14px" }}>
                              <div>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: "#1F2433", display: "block" }}>Where to search for leads</span>
                                <span style={{ fontSize: "11px", color: "#8A90A0", display: "block", marginTop: "2px" }}>We search this area for matching businesses, e.g. within 25 km of Austin, TX.</span>
                              </div>
                              
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "4px", display: "block" }}>City</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Austin"
                                    value={scrapeCity}
                                    onChange={(e) => setScrapeCity(e.target.value)}
                                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "13px", color: "#1F2433", outline: "none" }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "4px", display: "block" }}>State</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. TX"
                                    value={scrapeState}
                                    onChange={(e) => setScrapeState(e.target.value)}
                                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "13px", color: "#1F2433", outline: "none" }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "4px", display: "block" }}>Radius (km)</label>
                                  <input
                                    type="number"
                                    placeholder="e.g. 25"
                                    value={scrapeRadius}
                                    onChange={(e) => setScrapeRadius(e.target.value)}
                                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "13px", color: "#1F2433", outline: "none" }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "4px", display: "block" }}>Business Type</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Dental Clinic"
                                    value={scrapeBusinessType}
                                    onChange={(e) => setScrapeBusinessType(e.target.value)}
                                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "13px", color: "#1F2433", outline: "none" }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })()
                  )}

                  {/* Section: Qualifying Questions (Lead Qualification only) */}
                  {configuringService === "Lead Qualification" && (() => {
                    const QUALIFY_PROMPT = "You are calling to qualify prospects for the business described in your context. Ask the qualifying questions naturally, one at a time. Once you've gathered the answers, call capture_fields to save them along with whether the prospect is a good fit (qualified true or false). Be efficient and respectful of their time.";
                    const SURVEY_PROMPT = "You are running a short survey on behalf of the business described in your context. Read the questions naturally, one at a time, without leading the respondent. Record each answer with capture_fields exactly as given. Stay neutral — you're gathering research, not selling. Thank them for their time at the end.";
                    const RECRUIT_PROMPT = "You are screening job candidates for the business described in your context. Ask the screening questions one at a time and capture the answers with capture_fields, marking whether the candidate meets the basic criteria (qualified true or false). If they're a fit and interested, call check_availability and book_appointment to schedule an interview. Be respectful and encouraging.";
                    const isSurvey = scriptVariant === "survey";
                    const isConfigured = qualifyingQuestions.some(q => q.trim() !== "") && (isSurvey || qualifiedCriteria.trim() !== "");
                    return (
                      <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "#1F2433" }}>2. Qualifying Questions</span>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: isConfigured ? "#22C55E" : "#D97706", background: isConfigured ? "#ECFDF5" : "#FFF7ED", padding: "2px 8px", borderRadius: "6px" }}>{isConfigured ? "Configured ✓" : "Needs input"}</span>
                        </div>

                        {/* Qualify vs Survey */}
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "8px", display: "block" }}>What is this run for?</label>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {[
                              { v: "default", label: "Qualify & score", hint: "Decide who's a fit" },
                              { v: "survey", label: "Survey / Research", hint: "Just collect answers" },
                            ].map((o) => {
                              const sel = (o.v === "survey") === isSurvey;
                              return (
                                <div key={o.v}
                                  onClick={() => {
                                    if (o.v === "survey") { setScriptVariant("survey"); setRecruitmentEnabled(false); setScriptText(SURVEY_PROMPT); }
                                    else { setScriptVariant("default"); setScriptText(recruitmentEnabled ? RECRUIT_PROMPT : QUALIFY_PROMPT); }
                                  }}
                                  style={{ flex: 1, padding: "10px 12px", borderRadius: "8px", cursor: "pointer", border: sel ? "2px solid #4F46FF" : "1px solid #ECEEF2", background: sel ? "#F4F5FF" : "#FFFFFF" }}>
                                  <div style={{ fontSize: "12px", fontWeight: 600, color: sel ? "#4F46FF" : "#1F2433" }}>{o.label}</div>
                                  <div style={{ fontSize: "10.5px", color: "#8A90A0", marginTop: "2px" }}>{o.hint}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* The questions */}
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "6px", display: "block" }}>Questions the agent asks</label>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {qualifyingQuestions.map((q, idx) => (
                              <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <input
                                  type="text"
                                  placeholder={`Question ${idx + 1} — e.g. What's your budget?`}
                                  value={q}
                                  onChange={(e) => { const next = [...qualifyingQuestions]; next[idx] = e.target.value; setQualifyingQuestions(next); }}
                                  style={{ flex: 1, padding: "8px 12px", fontSize: "12px", border: "1px solid #ECEEF2", borderRadius: "8px", outline: "none", color: "#1F2433", fontFamily: "inherit", background: "#FFFFFF" }}
                                />
                                {qualifyingQuestions.length > 1 && (
                                  <button type="button" onClick={() => setQualifyingQuestions(qualifyingQuestions.filter((_, i) => i !== idx))} style={{ background: "#FEF2F2", color: "#EF4444", border: "none", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}>&times;</button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button type="button" onClick={() => setQualifyingQuestions([...qualifyingQuestions, ""])} style={{ marginTop: "8px", background: "#F4F5FF", color: "#4F46FF", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>+ Add question</button>
                        </div>

                        {/* Qualified criteria — only when scoring */}
                        {!isSurvey && (
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "6px", display: "block" }}>What counts as &quot;qualified&quot;?</label>
                            <textarea
                              placeholder="e.g. Budget over $5k, decision-maker, ready within 3 months"
                              value={qualifiedCriteria}
                              onChange={(e) => setQualifiedCriteria(e.target.value)}
                              style={{ width: "100%", minHeight: "60px", padding: "10px 12px", fontSize: "12px", border: "1px solid #ECEEF2", borderRadius: "8px", outline: "none", color: "#1F2433", fontFamily: "inherit", background: "#FFFFFF", resize: "vertical" }}
                            />
                          </div>
                        )}

                        {/* Recruitment toggle — only in Qualify mode */}
                        {!isSurvey && (
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#1F2433", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={recruitmentEnabled}
                              onChange={(e) => { setRecruitmentEnabled(e.target.checked); setScriptText(e.target.checked ? RECRUIT_PROMPT : QUALIFY_PROMPT); }}
                              style={{ accentColor: "#4F46FF" }}
                            />
                            <span><strong>Recruitment screening</strong> — book an interview for qualified leads <span style={{ color: "#8A90A0", fontWeight: 400 }}>(turns on the Meeting section below)</span></span>
                          </label>
                        )}
                      </div>
                    );
                  })()}

                  {/* Section 4: Offer & Knowledge */}
                  {(() => {
                    const isNoOffer = configuringService === "Lead Qualification" || configuringService === "Appointment Reminders";
                    const isConfigured = (isNoOffer || clientOffer.trim() !== "") && knowledgeBase.trim() !== "";
                    const sectionTitle = isNoOffer 
                      ? (configuringService === "Lead Qualification" ? "3. Knowledge Base" : "2. Knowledge Base")
                      : "2. Offer & Knowledge Base";
                    const sectionSubtitle = isNoOffer
                      ? "Core info the agent uses to answer questions on the call."
                      : "Detail the pitch proposal and core FAQ content that the agent will discuss.";
                    return (
                      <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ECEEF2", paddingBottom: "12px", marginBottom: "4px" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "#1F2433" }}>{sectionTitle}</span>
                            <span style={{ fontSize: "11px", color: "#8A90A0" }}>{sectionSubtitle}</span>
                          </div>
                          {isConfigured ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 600, color: "#22C55E", background: "#ECFDF5", padding: "4px 10px", borderRadius: "20px" }}>
                              Configured ✓
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 600, color: "#D97706", background: "#FEF3C7", padding: "4px 10px", borderRadius: "20px" }}>
                              Needs input
                            </span>
                          )}
                        </div>

                        {!isNoOffer && (
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "6px", display: "block" }}>The Core Offer / Pitch Hook</label>
                          <input
                            type="text"
                            placeholder="e.g. Free 30-min dental cleaning with zero out-of-pocket costs"
                            value={clientOffer}
                            onChange={(e) => setClientOffer(e.target.value)}
                            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "13px", color: "#1F2433", outline: "none" }}
                          />
                        </div>
                        )}

                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "6px", display: "block" }}>Knowledge Base (FAQs &amp; Business Info)</label>
                          <textarea
                            placeholder="e.g. Business hours are 8am-6pm. We accept major insurances. Dr. Smith has 15 years experience..."
                            value={knowledgeBase}
                            onChange={(e) => setKnowledgeBase(e.target.value)}
                            style={{
                              width: "100%",
                              minHeight: "75px",
                              padding: "10px 12px",
                              border: "1px solid #ECEEF2",
                              borderRadius: "8px",
                              fontSize: "13px",
                              color: "#1F2433",
                              fontFamily: "inherit",
                              resize: "vertical",
                              outline: "none"
                            }}
                          />
                        </div>

                        {/* File Upload Zone */}
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "6px", display: "block" }}>Attach Documents</label>
                          <label style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px dashed #ECEEF2",
                            borderRadius: "10px",
                            padding: "24px 16px",
                            background: "#F9FAFB",
                            cursor: "pointer",
                            transition: "all 150ms ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = "#4F46FF"}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = "#ECEEF2"}
                          >
                            <input
                              type="file"
                              multiple
                              style={{ display: "none" }}
                              onChange={(e) => {
                                if (e.target.files) {
                                  const names = Array.from(e.target.files).map(f => f.name);
                                  setAttachedDocuments([...attachedDocuments, ...names]);
                                }
                              }}
                            />
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A0A6B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "8px" }}>
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#5A6072" }}>Drag a file or click to upload</span>
                            <span style={{ fontSize: "10px", color: "#8A90A0", marginTop: "2px" }}>PDF, DOCX, TXT</span>
                          </label>

                          {attachedDocuments.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                              {attachedDocuments.map((docName, docIdx) => (
                                <div key={docIdx} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#F4F5FF", border: "1px solid #C7CBF5", borderRadius: "16px", padding: "4px 10px", fontSize: "11.5px", color: "#4F46FF", fontWeight: 500 }}>
                                  <span>{docName}</span>
                                  <button
                                    type="button"
                                    onClick={() => setAttachedDocuments(attachedDocuments.filter((_, i) => i !== docIdx))}
                                    style={{ background: "transparent", border: "none", color: "#EF4444", fontWeight: "bold", fontSize: "13px", cursor: "pointer", padding: 0 }}
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })()}

                  {/* Section 5: The meeting — hidden for Lead Qualification unless recruitment screening is on */}
                  {(configuringService !== "Lead Qualification" || recruitmentEnabled) && (() => {
                    const isModeSelected = meetingMode !== "";
                    const isLinkConfigured = (meetingMode === "Online" || meetingMode === "Both") ? meetingLink.trim() !== "" : true;
                    const isAddressConfigured = (meetingMode === "In-person" || meetingMode === "Both") ? meetingAddress.trim() !== "" : true;
                    const isConfigured = isModeSelected && isLinkConfigured && isAddressConfigured;
                    return (
                      <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ECEEF2", paddingBottom: "12px", marginBottom: "4px" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "#1F2433" }}>3. The Meeting (Calendar &amp; Booking)</span>
                            <span style={{ fontSize: "11px", color: "#8A90A0" }}>Set appointment modes, scheduling buffers, and calendar availability windows.</span>
                          </div>
                          {isConfigured ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 600, color: "#22C55E", background: "#ECFDF5", padding: "4px 10px", borderRadius: "20px" }}>
                              Configured ✓
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 600, color: "#D97706", background: "#FEF3C7", padding: "4px 10px", borderRadius: "20px" }}>
                              Needs input
                            </span>
                          )}
                        </div>

                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "8px", display: "block" }}>Meeting Mode (Required)</label>
                          <div style={{ display: "flex", gap: "16px" }}>
                            {["Online", "In-person", "Both"].map((mode) => {
                              const isChecked = meetingMode === mode;
                              return (
                                <label key={mode} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#1F2433", cursor: "pointer" }}>
                                  <input
                                    type="radio"
                                    name="meetingMode"
                                    checked={isChecked}
                                    onChange={() => setMeetingMode(mode)}
                                    style={{
                                      accentColor: "#4F46FF",
                                      cursor: "pointer"
                                    }}
                                  />
                                  {mode}
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {(meetingMode === "Online" || meetingMode === "Both") && (
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "4px", display: "block" }}>Meeting Link (Google Meet / Zoom)</label>
                            <input
                              type="text"
                              placeholder="https://meet.google.com/xyz"
                              value={meetingLink}
                              onChange={(e) => setMeetingLink(e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "13px", color: "#1F2433", outline: "none" }}
                            />
                          </div>
                        )}

                        {(meetingMode === "In-person" || meetingMode === "Both") && (
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "4px", display: "block" }}>In-Person Meeting Address</label>
                            <input
                              type="text"
                              placeholder="123 Business Rd, Suite 100"
                              value={meetingAddress}
                              onChange={(e) => setMeetingAddress(e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "13px", color: "#1F2433", outline: "none" }}
                            />
                          </div>
                        )}

                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "6px", display: "block" }}>Availability Windows</label>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {availabilityWindows.map((win, idx) => (
                              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <select
                                  value={win.day}
                                  onChange={(e) => {
                                    const next = [...availabilityWindows];
                                    next[idx].day = e.target.value;
                                    setAvailabilityWindows(next);
                                  }}
                                  style={{ padding: "8px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "12px", background: "#FFFFFF", color: "#1F2433", outline: "none" }}
                                >
                                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                </select>
                                <input
                                  type="time"
                                  value={win.start}
                                  onChange={(e) => {
                                    const next = [...availabilityWindows];
                                    next[idx].start = e.target.value;
                                    setAvailabilityWindows(next);
                                  }}
                                  style={{ padding: "8px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "12px", color: "#1F2433", outline: "none" }}
                                />
                                <span style={{ fontSize: "12px", color: "#8A90A0" }}>to</span>
                                <input
                                  type="time"
                                  value={win.end}
                                  onChange={(e) => {
                                    const next = [...availabilityWindows];
                                    next[idx].end = e.target.value;
                                    setAvailabilityWindows(next);
                                  }}
                                  style={{ padding: "8px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "12px", color: "#1F2433", outline: "none" }}
                                />
                                {availabilityWindows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAvailabilityWindows(availabilityWindows.filter((_, i) => i !== idx));
                                    }}
                                    style={{ background: "transparent", border: "none", color: "#EF4444", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }}
                                  >
                                    &times;
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setAvailabilityWindows([...availabilityWindows, { day: "Monday", start: "09:00", end: "17:00" }]);
                              }}
                              style={{
                                width: "fit-content",
                                background: "transparent",
                                border: "1px dashed #4F46FF",
                                color: "#4F46FF",
                                borderRadius: "8px",
                                padding: "6px 12px",
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: "pointer",
                                marginTop: "4px"
                              }}
                            >
                              + Add Window
                            </button>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "4px", display: "block" }}>Meeting Length (min)</label>
                            <input
                              type="number"
                              value={meetingLength}
                              onChange={(e) => setMeetingLength(e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "13px", color: "#1F2433", outline: "none" }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "4px", display: "block" }}>Buffer Between (min)</label>
                            <input
                              type="number"
                              value={meetingBuffer}
                              onChange={(e) => setMeetingBuffer(e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "13px", color: "#1F2433", outline: "none" }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "4px", display: "block" }}>Booking Capacity</label>
                            <input
                              type="number"
                              value={bookingCapacity}
                              onChange={(e) => setBookingCapacity(e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "13px", color: "#1F2433", outline: "none" }}
                            />
                          </div>
                        </div>

                      </div>
                    );
                  })()}

                  {/* Section 6: Phone pool & Caller IDs */}
                  {(() => {
                    const isConfigured = phoneNumbers.some(p => p.number.trim() !== "");
                    return (
                      <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ECEEF2", paddingBottom: "12px", marginBottom: "4px" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "#1F2433" }}>4. Phone Pool &amp; Calling Window</span>
                            <span style={{ fontSize: "11px", color: "#8A90A0" }}>Manage rotating caller IDs to scale daily dials safely and comply with call times.</span>
                          </div>
                          {isConfigured ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 600, color: "#22C55E", background: "#ECFDF5", padding: "4px 10px", borderRadius: "20px" }}>
                              Configured ✓
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 600, color: "#D97706", background: "#FEF3C7", padding: "4px 10px", borderRadius: "20px" }}>
                              Needs input
                            </span>
                          )}
                        </div>

                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "6px", display: "block" }}>Phone Number Pool (Caller IDs)</label>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {phoneNumbers.map((p, idx) => (
                              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <input
                                  type="text"
                                  placeholder="+1 (555) 123-4567"
                                  value={p.number}
                                  onChange={(e) => {
                                    const next = [...phoneNumbers];
                                    next[idx].number = e.target.value;
                                    setPhoneNumbers(next);
                                  }}
                                  style={{ flex: 1, padding: "10px 12px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "13px", color: "#1F2433", outline: "none" }}
                                />
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <span style={{ fontSize: "11px", color: "#8A90A0" }}>Daily Cap:</span>
                                  <input
                                    type="number"
                                    value={p.cap}
                                    onChange={(e) => {
                                      const next = [...phoneNumbers];
                                      next[idx].cap = parseInt(e.target.value) || 0;
                                      setPhoneNumbers(next);
                                    }}
                                    style={{ width: "60px", padding: "8px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "12px", color: "#1F2433", outline: "none" }}
                                  />
                                </div>
                                {phoneNumbers.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPhoneNumbers(phoneNumbers.filter((_, i) => i !== idx));
                                    }}
                                    style={{ background: "transparent", border: "none", color: "#EF4444", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }}
                                  >
                                    &times;
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setPhoneNumbers([...phoneNumbers, { number: "", cap: 40 }]);
                              }}
                              style={{
                                width: "fit-content",
                                background: "transparent",
                                border: "1px dashed #4F46FF",
                                color: "#4F46FF",
                                borderRadius: "8px",
                                padding: "6px 12px",
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: "pointer",
                                marginTop: "4px"
                              }}
                            >
                              + Add Phone Number
                            </button>
                          </div>
                        </div>

                        {/* Live computed capacity indicator */}
                        {(() => {
                          const validCount = phoneNumbers.filter(p => p.number.trim() !== "").length;
                          const totalCap = phoneNumbers.reduce((acc, curr) => acc + (curr.number.trim() !== "" ? curr.cap : 0), 0);
                          return (
                            <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#065F46", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                              </svg>
                              <span>
                                {validCount} numbers &times; 40 = {totalCap} dials/day capacity.
                              </span>
                            </div>
                          );
                        })()}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "4px" }}>
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "4px", display: "block" }}>Calling Starts</label>
                            <input
                              type="time"
                              value={callingHoursStart}
                              onChange={(e) => setCallingHoursStart(e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "13px", color: "#1F2433", outline: "none" }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "4px", display: "block" }}>Calling Ends</label>
                            <input
                              type="time"
                              value={callingHoursEnd}
                              onChange={(e) => setCallingHoursEnd(e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ECEEF2", borderRadius: "8px", fontSize: "13px", color: "#1F2433", outline: "none" }}
                            />
                          </div>
                          
                          {/* Calling timezone custom dropdown */}
                          <div style={{ position: "relative" }}>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "4px", display: "block" }}>Timezone</label>
                            <div
                              onClick={() => setIsTimezoneDropdownOpen(!isTimezoneDropdownOpen)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyLeft: "space-between",
                                padding: "10px 12px",
                                border: isTimezoneDropdownOpen ? "1px solid #4F46FF" : "1px solid #ECEEF2",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "13px",
                                color: "#1F2433",
                                background: "#FFFFFF",
                                transition: "all 150ms ease",
                                display: "flex",
                                justifyContent: "space-between"
                              }}
                            >
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{callingTimezone}</span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isTimezoneDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease" }}>
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </div>
                            {isTimezoneDropdownOpen && (
                              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px", background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "8px", boxShadow: "0 8px 24px rgba(31,36,51,0.08)", zIndex: 100, padding: "6px", maxHeight: "150px", overflowY: "auto" }}>
                                {["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix", "Europe/London", "Asia/Kolkata"].map((z) => (
                                  <div
                                    key={z}
                                    onClick={() => {
                                      setCallingTimezone(z);
                                      setIsTimezoneDropdownOpen(false);
                                    }}
                                    style={{
                                      padding: "8px 10px",
                                      fontSize: "12px",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      color: callingTimezone === z ? "#4F46FF" : "#5A6072",
                                      background: callingTimezone === z ? "#F4F5FF" : "transparent",
                                      fontWeight: callingTimezone === z ? 600 : 500
                                    }}
                                    onMouseEnter={(e) => { if (callingTimezone !== z) e.currentTarget.style.background = "#F7F8FA"; }}
                                    onMouseLeave={(e) => { if (callingTimezone !== z) e.currentTarget.style.background = "transparent"; }}
                                  >
                                    {z}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })()}

                  {/* Section 1: Agent & Script (Moved to the bottom!) */}
                  {(() => {
                    const isConfigured = true; // Always true for Section 1 as all fields have defaults
                    return (
                      <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ECEEF2", paddingBottom: "12px", marginBottom: "4px" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "#1F2433" }}>5. Agent &amp; Script</span>
                            <span style={{ fontSize: "11px", color: "#8A90A0" }}>Define the AI calling script variant, instructions, and voice preferences.</span>
                          </div>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 600, color: "#22C55E", background: "#ECFDF5", padding: "4px 10px", borderRadius: "20px" }}>
                            Configured ✓
                          </span>
                        </div>

                        {/* Dropdown for Script Variant — hidden for Lead Qualification and Appointment Reminders (chosen in respective sections) */}
                        <div ref={variantRef} style={{ position: "relative", display: (configuringService === "Lead Qualification" || configuringService === "Appointment Reminders") ? "none" : "block" }}>
                          <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "6px", display: "block" }}>Script Variant (Preset Selection)</label>
                          <div
                            onClick={() => setIsVariantDropdownOpen(!isVariantDropdownOpen)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 10px",
                              border: isVariantDropdownOpen ? "1px solid #4F46FF" : "1px solid #ECEEF2",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "12px",
                              color: "#1F2433",
                              background: "#FFFFFF",
                              transition: "all 150ms ease",
                              maxWidth: "320px"
                            }}
                          >
                            <span>
                              {configuringService === "Reactivation & Renewals" ? (
                                (scriptVariant === "db_reactivation" || scriptVariant === "default") ? "Re-engage old leads → book (Default)" : "Expiring contracts → save/renew"
                              ) : (
                                scriptVariant === "default" ? "Cold-call → book demo (Default)" : "Lighter pitch → just fill calendar"
                              )}
                            </span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isVariantDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease" }}>
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </div>
                          {isVariantDropdownOpen && (
                            <div style={{ position: "absolute", top: "100%", left: 0, marginTop: "4px", width: "320px", background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "8px", boxShadow: "0 8px 24px rgba(31,36,51,0.08)", zIndex: 100, padding: "6px" }}>
                              {(configuringService === "Reactivation & Renewals" ? [
                                { value: "db_reactivation", label: "Re-engage old leads → book (Default)", prompt: "You are calling past or dormant leads on behalf of the business described in your context — people who showed interest before but went quiet. Warmly reference that they connected with us previously, check if their need is still live, and re-spark interest. If they're open, call check_availability and book_appointment to get them back on the calendar. Be gracious if they've moved on." },
                                { value: "renewals_winback", label: "Expiring contracts → save/renew", prompt: "You are calling customers of the business described in your context whose contract or subscription is expiring or recently lapsed. Your goal is to save the account — confirm their status, surface the value they'd lose, and handle hesitation calmly. If they want to continue, call check_availability and book_appointment to set up the renewal conversation. Never pressure; make staying easy." }
                              ] : [
                                { value: "default", label: "Cold-call → book demo (Default)", prompt: "You are a warm, sharp, persuasive (never pushy) outbound sales rep calling on behalf of the business described in your context. Your goal is to book a short meeting or demo. Ask one question at a time and keep it natural. Qualify lightly and handle objections politely. When they agree, call check_availability, offer the times, then book_appointment to lock it in." },
                                { value: "appointment_setting", label: "Lighter pitch → just fill calendar", prompt: "You are a friendly outbound rep for the business described in your context. Your only goal is to get a meeting on the calendar — keep the pitch light, don't oversell. Confirm you're speaking with the right person, give a one-line reason for the call, then move straight to scheduling: call check_availability, offer a couple of times, and book_appointment to lock it in." }
                              ]).map((item) => (
                                <div
                                  key={item.value}
                                  onClick={() => {
                                    setScriptVariant(item.value);
                                    setScriptText(item.prompt);
                                    setIsVariantDropdownOpen(false);
                                  }}
                                  style={{
                                    padding: "8px 10px",
                                    fontSize: "12px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    color: scriptVariant === item.value ? "#4F46FF" : "#5A6072",
                                    background: scriptVariant === item.value ? "#F4F5FF" : "transparent",
                                    fontWeight: scriptVariant === item.value ? 600 : 500
                                  }}
                                  onMouseEnter={(e) => { if (scriptVariant !== item.value) e.currentTarget.style.background = "#F7F8FA"; }}
                                  onMouseLeave={(e) => { if (scriptVariant !== item.value) e.currentTarget.style.background = "transparent"; }}
                                >
                                  {item.label}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* System script prompt */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072" }}>Agent Instructions / Script Prompt</label>
                            <button
                              type="button"
                              onClick={handleGenerateScript}
                              style={{
                                background: "#F4F5FF",
                                color: "#4F46FF",
                                border: "1px solid #C7CBF5",
                                borderRadius: "6px",
                                padding: "4px 10px",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z" />
                              </svg>
                              Generate script
                            </button>
                          </div>
                          <textarea
                            value={scriptText}
                            onChange={(e) => setScriptText(e.target.value)}
                            style={{
                              width: "100%",
                              minHeight: "100px",
                              padding: "10px 12px",
                              border: "1px solid #ECEEF2",
                              borderRadius: "8px",
                              fontSize: "13px",
                              color: "#1F2433",
                              fontFamily: "inherit",
                              resize: "vertical",
                              outline: "none"
                            }}
                          />
                          <p style={{ fontSize: "11px", color: "#8A90A0", margin: 0, marginTop: "4px" }}>Auto-generated from your config — edit freely.</p>
                        </div>

                        {/* Opening Line */}
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "6px", display: "block" }}>Opening Line (First Message)</label>
                          <input
                            type="text"
                            value={openingLine}
                            onChange={(e) => setOpeningLine(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              border: "1px solid #ECEEF2",
                              borderRadius: "8px",
                              fontSize: "13px",
                              color: "#1F2433",
                              outline: "none"
                            }}
                          />
                        </div>

                        {/* Success Metric */}
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "6px", display: "block" }}>Success Metric</label>
                          <input
                            type="text"
                            value={successMetric}
                            onChange={(e) => setSuccessMetric(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              border: "1px solid #ECEEF2",
                              borderRadius: "8px",
                              fontSize: "13px",
                              color: "#1F2433",
                              outline: "none"
                            }}
                          />
                        </div>

                        {/* Voice & Model dropdowns */}
                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                          {/* Voice select */}
                          <div ref={voiceRef} style={{ flex: 1, position: "relative" }}>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "6px", display: "block" }}>Voice Profile</label>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <div
                                onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyLeft: "space-between",
                                  padding: "10px 12px",
                                  border: isVoiceDropdownOpen ? "1px solid #4F46FF" : "1px solid #ECEEF2",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  color: "#1F2433",
                                  background: "#FFFFFF",
                                  transition: "all 150ms ease",
                                  display: "flex",
                                  justifyContent: "space-between"
                                }}
                              >
                                <span>
                                  {voiceSelection === "default" && "Default voice (11labs)"}
                                  {voiceSelection === "rachel" && "Rachel (11labs)"}
                                  {voiceSelection === "drew" && "Drew (11labs)"}
                                  {voiceSelection === "custom" && "Custom voice (VAPI)"}
                                </span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isVoiceDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease", flexShrink: 0 }}>
                                  <path d="m6 9 6 6 6-6" />
                                </svg>
                              </div>
                              <button
                                type="button"
                                title="Voice preview — coming when voices are connected"
                                style={{
                                  background: "#F4F5FF",
                                  color: "#4F46FF",
                                  border: "1px solid #C7CBF5",
                                  borderRadius: "8px",
                                  padding: "10px 14px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                <span>▶</span> Preview
                              </button>
                            </div>
                            {isVoiceDropdownOpen && (
                              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px", background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "8px", boxShadow: "0 8px 24px rgba(31,36,51,0.08)", zIndex: 100, padding: "6px" }}>
                                {[
                                  { value: "default", label: "Default voice (11labs)" },
                                  { value: "rachel", label: "Rachel (11labs)" },
                                  { value: "drew", label: "Drew (11labs)" },
                                  { value: "custom", label: "Custom voice (VAPI)" }
                                ].map((item) => (
                                  <div
                                    key={item.value}
                                    onClick={() => {
                                      setVoiceSelection(item.value);
                                      setIsVoiceDropdownOpen(false);
                                    }}
                                    style={{
                                      padding: "8px 10px",
                                      fontSize: "12px",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      color: voiceSelection === item.value ? "#4F46FF" : "#5A6072",
                                      background: voiceSelection === item.value ? "#F4F5FF" : "transparent",
                                      fontWeight: voiceSelection === item.value ? 600 : 500
                                    }}
                                    onMouseEnter={(e) => { if (voiceSelection !== item.value) e.currentTarget.style.background = "#F7F8FA"; }}
                                    onMouseLeave={(e) => { if (voiceSelection !== item.value) e.currentTarget.style.background = "transparent"; }}
                                  >
                                    {item.label}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Model dropdown */}
                        <div ref={modelRef} style={{ position: "relative", maxWidth: "320px" }}>
                          <label style={{ fontSize: "11px", fontWeight: 600, color: "#5A6072", marginBottom: "6px", display: "block" }}>AI Model</label>
                          <div
                            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 12px",
                              border: isModelDropdownOpen ? "1px solid #4F46FF" : "1px solid #ECEEF2",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "13px",
                              color: "#1F2433",
                              background: "#FFFFFF",
                              transition: "all 150ms ease"
                            }}
                          >
                            <span>
                              {modelSelection === "gpt-4o-mini" && "GPT-4o-mini"}
                              {modelSelection === "gpt-4o" && "GPT-4o"}
                              {modelSelection === "claude-3-5-sonnet" && "Claude 3.5 Sonnet"}
                            </span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isModelDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease" }}>
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </div>
                          {isModelDropdownOpen && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px", background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "8px", boxShadow: "0 8px 24px rgba(31,36,51,0.08)", zIndex: 100, padding: "6px" }}>
                              {[
                                { value: "gpt-4o-mini", label: "GPT-4o-mini" },
                                { value: "gpt-4o", label: "GPT-4o" },
                                { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" }
                              ].map((item) => (
                                <div
                                  key={item.value}
                                  onClick={() => {
                                    setModelSelection(item.value);
                                    setIsModelDropdownOpen(false);
                                  }}
                                  style={{
                                    padding: "8px 10px",
                                    fontSize: "12px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    color: modelSelection === item.value ? "#4F46FF" : "#5A6072",
                                    background: modelSelection === item.value ? "#F4F5FF" : "transparent",
                                    fontWeight: modelSelection === item.value ? 600 : 500
                                  }}
                                  onMouseEnter={(e) => { if (modelSelection !== item.value) e.currentTarget.style.background = "#F7F8FA"; }}
                                  onMouseLeave={(e) => { if (modelSelection !== item.value) e.currentTarget.style.background = "transparent"; }}
                                >
                                  {item.label}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })()}

                  {/* Surfaced Auto-Config Section 1: Retry & pacing */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: isRetryPacingCollapsed ? "0" : "14px" }}>
                    <div
                      onClick={() => setIsRetryPacingCollapsed(!isRetryPacingCollapsed)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isRetryPacingCollapsed ? "rotate(0deg)" : "rotate(90deg)", transition: "transform 200ms ease" }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#1F2433" }}>Retry &amp; Pacing</span>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#22C55E", background: "#ECFDF5", padding: "2px 8px", borderRadius: "6px" }}>
                        Configured ✓
                      </span>
                    </div>
                    {!isRetryPacingCollapsed && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", borderTop: "1px solid #ECEEF2", paddingTop: "12px", fontSize: "12px" }}>
                        <div>
                          <label style={{ fontWeight: 600, color: "#5A6072", display: "block", marginBottom: "4px" }}>Max Call Attempts</label>
                          <input type="number" value={maxCallAttempts} onChange={(e) => setMaxCallAttempts(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #ECEEF2", borderRadius: "6px", background: "#FFFFFF", fontFamily: "inherit" }} />
                        </div>
                        <div>
                          <label style={{ fontWeight: 600, color: "#5A6072", display: "block", marginBottom: "4px" }}>Retry Gap (Days)</label>
                          <input type="number" value={retryGapDays} onChange={(e) => setRetryGapDays(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #ECEEF2", borderRadius: "6px", background: "#FFFFFF", fontFamily: "inherit" }} />
                        </div>
                        <div>
                          <label style={{ fontWeight: 600, color: "#5A6072", display: "block", marginBottom: "4px" }}>Daily Cap Per Number</label>
                          <input type="number" value={dailyCapPerNumber} onChange={(e) => setDailyCapPerNumber(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #ECEEF2", borderRadius: "6px", background: "#FFFFFF", fontFamily: "inherit" }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Surfaced Auto-Config Section 2: Voicemail */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: isVoicemailCollapsed ? "0" : "14px" }}>
                    <div
                      onClick={() => setIsVoicemailCollapsed(!isVoicemailCollapsed)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isVoicemailCollapsed ? "rotate(0deg)" : "rotate(90deg)", transition: "transform 200ms ease" }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#1F2433" }}>Voicemail Handling</span>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#22C55E", background: "#ECFDF5", padding: "2px 8px", borderRadius: "6px" }}>
                        Configured ✓
                      </span>
                    </div>
                    {!isVoicemailCollapsed && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", borderTop: "1px solid #ECEEF2", paddingTop: "12px", fontSize: "12px", color: "#5A6072" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}>
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        <span>
                          <strong style={{ color: "#1F2433" }}>No voicemail is ever left.</strong> If a call reaches an answering machine, the agent hangs up immediately — you&apos;re never charged for talking to a machine. The call is marked unanswered and retried later.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Surfaced Auto-Config Section 3: Compliance */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: isComplianceCollapsed ? "0" : "14px" }}>
                    <div
                      onClick={() => setIsComplianceCollapsed(!isComplianceCollapsed)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isComplianceCollapsed ? "rotate(0deg)" : "rotate(90deg)", transition: "transform 200ms ease" }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#1F2433" }}>Compliance &amp; Calling Window</span>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#22C55E", background: "#ECFDF5", padding: "2px 8px", borderRadius: "6px" }}>
                        Configured ✓
                      </span>
                    </div>
                    {!isComplianceCollapsed && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid #ECEEF2", paddingTop: "12px", fontSize: "12px" }}>
                        <p style={{ margin: 0, fontSize: "11px", color: "#8A90A0" }}>These stay on for every calling agent — legal/safety, not editable.</p>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "#1F2433" }}>
                          <input type="checkbox" checked disabled style={{ accentColor: "#4F46FF" }} />
                          DNC Scrub (opt-out list) <span style={{ color: "#8A90A0", fontWeight: 500 }}>(always on)</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "#1F2433" }}>
                          <input type="checkbox" checked disabled style={{ accentColor: "#4F46FF" }} />
                          Opt-out keyword detection (TCPA) <span style={{ color: "#8A90A0", fontWeight: 500 }}>(always on)</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "#1F2433" }}>
                          <input type="checkbox" checked disabled style={{ accentColor: "#4F46FF" }} />
                          Respect lead timezone call windows <span style={{ color: "#8A90A0", fontWeight: 500 }}>(always on)</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Surfaced Auto-Config Section 4: Enrichment */}
                  {configuringService !== "Appointment Reminders" && (
                    <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: isEnrichmentCollapsed ? "0" : "14px" }}>
                      <div
                        onClick={() => setIsEnrichmentCollapsed(!isEnrichmentCollapsed)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isEnrichmentCollapsed ? "rotate(0deg)" : "rotate(90deg)", transition: "transform 200ms ease" }}>
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#1F2433" }}>Lead Enrichment Settings</span>
                        </div>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#22C55E", background: "#ECFDF5", padding: "2px 8px", borderRadius: "6px" }}>
                          Configured ✓
                        </span>
                      </div>
                      {!isEnrichmentCollapsed && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid #ECEEF2", paddingTop: "12px", fontSize: "12px" }}>
                          {onboardedClient?.targetCustomerType !== "business" ? (
                            <span style={{ fontSize: "12px", color: "#D97706" }}>Enrichment is only for B2B clients — this client sells to consumers, so leads aren&apos;t researched or enriched.</span>
                          ) : (<>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "#1F2433" }}>
                            <input type="checkbox" checked={enrichEnabled} onChange={(e) => setEnrichEnabled(e.target.checked)} style={{ accentColor: "#4F46FF" }} />
                            Enrich each lead before dialing
                          </label>
                          {enrichEnabled && (
                            <div ref={depthRef} style={{ position: "relative" }}>
                              <label style={{ fontWeight: 600, color: "#5A6072", display: "block", marginBottom: "4px" }}>Enrichment Depth</label>
                              <div
                                onClick={() => setIsDepthDropdownOpen(!isDepthDropdownOpen)}
                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: isDepthDropdownOpen ? "1px solid #4F46FF" : "1px solid #ECEEF2", borderRadius: "6px", cursor: "pointer", fontSize: "12px", color: "#1F2433", background: "#FFFFFF", transition: "all 150ms ease" }}
                              >
                                <span>{enrichmentDepth}</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isDepthDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease" }}>
                                  <path d="m6 9 6 6 6-6" />
                                </svg>
                              </div>
                              {isDepthDropdownOpen && (
                                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px", background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "8px", boxShadow: "0 8px 24px rgba(31,36,51,0.08)", zIndex: 100, padding: "6px" }}>
                                  {["Basic (name + phone)", "Standard Profile + Website", "Deep (profile + website + email + ICP fit)"].map((opt) => (
                                    <div
                                      key={opt}
                                      onClick={() => { setEnrichmentDepth(opt); setIsDepthDropdownOpen(false); }}
                                      style={{ padding: "8px 10px", fontSize: "12px", borderRadius: "6px", cursor: "pointer", color: enrichmentDepth === opt ? "#4F46FF" : "#5A6072", background: enrichmentDepth === opt ? "#F4F5FF" : "transparent", fontWeight: enrichmentDepth === opt ? 600 : 500 }}
                                      onMouseEnter={(e) => { if (enrichmentDepth !== opt) e.currentTarget.style.background = "#F7F8FA"; }}
                                      onMouseLeave={(e) => { if (enrichmentDepth !== opt) e.currentTarget.style.background = "transparent"; }}
                                    >
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          </>)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Surfaced Auto-Config Section 5: Scrape Sources */}
                  {configuringService !== "Appointment Reminders" && (
                    <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: isScrapeSourcesCollapsed ? "0" : "14px" }}>
                      <div
                        onClick={() => setIsScrapeSourcesCollapsed(!isScrapeSourcesCollapsed)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isScrapeSourcesCollapsed ? "rotate(0deg)" : "rotate(90deg)", transition: "transform 200ms ease" }}>
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#1F2433" }}>Scraper Sources</span>
                        </div>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#22C55E", background: "#ECFDF5", padding: "2px 8px", borderRadius: "6px" }}>
                          Configured ✓
                        </span>
                      </div>
                      {!isScrapeSourcesCollapsed && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid #ECEEF2", paddingTop: "12px", fontSize: "12px" }}>
                          <label style={{ fontWeight: 600, color: "#5A6072", display: "block" }}>Scraping search engines enabled <span style={{ color: "#8A90A0", fontWeight: 500 }}>(click to toggle)</span></label>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {["Google Maps", "Yellow Pages", "Hotfrog"].map((s) => {
                              const on = scrapeSources.includes(s);
                              return (
                                <span
                                  key={s}
                                  onClick={() => setScrapeSources(prev => on ? prev.filter(x => x !== s) : [...prev, s])}
                                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "20px", background: on ? "#F4F5FF" : "#F4F5F7", border: on ? "1px solid #C7CBF5" : "1px solid #ECEEF2", color: on ? "#4F46FF" : "#A0A6B4", fontSize: "11px", fontWeight: 600, cursor: "pointer", userSelect: "none" }}
                                >
                                  {on ? "✓ " : ""}{s}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Surfaced Auto-Config Section 6: Call Limits */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: isCallLimitsCollapsed ? "0" : "14px" }}>
                    <div
                      onClick={() => setIsCallLimitsCollapsed(!isCallLimitsCollapsed)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isCallLimitsCollapsed ? "rotate(0deg)" : "rotate(90deg)", transition: "transform 200ms ease" }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#1F2433" }}>Calling Limits &amp; Batching</span>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#22C55E", background: "#ECFDF5", padding: "2px 8px", borderRadius: "6px" }}>
                        Configured ✓
                      </span>
                    </div>
                    {!isCallLimitsCollapsed && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid #ECEEF2", paddingTop: "12px", fontSize: "12px" }}>
                        <div>
                          <label style={{ fontWeight: 600, color: "#5A6072", display: "block", marginBottom: "4px" }}>Max Call Length (Min)</label>
                          <input type="number" value={maxCallLength} onChange={(e) => setMaxCallLength(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #ECEEF2", borderRadius: "6px", background: "#FFFFFF", fontFamily: "inherit" }} />
                        </div>
                        <div>
                          <label style={{ fontWeight: 600, color: "#5A6072", display: "block", marginBottom: "4px" }}>Max Leads Per Scraper Run</label>
                          <input type="number" value={maxLeadsPerRun} onChange={(e) => setMaxLeadsPerRun(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #ECEEF2", borderRadius: "6px", background: "#FFFFFF", fontFamily: "inherit" }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 7: Footer actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px", borderTop: "1px solid #ECEEF2", paddingTop: "16px" }}>
                    <button
                      type="button"
                      onClick={() => setConfiguringService(null)}
                      style={{
                        background: "#F4F5FF",
                        color: "#4F46FF",
                        border: "none",
                        borderRadius: "10px",
                        padding: "10px 20px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 150ms ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#EBEFFD"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#F4F5FF"}
                    >
                      Cancel
                    </button>
                    {(() => {
                      // Lead Qualification (capture-only) and Appointment Reminders don't need a meeting.
                      const canActivate = (configuringService === "Lead Qualification" && !recruitmentEnabled) || configuringService === "Appointment Reminders" || !!meetingMode;
                      return (
                    <button
                      type="button"
                      disabled={!canActivate}
                      onClick={handleActivateService}
                      style={{
                        background: canActivate ? "#22C55E" : "#CBD2DD",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "10px",
                        padding: "10px 20px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: canActivate ? "pointer" : "not-allowed",
                        fontFamily: "inherit",
                        transition: "background 150ms ease"
                      }}
                      onMouseEnter={(e) => { if (canActivate) e.currentTarget.style.background = "#16A34A"; }}
                      onMouseLeave={(e) => { if (canActivate) e.currentTarget.style.background = "#22C55E"; }}
                    >
                      {onboardedClient?.services?.includes(configuringService) ? "Save Updates" : "Activate Service"}
                    </button>
                      );
                    })()}
                  </div>

                </div>
              ) : (
                /* Centered Coming Soon Placeholder for the other 8 service IDs */
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 40px", border: "1px solid #ECEEF2", borderRadius: "12px", background: "#FFFFFF", textAlign: "center", marginTop: "10px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#FFFBEB", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                      <line x1="15" y1="21" x2="15" y2="15" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="3" y1="15" x2="21" y2="15" />
                    </svg>
                  </div>
                  <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#1F2433", margin: 0 }}>Configuration for {configuringService}</h4>
                  <p style={{ fontSize: "13px", color: "#8A90A0", margin: "8px 0 20px" }}>This configuration module is coming soon.</p>
                  <button
                    type="button"
                    onClick={() => setConfiguringService(null)}
                    style={{ background: "#F4F5FF", color: "#4F46FF", border: "none", borderRadius: "10px", padding: "10px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "background 150ms ease" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#EBEFFD"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#F4F5FF"}
                  >
                    Back to Services
                  </button>
                </div>
              )
            ) : (
              /* Lists Active Services on the Client, or shows Empty State if none */
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {onboardedClient?.serviceConfigs && Object.keys(onboardedClient.serviceConfigs).length > 0 ? (
                  <>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1F2433", margin: 0 }}>Active Services</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {Object.keys(onboardedClient.serviceConfigs).map((svcId) => {
                        const config = onboardedClient.serviceConfigs?.[svcId];
                        const isActive = onboardedClient.activeServices?.includes(svcId);
                        return (
                          <div key={svcId} style={{ background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", opacity: isActive ? 1 : 0.85 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ECEEF2", paddingBottom: "12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5FF", color: "#4F46FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                  </svg>
                                </span>
                                <span style={{ fontSize: "14px", fontWeight: 700, color: "#1F2433" }}>{svcId}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                {config?.isDraft ? (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#D97706", background: "#FEF3C7", padding: "2px 8px", borderRadius: "6px" }}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#D97706" }} />
                                    Draft
                                  </span>
                                ) : isActive ? (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#10B981", background: "#E6FDF4", padding: "2px 8px", borderRadius: "6px" }}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
                                    Active
                                  </span>
                                ) : (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#8A90A0", background: "#F1F3F5", padding: "2px 8px", borderRadius: "6px" }}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#8A90A0" }} />
                                    Inactive
                                  </span>
                                )}

                                {/* Toggle switch */}
                                <div
                                  onClick={() => {
                                    if (isActive) {
                                      handleDeactivateService(svcId);
                                    } else {
                                      const c = onboardedClient;
                                      if (c) {
                                        const active = c.activeServices || [];
                                        const updatedActive = [...active, svcId];
                                        const serviceConfigs = { ...(c.serviceConfigs || {}) };
                                        if (serviceConfigs[svcId]) {
                                          serviceConfigs[svcId] = {
                                            ...serviceConfigs[svcId],
                                            isDraft: false
                                          };
                                        }
                                        const updated = { ...c, activeServices: updatedActive, serviceConfigs };
                                        setClients(prev => prev.map(x => x.id === c.id ? updated : x));
                                        setOnboardedClient(updated);
                                      }
                                    }
                                  }}
                                  style={{
                                    width: "36px",
                                    height: "20px",
                                    borderRadius: "10px",
                                    background: isActive ? "#22C55E" : "#CBD2DD",
                                    position: "relative",
                                    cursor: "pointer",
                                    transition: "background 150ms ease",
                                    display: "inline-block"
                                  }}
                                >
                                  <div style={{
                                    width: "14px",
                                    height: "14px",
                                    borderRadius: "50%",
                                    background: "#FFFFFF",
                                    position: "absolute",
                                    top: "3px",
                                    left: isActive ? "19px" : "3px",
                                    transition: "left 150ms ease"
                                  }} />
                                </div>

                                {/* Edit icon button */}
                                <button
                                  type="button"
                                  onClick={() => handleConfigureService(svcId)}
                                  title="Edit Service Configuration"
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#5A6072",
                                    cursor: "pointer",
                                    padding: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "4px",
                                    transition: "all 150ms ease"
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = "#4F46FF"; e.currentTarget.style.background = "#F4F5FF"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = "#5A6072"; e.currentTarget.style.background = "transparent"; }}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                  </svg>
                                </button>

                                {/* Delete button (only when inactive) */}
                                {!isActive && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteService(svcId)}
                                    title="Delete Service"
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "#EF4444",
                                      cursor: "pointer",
                                      padding: "4px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      borderRadius: "4px",
                                      transition: "all 150ms ease"
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      <line x1="10" y1="11" x2="10" y2="17" />
                                      <line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Summary Detail items */}
                            {(svcId === "Outbound Sales / Appt Setting" || svcId === "Reactivation & Renewals") && config ? (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "12px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <span style={{ fontWeight: 600, color: "#5A6072" }}>AI Model / Voice</span>
                                  <span style={{ color: "#1F2433" }}>{config.modelSelection} / {config.voiceSelection === "default" ? "Default voice (11labs)" : config.voiceSelection}</span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <span style={{ fontWeight: 600, color: "#5A6072" }}>Phone Pool &amp; Capacity</span>
                                  <span style={{ color: "#1F2433" }}>
                                    {config.phoneNumbers?.length || 0} numbers configured ({ (config.phoneNumbers || []).reduce((acc, curr) => acc + curr.cap, 0) } dials/day)
                                  </span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <span style={{ fontWeight: 600, color: "#5A6072" }}>Meeting Mode</span>
                                  <span style={{ color: "#1F2433" }}>
                                    {config.meetingMode} {config.meetingMode === "Online" || config.meetingMode === "Both" ? `(${config.meetingLink || "No link"})` : ""}
                                  </span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <span style={{ fontWeight: 600, color: "#5A6072" }}>Target Offer</span>
                                  <span style={{ color: "#1F2433", fontStyle: "italic" }}>&quot;{config.clientOffer || "No offer set"}&quot;</span>
                                </div>
                                <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "4px", background: "#F7F8FA", padding: "10px", borderRadius: "8px", border: "1px solid #ECEEF2" }}>
                                  <span style={{ fontWeight: 600, color: "#5A6072" }}>Instructions Script Preview</span>
                                  <span style={{ color: "#5A6072", fontFamily: "monospace", fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {config.scriptText}
                                  </span>
                                </div>
                              </div>
                            ) : (svcId === "Lead Qualification" && config) ? (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "12px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <span style={{ fontWeight: 600, color: "#5A6072" }}>Mode</span>
                                  <span style={{ color: "#1F2433" }}>{config.scriptVariant === "survey" ? "Survey / Research" : "Qualify & score"}{config.recruitmentEnabled ? " + Recruitment (books interview)" : ""}</span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <span style={{ fontWeight: 600, color: "#5A6072" }}>Questions</span>
                                  <span style={{ color: "#1F2433" }}>{(config.qualifyingQuestions || []).filter(q => q && q.trim()).length} configured</span>
                                </div>
                                <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "4px", background: "#F7F8FA", padding: "10px", borderRadius: "8px", border: "1px solid #ECEEF2" }}>
                                  <span style={{ fontWeight: 600, color: "#5A6072" }}>Instructions Script Preview</span>
                                  <span style={{ color: "#5A6072", fontFamily: "monospace", fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{config.scriptText}</span>
                                </div>
                              </div>
                            ) : (svcId === "Appointment Reminders" && config) ? (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "12px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <span style={{ fontWeight: 600, color: "#5A6072" }}>Reminder Type</span>
                                  <span style={{ color: "#1F2433", textTransform: "capitalize" }}>
                                    {String(config.scriptVariant || "").replace(/_/g, " ")}
                                  </span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <span style={{ fontWeight: 600, color: "#5A6072" }}>Reminder Timing</span>
                                  <span style={{ color: "#1F2433" }}>
                                    {config.reminderTimingValue} {config.reminderTimingUnit} {config.scriptVariant === "no_show_recovery" ? "after" : "before"}
                                  </span>
                                </div>
                                <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <span style={{ fontWeight: 600, color: "#5A6072" }}>Appointment Source(s)</span>
                                  <span style={{ color: "#1F2433" }}>
                                    {[
                                      config.remindSourceBooked && "Remind meetings we book",
                                      config.remindSourceCalendar && "Connected calendar",
                                      config.remindSourceUpload && "CSV upload"
                                    ].filter(Boolean).join(", ") || "None"}
                                  </span>
                                </div>
                                <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "4px", background: "#F7F8FA", padding: "10px", borderRadius: "8px", border: "1px solid #ECEEF2" }}>
                                  <span style={{ fontWeight: 600, color: "#5A6072" }}>Instructions Script Preview</span>
                                  <span style={{ color: "#5A6072", fontFamily: "monospace", fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{config.scriptText}</span>
                                </div>
                              </div>
                            ) : (
                              <p style={{ fontSize: "12px", color: "#8A90A0", margin: 0 }}>Service has default system parameters enabled.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 40px", border: "1px dashed #ECEEF2", borderRadius: "12px", background: "#FFFFFF", textAlign: "center" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#F4F5FF", color: "#4F46FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="M12 8v8" />
                        <path d="M8 12h8" />
                      </svg>
                    </div>
                    <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#1F2433", margin: 0 }}>No Active Services Configured</h4>
                    <p style={{ fontSize: "13px", color: "#8A90A0", margin: "8px 0 20px", maxWidth: "340px" }}>
                      This client doesn&apos;t have any active calling agents or data pipelines set up yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddServiceModal(true);
                        setSelectedServiceCategory("");
                        setSelectedSubService("");
                      }}
                      style={{ background: "#4F46FF", color: "#FFFFFF", border: "none", borderRadius: "10px", padding: "10px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "background 150ms ease" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#3F37D9"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#4F46FF"}
                    >
                      Add Your First Service
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
