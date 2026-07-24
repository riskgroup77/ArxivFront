/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import LoginScreen from "./components/LoginScreen.tsx";
import Sidebar from "./components/Sidebar.tsx";
import DashboardTab from "./components/DashboardTab.tsx";
import SearchTab from "./components/SearchTab.tsx";
import IntakeTab from "./components/IntakeTab.tsx";
import RepositoryTab from "./components/RepositoryTab.tsx";
import SettingsTab from "./components/SettingsTab.tsx";
import AdminTab from "./components/AdminTab.tsx";
import { api, removeAuthToken } from "./api.ts";
import { Menu, Languages } from "lucide-react";
import { useTranslation } from "./components/LanguageContext.tsx";

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [tabFilters, setTabFilters] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const { lang, setLang, t } = useTranslation();

  // Restore authenticated session on mount (validate token with /auth/me)
  useEffect(() => {
    const savedToken = localStorage.getItem("arxiv_access_token") || localStorage.getItem("arxiv_auth_token");
    if (!savedToken) return;

    api
      .getMe()
      .then((user) => setCurrentUser(user))
      .catch(() => removeAuthToken());
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setActiveTab("dashboard");
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      removeAuthToken();
    }
    setCurrentUser(null);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setTabFilters(null); // Clear temporary filters inside transition
  };

  const handleNavWithFilters = (tabId: string, filters?: any) => {
    setTabFilters(filters || null);
    setActiveTab(tabId);
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50/40 text-neutral-800 font-sans overflow-hidden selection:bg-indigo-650 selection:text-white">
      {/* Sidebar navigation */}
      <Sidebar 
        currentUser={currentUser} 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content container */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-slate-50/40">
        
        {/* Mobile thin top nav bar */}
        <header className="h-14 border-b border-indigo-100 bg-white flex items-center justify-between px-4 md:hidden shrink-0 no-print">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-indigo-650 bg-indigo-650 text-white flex items-center justify-center font-display font-black text-xs select-none rounded">
              A
            </div>
            <h1 className="text-xs font-display font-extrabold uppercase tracking-tight text-indigo-950">{t("Institut Arxivi")}</h1>
          </div>
          
          <div className="flex items-center gap-2.5">
            {/* Mobile language switch toggle */}
            <div className="flex items-center bg-indigo-50/50 p-0.5 rounded-lg border border-indigo-100/50 text-[9px] font-bold">
              <button
                type="button"
                onClick={() => setLang("cyrillic")}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer font-sans ${lang === "cyrillic" ? "bg-indigo-650 text-white shadow-xs" : "text-neutral-500 hover:text-indigo-950"}`}
              >
                КИРИЛ
              </button>
              <button
                type="button"
                onClick={() => setLang("latin")}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer font-sans ${lang === "latin" ? "bg-indigo-650 text-white shadow-xs" : "text-neutral-500 hover:text-indigo-950"}`}
              >
                LOTIN
              </button>
            </div>
            
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-1 px-2.5 border border-indigo-200 text-indigo-700 bg-indigo-50/30 hover:bg-indigo-50 flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase transition-all rounded cursor-pointer"
            >
              <Menu className="w-3.5 h-3.5 text-indigo-600" /> {t("Menu")}
            </button>
          </div>
        </header>

        {/* Desktop title / location bar */}
        <header className="h-16 border-b border-indigo-100/60 hidden md:flex items-center justify-between px-8 bg-white shrink-0 no-print shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-950 font-mono">
            {activeTab === "dashboard" && t("Dashboard // Umumiy Statistika")}
            {activeTab === "search" && t("Qidiruv (Search) // Hujjatlar Qidiruvi")}
            {activeTab === "intake" && t("Hujjat qabul (Intake) // Yangi Hujjat Qo'shish")}
            {activeTab === "documents" && t("Hujjatlar ro'yxati // Arxiv Hujjatlari Ombori")}
            {activeTab === "settings" && t("Kategoriyalar & Shkaflar // Tizim Spravochniklari")}
            {activeTab === "admin" && t("Admin panel // Tizim Sozlamalari & Audit")}
          </h2>
          
          <div className="flex items-center gap-4">
            {/* Desktop language switch segmented control */}
            <div className="flex items-center border border-indigo-50 rounded-xl bg-indigo-50/10 p-0.5 font-sans text-xs shrink-0 select-none">
              <span className="text-[10px] text-indigo-950/60 font-extrabold uppercase tracking-wide px-2 flex items-center gap-1 font-mono">
                <Languages className="w-3.5 h-3.5 text-indigo-500" /> Скрипт:
              </span>
              <div className="flex bg-white shadow-xs border border-indigo-50/55 p-0.5 rounded-lg text-[10px] font-black">
                <button
                  type="button"
                  onClick={() => setLang("cyrillic")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer tracking-wider ${lang === "cyrillic" ? "bg-indigo-650 text-white shadow-xs" : "text-neutral-500 hover:text-indigo-650 hover:bg-slate-50"}`}
                >
                  КИРИЛЛ (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setLang("latin")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer tracking-wider ${lang === "latin" ? "bg-indigo-650 text-white shadow-xs" : "text-neutral-500 hover:text-indigo-650 hover:bg-slate-50"}`}
                >
                  LOTIN (Uz)
                </button>
              </div>
            </div>

            <span className="inline-block border border-indigo-100 text-[9px] px-2.5 py-1 font-mono font-black uppercase bg-indigo-50 text-indigo-750 rounded shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
              {currentUser?.role === 'admin' ? t("Bosh Arxivchi (Admin)") : t("Arxiv Operator")}
            </span>
          </div>
        </header>

        {/* Main Work Area viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="no-print">
              {activeTab === "dashboard" && (
                <DashboardTab onNavigateToTab={handleNavWithFilters} />
              )}

              {activeTab === "search" && (
                <SearchTab initialFilters={tabFilters} />
              )}

              {activeTab === "intake" && (
                <IntakeTab onNavigateToTab={handleTabChange} />
              )}

              {activeTab === "documents" && (
                <RepositoryTab currentUser={currentUser} />
              )}

              {activeTab === "settings" && (
                <SettingsTab />
              )}

              {activeTab === "admin" && (
                <AdminTab />
              )}
            </div>
          </div>
        </main>

        {/* Status indicator footer bar */}
        <footer className="h-8 border-t border-indigo-100/50 bg-white flex items-center justify-between px-6 sm:px-8 text-[9px] uppercase font-bold text-slate-500 shrink-0 no-print font-mono shadow-[0_-1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center space-x-6">
            <span>{t("Tizim holati")}: <span className="text-emerald-600 font-bold">{t("ONLINE")}</span></span>
            <span className="text-slate-200">|</span>
            <span className="hidden sm:inline">{t("Kanal")}: <span className="text-slate-700">{t("Sertifikatlangan LAN")}</span></span>
            <span className="hidden sm:inline text-slate-200">|</span>
            <span>{t("Faol xodim")}: <span className="text-indigo-700">{currentUser?.fullName}</span></span>
          </div>
          <div className="hidden xs:block">{t("Arxiv Departament")} &copy; {new Date().getFullYear()}</div>
        </footer>

      </div>
    </div>
  );
}
