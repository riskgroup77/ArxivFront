/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { 
  FolderPlus, 
  UserPlus, 
  FileUp, 
  Map as MapIcon, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  AlertTriangle,
  Users,
  Eye
} from "lucide-react";
import { motion } from "motion/react";

interface IntakeTabProps {
  onNavigateToTab: (tab: string) => void;
}

export default function IntakeTab({ onNavigateToTab }: IntakeTabProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Lists for dropdown
  const [categories, setCategories] = useState<any[]>([]);
  const [cabinets, setCabinets] = useState<any[]>([]);
  const [existingStudents, setExistingStudents] = useState<any[]>([]);

  // STEP 1 Form State: Category
  const [categoryId, setCategoryId] = useState("");
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [catError, setCatError] = useState("");

  // STEP 2 Form State: Student
  const [studentMode, setStudentMode] = useState<"existing" | "new">("existing");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [studentRegId, setStudentRegId] = useState(""); // HEMIS code
  const [groupName, setGroupName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");

  // STEP 3 Form State: PDF File
  const [file, setFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState("");

  // STEP 4 Form State: Placement
  const [cabinetId, setCabinetId] = useState("");
  const [floor, setFloor] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  // Load backend variables
  const loadData = async () => {
    try {
      const cats = await api.getCategories();
      const cabs = await api.getCabinets();
      setCategories(cats);
      setCabinets(cabs);

      // Extract unique students by querying documents listing
      const docRes = await api.getDocuments({ limit: 500 });
      const studentsMap = new Map();
      docRes.documents.forEach((d: any) => {
        if (d.student) {
          studentsMap.set(d.student.id, d.student);
        }
      });
      setExistingStudents(Array.from(studentsMap.values()));
    } catch (err) {
      console.error("Failed to load metadata in Intake", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Inline Category Saving
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError("");
    if (!newCatName.trim()) {
      setCatError("Kategoriya nomi majburiy");
      return;
    }

    try {
      const created = await api.createCategory(newCatName.trim(), newCatDesc.trim());
      setCategories([...categories, created]);
      setCategoryId(created.id);
      setNewCatName("");
      setNewCatDesc("");
      setShowCatForm(false);
    } catch (err: any) {
      setCatError(err.message || "Kategoriyani saqlashda xatolik yuz berdi");
    }
  };

  // Base64 File encoding
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setFileError("Faqat PDF formatini yuklashingiz mumkin (.pdf)");
      return;
    }

    // Limit 20MB check
    const maxSize = 20 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setFileError("Fayl hajmi 20 MB dan ko'p bo'lmasligi lozim");
      return;
    }

    setFile(selectedFile);
    setUploadProgress(10);

    const reader = new FileReader();
    reader.onloadstart = () => setUploadProgress(30);
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 60) + 30;
        setUploadProgress(pct);
      }
    };
    reader.onload = (event) => {
      setPdfBase64(event.target?.result as string);
      setUploadProgress(100);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Complete Intake Submit
  const handleIntakeSubmit = async () => {
    setLoading(true);
    setGlobalError(null);

    // Payload Assembly
    const payload: any = {
      cabinetId,
      floor: Number(floor),
      pdfFilename: file?.name || "arxiv_hujjat.pdf",
      pdfBase64,
      notes,
    };

    if (categoryId) {
      payload.categoryId = categoryId;
    } else {
      setGlobalError("Kategoriya tanlanmagan");
      setLoading(false);
      return;
    }

    if (studentMode === "existing") {
      if (!selectedStudentId) {
        setGlobalError("Mavjud talabani tanlang yoki yangi yarating");
        setLoading(false);
        return;
      }
      payload.studentId = selectedStudentId;
    } else {
      payload.studentFirstName = firstName;
      payload.studentLastName = lastName;
      payload.studentMiddleName = middleName;
      payload.studentRegId = studentRegId;
      payload.studentGroup = groupName;
      payload.studentBirthDate = birthDate;
      payload.studentPhone = phone;
    }

    try {
      await api.createDocument(payload);
      setSuccess(true);
    } catch (err: any) {
      setGlobalError(err.message || "Hujjat qabul qilinishida xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Reset complete page states
  const handleResetForm = () => {
    setStep(1);
    setSuccess(false);
    setGlobalError(null);
    setCategoryId("");
    setSelectedStudentId("");
    setLastName("");
    setFirstName("");
    setMiddleName("");
    setStudentRegId("");
    setGroupName("");
    setBirthDate("");
    setPhone("");
    setFile(null);
    setPdfBase64("");
    setUploadProgress(0);
    setCabinetId("");
    setFloor("");
    setNotes("");
    // reload background lists
    loadData();
  };

  const selectedCabinet = cabinets.find(c => c.id === cabinetId);

  // Validations per steps
  const isStepValid = () => {
    if (step === 1) return !!categoryId;
    if (step === 2) {
      if (studentMode === "existing") return !!selectedStudentId;
      return firstName.trim().length >= 2 && lastName.trim().length >= 2;
    }
    if (step === 3) return !!pdfBase64;
    if (step === 4) {
      if (!cabinetId || !floor) return false;
      const cab = cabinets.find(c => c.id === cabinetId);
      if (cab) {
        const fl = Number(floor);
        return fl >= 1 && fl <= cab.maxFloor;
      }
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6 selection:bg-indigo-600 selection:text-white">
      {/* Header */}
      <div className="border-b border-indigo-100 pb-4">
        <h2 className="text-xl font-display font-black uppercase tracking-tight text-indigo-950">
          Yangi Hujjat Qabul Qilish (Intake)
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Kompleks o'quvchi ma'lumotlari, PDF yuklash va fizik saqlash koordinatalarini ro'yxatga olish
        </p>
      </div>

      {success ? (
        /* Success Screen */
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl mx-auto border border-indigo-100 p-8 text-center space-y-6 bg-white rounded-2xl shadow-xl shadow-indigo-100/10"
        >
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-display font-black uppercase tracking-tight text-indigo-950">HUJJAT QABUL QILINDI!</h3>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-sm mx-auto">
              Hujjat arxiv bazasiga muvaffaqiyatli saqlanib, fizik saqlash joylashuvi koordinatalariga bog'landi.
            </p>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleResetForm}
              className="flex-1 border border-indigo-200 bg-white hover:bg-indigo-50/20 text-indigo-700 py-3 px-4 font-mono text-xs uppercase font-bold text-center tracking-wider rounded-lg transition-all cursor-pointer"
            >
              Yangi hujjat kiritish
            </button>
            <button
              onClick={() => onNavigateToTab("search")}
              className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 py-3 px-4 font-mono text-xs uppercase font-bold text-center tracking-wider rounded-lg transition-all shadow-md shadow-indigo-100/40 cursor-pointer"
            >
              Qidiruv tizimiga o'tish
            </button>
          </div>
        </motion.div>
      ) : (
        /* Intake multi-step form */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* STAGES SIDE RAILS */}
          <div className="lg:col-span-1 space-y-2.5">
            {[
              { num: 1, label: "Kategoriya kiritish", icon: FolderPlus, desc: "Hujjat turi / spravochnik" },
              { num: 2, label: "Talaba o'quvchi", icon: UserPlus, desc: "F.I.Sh hamda HEMIS bog'lovi" },
              { num: 3, label: "PDF nusxasi", icon: FileUp, desc: "Maksimal hajm: 20 MB (.pdf)" },
              { num: 4, label: "Arxiv joylashuvi", icon: MapIcon, desc: "Shkaf va Tokcha (Tok)" },
              { num: 5, label: "Xulosa va saqlash", icon: CheckCircle, desc: "Yakuniy ma'lumotlarni tahlil qilish" }
            ].map((st) => {
              const Icon = st.icon;
              const isActive = step === st.num;
              const isCompleted = step > st.num;
              return (
                <div 
                  key={st.num}
                  className={`border p-3 flex items-start gap-3 transition-all rounded-lg ${isActive ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-100/50' : isCompleted ? 'border-emerald-100 bg-emerald-50/30 text-emerald-700' : 'border-neutral-200 bg-white text-neutral-400'}`}
                >
                  <div className={`w-6 h-6 shrink-0 flex items-center justify-center font-mono text-xs font-bold rounded ${isActive ? 'bg-white text-indigo-700' : isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'}`}>
                    0{st.num}
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold leading-normal uppercase">{st.label}</span>
                    <span className={`block text-[9px] leading-none ${isActive ? 'text-neutral-300' : 'text-neutral-400'}`}>{st.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ACTIVE STEP CONTENT */}
          <div className="lg:col-span-3 border border-indigo-100 rounded-xl p-6 bg-white flex flex-col justify-between min-h-[420px] shadow-sm shadow-indigo-100/10">
            <div>
              {globalError && (
                <div className="mb-4 border border-red-200 bg-red-50/50 p-3.5 text-xs font-sans font-medium flex items-start gap-2.5 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span className="text-red-850">{globalError}</span>
                </div>
              )}

              {/* STEP 1: CATEGORY SELECTION */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex justify-between items-center border-b border-indigo-100/60 pb-2">
                    <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-indigo-950">
                      1-Bosqich: Hujjat Kategoriyasi Tanlash
                    </h3>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">majburiy</span>
                  </div>

                  <div className="space-y-4">
                    {!showCatForm ? (
                      <div className="space-y-3">
                        <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500">
                          Mavjud kategoriyalardan tanlang:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {categories.map((cat) => (
                            <div 
                              key={cat.id}
                              onClick={() => setCategoryId(cat.id)}
                              className={`border-2 p-3.5 cursor-pointer rounded-lg transition-all flex justify-between items-center ${categoryId === cat.id ? 'border-indigo-500 bg-indigo-50/20' : 'border-neutral-200 hover:border-indigo-400 bg-white'}`}
                            >
                              <div>
                                <span className="block font-bold text-xs text-neutral-950">{cat.name}</span>
                                <span className="text-[10px] text-neutral-400 leading-tight mt-1 mr-1 line-clamp-1">{cat.description || "Tavsif kiritilmagan"}</span>
                              </div>
                              <div className={`w-3.5 h-3.5 border rounded-full flex items-center justify-center ${categoryId === cat.id ? 'border-indigo-600 bg-indigo-600' : 'border-neutral-300'}`}>
                                {categoryId === cat.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-dashed border-neutral-200">
                          <button
                            type="button"
                            onClick={() => setShowCatForm(true)}
                            className="inline-flex items-center gap-1.5 font-mono text-xs font-black uppercase text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Yangi Kategoriya Qo'shish
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Inline Category Add Form */
                      <form onSubmit={handleCreateCategory} className="border border-indigo-100 p-4 space-y-3 bg-indigo-50/10 rounded-lg">
                        <h4 className="font-mono text-xs uppercase font-extrabold text-indigo-950 flex items-center gap-1.5">
                          YANGI CATEGORIYA QO'SHISH Formasi
                        </h4>
                        
                        {catError && <p className="text-xs text-red-600 bg-red-50 p-2 border border-red-200 rounded">{catError}</p>}
                        
                        <div className="grid grid-cols-1 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                              Kategoriya nomi (*)
                            </label>
                            <input
                              type="text"
                              value={newCatName}
                              onChange={(e) => setNewCatName(e.target.value)}
                              placeholder="Masalan: Baho reyting varaqasi"
                              className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-xs rounded focus:border-indigo-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                              Qisqacha tavsifi (Ixtiyoriy)
                            </label>
                            <input
                              type="text"
                              value={newCatDesc}
                              onChange={(e) => setNewCatDesc(e.target.value)}
                              placeholder="Kategoriya uchun qisqa sharh kiriting..."
                              className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-xs rounded focus:border-indigo-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => { setShowCatForm(false); setCatError(""); }}
                            className="px-3 py-1 border border-neutral-300 hover:border-indigo-500 rounded font-mono text-[10px] uppercase cursor-pointer text-slate-700 transition-all"
                          >
                            Bekor qilish
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded font-mono text-[10px] uppercase font-bold cursor-pointer transition-all"
                          >
                            Saqlash
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: STUDENT SPECIFICATION */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex justify-between items-center border-b border-indigo-100/60 pb-2">
                    <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-indigo-950">
                      2-Bosqich: O'quvchi (Talaba) ma'lumotlari
                    </h3>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">majburiy</span>
                  </div>

                  {/* Mode Selector */}
                  <div className="grid grid-cols-2 gap-4 border border-indigo-100 p-1 bg-indigo-50/20 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setStudentMode("existing")}
                      className={`py-2 px-3 tracking-wider font-mono text-xs uppercase font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all rounded ${studentMode === "existing" ? "bg-indigo-600 text-white shadow-sm" : "text-indigo-700 hover:bg-indigo-50/40"}`}
                    >
                      <Users className="w-3.5 h-3.5" /> Mavjud talabani qidirish
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentMode("new")}
                      className={`py-2 px-3 tracking-wider font-mono text-xs uppercase font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all rounded ${studentMode === "new" ? "bg-indigo-600 text-white shadow-sm" : "text-indigo-700 hover:bg-indigo-50/40"}`}
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Yangi talaba qo'shish
                    </button>
                  </div>

                  {studentMode === "existing" ? (
                    /* Existing student Search selection */
                    <div className="space-y-3.5">
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1 font-semibold">
                        Arxivdagi talabalar ro'yxatidan tanlang (*)
                      </label>
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm rounded focus:border-indigo-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all cursor-pointer"
                      >
                        <option value="">-- Talabani tanlang --</option>
                        {existingStudents.map((std) => (
                          <option key={std.id} value={std.id}>
                            {std.lastName} {std.firstName} {std.middleName || ""} - Guruh: {std.groupName || "N/A"} &middot; HEMIS: {std.studentId || "N/A"}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-neutral-400 leading-normal font-mono uppercase bg-neutral-50 p-2 border border-neutral-200">
                        * TAVSIYA: Biznes duplications pasaytirish uchun o'quvchi kodi (student ID/HEMIS) borligini tekshiring.
                      </p>
                    </div>
                  ) : (
                    /* Complete New student Form layout */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1 font-semibold">
                          Familiyasi (*)
                        </label>
                         <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Faqat harflar (kamida 2 xona)"
                          className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-xs rounded focus:border-indigo-600 outline-hidden focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1 font-semibold">
                          Ismi (*)
                        </label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Faqat harflar"
                          className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-xs rounded focus:border-indigo-600 outline-hidden focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                          Otasining ismi
                        </label>
                        <input
                          type="text"
                          value={middleName}
                          onChange={(e) => setMiddleName(e.target.value)}
                          placeholder="Karimovich yoki Rustamovna"
                          className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-xs rounded focus:border-indigo-600 outline-hidden focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                          Guruh raqami / yo'nalishi
                        </label>
                        <input
                          type="text"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          placeholder="Qisqa guruh kodi, masalan: IF-20"
                          className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-xs rounded focus:border-indigo-600 outline-hidden focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                          Tug'ilgan sanasi
                        </label>
                        <input
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-xs rounded focus:border-indigo-600 outline-hidden focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                          Telefon raqami
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+998 90 123 45 67"
                          className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-xs rounded focus:border-indigo-600 outline-hidden focus:ring-1 focus:ring-indigo-100 transition-all font-mono"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 3: PDF FILE UPLOAD */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex justify-between items-center border-b border-indigo-100/60 pb-2">
                    <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-indigo-950">
                      3-Bosqich: Elektron PDF hujjati yuklash
                    </h3>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">majburiy</span>
                  </div>

                  {fileError && <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 border border-red-200 rounded">{fileError}</p>}

                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 p-8 bg-slate-50/50 hover:bg-indigo-50/10 text-center cursor-pointer transition-all rounded-xl relative">
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Hujjatni bu yerga bosing yoki sudrab keling"
                      />
                      <div className="space-y-2">
                        <FileUp className="w-10 h-10 text-indigo-400 mx-auto animate-bounce-subtle" />
                        <p className="text-sm font-sans font-bold text-indigo-950">Faylni tanlash yoki sudrab yuklash</p>
                        <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest">Faqat .pdf formatida, maksimal 20 MB</p>
                      </div>
                    </div>

                    {file && (
                      <div className="border border-indigo-100 rounded-lg p-4 space-y-2 bg-indigo-50/10">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="truncate max-w-xs font-bold text-indigo-950">{file.name}</span>
                          <span className="text-indigo-600 font-bold">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                        
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between text-[10px] font-mono uppercase text-neutral-400">
                          <span>Progress</span>
                          <span className="text-indigo-600 font-bold">{uploadProgress === 100 ? "Tayyor (Base64 tayyorlangan)" : "Bajarilmoqda..."}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: PLACEMENT MAP */}
              {step === 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex justify-between items-center border-b border-indigo-100/60 pb-2">
                    <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-indigo-950">
                      4-Bosqich: Fizik saqlash joylashuvi (Koordinata)
                    </h3>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">majburiy</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5 font-semibold">
                        Arxiv Shkafi (*)
                      </label>
                      <select
                        value={cabinetId}
                        onChange={(e) => { setCabinetId(e.target.value); setFloor(""); }}
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm rounded focus:border-indigo-600 outline-hidden focus:ring-1 focus:ring-indigo-100 transition-all cursor-pointer"
                      >
                        <option value="">-- Shkafni tanlang --</option>
                        {cabinets.map((cab) => (
                           <option key={cab.id} value={cab.id}>{cab.name} - (Maksimal {cab.maxFloor} qavat)</option>
                        ))}
                      </select>
                      {selectedCabinet && (
                        <p className="text-[10px] text-neutral-500 font-mono mt-1 italic">
                          Tavsif: {selectedCabinet.description || "N/A"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5 font-bold">
                        Qavat raqami (Butun musbat son) (*)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedCabinet ? selectedCabinet.maxFloor : "99"}
                        value={floor}
                        onChange={(e) => setFloor(e.target.value === "" ? "" : Number(e.target.value))}
                        disabled={!cabinetId}
                        placeholder={selectedCabinet ? `1 va ${selectedCabinet.maxFloor} oralig'ida` : "Avvalo shkaf tanlang"}
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm rounded focus:border-indigo-600 outline-hidden focus:ring-1 focus:ring-indigo-100 transition-all font-mono normal-case disabled:bg-neutral-50"
                      />
                      {selectedCabinet && (
                        <p className="text-[10px] text-indigo-650 font-bold uppercase tracking-wider font-mono mt-1">
                          Varaqa formati: «{selectedCabinet.name}, {floor || "N"}-qavat»
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                        Shkafdagi aniq joylashuv izohi (Ixtiyoriy)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Masalan: chap bo'lim orqa tomondagi ko'k jildli tezis jurnali"
                        rows={3}
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm rounded focus:border-indigo-600 outline-hidden focus:ring-1 focus:ring-indigo-100 transition-all"
                      ></textarea>
                    </div>
                  </div>
                </motion.div>
              )}              {/* STEP 5: FINAL COMPLETE CONFIRMATION SUMMARY */}
              {step === 5 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
                    <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-indigo-950">
                      5-Bosqich: Arxivga kiritishdan oldin xulosa
                    </h3>
                    <span className="font-mono text-[10px] text-indigo-400 uppercase font-black tracking-widest">tasdiqlash zaxirasi</span>
                  </div>

                  <div className="border border-indigo-100 rounded-xl overflow-hidden divide-y divide-indigo-50/60 shadow-sm">
                    <div className="bg-indigo-50/30 p-3 font-mono text-[11px] font-bold text-indigo-850 uppercase">
                      Hujjat kiritiladigan o'quvchi:
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {studentMode === "existing" ? (
                        <>
                          <div>
                            <span className="text-slate-400 block font-mono text-[9px] uppercase">O'QUVCHI F.I.Sh:</span>
                            <span className="font-semibold text-slate-800">
                              {existingStudents.find(s => s.id === selectedStudentId)?.lastName}{" "}
                              {existingStudents.find(s => s.id === selectedStudentId)?.firstName}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-mono text-[9px] uppercase">HEMIS ID (CODE):</span>
                            <span className="font-mono text-slate-800">{existingStudents.find(s => s.id === selectedStudentId)?.studentId || "N/A"}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-slate-400 block font-mono text-[9px] uppercase">O'QUVCHI F.I.Sh (YANGI):</span>
                            <span className="font-semibold text-slate-800">{lastName} {firstName} {middleName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-mono text-[9px] uppercase">GURUH & B-SANA:</span>
                            <span className="text-slate-800">{groupName} &middot; {birthDate ? new Date(birthDate).toLocaleDateString() : "Naima"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-mono text-[9px] uppercase">Telefon raqami</span>
                            <span className="font-mono text-slate-800">{phone || "N/A"}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="bg-indigo-50/30 p-3 font-mono text-[11px] font-bold text-indigo-850 uppercase">
                      Kategoriya va yuklanadigan fayl nusxasi:
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-mono text-[9px] uppercase">Hujjat turi (Kategoriya):</span>
                        <span className="font-bold text-slate-800">{categories.find(c => c.id === categoryId)?.name || "Kategoriya topilmadi"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono text-[9px] uppercase">Yuklangan PDF nomi:</span>
                        <span className="font-mono text-xs text-slate-700 truncate block font-bold">{file?.name}</span>
                      </div>
                    </div>

                    <div className="bg-indigo-50/30 p-3 font-mono text-[11px] font-bold text-indigo-850 uppercase">
                      Haqiqiy fizik saqlash koordinatasi:
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-indigo-950 text-white">
                      <div>
                        <span className="text-indigo-200 block font-mono text-[9px] uppercase">SHKAF REKVIZITI:</span>
                        <span className="font-black text-sm tracking-wider uppercase font-sans text-white">{selectedCabinet?.name}</span>
                      </div>
                      <div>
                        <span className="text-indigo-200 block font-mono text-[9px] uppercase">TOKCHA / QAVAT:</span>
                        <span className="font-mono font-black text-base text-emerald-400">{floor}-QAVAT</span>
                      </div>
                      {notes && (
                        <div className="col-span-2 border-t border-indigo-900/40 pt-2">
                          <span className="text-indigo-200 block font-mono text-[9px] uppercase">QO'SHIMCHA IZOH:</span>
                          <span className="italic opacity-80 text-indigo-100">{notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* LOWER DIALOG BUTTONS CONTROL */}
            <div className="border-t border-neutral-100 pt-4 flex justify-between gap-3 sticky bottom-0 bg-white">
              <button
                type="button"
                disabled={step === 1 || loading}
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 border border-neutral-300 hover:border-indigo-500 rounded text-slate-700 font-mono text-xs uppercase font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Orqaga
              </button>

              {step < 5 ? (
                <button
                  type="button"
                  disabled={!isStepValid()}
                  onClick={() => setStep(step + 1)}
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 font-mono text-xs uppercase font-bold flex items-center gap-1 cursor-pointer transition-all rounded"
                >
                  Keyingisi <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleIntakeSubmit}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs uppercase font-black tracking-wider flex items-center gap-1.5 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 transition-all rounded shadow-md shadow-indigo-100/40"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Qabul qilinmoqda...
                    </>
                  ) : (
                    <>
                      Arxivga Saqlash
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
