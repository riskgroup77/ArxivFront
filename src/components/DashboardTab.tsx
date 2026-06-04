/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { api } from "../api.js";
import { 
  FileText, 
  Users, 
  FolderOpen, 
  Layers, 
  Calendar, 
  Search, 
  TrendingUp, 
  ArrowRight,
  Database,
  Grid
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "./LanguageContext.tsx";

interface DashboardTabProps {
  onNavigateToTab: (tab: string, filters?: any) => void;
}

export default function DashboardTab({ onNavigateToTab }: DashboardTabProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || t("Tahliliy ma'lumotlarni hisoblashda xatolik yuz berdi"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto refresh every 60 seconds as recommended in DASH-02
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-4">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">{t("Natijalar yuklanmoqda...")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-black p-6 bg-neutral-50 text-center my-6">
        <span className="font-mono text-xs uppercase font-bold bg-black text-white px-2 py-1">{t("Xato")}</span>
        <p className="mt-3 font-medium text-sm text-black">{t(error)}</p>
        <button 
          onClick={fetchStats}
          className="mt-4 px-4 py-2 border border-black text-xs font-mono uppercase font-bold hover:bg-neutral-50 transition-colors"
        >
          {t("Formani tozalash")}
        </button>
      </div>
    );
  }

  const { counters, categoryStats, cabinetStats, songgiYozuvlar, weeklyData } = stats;

  // Compute maximum count in weekly data to upscale SVG chart bars
  const maxWeeklyCount = Math.max(...weeklyData.map((d: any) => d.count), 1);

  return (
    <div className="space-y-8 selection:bg-black selection:text-white">
      {/* Page Title Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-black pb-4">
        <div>
          <h2 className="text-xl font-display font-bold uppercase tracking-tight text-black">
            {t("Boshqaruv paneli (Dashboard)")}
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            {t("Arxiv tizimining umumiy statistikasi va oxirgi faollik ko'rsatkichlari")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-black animate-pulse"></span>
          <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest">{t("REAL VAQTDA")}</span>
        </div>
      </div>

      {/* 4.3.1. General Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          {
            title: t("Hujjatlar"),
            value: counters.jamiHujjatlar,
            desc: t("Arxivda saqlanayotgan jami faol hujjatlar"),
            icon: FileText,
            colorClass: "text-indigo-600",
            iconColor: "text-indigo-500",
            bgClass: "bg-indigo-50/30",
            borderColor: "border-indigo-100 hover:border-indigo-400"
          },
          {
            title: t("O'quvchilar"),
            value: counters.jamiOquvchilar,
            desc: t("Kamida bitta hujjati bor talabalar jami soni"),
            icon: Users,
            colorClass: "text-emerald-600",
            iconColor: "text-emerald-500",
            bgClass: "bg-emerald-50/30",
            borderColor: "border-emerald-100 hover:border-emerald-400"
          },
          {
            title: t("Kategoriyalar"),
            value: counters.jamiKategoriyalar,
            desc: t("Tizimdagi faol mavjud hujjat turlari"),
            icon: FolderOpen,
            colorClass: "text-amber-600",
            iconColor: "text-amber-500",
            bgClass: "bg-amber-50/30",
            borderColor: "border-amber-100 hover:border-amber-400"
          },
          {
            title: t("Shkaflar"),
            value: counters.jamiShkaflar,
            desc: t("Fizik shkaflar va metall stellajlar"),
            icon: Layers,
            colorClass: "text-sky-600",
            iconColor: "text-sky-500",
            bgClass: "bg-sky-50/30",
            borderColor: "border-sky-100 hover:border-sky-400"
          },
          {
            title: t("Bugun Qabul"),
            value: counters.bugunQabulQilingan,
            desc: t("Bugun kiritilgan yangi arxiv hujjatlari"),
            icon: Calendar,
            colorClass: "text-teal-600",
            iconColor: "text-teal-500",
            bgClass: "bg-teal-50/40",
            borderColor: "border-teal-100 hover:border-teal-400",
            highlight: counters.bugunQabulQilingan > 0
          },
          {
            title: t("Bugun Qidiruv"),
            value: counters.bugunQidiruvlar,
            desc: t("Xodimlar tomonidan amalga oshirilgan qidiruvlar"),
            icon: Search,
            colorClass: "text-purple-600",
            iconColor: "text-purple-500",
            bgClass: "bg-purple-50/30",
            borderColor: "border-purple-100 hover:border-purple-400"
          }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx}
              className={`border-2 p-4 flex flex-col justify-between ${card.borderColor} ${card.bgClass} transition-all rounded-md shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-md`}
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 leading-none">
                  {card.title}
                </span>
                <Icon className={`w-4 h-4 ${card.iconColor} shrink-0`} />
              </div>
              <div>
                <span className={`font-display text-3.5xl font-black block tracking-tight leading-none ${card.colorClass}`}>
                  {card.value}
                </span>
                <span className="text-[10px] text-neutral-500 font-medium leading-tight mt-1.5 block">
                  {card.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* A. Categories and Percentages */}
        <div className="border border-black p-6 space-y-4 bg-white">
          <div className="flex border-b border-neutral-200 pb-3 justify-between items-center">
            <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-black flex items-center gap-2">
              <FolderOpen className="w-4 h-4" /> {t("KATEGORIYALAR BO'YICHA TAQSIMOT")}
            </h3>
            <span className="font-mono text-xs text-neutral-500">{t("foiz ulushi")}</span>
          </div>
          
          <div className="space-y-3 pt-2">
            {categoryStats.map((cat: any) => (
              <div 
                key={cat.id} 
                className="group cursor-pointer"
                onClick={() => onNavigateToTab("search", { categoryId: cat.id })}
              >
                <div className="flex justify-between text-xs font-mono font-medium mb-1">
                  <span className="text-black group-hover:underline">{t(cat.name)}</span>
                  <span className="text-neutral-500">
                    {cat.count} {t("ta yozuv")} (<strong className="text-indigo-600 font-bold">{cat.percent}%</strong>)
                  </span>
                </div>
                {/* Minimalist Black and White progress bar with colored fill */}
                <div className="w-full h-2 rounded overflow-hidden bg-neutral-100 border border-neutral-200 group-hover:border-indigo-400 transition-colors">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 rounded-r" 
                    style={{ width: `${cat.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {categoryStats.length === 0 && (
              <p className="text-center text-neutral-400 py-6 text-sm">{t("Hozircha hech qanday kategoriya kiritilmagan")}</p>
            )}
          </div>
        </div>

        {/* B. Qabul qilinganlar (Oq-Qora Grafik) */}
        <div className="border border-black p-6 space-y-4 bg-white">
          <div className="flex border-b border-neutral-200 pb-3 justify-between items-center">
            <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-black flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> {t("OXIRGI 7 KUNLIK QABUL GRAFIGI")}
            </h3>
            <span className="font-mono text-xs text-neutral-500 font-bold bg-neutral-100 px-1.5 py-0.5 border border-neutral-200">{t("KUNLIK SONI")}</span>
          </div>

          <div className="h-48 flex items-end justify-between pt-4 gap-2">
            {weeklyData.map((day: any, idx: number) => {
              const barHeightPct = (day.count / maxWeeklyCount) * 85; // cap at 85% to give space for labels
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="font-mono text-[10px] text-indigo-600 font-bold group-hover:scale-110 transition-transform mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.count} {t("ta")}
                  </span>
                  
                  {/* Flat black bar with elegant blue-indigo gradient for modern sleek interface */}
                  <div 
                    className="w-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 hover:border-indigo-400 rounded-t transition-all overflow-hidden font-sans"
                    style={{ height: `${Math.max(barHeightPct, 4)}%` }}
                  >
                    <div 
                       className={`h-full w-full ${day.count > 0 ? "bg-gradient-to-t from-indigo-650 to-sky-500" : "bg-neutral-100"}`}
                    ></div>
                  </div>
                  
                  <span className="font-mono text-[9px] text-neutral-400 rotate-45 origin-left whitespace-nowrap mt-2 ml-1 group-hover:text-black group-hover:font-bold">
                    {t(day.dayName.split(" ")[0])}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="pt-2"></div>
        </div>
      </div>

      {/* Cabinets Capacity Section */}
      <div className="border border-black p-6 space-y-4 bg-white">
        <div className="flex border-b border-neutral-200 pb-3 justify-between items-center">
          <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-black flex items-center gap-2">
            <Grid className="w-4 h-4" /> {t("SHKAFLAR VA TO'LIQLIK HOLATI")}
          </h3>
          <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider">{t("shkaf ustiga bosib filtrlash")}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {cabinetStats.map((cab: any) => {
            const floorCounts = Object.entries(cab.floorDistribution);
            const totalLoad = floorCounts.reduce((acc, [_, count]) => acc + (count as number), 0);
            
            return (
              <div 
                key={cab.id}
                className="border-2 border-neutral-200 hover:border-black p-4 space-y-3 cursor-pointer transition-all flex flex-col justify-between"
                onClick={() => onNavigateToTab("search", { cabinetId: cab.id })}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 border-b border-neutral-100 pb-2">
                    <div>
                      <h4 className="font-sans font-bold text-sm text-black">{t(cab.name)}</h4>
                      <p className="text-[10px] text-neutral-500 line-clamp-1">{t(cab.description) || t("Tavsifi yo'q")}</p>
                    </div>
                    <span className="font-mono text-xs font-bold bg-black text-white px-1.5 py-0.5 uppercase shrink-0">
                      {totalLoad} {t("ta")}
                    </span>
                  </div>

                  {/* Floor boxes visualization */}
                  <div className="mt-3 space-y-1.5">
                    <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest">{t("Qavatlar bo'yicha sig'im:")}</span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 pt-1">
                      {floorCounts.map(([floor, count]) => {
                        const cnt = count as number;
                        return (
                          <div 
                            key={floor} 
                            className={`border px-1 py-1.5 text-center rounded transition-all ${
                              cnt > 0 
                                ? 'bg-gradient-to-br from-indigo-900 via-indigo-950 to-neutral-900 border-indigo-900 text-white shadow-sm font-semibold hover:scale-105' 
                                : 'border-neutral-200 text-neutral-400 bg-white hover:bg-neutral-50'
                            }`}
                            title={`${floor}-${t("qavat")}: ${cnt} ${t("ta yozuv")}`}
                          >
                            <span className="font-mono text-[10px] block font-bold leading-none">{floor}</span>
                            <span className={`text-[8px] font-mono leading-none mt-1 block font-bold ${cnt > 0 ? 'text-sky-300' : 'text-neutral-450'}`}>{cnt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="text-right pt-3">
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-neutral-500 uppercase hover:text-black">
                    {t("Ro'yxatni ko'rish")} <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            );
          })}
          {cabinetStats.length === 0 && (
            <p className="text-center text-neutral-400 py-6 text-sm col-span-3">{t("Hozircha hech qanday shkaf kiritilmagan")}</p>
          )}
        </div>
      </div>

      {/* Bottom recent activity list */}
      <div className="border border-black p-6 space-y-4 bg-white">
        <div className="flex border-b border-neutral-200 pb-3 justify-between items-center">
          <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-black flex items-center gap-2">
            <Database className="w-4 h-4" /> {t("SO'NGGI QABUL QILINGAN HUJJATLAR")}
          </h3>
          <span className="font-mono text-xs text-neutral-500">{t("oxirgi 15 ta")}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black font-mono text-[11px] uppercase text-neutral-500">
                <th className="py-2.5 px-3">{t("Sana & Vaqt")}</th>
                <th className="py-2.5 px-3">{t("O'quvchi F.I.Sh.")}</th>
                <th className="py-2.5 px-3">{t("Hujjat kategoriyasi")}</th>
                <th className="py-2.5 px-3">{t("Fizik joylashuvi")}</th>
                <th className="py-2.5 px-3">{t("Holati")}</th>
                <th className="py-2.5 px-3 text-right">{t("Amal")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs font-sans">
              {songgiYozuvlar.map((doc: any) => (
                <tr 
                  key={doc.id}
                  className="hover:bg-neutral-50 transition-colors cursor-pointer group"
                  onClick={() => onNavigateToTab("documents")}
                >
                  <td className="py-2.5 px-3 font-mono text-neutral-500">
                    {new Date(doc.receivedAt).toLocaleString("uz-UZ", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-black group-hover:underline">
                    {t(doc.studentName)}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-600">
                    {t(doc.categoryName)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-neutral-600">
                    {t(doc.cabinetName)}, <strong className="text-black">{doc.floor}-{t("qavat")}</strong>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block border px-1.5 py-0.5 text-[10px] font-mono uppercase font-bold ${doc.status === 'Joyida' ? 'border-black text-black' : 'border-neutral-300 text-neutral-450'}`}>
                      {t(doc.status)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button className="font-mono text-[10px] px-1 bg-black text-white py-0.5">{t("Batafsil ma'lumot va PDF korish")}</button>
                  </td>
                </tr>
              ))}
              {songgiYozuvlar.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-neutral-400 font-mono">
                    {t("Hozircha arxiv hujjatlari mavjud emas.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
