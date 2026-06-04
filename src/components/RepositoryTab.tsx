/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { DocumentStatus, UserRole } from "../types.js";
import { 
  FileText, 
  Trash2, 
  Edit3, 
  Eye, 
  MapPin, 
  RotateCcw, 
  AlertTriangle, 
  Check, 
  X,
  FileDown,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RepositoryTabProps {
  currentUser: any;
}

export default function RepositoryTab({ currentUser }: RepositoryTabProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering lists
  const [categories, setCategories] = useState<any[]>([]);
  const [cabinets, setCabinets] = useState<any[]>([]);

  // Selected for View Details
  const [inspectDoc, setInspectDoc] = useState<any>(null);
  // Selected for Edit Details
  const [editDoc, setEditDoc] = useState<any>(null);
  // Confirm Delete Doc ID
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Edit fields states
  const [editStatus, setEditStatus] = useState<DocumentStatus>(DocumentStatus.JOYIDA);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editCabinetId, setEditCabinetId] = useState("");
  const [editFloor, setEditFloor] = useState<number>(1);
  const [editNotes, setEditNotes] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFileBase64, setEditFileBase64] = useState("");
  const [editFileError, setEditFileError] = useState("");
  const [statusNotesAdd, setStatusNotesAdd] = useState(""); // notes when given out ("Kimga berildi" details)

  const [filterCat, setFilterCat] = useState("");
  const [filterCab, setFilterCab] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadRepository = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDocuments({
        q: searchQuery,
        categoryId: filterCat,
        cabinetId: filterCab,
        status: filterStatus
      });
      setDocuments(res.documents);
    } catch (err: any) {
      setError(err.message || "Arxiv ro'yxatini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrapData = async () => {
      try {
        const catData = await api.getCategories();
        const cabData = await api.getCabinets();
        setCategories(catData);
        setCabinets(cabData);
      } catch (err) {
        console.error("Spravochnik load errors in repository", err);
      }
    };
    bootstrapData();
    loadRepository();
  }, [filterCat, filterCab, filterStatus]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      loadRepository();
    }
  };

  // Populate Edit Fields on select
  const handleOpenEdit = (doc: any) => {
    setEditDoc(doc);
    setEditStatus(doc.status);
    setEditCategoryId(doc.categoryId);
    setEditCabinetId(doc.cabinetId);
    setEditFloor(doc.floor);
    setEditNotes(doc.notes || "");
    setStatusNotesAdd("");
    setEditFile(null);
    setEditFileBase64("");
    setEditFileError("");
  };

  // Convert File to Base64 (PDF replacer)
  const handleReplacementFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFileError("");
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      setEditFileError("Faqat PDF yuklash ruxsat etiladi");
      return;
    }

    if (selected.size > 20 * 1024 * 1024) {
      setEditFileError("Kattalik cheklovi: maks 20 MB");
      return;
    }

    setEditFile(selected);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditFileBase64(ev.target?.result as string);
    };
    reader.readAsDataURL(selected);
  };

  // Submit Edit changes
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDoc) return;

    setLoading(true);
    try {
      let finalNotes = editNotes;
      if (editStatus === DocumentStatus.BERILGAN && statusNotesAdd.trim()) {
        finalNotes = `${editNotes}\n[Qabul: Kimga berildi: ${statusNotesAdd.trim()} - Sana: ${new Date().toLocaleDateString()}]`;
      }

      const payload: any = {
        status: editStatus,
        categoryId: editCategoryId,
        cabinetId: editCabinetId,
        floor: Number(editFloor),
        notes: finalNotes
      };

      if (editFileBase64) {
        payload.pdfBase64 = editFileBase64;
        payload.pdfFilename = editFile?.name;
      }

      await api.updateDocument(editDoc.id, payload);
      setEditDoc(null);
      loadRepository();
    } catch (err: any) {
      alert(err.message || "Tahrirlashni saqlashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Delete Action
  const handleDeleteDoc = async (id: string) => {
    setLoading(true);
    try {
      await api.deleteDocument(id);
      setConfirmDeleteId(null);
      setInspectDoc(null);
      loadRepository();
    } catch (err: any) {
      alert(err.message || "O'chirishda muammo sodir bo'ldi");
    } finally {
      setLoading(false);
    }
  };

  // Download PDF file cleanly
  const handleDownloadPdf = async (doc: any) => {
    try {
      const response = await fetch(`/api/documents/pdf/${doc.id}?download=true`);
      if (!response.ok) throw new Error("Server error " + response.status);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.originalFilename || `hujjat_${doc.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Hujjatni yuklab olishda xatolik yuz berdi: " + err.message);
    }
  };

  // Print PDF file cleanly
  const handlePrintPdf = async (doc: any) => {
    try {
      const response = await fetch(`/api/documents/pdf/${doc.id}`);
      if (!response.ok) throw new Error("Server error " + response.status);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.src = url;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            window.URL.revokeObjectURL(url);
          }, 2000);
        } catch (e) {
          console.error("Iframe printing blocked", e);
          const newWindow = window.open(url, "_blank");
          if (!newWindow) {
            alert("Iltimos, qalqib chiquvchi oynalar (popup) bloklanishini o'chiring!");
          }
        }
      };
    } catch (err: any) {
      alert("Chop etishda xatolik yuz berdi: " + err.message);
    }
  };

  const selectedCabinetsMaxFloors = cabinets.find(c => c.id === editCabinetId)?.maxFloor || 9;

  return (
    <div className="space-y-6 selection:bg-black selection:text-white">
      {/* Header */}
      <div className="border-b border-black pb-4">
        <h2 className="text-xl font-display font-bold uppercase tracking-tight text-black">
          Hujjatlar Ombori (Inventarizatsiya)
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Faol hujjatlarni tahrirlash, holatini o'zgartirish, elektron PDF almashtirish va o'chirish boshqaruvi
        </p>
      </div>

      {/* Lookup controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-neutral-50 p-4 border border-neutral-200">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            placeholder="O'quvchi ismi yoki kodi bilan qidiring..."
            className="flex-1 bg-white border border-neutral-300 px-3 py-1.5 text-xs focus:border-black"
          />
          <button
            onClick={loadRepository}
            className="px-4 py-1.5 bg-black text-white hover:bg-neutral-800 font-mono text-xs uppercase font-bold cursor-pointer shrink-0"
          >
            Qidiruv
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {/* Category drop */}
          <select 
            value={filterCat} 
            onChange={(e) => setFilterCat(e.target.value)}
            className="bg-white border border-neutral-300 px-2 py-1.5 cursor-pointer"
          >
            <option value="">Barcha Kategoriyalar</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Cabinet drop */}
          <select 
            value={filterCab} 
            onChange={(e) => setFilterCab(e.target.value)}
            className="bg-white border border-neutral-300 px-2 py-1.5 cursor-pointer"
          >
            <option value="">Barcha Shkaflar</option>
            {cabinets.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status drop */}
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-neutral-300 px-2 py-1.5 cursor-pointer"
          >
            <option value="">Barcha Holatlar</option>
            <option value="Joyida">Joyida</option>
            <option value="Berilgan">Berilgan</option>
            <option value="Yo'q qilingan">Yo'q qilingan</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="py-24 text-center">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span className="font-mono text-xs text-neutral-500 uppercase mt-2 block">Ma'lumotlar olinmoqda...</span>
        </div>
      )}

      {/* Standard master inventory table */}
      {!loading && (
        <div className="overflow-x-auto border border-neutral-200">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-neutral-900 text-white font-mono text-[10px] uppercase">
                <th className="py-2.5 px-3">O'quvchi (Talaba)</th>
                <th className="py-2.5 px-3">Hujjat kategoriyasi</th>
                <th className="py-2.5 px-3">Fizik Shkaf & Qavat</th>
                <th className="py-2.5 px-3">Qabul qilingan sana</th>
                <th className="py-2.5 px-3">Holati</th>
                <th className="py-2.5 px-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs">
              {documents.map((doc) => {
                const stdName = doc.student ? `${doc.student.lastName} ${doc.student.firstName}` : "N/A";
                return (
                  <tr key={doc.id} className="hover:bg-neutral-50 font-sans">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-black">{stdName}</div>
                      <div className="text-[10px] text-neutral-400 font-mono font-medium">{doc.student?.studentId || "Kodsiz"} &middot; {doc.student?.groupName || "O'quvsiz"}</div>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-700">{doc.category?.name || "Kategoriya kiritilmagan"}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {doc.cabinet?.name || doc.cabinetId}, <strong className="text-black">{doc.floor}-qavat</strong>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-500">
                      {new Date(doc.receivedAt).toLocaleDateString("uz-UZ")}
                    </td>
                    <td className="py-2.5 px-3">
                      {doc.status === DocumentStatus.JOYIDA ? (
                        <span className="border border-black px-1.5 py-0.5 text-[9px] font-mono uppercase bg-black text-white font-bold">Joyida</span>
                      ) : doc.status === DocumentStatus.BERILGAN ? (
                        <span className="border border-neutral-300 px-1.5 py-0.5 text-[9px] font-mono uppercase bg-neutral-100 text-neutral-500 font-bold" title="Hujjat talabaga berilgan">Chiqarilgan</span>
                      ) : (
                        <span className="border border-dashed border-red-200 px-1.5 py-0.5 text-[9px] font-mono uppercase text-red-500 bg-red-50 font-bold">Yo'q qilingan</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {/* Only staff or admin can modify/delete */}
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => setInspectDoc(doc)}
                          className="p-1 px-1.5 border border-neutral-300 hover:border-black font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:bg-neutral-50 text-black font-semibold"
                        >
                          <Eye className="w-3 h-3" /> Ko'rish
                        </button>
                        {currentUser?.role !== UserRole.VIEWER && (
                          <button 
                            onClick={() => handleOpenEdit(doc)}
                            className="p-1 px-1.5 border border-black bg-black text-white hover:bg-neutral-800 font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <Edit3 className="w-3 h-3" /> Tahrirlash
                          </button>
                        )}
                        {currentUser?.role === UserRole.ADMIN && (
                          <button 
                            onClick={() => setConfirmDeleteId(doc.id)}
                            className="p-1 px-1.5 border border-red-600 text-red-600 hover:bg-red-50 font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer font-bold"
                            title="O'chirish (Soft delete)"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {documents.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-neutral-400 font-mono uppercase">
                    Hujjatlar topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* INSPECT PREVIEW DRAWER */}
      <AnimatePresence>
        {inspectDoc && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setInspectDoc(null)} className="fixed inset-0 bg-black z-45" />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween" }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white border-l-2 border-black z-50 p-6 shadow-2xl overflow-y-auto flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-black pb-4">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold bg-neutral-100 text-black border border-neutral-300 px-2 py-0.5">
                      Ombor Kartasi: {inspectDoc.id}
                    </span>
                    <h3 className="text-lg font-display font-medium text-black uppercase tracking-tight mt-1">Hujjat Rekvizitlari</h3>
                  </div>
                  <button onClick={() => setInspectDoc(null)} className="p-1 border border-black hover:bg-neutral-50 text-black cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  {/* Location card */}
                  <div className="border border-black p-3 bg-neutral-50 flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-black" />
                    <div>
                      <span className="block text-[8px] font-mono text-neutral-400 uppercase font-semibold">Tahrirlangan joriy koordinata:</span>
                      <strong className="font-mono text-xs text-black uppercase">{inspectDoc.cabinet?.name}, {inspectDoc.floor}-qavat</strong>
                    </div>
                  </div>

                  <div className="space-y-2 border-b border-neutral-100 pb-3">
                    <h4 className="font-mono text-[10px] uppercase text-neutral-400 font-bold mb-1">O'quvchi rekvizitlari:</h4>
                    <p className="font-bold text-sm text-black">
                      {inspectDoc.student ? `${inspectDoc.student.lastName} ${inspectDoc.student.firstName} ${inspectDoc.student.middleName || ""}` : "Noma'lum"}
                    </p>
                    <p className="font-mono text-neutral-600">
                      HEMIS ID: {inspectDoc.student?.studentId || "Yo'q"} &middot; Guruhi: {inspectDoc.student?.groupName || "Noma'lum"} &middot; Telefon: {inspectDoc.student?.phone || "Kiritilmagan"}
                    </p>
                  </div>

                  <div className="space-y-2 border-b border-neutral-100 pb-3">
                    <h4 className="font-mono text-[10px] uppercase text-neutral-400 font-bold mb-1">Status rekvizitlari:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-neutral-400 font-semibold block">Hujjat Holati:</span>
                        <span className={`inline-block border px-1.5 py-0.5 text-[9px] font-mono uppercase font-black ${inspectDoc.status === 'Joyida' ? 'border-black bg-black text-white' : 'border-neutral-300 text-neutral-400'}`}>
                          {inspectDoc.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block">Qabul sanasi:</span>
                        <span className="font-mono font-semibold text-black">{new Date(inspectDoc.receivedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-semibold block text-neutral-500">Muvofiqlik izohlari:</span>
                    <p className="p-2.5 bg-neutral-50 border border-neutral-200 font-mono text-neutral-600 leading-normal text-[11px] whitespace-pre-wrap rounded">
                      {inspectDoc.notes || "Hech qanday zaxira izohlar mavjud emas"}
                    </p>
                  </div>

                  {/* Attachment container */}
                  <div className="space-y-1 pt-2">
                    <span className="font-semibold block text-neutral-500">Yuklangan elektron fayl:</span>
                    <div className="flex items-center gap-2 border border-neutral-200 p-2 bg-gradient-to-r from-neutral-50 to-indigo-50/20 rounded">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      <div className="flex-1 truncate font-mono text-[11px] font-bold text-neutral-700">
                        {inspectDoc.originalFilename} ({(inspectDoc.fileSize / 1024).toFixed(1)} KB)
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          type="button"
                          onClick={() => handleDownloadPdf(inspectDoc)} 
                          className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[10px] uppercase tracking-wider flex items-center gap-1 font-bold cursor-pointer rounded transition-all"
                        >
                          <FileDown className="w-3 h-3" /> yuklash
                        </button>
                        <button 
                          type="button"
                          onClick={() => handlePrintPdf(inspectDoc)} 
                          className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] uppercase tracking-wider flex items-center gap-1 font-bold cursor-pointer rounded transition-all"
                        >
                          <Printer className="w-3 h-3" /> Chop etish
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4 flex gap-2">
                <button 
                  onClick={() => { setInspectDoc(null); handleOpenEdit(inspectDoc); }}
                  className="px-4 py-2 border border-black hover:bg-neutral-50 text-black font-mono text-xs uppercase tracking-wider font-bold flex-1"
                >
                  Tahrirlashga o'tish
                </button>
                <button onClick={() => setInspectDoc(null)} className="px-4 py-2 bg-black text-white font-mono text-xs uppercase tracking-wider font-bold flex-1">
                  Yopish
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EDIT MODAL DIALOG */}
      <AnimatePresence>
        {editDoc && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setEditDoc(null)} className="fixed inset-0 bg-black z-45" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white border-2 border-black z-50 p-6 shadow-2xl overflow-y-auto max-h-[90vh] selection:bg-black selection:text-white"
            >
              <div className="flex justify-between items-center border-b border-black pb-3 mb-4">
                <h3 className="font-display font-bold uppercase text-black text-sm tracking-widest">
                  Hujjat rekvizitlarini tahrirlash
                </h3>
                <button onClick={() => setEditDoc(null)} className="p-1 border border-neutral-300 hover:border-black cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs">
                {/* 1. Status toggle */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1.5 font-bold">
                    Hujjat Holati (*)
                  </label>
                  <div className="grid grid-cols-3 gap-2 border border-neutral-300 p-1 bg-neutral-50">
                    {["Joyida", "Berilgan", "Yo'q qilingan"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setEditStatus(st as DocumentStatus)}
                        className={`py-1.5 font-mono text-[10px] uppercase font-bold text-center ${editStatus === st ? "bg-black text-white" : "hover:bg-white text-neutral-600"}`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1.5 Notes popup if given out (Berilgan) */}
                {editStatus === DocumentStatus.BERILGAN && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3 border border-black bg-neutral-50 space-y-2">
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-neutral-600 font-bold">
                      Kimga va nima maqsadda chiqarilgan? (*)
                    </label>
                    <input
                      type="text"
                      required
                      value={statusNotesAdd}
                      onChange={(e) => setStatusNotesAdd(e.target.value)}
                      placeholder="Masalan: Dekanat boshlig'i Soliyevga vaqtinchalik reyting uchun"
                      className="w-full bg-white border border-neutral-300 px-2.5 py-1.5 focus:border-black"
                    />
                  </motion.div>
                )}

                {/* 2. Category selection */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                    Hujjat Kategoriyasi (*)
                  </label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full bg-white border border-neutral-300 px-3 py-1.5 focus:border-black cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Cabinet coordinates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                      Fizik Shkaf (*)
                    </label>
                    <select
                      value={editCabinetId}
                      onChange={(e) => { setEditCabinetId(e.target.value); setEditFloor(1); }}
                      className="w-full bg-white border border-neutral-300 px-3 py-1.5 focus:border-black cursor-pointer"
                    >
                      {cabinets.map(cab => (
                        <option key={cab.id} value={cab.id}>{cab.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                      Tokcha (Qavat: 1-{selectedCabinetsMaxFloors}) (*)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedCabinetsMaxFloors}
                      value={editFloor}
                      onChange={(e) => setEditFloor(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 px-3 py-1.5 focus:border-black font-mono-normal"
                    />
                  </div>
                </div>

                {/* 4. Notes editing */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                    Batafsil izoh & ko'rsatmalar
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-neutral-300 px-3 py-1.5 focus:border-black"
                  ></textarea>
                </div>

                {/* 5. PDF replacement file */}
                <div className="border border-dashed border-neutral-400 p-3 bg-neutral-50 space-y-2">
                  <label className="block text-[9px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
                    Elektron PDF faylini almashtirish (Ixtiyoriy)
                  </label>
                  {editFileError && <p className="text-[10px] text-black font-bold mb-1">{editFileError}</p>}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleReplacementFile}
                    className="block w-full text-xs font-mono"
                  />
                  {editFile && (
                    <p className="text-[10px] text-black bg-white p-1 border font-mono">
                      Yangi fayl: {editFile.name} ({(editFile.size/1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                {/* Options panel */}
                <div className="pt-2 border-t border-neutral-200 flex justify-end gap-2 text-xs">
                  <button 
                    type="button" 
                    onClick={() => setEditDoc(null)} 
                    className="px-4 py-2 border border-neutral-400 hover:border-black font-mono text-[10px] uppercase font-bold cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-black text-white hover:bg-neutral-800 font-mono text-[10px] uppercase font-black cursor-pointer"
                  >
                    O'zgarishlarni Saqlash
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE DIALOG */}
      <AnimatePresence>
        {confirmDeleteId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setConfirmDeleteId(null)} className="fixed inset-0 bg-black z-45" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white border-2 border-black z-50 p-6 shadow-2xl text-center space-y-4"
            >
              <div className="flex justify-center">
                <AlertTriangle className="w-10 h-10 text-neutral-900" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-black uppercase text-sm tracking-wide">HUJJATNI O'CHIRISH!</h4>
                <p className="text-xs text-neutral-500 leading-normal">
                  Chindan ham ushbu hujjat yozuvini arxiv bazasidan o'chirmoqchimisiz? Ushbu amaldan so'ng hujjat asosi faqat tahliliy soft-delete loglarida saqlab qolinadi.
                </p>
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2 border border-neutral-400 hover:border-black font-mono text-[10px] uppercase font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={() => handleDeleteDoc(confirmDeleteId)}
                  className="flex-1 px-4 py-2 bg-black text-white hover:bg-neutral-800 font-mono text-[10px] uppercase font-bold cursor-pointer"
                >
                  Ha, o'chirilsin
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
