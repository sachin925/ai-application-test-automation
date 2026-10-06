'use strict';

// Thin wrapper over a Playwright APIRequestContext for the AI Notes app.
// Wraps the /api/test/* hooks plus the public API so specs can assert at the
// HTTP layer without repeating URL and status handling.
class AppClient {
  constructor(request) {
    this.request = request;
  }

  // --- test hooks ---

  async reset() {
    const res = await this.request.post('/api/test/reset');
    if (!res.ok()) throw new Error(`POST /api/test/reset failed: ${res.status()}`);
  }

  async seed() {
    const res = await this.request.get('/api/test/seed');
    if (!res.ok()) throw new Error(`GET /api/test/seed failed: ${res.status()}`);
    return res.json();
  }

  async getAiMode() {
    const res = await this.request.get('/api/test/ai-mode');
    if (!res.ok()) throw new Error(`GET /api/test/ai-mode failed: ${res.status()}`);
    return res.json();
  }

  async setAiMode(mode, delayMs) {
    const body = delayMs ? { mode, delayMs } : { mode };
    const res = await this.request.put('/api/test/ai-mode', { data: body });
    if (!res.ok()) throw new Error(`PUT /api/test/ai-mode failed: ${res.status()}`);
    return res.json();
  }

  // --- auth ---

  async login(email, password) {
    const res = await this.request.post('/api/login', { data: { email, password } });
    return { status: res.status(), body: await res.json() };
  }

  async logout() {
    const res = await this.request.post('/api/logout');
    return { status: res.status(), body: await res.json() };
  }

  async me() {
    const res = await this.request.get('/api/me');
    return { status: res.status(), body: await res.json() };
  }

  // --- notes ---

  async listNotes(params = {}) {
    const res = await this.request.get('/api/notes', { params });
    return { status: res.status(), body: await res.json() };
  }

  async createNote(fields) {
    const res = await this.request.post('/api/notes', { data: fields });
    return { status: res.status(), body: await res.json() };
  }

  async getNote(id) {
    const res = await this.request.get(`/api/notes/${id}`);
    return { status: res.status(), body: await res.json() };
  }

  async updateNote(id, fields) {
    const res = await this.request.put(`/api/notes/${id}`, { data: fields });
    return { status: res.status(), body: await res.json() };
  }

  async deleteNote(id) {
    const res = await this.request.delete(`/api/notes/${id}`);
    return { status: res.status(), body: await res.json() };
  }

  async summarize(id) {
    const res = await this.request.post(`/api/notes/${id}/summarize`);
    return { status: res.status(), body: await res.json() };
  }
}

module.exports = { AppClient };
