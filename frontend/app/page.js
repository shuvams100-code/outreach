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

export default function Home() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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
      <div style={{ width: "56px", flexShrink: 0, backgroundColor: "#FFFFFF", borderRight: "1px solid #ECEEF2", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "16px", gap: "24px" }}>
        <img src="/logo.png" alt="Reacher AI" style={{ width: "36px", height: "36px" }} />
        <div style={{ flex: 1 }} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, padding: "20px 24px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: "20px", fontWeight: 600, color: "#1F2433" }}>Overview</div>
            <div style={{ fontSize: "12px", color: "#8A90A0", marginTop: "2px" }}>Agency dashboard</div>
          </div>

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

          <button style={{ marginLeft: "auto", flexShrink: 0, background: "#4F46FF", color: "#FFFFFF", border: "none", borderRadius: "10px", padding: "9px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            Add Organization
          </button>
        </div>

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

        {/* Bottom row — chart left half, right half empty */}
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1, background: "#FFFFFF", border: "1px solid #ECEEF2", borderRadius: "12px", padding: "20px 24px" }}>
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
            <div style={{ fontSize: "11px", color: "#8A90A0", marginBottom: "16px" }}>Last 7 days</div>
            <svg viewBox="0 0 500 160" style={{ width: "100%", height: "160px" }} preserveAspectRatio="none">
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1="0" y1={i * 40 + 20} x2="500" y2={i * 40 + 20} stroke="#F0F1F4" strokeWidth="1" />
              ))}
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46FF" />
                  <stop offset="100%" stopColor="#4F46FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points="0,130 80,118 160,105 240,95 320,78 400,60 500,42 500,160 0,160" fill="url(#revGrad)" opacity="0.12" />
              <polyline points="0,120 80,115 160,110 240,108 320,105 400,100 500,95" fill="none" stroke="#C9CDD6" strokeWidth="1.5" strokeDasharray="5 4" />
              <polyline points="0,130 80,118 160,105 240,95 320,78 400,60 500,42" fill="none" stroke="#4F46FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                <text key={d} x={i * 83} y="158" fontSize="10" fill="#A0A6B4" textAnchor="middle">{d}</text>
              ))}
            </svg>
          </div>
          <div style={{ flex: 1 }} />
        </div>

      </div>
    </div>
  );
}
