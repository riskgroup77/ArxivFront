/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { UserRole } from "../types.js";
import { 
  LogOut, 
  LayoutGrid, 
  Search, 
  FilePlus2, 
  Database, 
  Scroll, 
  FolderLock,
  X
} from "lucide-react";
import { useTranslation } from "./LanguageContext.tsx";

interface SidebarProps {
  currentUser: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentUser, activeTab, onTabChange, onLogout, isOpen, onClose }: SidebarProps) {
  const isDocRole = currentUser?.role !== UserRole.VIEWER;
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const { t } = useTranslation();

  const menuItems = [
    { id: "dashboard", label: "Boshqaruv paneli", icon: LayoutGrid, desc: "Statistika & Oqim", color: "text-indigo-500", borderCol: "group-hover:border-indigo-400", bgActive: "bg-indigo-950/90 text-white border-l-4 border-l-indigo-500" },
    { id: "search", label: "Qidiruv (Search)", icon: Search, desc: "Tezkor filter tizimi", color: "text-emerald-500", borderCol: "group-hover:border-emerald-400", bgActive: "bg-emerald-950/90 text-white border-l-4 border-l-emerald-500" },
    isDocRole && { id: "intake", label: "Hujjat qabul (Intake)", icon: FilePlus2, desc: "PDF va Fizik joylashuv", color: "text-amber-500", borderCol: "group-hover:border-amber-400", bgActive: "bg-amber-950/90 text-white border-l-4 border-l-amber-500" },
    { id: "documents", label: "Hujjatlar ro'yxati", icon: Database, desc: "Inventar & Holat", color: "text-blue-500", borderCol: "group-hover:border-blue-400", bgActive: "bg-blue-950/90 text-white border-l-4 border-l-blue-500" },
    isDocRole && { id: "settings", label: "Mundarija", icon: Scroll, desc: "Kategoriyalar & Shkaflar", color: "text-purple-500", borderCol: "group-hover:border-purple-400", bgActive: "bg-purple-950/90 text-white border-l-4 border-l-purple-500" },
    isAdmin && { id: "admin", label: "Admin panel", icon: FolderLock, desc: "Audit & Hisoblar", color: "text-rose-500", borderCol: "group-hover:border-rose-400", bgActive: "bg-rose-950/90 text-white border-l-4 border-l-rose-500" },
  ].filter(Boolean) as any[];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand space */}
      <div className="p-6 border-b border-indigo-100/80 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 border border-indigo-600 bg-indigo-600 text-white flex items-center justify-center font-display font-black text-sm rounded">
              A
            </div>
            <h1 className="text-lg font-display font-black uppercase tracking-tighter text-indigo-950">{t("Institut Arxivi")}</h1>
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-mono">{t("Boshqaruv Tizimi v1.0")}</p>
        </div>
        {/* Mobile close button inside the panel */}
        <button 
          onClick={onClose} 
          className="md:hidden p-1 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded cursor-pointer"
          title={t("Yopish")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav Space */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.id;
          return (
            <button
               key={item.id}
               onClick={() => {
                 onTabChange(item.id);
                 onClose(); // close responsive drawer on nav selection
               }}
               className={`w-full flex items-center justify-between px-4 py-3 transition-all uppercase tracking-wider font-mono text-left cursor-pointer group rounded-md border border-transparent ${
                 isSelected 
                   ? item.bgActive + " shadow-sm" 
                   : `hover:bg-neutral-50 hover:border-neutral-250/50 ${item.borderCol} text-neutral-800`
               }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 shrink-0 transition-all ${
                  isSelected ? "text-white scale-110" : `${item.color} group-hover:scale-110`
                }`} />
                <div>
                  <span className={`text-xs font-bold block ${isSelected ? "text-white" : "text-neutral-900"}`}>{t(item.label)}</span>
                  <span className={`text-[8px] block tracking-wide ${isSelected ? "text-neutral-300" : "text-neutral-450 group-hover:text-neutral-500"}`}>{t(item.desc)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Profile summary footer of sidebar */}
      <div className="p-6 border-t border-indigo-100/80 bg-slate-55/60">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center text-white font-mono text-xs font-extrabold select-none shrink-0 border border-indigo-650 rounded-lg shadow-sm">
            {currentUser?.fullName?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-black uppercase leading-normal" title={currentUser?.fullName}>
              {t(currentUser?.fullName)}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider leading-none mt-0.5">
              {currentUser?.role === 'admin' ? t("Bosh Arxivchi (Admin)") : currentUser?.role === 'xodim' ? t("Arxiv Operator") : t("Arxivchi (Viewer)")}
            </p>
          </div>
          <button 
            onClick={onLogout} 
            className="text-xs font-bold underline shrink-0 hover:text-neutral-600 tracking-wider font-mono uppercase cursor-pointer text-indigo-600 hover:text-indigo-800"
          >
            {t("Chiqish")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/40 z-40 md:hidden no-print transition-opacity" 
        />
      )}

      {/* Persistent Desktop Sidebar & Drawer container on Mobile */}
      <aside 
        className={`
          no-print fixed inset-y-0 left-0 z-50 w-64 border-r border-black transform transition-transform duration-200 ease-in-out bg-white h-full shrink-0
          md:translate-x-0 md:static md:flex md:flex-col md:h-screen
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
