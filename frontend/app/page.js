"use client";

import { useState, useRef, useEffect } from "react";

// ponytail: mock data — swap for Supabase query later
const CLIENTS = [
  { id: "acc_1042", name: "Acme Realty", email: "ops@acmerealty.com" },
  { id: "acc_1087", name: "BlueSky Insurance", email: "hello@bluesky.io" },
  { id: "acc_1130", name: "Northwind Logistics", email: "team@northwind.co" },
  { id: "acc_1156", name: "Sunrise Dental", email: "front@sunrisedental.com" },
  { id: "acc_1199", name: "Vertex Solar", email: "sales@vertexsolar.com" },
  { id: "acc_1203", name: "Harbor Financial", email: "contact@harborfin.com" },
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

const SERVICE_SUB_OPTIONS = {
  "Answer My Phones": [
    "Receptionist (business hours)",
    "After-Hours / Overflow",
    "24/7 Coverage",
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

export default function Home() {
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

  const [paymentLogs, setPaymentLogs] = useState([
    { id: "pay_1", client: "Harbor Financial", amount: 5000, status: "Paid", date: "2026-06-28", remark: "June Monthly Retainer" },
    { id: "pay_2", client: "Acme Realty", amount: 1200, status: "Paid", date: "2026-06-15", remark: "Google Ads & CRM management" },
    { id: "pay_3", client: "Northwind Logistics", amount: 2500, status: "Paid", date: "2026-06-10", remark: "B2B SDR Prospecting" },
    { id: "pay_4", client: "Sunrise Dental", amount: 1500, status: "Unpaid", date: "2026-06-01", remark: "Inbound answering line (Overdue)" }
  ]);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingStatus, setEditingStatus] = useState("Paid");
  const [editingAmount, setEditingAmount] = useState("");
  const [editingRemark, setEditingRemark] = useState("");

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
      if (timeframeRef.current && !timeframeRef.current.contains(e.target)) setShowTimeframeDropdown(false);
      if (revenueTimeframeRef.current && !revenueTimeframeRef.current.contains(e.target)) setShowRevenueTimeframeDropdown(false);
      if (paymentClientRef.current && !paymentClientRef.current.contains(e.target)) setPaymentClientOpen(false);
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

  const q = query.trim().toLowerCase();
  const matches = q
    ? CLIENTS.filter(
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
            <div style={{ fontSize: "20px", fontWeight: 600, color: "#1F2433" }}>
              {currentView === "dashboard" ? "Overview" : currentView === "health" ? "System Health" : currentView === "revenue" ? "Revenue & Payments" : "Client Directory"}
            </div>
            <div style={{ fontSize: "12px", color: "#8A90A0", marginTop: "2px" }}>
              {currentView === "dashboard" ? "Agency dashboard" : currentView === "health" ? "Real-time operational status" : currentView === "revenue" ? "Billing logs and revenue metrics" : "Full client roster and search"}
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
            {/* Notification Bell Button */}
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

            <button style={{ background: "#4F46FF", color: "#FFFFFF", border: "none", borderRadius: "10px", padding: "9px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              Add Organization
            </button>
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
                        <div ref={timeframeRef} style={{ position: "relative" }}>
                          <button
                            onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                            style={{
                              background: "#FFFFFF",
                              border: "1px solid #ECEEF2",
                              borderRadius: "8px",
                              padding: "6px 12px",
                              fontSize: "11px",
                              fontWeight: 500,
                              color: "#5A6072",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontFamily: "inherit",
                              transition: "all 150ms ease"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "#4F46FF";
                              e.currentTarget.style.color = "#1F2433";
                            }}
                            onMouseLeave={(e) => {
                              if (!showTimeframeDropdown) {
                                e.currentTarget.style.borderColor = "#ECEEF2";
                                e.currentTarget.style.color = "#5A6072";
                              }
                            }}
                          >
                            {TIMEFRAME_DATA[timeframe].label}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                          </button>
                          
                          {showTimeframeDropdown && (
                            <div style={{
                              position: "absolute",
                              top: "calc(100% + 6px)",
                              right: 0,
                              background: "#FFFFFF",
                              border: "1px solid #ECEEF2",
                              borderRadius: "10px",
                              boxShadow: "0 8px 24px rgba(31,36,51,0.08)",
                              padding: "4px",
                              zIndex: 50,
                              minWidth: "130px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px"
                            }}>
                              {Object.entries(TIMEFRAME_DATA).map(([key, data]) => (
                                <div
                                  key={key}
                                  onClick={() => {
                                    setTimeframe(key);
                                    setShowTimeframeDropdown(false);
                                  }}
                                  style={{
                                    padding: "6px 10px",
                                    fontSize: "12px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    color: timeframe === key ? "#4F46FF" : "#5A6072",
                                    backgroundColor: timeframe === key ? "#F4F5FF" : "transparent",
                                    fontWeight: timeframe === key ? 600 : 500,
                                    transition: "all 150ms ease"
                                  }}
                                  onMouseEnter={(e) => {
                                    if (timeframe !== key) e.currentTarget.style.backgroundColor = "#F7F8FA";
                                  }}
                                  onMouseLeave={(e) => {
                                    if (timeframe !== key) e.currentTarget.style.backgroundColor = "transparent";
                                  }}
                                >
                                  {data.label}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
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

                          {/* Active Dot Indicators */}
                          {hoveredIdx !== null && (
                            <>
                              <circle
                                cx={xCoords[hoveredIdx]}
                                cy={revenue[hoveredIdx]}
                                r="4.5"
                                fill="#FFFFFF"
                                stroke="#4F46FF"
                                strokeWidth="2.5"
                              />
                              <circle
                                cx={xCoords[hoveredIdx]}
                                cy={cost[hoveredIdx]}
                                r="4.5"
                                fill="#FFFFFF"
                                stroke="#A8AEBC"
                                strokeWidth="2.5"
                              />
                            </>
                          )}

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
                              {CLIENTS.filter(c => c.name.toLowerCase().includes(paymentClientSearch.toLowerCase())).length > 0 ? (
                                CLIENTS.filter(c => c.name.toLowerCase().includes(paymentClientSearch.toLowerCase())).map((c) => (
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
                      const allClients = [
                        {
                          id: "acc_Harbor",
                          name: "Harbor Financial",
                          avatar: "HF",
                          color: "#0F172A",
                          leads: "210 Ready Leads",
                          services: ["Do Everything (Full Funnel)"],
                          health: "Operational",
                          retainer: "$5,000.00",
                          payment: "Paid",
                          score: 99,
                          onboarded: "2026-06-28"
                        },
                        {
                          id: "acc_Acme",
                          name: "Acme Realty",
                          avatar: "AR",
                          color: "#4F46FF",
                          leads: "24 Ready Leads",
                          services: ["Answer My Phones", "Call Leads & Book", "Fix Lead List"],
                          health: errors.some(e => e.client && e.client.includes("Acme")) ? "Degraded" : "Operational",
                          retainer: "$1,200.00",
                          payment: "Paid",
                          score: 74,
                          onboarded: "2026-03-10"
                        },
                        {
                          id: "acc_Northwind",
                          name: "Northwind Logistics",
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
                          avatar: "SD",
                          color: "#EF4444",
                          leads: errors.some(e => e.client && e.client.includes("Sunrise")) ? "0 Leads (Paused)" : "45 Ready Leads",
                          services: ["Call Leads & Qualify", "Fix Lead List", "Find New Leads"],
                          health: errors.some(e => e.client && e.client.includes("Sunrise")) ? "Paused" : "Operational",
                          retainer: "$1,500.00",
                          payment: "Unpaid",
                          score: 35,
                          onboarded: "2026-06-18"
                        },
                        {
                          id: "acc_Oakwood",
                          name: "Oakwood Estates",
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
                          avatar: "AH",
                          color: "#06B6D4",
                          leads: "64 Ready Leads",
                          services: ["Call Leads & Book", "Appointment Reminders", "Find New Leads"],
                          health: "Operational",
                          retainer: "$2,100.00",
                          payment: "Paid",
                          score: 85,
                          onboarded: "2026-05-02"
                        }
                      ];

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
                          style={{
                            borderBottom: "1px solid #F0F1F4",
                            transition: "background-color 150ms ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9FAFB"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          {/* Client Name with Avatar */}
                          <td style={{ padding: "12px 10px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: client.color,
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: 600,
                              flexShrink: 0
                            }}>
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

                const xCoords = [60, 208, 356, 504, 652, 800, 948];
                
                const getBezierPath = (data) => {
                  let path = `M ${xCoords[0]} ${data[0]}`;
                  for (let i = 0; i < data.length - 1; i++) {
                    const x0 = xCoords[i];
                    const y0 = data[i];
                    const x1 = xCoords[i + 1];
                    const y1 = data[i + 1];
                    const cpX1 = x0 + 50;
                    const cpY1 = y0;
                    const cpX2 = x1 - 50;
                    const cpY2 = y1;
                    path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x1} ${y1}`;
                  }
                  return path;
                };

                const revenue = TIMEFRAME_DATA[revenueTimeframe].revenue;
                const cost = TIMEFRAME_DATA[revenueTimeframe].cost;
                const revFillPath = `${getBezierPath(revenue)} L 948,150 L 60,150 Z`;

                return (
                  <>
                    {/* Card Header Row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#1F2433" }}>Revenue & Cost Performance</span>
                      
                      {/* Timeframe selector button */}
                      <div ref={revenueTimeframeRef} style={{ position: "relative" }}>
                        <button
                          onClick={() => setShowRevenueTimeframeDropdown(!showRevenueTimeframeDropdown)}
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #ECEEF2",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "#5A6072",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontFamily: "inherit",
                            transition: "all 150ms ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#4F46FF";
                            e.currentTarget.style.color = "#1F2433";
                          }}
                          onMouseLeave={(e) => {
                            if (!showRevenueTimeframeDropdown) {
                              e.currentTarget.style.borderColor = "#ECEEF2";
                              e.currentTarget.style.color = "#5A6072";
                            }
                          }}
                        >
                          {TIMEFRAME_DATA[revenueTimeframe].label}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </button>
                        
                        {showRevenueTimeframeDropdown && (
                          <div style={{
                            position: "absolute",
                            top: "calc(100% + 6px)",
                            right: 0,
                            background: "#FFFFFF",
                            border: "1px solid #ECEEF2",
                            borderRadius: "10px",
                            boxShadow: "0 8px 24px rgba(31,36,51,0.08)",
                            padding: "4px",
                            zIndex: 50,
                            minWidth: "130px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px"
                          }}>
                            {Object.entries(TIMEFRAME_DATA).map(([key, data]) => (
                              <div
                                key={key}
                                onClick={() => {
                                  setRevenueTimeframe(key);
                                  setShowRevenueTimeframeDropdown(false);
                                }}
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "11px",
                                  fontWeight: 500,
                                  color: revenueTimeframe === key ? "#4F46FF" : "#5A6072",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  background: revenueTimeframe === key ? "#F4F5FF" : "transparent",
                                  transition: "all 150ms ease"
                                }}
                                onMouseEnter={(e) => {
                                  if (revenueTimeframe !== key) e.currentTarget.style.background = "#F7F8FA";
                                }}
                                onMouseLeave={(e) => {
                                  if (revenueTimeframe !== key) e.currentTarget.style.background = "transparent";
                                }}
                              >
                                {data.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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

                    {/* SVG Bezier Line Plot wrapper */}
                    <div style={{ position: "relative", width: "100%", height: "240px" }}>
                      <svg
                        viewBox="0 0 1000 180"
                        preserveAspectRatio="none"
                        style={{ width: "100%", height: "100%", overflow: "visible" }}
                      >
                        {/* Grids and labels */}
                        <line x1="60" y1="30" x2="948" y2="30" stroke="#F1F3F6" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="50" y="33" textAnchor="end" fontSize="9" fill="#A3AED0" fontWeight="500">100k</text>

                        <line x1="60" y1="60" x2="948" y2="60" stroke="#F1F3F6" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="50" y="63" textAnchor="end" fontSize="9" fill="#A3AED0" fontWeight="500">75k</text>

                        <line x1="60" y1="90" x2="948" y2="90" stroke="#F1F3F6" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="50" y="93" textAnchor="end" fontSize="9" fill="#A3AED0" fontWeight="500">50k</text>

                        <line x1="60" y1="120" x2="948" y2="120" stroke="#F1F3F6" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="50" y="123" textAnchor="end" fontSize="9" fill="#A3AED0" fontWeight="500">25k</text>

                        <line x1="60" y1="150" x2="948" y2="150" stroke="#E2E8F0" strokeWidth="1" />
                        <text x="50" y="153" textAnchor="end" fontSize="9" fill="#A3AED0" fontWeight="500">0</text>

                        {/* X Axis Labels */}
                        {TIMEFRAME_DATA[revenueTimeframe].labels.map((lbl, idx) => (
                          <text
                            key={lbl}
                            x={xCoords[idx]}
                            y="168"
                            textAnchor="middle"
                            fontSize="9"
                            fill={revenueHoveredIdx === idx ? "#1F2433" : "#A3AED0"}
                            fontWeight={revenueHoveredIdx === idx ? "600" : "500"}
                          >
                            {lbl}
                          </text>
                        ))}

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
                            y1="30"
                            x2={xCoords[revenueHoveredIdx]}
                            y2="150"
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

                        {/* Active Dots on Hover */}
                        {revenueHoveredIdx !== null && (
                          <>
                            <circle
                              cx={xCoords[revenueHoveredIdx]}
                              cy={revenue[revenueHoveredIdx]}
                              r="6"
                              fill="#4F46FF"
                              stroke="#FFFFFF"
                              strokeWidth="2"
                              style={{ filter: "drop-shadow(0px 2px 4px rgba(79, 70, 255, 0.4))" }}
                            />
                            <circle
                              cx={xCoords[revenueHoveredIdx]}
                              cy={cost[revenueHoveredIdx]}
                              r="6"
                              fill="#F59E0B"
                              stroke="#FFFFFF"
                              strokeWidth="2"
                              style={{ filter: "drop-shadow(0px 2px 4px rgba(245, 158, 11, 0.4))" }}
                            />
                          </>
                        )}

                        {/* Hover Overlay Columns */}
                        {xCoords.map((x, idx) => (
                          <rect
                            key={idx}
                            x={x - 74}
                            y="10"
                            width="148"
                            height="140"
                            fill="transparent"
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setRevenueHoveredIdx(idx)}
                          />
                        ))}
                      </svg>

                      {/* Tooltip Overlay */}
                      {revenueHoveredIdx !== null && (
                        <div
                          style={{
                            position: "absolute",
                            left: `${(xCoords[revenueHoveredIdx] / 1000) * 100}%`,
                            top: `${(revenue[revenueHoveredIdx] / 180) * 100 - 15}%`,
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

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", tableLayout: "fixed" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #ECEEF2" }}>
                      <th style={{ width: "25%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Client Name</th>
                      <th style={{ width: "15%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Amount</th>
                      <th style={{ width: "18%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Status</th>
                      <th style={{ width: "15%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Payment Date</th>
                      <th style={{ width: "20%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Remark</th>
                      <th style={{ width: "12%", fontSize: "10px", fontWeight: 600, color: "#8A90A0", padding: "10px 12px", textTransform: "uppercase" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentLogs.map((log) => {
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
                      const allClients = [
                        {
                          id: "acc_Harbor",
                          name: "Harbor Financial",
                          avatar: "HF",
                          color: "#0F172A",
                          leads: "210 Ready Leads",
                          services: ["Do Everything (Full Funnel)"],
                          health: "Operational",
                          retainer: "$5,000.00",
                          payment: "Paid",
                          score: 99,
                          onboarded: "2026-06-28"
                        },
                        {
                          id: "acc_Acme",
                          name: "Acme Realty",
                          avatar: "AR",
                          color: "#4F46FF",
                          leads: "24 Ready Leads",
                          services: ["Answer My Phones", "Call Leads & Book", "Fix Lead List"],
                          health: errors.some(e => e.client && e.client.includes("Acme")) ? "Degraded" : "Operational",
                          retainer: "$1,200.00",
                          payment: "Paid",
                          score: 74,
                          onboarded: "2026-03-10"
                        },
                        {
                          id: "acc_Northwind",
                          name: "Northwind Logistics",
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
                          avatar: "SD",
                          color: "#EF4444",
                          leads: errors.some(e => e.client && e.client.includes("Sunrise")) ? "0 Leads (Paused)" : "45 Ready Leads",
                          services: ["Call Leads & Qualify", "Fix Lead List", "Find New Leads"],
                          health: errors.some(e => e.client && e.client.includes("Sunrise")) ? "Paused" : "Operational",
                          retainer: "$1,500.00",
                          payment: "Unpaid",
                          score: 35,
                          onboarded: "2026-06-18"
                        },
                        {
                          id: "acc_Oakwood",
                          name: "Oakwood Estates",
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
                          avatar: "AH",
                          color: "#06B6D4",
                          leads: "64 Ready Leads",
                          services: ["Call Leads & Book", "Appointment Reminders", "Find New Leads"],
                          health: "Operational",
                          retainer: "$2,100.00",
                          payment: "Paid",
                          score: 85,
                          onboarded: "2026-05-02"
                        }
                      ];

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
                          style={{
                            borderBottom: "1px solid #F0F1F4",
                            transition: "background-color 150ms ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9FAFB"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          {/* Client Name with Avatar */}
                          <td style={{ padding: "12px 10px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: client.color,
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: 600,
                              flexShrink: 0
                            }}>
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

      </div>
    </div>
  );
}
