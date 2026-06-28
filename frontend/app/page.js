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

export default function Home() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [timeframe, setTimeframe] = useState("7d");
  const [selectHovered, setSelectHovered] = useState(false);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const boxRef = useRef(null);
  const timeframeRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
      if (timeframeRef.current && !timeframeRef.current.contains(e.target)) setShowTimeframeDropdown(false);
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

    console.log("Logged Payment:", {
      client: paymentClient,
      amount: parseFloat(paymentAmount),
      status: paymentStatus,
      date: paymentDate,
      remark: paymentRemark
    });

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

        <div style={{ flex: 1 }} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, padding: "20px 24px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: "20px", fontWeight: 600, color: "#1F2433" }}>
              {currentView === "dashboard" ? "Overview" : "System Health"}
            </div>
            <div style={{ fontSize: "12px", color: "#8A90A0", marginTop: "2px" }}>
              {currentView === "dashboard" ? "Agency dashboard" : "Real-time operational status"}
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
                borderRadius: "10px",
                border: "1px solid #ECEEF2",
                background: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 150ms ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#4F46FF";
                e.currentTarget.style.background = "#F4F5FF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#ECEEF2";
                e.currentTarget.style.background = "#FFFFFF";
              }}
            >
              {errors.length > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 z-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
                </span>
              ) : (
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
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </div>

            <button style={{ background: "#4F46FF", color: "#FFFFFF", border: "none", borderRadius: "10px", padding: "9px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              Add Organization
            </button>
          </div>
        </div>

        {currentView === "dashboard" ? (
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
              <div style={{ gridColumn: "span 2", background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1F2433" }}>Revenue vs Cost</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#5A6072" }}>
                      <span style={{ width: "20px", height: "2px", background: "#4F46FF", display: "inline-block", borderRadius: "2px" }}></span>Revenue
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#5A6072" }}>
                      <span style={{ width: "20px", height: "0px", borderTop: "2px dashed #A8AEBC", display: "inline-block" }}></span>Cost
                    </span>
                  </div>
                </div>
                <div ref={timeframeRef} style={{ position: "relative", marginBottom: "16px", display: "inline-block" }}>
                  <div
                    onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                    onMouseEnter={() => setSelectHovered(true)}
                    onMouseLeave={() => setSelectHovered(false)}
                    style={{
                      fontSize: "11px",
                      color: selectHovered || showTimeframeDropdown ? "#1F2433" : "#8A90A0",
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      userSelect: "none",
                      transition: "color 150ms ease"
                    }}
                  >
                    {TIMEFRAME_DATA[timeframe].label}
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: showTimeframeDropdown ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 200ms ease"
                      }}
                    >
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>
                  {showTimeframeDropdown && (
                    <div style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
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
                <svg viewBox="0 0 500 150" style={{ width: "100%", height: "220px" }} preserveAspectRatio="none">
                  {[0, 1, 2, 3].map((i) => (
                    <line key={i} x1="0" y1={i * 40 + 20} x2="500" y2={i * 40 + 20} stroke="#F0F1F4" strokeWidth="1" />
                  ))}
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46FF" />
                      <stop offset="100%" stopColor="#4F46FF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={`${TIMEFRAME_DATA[timeframe].revenue.map((val, idx) => `${[0, 83, 167, 250, 333, 417, 500][idx]},${val}`).join(" ")} 500,150 0,150`}
                    fill="url(#revGrad)"
                    opacity="0.12"
                  />
                  <polyline
                    points={TIMEFRAME_DATA[timeframe].revenue.map((val, idx) => `${[0, 83, 167, 250, 333, 417, 500][idx]},${val}`).join(" ")}
                    fill="none"
                    stroke="#4F46FF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points={TIMEFRAME_DATA[timeframe].cost.map((val, idx) => `${[0, 83, 167, 250, 333, 417, 500][idx]},${val}`).join(" ")}
                    fill="none"
                    stroke="#A8AEBC"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {TIMEFRAME_DATA[timeframe].revenue.map((val, idx) => (
                    <circle
                      key={`rev-${idx}`}
                      cx={[0, 83, 167, 250, 333, 417, 500][idx]}
                      cy={val}
                      r="3.5"
                      fill="#FFFFFF"
                      stroke="#4F46FF"
                      strokeWidth="2.5"
                    />
                  ))}
                </svg>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", padding: "0 4px" }}>
                  {TIMEFRAME_DATA[timeframe].labels.map((lbl, idx) => (
                    <span key={idx} style={{ fontSize: "10px", color: "#8A90A0", fontWeight: 500, width: "50px", textAlign: "center" }}>
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>

              {/* Form Card */}
              <div style={{ gridColumn: "span 2", background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1F2433", marginBottom: "2px" }}>Log Client Payment</div>
                  <div style={{ fontSize: "11px", color: "#8A90A0", marginBottom: "16px" }}>Record manual bank transfer logs</div>

                  <form onSubmit={handleLogPayment} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "10px", fontWeight: 600, color: "#5A6072" }}>Client</label>
                        <select
                          value={paymentClient}
                          onChange={(e) => setPaymentClient(e.target.value)}
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
                          <option value="">Select client</option>
                          {CLIENTS.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
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
          </>
        ) : (
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

      </div>
    </div>
  );
}
