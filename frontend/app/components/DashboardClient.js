"use client";

import { useState, useRef } from "react";
import { 
  Search, 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Zap,
  Activity,
  Sparkles
} from "lucide-react";

export default function DashboardClient({ initialAccounts }) {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef(null);

  const handleClear = () => {
    setSearchQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Filter accounts by business name
  const filteredAccounts = initialAccounts.filter((account) => {
    const name = account.business_name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-100">
      
      {/* Top Header Row containing Logo and Centered Search Bar */}
      <header className="relative w-full max-w-7xl mx-auto pt-8 px-6 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Logo - Extreme Left */}
        <div className="flex items-center gap-2.5 z-10 self-start md:self-auto">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/10">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            Reacher AI
          </span>
        </div>

        {/* Search Box - Top-Centre (Responsive placement) */}
        <div className="w-full md:absolute md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 md:max-w-md z-0">
          <div className="relative group">
            {/* Subtle glow effect behind search input */}
            <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur group-focus-within:opacity-100 opacity-0 transition duration-500" />
            <div className="relative flex items-center bg-white border border-slate-200/80 group-focus-within:border-indigo-500 group-focus-within:ring-4 group-focus-within:ring-indigo-500/5 rounded-full py-2 px-4.5 shadow-sm transition-all duration-300">
              <Search className="w-4 h-4 text-slate-400 mr-2 group-focus-within:text-indigo-600 transition-colors" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search by company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-sm w-full focus:ring-0 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={handleClear}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Empty element to balance header spacing on large screens */}
        <div className="hidden md:block w-32 h-8" />

      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-8 mt-12 pb-16">
        
        {/* List of Company Cards */}
        <div className="w-full max-w-2xl mx-auto">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm border border-dashed border-slate-200 rounded-2xl">
              No companies found matching &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredAccounts.map((account) => {
                const isActive = account.status === "active";
                const parsedSources = Array.isArray(account.sources) 
                  ? account.sources 
                  : [];
                const activeSources = parsedSources.filter(s => s.enabled).map(s => s.key);

                return (
                  <div
                    key={account.id}
                    className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-250 flex flex-col justify-between"
                  >
                    {/* Card Header: Business Name & Status */}
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        {account.business_name || "Unnamed Company"}
                      </h2>
                      
                      {/* Status Pill Badge */}
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm ${
                        isActive 
                          ? "bg-emerald-50/60 border-emerald-100 text-emerald-700"
                          : "bg-amber-50/60 border-amber-100 text-amber-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {isActive ? "Active" : "Paused"}
                      </span>
                    </div>

                    {/* Card Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
                      
                      {/* Left Column: Contact info */}
                      <div className="space-y-2.5">
                        {account.contact_name && (
                          <div className="flex items-center gap-2.5">
                            <User className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-700">{account.contact_name}</span>
                          </div>
                        )}
                        {account.contact_email && (
                          <div className="flex items-center gap-2.5">
                            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                            <a href={`mailto:${account.contact_email}`} className="hover:text-indigo-600 hover:underline transition-colors truncate">
                              {account.contact_email}
                            </a>
                          </div>
                        )}
                        {account.contact_phone && (
                          <div className="flex items-center gap-2.5">
                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                            <a href={`tel:${account.contact_phone}`} className="hover:text-indigo-600 hover:underline transition-colors truncate">
                              {account.contact_phone}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Location & Rules */}
                      <div className="space-y-2.5">
                        {(account.geo_city || account.geo_state) && (
                          <div className="flex items-center gap-2.5">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>
                              {[account.geo_city, account.geo_state].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                        {account.broker_timezone && (
                          <div className="flex items-center gap-2.5">
                            <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{account.broker_timezone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 text-slate-500">
                          <Activity className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Daily Cap: <span className="font-semibold text-slate-700">{account.daily_dial_cap ?? 40} dials</span></span>
                        </div>
                      </div>

                    </div>

                    {/* Sources Badges */}
                    {activeSources.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-slate-100">
                        {activeSources.map((source) => (
                          <span 
                            key={source} 
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/50"
                          >
                            <Zap className="w-2.5 h-2.5 text-indigo-500" />
                            {source.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

    </div>
  );
}
