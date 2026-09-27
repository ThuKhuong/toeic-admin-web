import api from "./api";

// Admin Dashboard APIs
export const adminService = {
  // Lấy thống kê dashboard
  getDashboardStats: async () => {
    const response = await api.get("/admin/dashboard-stats");
    return response;
  },

  getDashboardTrends: async (params) => {
    const response = await api.get("/admin/dashboard-trends", { params });
    return response;
  },

  // Lấy danh sách người dùng
  getUsers: async (params) => {
    const response = await api.get("/admin/users", { params });
    return response;
  },
};

// Auth APIs
export const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response;
  },

  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response;
  },

  logout: () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminUser");
  },
};

// Vocabulary APIs (Admin)
export const vocabularyService = {
  getAll: async (params) => {
    const response = await api.get("/admin/vocabulary", { params });
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/admin/vocabulary/${id}`);
    return response;
  },

  create: async (data) => {
    const response = await api.post("/admin/vocabulary", data);
    return response;
  },

  update: async (id, data) => {
    const response = await api.put(`/admin/vocabulary/${id}`, data);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/admin/vocabulary/${id}`);
    return response;
  },

  importBulk: async (items) => {
    const response = await api.post("/admin/vocabulary/import", { items });
    return response;
  },


};

// Tests APIs (Admin)
export const testsService = {
  getAll: async (params) => {
    const response = await api.get("/admin/tests", { params });
    return response;
  },

  getById: async (id, includeAnswers = true) => {
    const response = await api.get(`/admin/tests/${id}`, {
      params: { include_answers: includeAnswers },
    });
    return response;
  },

  create: async (data) => {
    const response = await api.post("/admin/tests", data);
    return response;
  },

  createWithQuestions: async (data) => {
    const response = await api.post("/admin/tests/create-with-questions", data);
    return response;
  },

  autoGenerate: async (data) => {
    const response = await api.post("/admin/tests/auto-generate", data);
    return response;
  },

  update: async (id, data) => {
    const response = await api.put(`/admin/tests/${id}`, data);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/admin/tests/${id}`);
    return response;
  },

  getStatistics: async (id) => {
    const response = await api.get(`/admin/tests/${id}/statistics`);
    return response;
  },

  getAvailability: async (params) => {
    const response = await api.get(`/admin/tests/availability`, { params });
    return response;
  },

  getUnassignedQuestions: async (params) => {
    const response = await api.get(`/admin/tests/unassigned-questions`, {
      params,
    });
    return response;
  },

  assignQuestions: async (data) => {
    const response = await api.post(`/admin/tests/assign-questions`, data);
    return response;
  },
};

// Questions APIs (Admin)
export const questionsService = {
  getAll: async (params) => {
    const response = await api.get("/admin/questions", { params });
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/admin/questions/${id}`);
    return response;
  },

  create: async (data) => {
    const response = await api.post("/admin/questions", data);
    return response;
  },

  update: async (id, data) => {
    const response = await api.put(`/admin/questions/${id}`, data);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/admin/questions/${id}`);
    return response;
  },

  getStatistics: async () => {
    const response = await api.get("/admin/questions/statistics");
    return response;
  },

  importBulk: async (items) => {
    const response = await api.post("/admin/questions/import", { items });
    return response;
  },

  importZipPart7: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const response = await api.post("/admin/questions/import-zip/part7", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  },

  importZipPart6: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const response = await api.post("/admin/questions/import-zip/part6", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  },

  deletePassageGroup: async (passageId) => {
    const response = await api.delete(`/admin/questions/passage/${passageId}`);
    return response;
  },

  updatePassageGroup: async (passageId, data) => {
    const response = await api.put(
      `/admin/questions/passage/${passageId}`,
      data
    );
    return response;
  },
};

export const usersService = {
  list: async (params) => {
    const response = await api.get("/admin/users", { params });
    return response;
  },
  getById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response;
  },
  activate: async (id) => {
    const response = await api.put(`/admin/users/${id}/activate`);
    return response;
  },
  deactivate: async (id) => {
    const response = await api.put(`/admin/users/${id}/deactivate`);
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response;
  },
};

// Listening APIs (Admin)
export const listeningService = {
  getMaterials: async (params) => {
    const response = await api.get("/admin/listening/materials", { params });
    return response;
  },

  getMaterialById: async (id) => {
    const response = await api.get(`/admin/listening/materials/${id}`);
    return response;
  },

  createMaterial: async (data) => {
    const response = await api.post("/admin/listening/materials", data);
    return response;
  },

  updateMaterial: async (id, data) => {
    const response = await api.put(`/admin/listening/materials/${id}`, data);
    return response;
  },

  deleteMaterial: async (id) => {
    const response = await api.delete(`/admin/listening/materials/${id}`);
    return response;
  },

  getQuestionsByPart: async (part, params) => {
    const response = await api.get(`/admin/listening/questions/part/${part}`, {
      params,
    });
    return response;
  },

  getQuestionsGrouped: async (part, params) => {
    const response = await api.get(
      `/admin/listening/questions/part/${part}/grouped`,
      { params }
    );
    return response;
  },

  getQuestionsByMaterial: async (materialId, params) => {
    const response = await api.get(
      `/admin/listening/materials/${materialId}/questions`,
      { params }
    );
    return response;
  },

  createQuestion: async (part, data) => {
    const response = await api.post(
      `/admin/listening/questions/part/${part}`,
      data
    );
    return response;
  },

  deleteQuestion: async (id) => {
    const response = await api.delete(`/admin/listening/questions/${id}`);
    return response;
  },

  importQuestionsZip: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const response = await api.post(
      "/admin/listening/questions/import-zip",
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response;
  },

  getStatistics: async () => {
    const response = await api.get("/admin/listening/statistics");
    return response;
  },
};

// Test Attempts Service
export const testAttemptsService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/admin/tests/attempts/all?${queryString}`);
  },
  getDetail: async (attemptId) => {
    return await api.get(`/admin/tests/attempts/${attemptId}/detail`);
  },
};

export default {
  admin: adminService,
  auth: authService,
  vocabulary: vocabularyService,
  tests: testsService,
  questions: questionsService,
  users: usersService,
  listening: listeningService,
  testAttempts: testAttemptsService,
};
