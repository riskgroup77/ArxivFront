/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper to get active user token from localStorage
export function getAuthToken(): string | null {
  return localStorage.getItem("arxiv_auth_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("arxiv_auth_token", token);
}

export function removeAuthToken() {
  localStorage.removeItem("arxiv_auth_token");
  localStorage.removeItem("arxiv_user");
}

async function request(url: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // Default JSON header unless FormData/Base64 is bypass handled
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errMsg = "Noma'lum xatolik yuz berdi";
    try {
      const data = await response.json();
      errMsg = data.error || errMsg;
    } catch (e) {
      // ignore
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export const api = {
  login: (username: string, password: string) => 
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    }),
    
  logout: () => 
    request("/api/auth/logout", { method: "POST" }),

  getStats: () => 
    request("/api/stats"),

  getDocuments: (params: {
    q?: string;
    categoryId?: string;
    cabinetId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.categoryId) query.set("categoryId", params.categoryId);
    if (params.cabinetId) query.set("cabinetId", params.cabinetId);
    if (params.dateFrom) query.set("dateFrom", params.dateFrom);
    if (params.dateTo) query.set("dateTo", params.dateTo);
    if (params.status) query.set("status", params.status);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    
    return request(`/api/documents?${query.toString()}`);
  },

  getDocument: (id: string) => 
    request(`/api/documents/${id}`),

  createDocument: (data: any) => 
    request("/api/documents", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  updateDocument: (id: string, data: any) => 
    request(`/api/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),

  deleteDocument: (id: string) => 
    request(`/api/documents/${id}`, { method: "DELETE" }),

  getCategories: (all: boolean = false) => 
    request(`/api/categories?all=${all}`),

  createCategory: (name: string, description?: string) => 
    request("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name, description })
    }),

  updateCategory: (id: string, name: string, description?: string, isActive?: boolean) => 
    request(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, description, isActive })
    }),

  deleteCategory: (id: string) => 
    request(`/api/categories/${id}`, { method: "DELETE" }),

  getCabinets: () => 
    request("/api/cabinets"),

  createCabinet: (name: string, description?: string, maxFloor: number = 9) => 
    request("/api/cabinets", {
      method: "POST",
      body: JSON.stringify({ name, description, maxFloor })
    }),

  updateCabinet: (id: string, name: string, description?: string, maxFloor?: number, isActive?: boolean) => 
    request(`/api/cabinets/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, description, maxFloor, isActive })
    }),

  deleteCabinet: (id: string) => 
    request(`/api/cabinets/${id}`, { method: "DELETE" }),

  getUsers: () => 
    request("/api/users"),

  createUser: (userData: any) => 
    request("/api/users", {
      method: "POST",
      body: JSON.stringify(userData)
    }),

  updateUser: (id: string, userData: any) => 
    request(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData)
    }),

  getAuditLogs: () => 
    request("/api/audit-logs"),
};
