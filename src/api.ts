/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole } from "./types.js";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "https://api.arxivfjsti.uz/api/v1";

const ACCESS_KEY = "arxiv_access_token";
const REFRESH_KEY = "arxiv_refresh_token";
const USER_KEY = "arxiv_user";

let refreshInFlight: Promise<void> | null = null;

export function getAuthToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  // Legacy key used by older code paths
  localStorage.setItem("arxiv_auth_token", accessToken);
}

export function setStoredUser(user: any) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removeAuthToken() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem("arxiv_auth_token");
  localStorage.removeItem(USER_KEY);
}

export function getDocumentDownloadUrl(documentId: string): string {
  return `${API_BASE}/documents/${documentId}/download`;
}

/** @deprecated Use getDocumentDownloadUrl(documentId) */
export function getPdfUrl(pdfPathOrDocId: string | undefined | null): string {
  if (!pdfPathOrDocId) return "";
  // UUID тАФ download endpoint; eski pdf_path тАФ to'g'ridan-to'g'ri URL
  if (/^[0-9a-f-]{36}$/i.test(pdfPathOrDocId)) {
    return getDocumentDownloadUrl(pdfPathOrDocId);
  }
  return pdfPathOrDocId;
}

function parseErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const d = data as Record<string, unknown>;
  if (typeof d.detail === "string") return d.detail;
  if (typeof d.error === "string") return d.error;
  if (Array.isArray(d.detail) && d.detail.length > 0) {
    const first = d.detail[0] as { msg?: string };
    if (first?.msg) return first.msg;
  }
  return fallback;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function refreshAccessToken(): Promise<void> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("Sessiya muddati tugagan. Qayta kiring.");

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });

  const data = await parseResponseBody(response);
  if (!response.ok) {
    removeAuthToken();
    throw new Error(parseErrorMessage(data, "Sessiya yangilanmadi"));
  }

  const tokens = data as {
    access_token: string;
    refresh_token: string;
  };
  setAuthTokens(tokens.access_token, tokens.refresh_token);
}

async function request<T = unknown>(
  path: string,
  options: RequestInit & { skipAuth?: boolean; retry?: boolean } = {}
): Promise<T> {
  const { skipAuth, retry = true, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});

  if (!skipAuth) {
    const token = getAuthToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  if (
    !headers.has("Content-Type") &&
    fetchOptions.body &&
    !(fetchOptions.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401 && !skipAuth && retry) {
    if (!refreshInFlight) {
      refreshInFlight = refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
    }
    await refreshInFlight;
    return request<T>(path, { ...options, retry: false });
  }

  const data = await parseResponseBody(response);

  if (!response.ok) {
    throw new Error(
      parseErrorMessage(data, `So'rov xatosi (${response.status})`)
    );
  }

  if (response.status === 204) return undefined as T;
  return data as T;
}

// --- Mappers (API snake_case тЖТ UI camelCase) ---

export function mapUser(raw: {
  id: string;
  username: string;
  full_name: string;
  role: string;
  is_active?: boolean;
  created_at?: string;
}) {
  return {
    id: raw.id,
    username: raw.username,
    fullName: raw.full_name,
    role: raw.role as UserRole,
    isActive: raw.is_active ?? true,
    createdAt: raw.created_at,
  };
}

export function mapCategory(raw: any) {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    isActive: raw.is_active ?? true,
    createdAt: raw.created_at,
    docCount: raw.doc_count,
  };
}

export function mapCabinet(raw: any) {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    maxFloor: raw.max_floor,
    isActive: raw.is_active ?? true,
    createdAt: raw.created_at,
    docCount: raw.doc_count,
  };
}

export function mapDocument(raw: any) {
  const nestedStudent = raw.student
    ? {
        id: raw.student.id,
        lastName: raw.student.last_name || "",
        firstName: raw.student.first_name || "",
        middleName: raw.student.middle_name || "",
        studentId: raw.student.student_id,
        groupName: raw.student.group_name || raw.group_name,
        birthDate: raw.doc_date,
        phone: undefined,
        createdAt: raw.student.created_at || raw.created_at,
        updatedAt: raw.updated_at,
      }
    : undefined;

  const studentName =
    raw.student_name ||
    (nestedStudent
      ? `${nestedStudent.lastName} ${nestedStudent.firstName} ${nestedStudent.middleName || ""}`.trim()
      : "");

  return {
    id: raw.id,
    categoryId: raw.category_id,
    cabinetId: raw.cabinet_id,
    floor: raw.floor,
    status: raw.status,
    docName: raw.doc_name,
    notes: raw.notes ?? raw.description,
    description: raw.description,
    filePath: raw.pdf_path,
    originalFilename: raw.original_filename || raw.pdf_path || raw.doc_name,
    fileSize: raw.file_size || 0,
    receivedAt: raw.created_at,
    receivedByUserId: raw.created_by,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    studentName,
    student: nestedStudent || {
      id: raw.student_id || raw.id,
      lastName: "",
      firstName: studentName,
      middleName: "",
      studentId: undefined,
      groupName: raw.group_name,
      birthDate: raw.doc_date,
      phone: undefined,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    },
    category: raw.category ? mapCategory(raw.category) : undefined,
    cabinet: raw.cabinet ? mapCabinet(raw.cabinet) : undefined,
  };
}

export function getStudentDisplayName(doc: {
  studentName?: string;
  student?: { lastName?: string; firstName?: string; middleName?: string };
}): string {
  const s = doc.student;
  if (s && (s.lastName || s.firstName)) {
    return `${s.lastName || ""} ${s.firstName || ""} ${s.middleName || ""}`.trim();
  }
  if (doc.studentName) return doc.studentName;
  if (!s) return "";
  if (s.firstName && !s.lastName) return s.firstName;
  return "";
}

export async function fetchPdfBlob(
  doc: { id?: string; filePath?: string; pdf_path?: string },
  _download = false
): Promise<Blob> {
  if (!doc.id) {
    throw new Error("Hujjat ID topilmadi");
  }

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(getDocumentDownloadUrl(doc.id), { headers });
  if (!response.ok) {
    throw new Error(`PDF yuklanmadi (${response.status})`);
  }
  return response.blob();
}

async function fetchAllDocumentsForStats(): Promise<ReturnType<typeof mapDocument>[]> {
  const items: ReturnType<typeof mapDocument>[] = [];
  let page = 1;
  let pages = 1;
  do {
    const res = await api.getDocuments({ page, size: 100 });
    items.push(...res.documents);
    pages = res.pages || 1;
    page += 1;
  } while (page <= pages && page <= 10);
  return items;
}

export const api = {
  login: async (username: string, password: string) => {
    const tokens = await request<{
      access_token: string;
      refresh_token: string;
      token_type: string;
    }>("/auth/login", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ username, password }),
    });

    setAuthTokens(tokens.access_token, tokens.refresh_token);

    const me = await request<{
      id: string;
      username: string;
      full_name: string;
      role: string;
    }>("/auth/me");

    const user = mapUser(me);
    setStoredUser(user);
    return { token: tokens.access_token, user };
  },

  logout: async () => {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors on logout
    } finally {
      removeAuthToken();
    }
  },

  getMe: async () => {
    const me = await request<{
      id: string;
      username: string;
      full_name: string;
      role: string;
    }>("/auth/me");
    const user = mapUser(me);
    setStoredUser(user);
    return user;
  },

  getStats: async () => {
    const [counters, activities, categoriesChart, weeklyStats, cabinets, allDocs] =
      await Promise.all([
        request<{
          total_documents: number;
          total_unique_students: number;
          total_categories: number;
          total_cabinets: number;
          today_added: number;
          today_searches: number;
        }>("/dashboard/counters"),
        request<
          Array<{
            id: string;
            student_name: string;
            group_name: string;
            status: string;
            created_at: string;
          }>
        >("/dashboard/activities"),
        request<Array<{ name: string; count: number }>>(
          "/dashboard/categories-chart"
        ),
        request<Array<{ date: string; count: number }>>(
          "/dashboard/weekly-stats"
        ),
        request<any[]>("/cabinets"),
        fetchAllDocumentsForStats(),
      ]);

    const categories = await request<any[]>("/categories");
    const catByName = new Map(categories.map((c) => [c.name, c]));

    const total = counters.total_documents || 0;
    const categoryStats = categoriesChart.map((c) => {
      const cat = catByName.get(c.name);
      return {
        id: cat?.id || c.name,
        name: c.name,
        count: c.count,
        percent: total > 0 ? Math.round((c.count / total) * 100) : 0,
      };
    });

    const mappedCabinets = cabinets.map(mapCabinet);
    const cabinetStats = mappedCabinets.map((cab) => {
      const cabDocs = allDocs.filter((d) => d.cabinetId === cab.id);
      const floorDistribution: Record<number, number> = {};
      for (let i = 1; i <= cab.maxFloor; i++) floorDistribution[i] = 0;
      cabDocs.forEach((d) => {
        if (d.floor >= 1 && d.floor <= cab.maxFloor) {
          floorDistribution[d.floor] =
            (floorDistribution[d.floor] || 0) + 1;
        }
      });
      return {
        id: cab.id,
        name: cab.name,
        description: cab.description,
        count: cabDocs.length,
        floorDistribution,
      };
    });

    const songgiYozuvlar = activities.map((a) => ({
      id: a.id,
      studentName: a.student_name,
      categoryName: "тАФ",
      cabinetName: a.group_name,
      floor: 0,
      status: a.status,
      receivedAt: a.created_at,
    }));

    const weekdayUz = ["Yak", "Dus", "Se", "Chor", "Pay", "Jum", "Sha"];
    const weeklyData = weeklyStats.map((d) => {
      const date = new Date(d.date);
      return {
        date: d.date,
        dayName: `${d.date.substring(8, 10)}-${d.date.substring(5, 7)} (${weekdayUz[date.getDay()]})`,
        count: d.count,
      };
    });

    return {
      counters: {
        jamiHujjatlar: counters.total_documents,
        jamiOquvchilar: counters.total_unique_students,
        jamiKategoriyalar: counters.total_categories,
        jamiShkaflar: counters.total_cabinets,
        bugunQabulQilingan: counters.today_added,
        bugunQidiruvlar: counters.today_searches,
      },
      categoryStats,
      cabinetStats,
      songgiYozuvlar,
      weeklyData,
    };
  },

  getDocuments: async (params: {
    q?: string;
    categoryId?: string;
    cabinetId?: string;
    floor?: number;
    docDate?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    page?: number;
    limit?: number;
    size?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.q) query.set("query", params.q);
    if (params.categoryId) query.set("category_id", params.categoryId);
    if (params.cabinetId) query.set("cabinet_id", params.cabinetId);
    if (params.floor) query.set("floor", String(params.floor));
    if (params.docDate) query.set("doc_date", params.docDate);
    query.set("page", String(params.page || 1));
    query.set("size", String(params.size || params.limit || 20));

    const res = await request<{
      items: any[];
      total: number;
      page: number;
      size: number;
      pages: number;
    }>(`/documents?${query.toString()}`);

    let documents = res.items.map(mapDocument);

    if (params.status) {
      documents = documents.filter((d) => d.status === params.status);
    }
    if (params.dateFrom) {
      documents = documents.filter((d) => d.receivedAt >= params.dateFrom!);
    }
    if (params.dateTo) {
      const toStr = params.dateTo.includes("T")
        ? params.dateTo
        : `${params.dateTo}T23:59:59.999Z`;
      documents = documents.filter((d) => d.receivedAt <= toStr);
    }

    return {
      documents,
      total: res.total,
      page: res.page,
      limit: res.size,
      pages: res.pages,
    };
  },

  getDocument: async (id: string) => {
    const list = await api.getDocuments({ q: "", page: 1, size: 100 });
    const found = list.documents.find((d) => d.id === id);
    if (found) return found;
    throw new Error("Hujjat topilmadi");
  },

  createDocument: async (form: FormData) => {
    const raw = await request<any>("/documents", {
      method: "POST",
      body: form,
    });
    return mapDocument(raw);
  },

  updateDocument: async (
    id: string,
    data: {
      categoryId?: string;
      cabinetId?: string;
      floor?: number;
      studentName?: string;
      studentBirthDate?: string;
      groupName?: string;
      status?: string;
      notes?: string;
      description?: string;
    }
  ) => {
    const body: Record<string, unknown> = {};
    if (data.categoryId) body.category_id = data.categoryId;
    if (data.cabinetId) body.cabinet_id = data.cabinetId;
    if (data.floor !== undefined) body.floor = data.floor;
    if (data.studentName) body.student_name = data.studentName;
    if (data.studentBirthDate) body.doc_date = data.studentBirthDate;
    if (data.groupName) body.group_name = data.groupName;
    if (data.status) body.status = data.status;
    if (data.notes !== undefined) body.notes = data.notes;
    if (data.description !== undefined) body.description = data.description;

    const raw = await request<any>(`/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return mapDocument(raw);
  },

  deleteDocument: (id: string) =>
    request(`/documents/${id}`, { method: "DELETE" }),

  getCategories: async (all = false) => {
    const list = await request<any[]>("/categories");
    const mapped = list.map(mapCategory);
    if (all) return mapped;
    return mapped.filter((c) => c.isActive);
  },

  createCategory: async (name: string, description?: string) => {
    const raw = await request<any>("/categories", {
      method: "POST",
      body: JSON.stringify({ name, description: description || null }),
    });
    return mapCategory(raw);
  },

  updateCategory: async (
    id: string,
    name: string,
    description?: string,
    isActive?: boolean
  ) => {
    const raw = await request<any>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name,
        description,
        is_active: isActive,
      }),
    });
    return mapCategory(raw);
  },

  deleteCategory: (id: string) =>
    request(`/categories/${id}`, { method: "DELETE" }),

  getCabinets: async () => {
    const list = await request<any[]>("/cabinets");
    return list.map(mapCabinet);
  },

  createCabinet: async (
    name: string,
    description?: string,
    maxFloor = 9
  ) => {
    const raw = await request<any>("/cabinets", {
      method: "POST",
      body: JSON.stringify({
        name,
        description: description || null,
        max_floor: maxFloor,
      }),
    });
    return mapCabinet(raw);
  },

  updateCabinet: async (
    id: string,
    name: string,
    description?: string,
    maxFloor?: number,
    isActive?: boolean
  ) => {
    const raw = await request<any>(`/cabinets/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name,
        description,
        max_floor: maxFloor,
        is_active: isActive,
      }),
    });
    return mapCabinet(raw);
  },

  deleteCabinet: (id: string) =>
    request(`/cabinets/${id}`, { method: "DELETE" }),

  getUsers: async () => {
    const list = await request<any[]>("/users");
    return list.map(mapUser);
  },

  createUser: async (userData: {
    username: string;
    password: string;
    fullName: string;
    role: string;
  }) => {
    const raw = await request<any>("/users", {
      method: "POST",
      body: JSON.stringify({
        username: userData.username,
        password: userData.password,
        full_name: userData.fullName,
        role: userData.role,
      }),
    });
    return mapUser(raw);
  },

  updateUser: async (
    id: string,
    userData: {
      fullName?: string;
      role?: string;
      isActive?: boolean;
      password?: string;
    }
  ) => {
    const raw = await request<any>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        full_name: userData.fullName,
        role: userData.role,
        is_active: userData.isActive,
        password: userData.password,
      }),
    });
    return mapUser(raw);
  },

  /** Audit jurnali (paginated) */
  getAuditLogs: async (page = 1, size = 50) => {
    const res = await request<{
      items: any[];
      total: number;
      page: number;
      size: number;
      pages: number;
    }>(`/audit-logs?page=${page}&size=${size}`);

    return res.items.map((log) => ({
      id: log.id,
      userId: log.user_id,
      userFullName: log.user_full_name || log.user_name || log.username || "Noma'lum",
      action: log.action || log.details || "",
      entityType: log.entity_type || log.entity || "System",
      entityId: log.entity_id,
      ip: log.ip || log.ip_address || "тАФ",
      createdAt: log.created_at,
    }));
  },

  getStudents: async (query?: string) => {
    const q = query ? `?query=${encodeURIComponent(query)}` : "";
    const list = await request<any[]>(`/students${q}`);
    return list.map((s) => ({
      id: s.id,
      lastName: s.last_name,
      firstName: s.first_name,
      middleName: s.middle_name,
      studentId: s.student_id,
      groupName: s.group_name,
      isActive: s.is_active ?? true,
      createdAt: s.created_at,
    }));
  },

  getEmployees: async (query?: string) => {
    const q = query ? `?query=${encodeURIComponent(query)}` : "";
    const list = await request<any[]>(`/employees${q}`);
    return list.map((e) => ({
      id: e.id,
      lastName: e.last_name,
      firstName: e.first_name,
      middleName: e.middle_name,
      employeeId: e.employee_id,
      department: e.department,
      position: e.position,
      phone: e.phone,
      isActive: e.is_active ?? true,
      createdAt: e.created_at,
    }));
  },
};

/** @deprecated Use setAuthTokens via login */
export function setAuthToken(token: string) {
  localStorage.setItem(ACCESS_KEY, token);
  localStorage.setItem("arxiv_auth_token", token);
}
