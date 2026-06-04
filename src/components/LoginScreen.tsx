/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { api, setAuthToken } from "../api.js";
import { LogIn, Key, UserCheck, Languages } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "./LanguageContext.tsx";

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { lang, setLang, t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(t("Iltimos, maydonlarni to'ldiring"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.login(username.trim(), password.trim());
      setAuthToken(data.token);
      localStorage.setItem("arxiv_user", JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || t("Tizimga kirishda xatolik yuz berdi"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-800 flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Upper Brand Info */}
      <div className="flex justify-between items-center w-full max-w-6xl mx-auto border-b border-indigo-100 pb-4">
        <div>
          <span className="font-mono text-[10px] tracking-wider uppercase text-slate-500 block">
            {t("Toshkent Davlat Universiteti")}
          </span>
          <h1 className="text-xl font-display font-extrabold tracking-tight uppercase text-indigo-950">
            {t("INSTITUT ARXIVI")}
          </h1>
        </div>
        
        {/* Language switch on Login Screen */}
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-indigo-100 rounded-xl bg-indigo-50/50 p-0.5 font-sans text-xs select-none">
            <span className="text-[9px] text-indigo-950/60 font-extrabold uppercase tracking-wide px-2 flex items-center gap-1 font-mono">
              <Languages className="w-3.5 h-3.5 text-indigo-500" /> Til:
            </span>
            <div className="flex bg-white shadow-xs border border-indigo-50/50 p-0.5 rounded-lg text-[10px] font-black">
              <button
                type="button"
                onClick={() => setLang("cyrillic")}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer font-sans ${lang === "cyrillic" ? "bg-indigo-600 text-white shadow-xs" : "text-neutral-500 hover:text-indigo-950"}`}
              >
                КИРИЛ
              </button>
              <button
                type="button"
                onClick={() => setLang("latin")}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer font-sans ${lang === "latin" ? "bg-indigo-600 text-white shadow-xs" : "text-neutral-500 hover:text-indigo-950"}`}
              >
                LOTIN
              </button>
            </div>
          </div>
          
          <div className="text-right hidden md:block">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              {t("Hujjatlarni boshqarish tizimi v1.0")}
            </span>
          </div>
        </div>
      </div>

      {/* Main Login Block */}
      <div className="flex-1 flex items-center justify-center py-12">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md border border-indigo-100 p-8 bg-white rounded-xl shadow-xl shadow-indigo-100/20"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-indigo-950">
              {t("Tizimga kirish")}
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              {t("Arxiv hisobiga bog'lanish uchun quyidagi parametrlarni kiriting")}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 border border-red-200 bg-red-50 p-3 text-xs flex items-start gap-2.5 rounded-lg"
            >
              <div className="font-mono font-bold text-[9px] tracking-wider uppercase px-1.5 py-0.5 bg-red-600 text-white mt-0.5 select-none rounded">
                XATO
              </div>
              <span className="leading-tight font-semibold text-red-900">{t(error)}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">
                {t("Foydalanuvchi nomi (Username)")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("Masalan: xodim yoki admin")}
                  className="w-full bg-white border border-neutral-300 hover:border-neutral-400 px-4 py-2.5 font-sans placeholder-neutral-400 focus:border-indigo-600 outline-hidden rounded-md transition-all disabled:bg-neutral-100 text-sm focus:ring-1 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">
                {t("Tizim paroli (Password)")}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-neutral-300 hover:border-neutral-400 px-4 py-2.5 font-sans placeholder-neutral-400 focus:border-indigo-600 outline-hidden rounded-md transition-all disabled:bg-neutral-100 text-sm focus:ring-1 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 font-mono uppercase font-bold text-sm tracking-wider flex items-center justify-center gap-2 rounded-md transition-all shadow-md shadow-indigo-100/40 cursor-pointer disabled:bg-neutral-200 disabled:text-neutral-500"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t("Yuklanmoqda...")}
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    {t("Tizimga Kirish")}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Prompt standard credentials secretly for convenience */}
          <div className="mt-8 pt-6 border-t border-dashed border-neutral-200">
            <span className="block text-xs font-mono text-neutral-500 uppercase tracking-widest mb-2 font-bold">
              {t("SINAB KO'RISH uchun loginlar:")}
            </span>
            <div className="grid grid-cols-1 gap-2.5 font-mono text-[11px] text-neutral-600 bg-neutral-50/50 p-3 border border-neutral-200 rounded-xl">
              <div className="flex justify-between">
                <span>Admin: <strong className="text-black">admin</strong> / 123</span>
                <span className="text-neutral-300">→</span>
                <span>admin123</span>
              </div>
              <div className="flex justify-between">
                <span>Employee: <strong className="text-black">xodim</strong> / 123</span>
                <span className="text-neutral-300">→</span>
                <span>xodim123</span>
              </div>
              <div className="flex justify-between">
                <span>Viewer: <strong className="text-black">viewer</strong> / 123</span>
                <span className="text-neutral-300">→</span>
                <span>viewer123</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Corporate Footprint */}
      <div className="w-full max-w-6xl mx-auto border-t border-neutral-200 pt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-neutral-400 font-mono gap-2">
        <div>
          &copy; {new Date().getFullYear()} {t("Institut Axivi Bo'limi. barcha huquqlar himoyalangan.")}
        </div>
        <div className="flex gap-4">
          <span>{t("Xavfsizlik sertifikatlangan")}</span>
          <span>&middot;</span>
          <span>{t("Lokal Tarmoq (LAN)")}</span>
        </div>
      </div>
    </div>
  );
}
