/**
 * Central API Client for Cafe 90 Admin Dashboard
 * Base URL: https://backend.ninety90degree.com/public/api
 * Handles Bearer token, Accept-Language, FormData, and 401 Unauthorized interceptor.
 */

const BASE_URL = 'https://backend.ninety90degree.com/public/api';

// In-flight GET requests promise tracker (URL -> Promise) to eliminate duplicate concurrent network calls
const inFlightGetRequests = new Map();

// Short-lived memory cache (URL -> { data, time }) to deduplicate simultaneous/burst requests
const getResponseCache = new Map();
const DEFAULT_GET_CACHE_TTL = 1500; // 1.5 seconds

class ApiClient {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  getToken() {
    return localStorage.getItem('admin_token') || localStorage.getItem('token') || '';
  }

  getLanguage() {
    return localStorage.getItem('cafe90_language') || 'ar';
  }

  /**
   * Invalidate cached GET responses matching a given substring pattern or completely
   */
  invalidateCache(pattern = '') {
    if (!pattern) {
      getResponseCache.clear();
      return;
    }
    for (const key of getResponseCache.keys()) {
      if (key.includes(pattern)) {
        getResponseCache.delete(key);
      }
    }
  }

  formatUrl(endpoint) {
    if (!endpoint || typeof endpoint !== 'string') return this.baseUrl;
    if (endpoint.startsWith('http')) return endpoint;
    const cleanEndpoint = endpoint.startsWith('/api/')
      ? endpoint.slice(4)
      : (endpoint.startsWith('api/') ? `/${endpoint.slice(4)}` : endpoint);
    return `${this.baseUrl}${cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`}`;
  }

  async request(endpoint, options = {}) {
    const url = this.formatUrl(endpoint);

    const headers = new Headers(options.headers || {});

    // Attach Accept header
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    // Attach Admin Bearer Token if available
    const token = this.getToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Attach Accept-Language
    if (!headers.has('Accept-Language')) {
      headers.set('Accept-Language', this.getLanguage());
    }

    // If body is NOT FormData and not already specified, set JSON header
    const isFormData = options.body instanceof FormData;
    if (!isFormData && options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        const err = new Error('Unauthorized');
        err.status = 401;
        throw err;
      }

      // Parse JSON response
      const contentType = response.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!response.ok) {
        let message = '';
        if (data && typeof data === 'object') {
          // If Laravel returned validation errors, format them clearly
          if (data.errors && typeof data.errors === 'object') {
            const errorList = Object.values(data.errors).flat().filter(Boolean);
            if (errorList.length > 0) {
              message = errorList.join(' • ');
            }
          }
          if (!message && data.message && typeof data.message === 'string') {
            message = data.message;
          }
          if (!message && data.error && typeof data.error === 'string') {
            message = data.error;
          }
          if (typeof message === 'string' && (message.includes('foreign key') || message.includes('Integrity constraint') || message.includes('1451'))) {
            message = 'لا يمكن حذف هذا العنصر لأنه مرتبط بسجلات أو حجوزات سابقة في قاعدة البيانات.';
          }
        }
        
        if (!message) {
          if (response.status === 422) {
            message = 'خطأ في التحقق من صحة البيانات المرسلة (422)';
          } else if (response.status === 401) {
            message = 'انتهت صلاحية تسجيل الدخول (401)';
          } else if (response.status === 403) {
            message = 'ليس لديك صلاحية لتنفيذ هذا الإجراء (403)';
          } else if (response.status === 404) {
            message = 'العنصر غير موجود (404)';
          } else if (response.status === 500) {
            message = 'خطأ داخلي من السيرفر (500)';
          } else {
            message = `فشل الطلب مع كود (${response.status})`;
          }
        }

        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        console.error('Network Error / CORS on URL:', url);
      }
      throw err;
    }
  }

  async get(endpoint, headers = {}, options = {}) {
    const fullUrl = this.formatUrl(endpoint);

    const force = options.force === true;
    const ttl = typeof options.ttl === 'number' ? options.ttl : DEFAULT_GET_CACHE_TTL;

    // 1. Check short-lived cache if not forcing fresh request
    if (!force) {
      const cached = getResponseCache.get(fullUrl);
      if (cached && (Date.now() - cached.time < ttl)) {
        return cached.data;
      }
    }

    // 2. Check in-flight promise deduplication
    if (inFlightGetRequests.has(fullUrl)) {
      return inFlightGetRequests.get(fullUrl);
    }

    // 3. Initiate single network request and register in-flight promise
    const promise = (async () => {
      try {
        const data = await this.request(endpoint, { method: 'GET', headers, signal: options.signal });
        getResponseCache.set(fullUrl, { data, time: Date.now() });
        return data;
      } finally {
        inFlightGetRequests.delete(fullUrl);
      }
    })();

    inFlightGetRequests.set(fullUrl, promise);
    return promise;
  }

  async post(endpoint, body, headers = {}) {
    this.invalidateCache(endpoint.split('?')[0]);
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers
    });
  }

  async put(endpoint, body, headers = {}) {
    this.invalidateCache(endpoint.split('?')[0]);
    return this.request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers
    });
  }

  async delete(endpoint, headers = {}) {
    this.invalidateCache(endpoint.split('?')[0]);
    return this.request(endpoint, { method: 'DELETE', headers });
  }

  /**
   * Helper for Laravel multipart PUT updates
   * Uses POST with ?_method=PUT and FormData field _method='PUT'
   */
  postMultipartPut(endpoint, formData) {
    this.invalidateCache(endpoint.split('?')[0]);
    if (formData instanceof FormData && !formData.has('_method')) {
      formData.append('_method', 'PUT');
    }
    const separator = endpoint.includes('?') ? '&' : '?';
    return this.post(`${endpoint}${separator}_method=PUT`, formData);
  }
}

export const apiClient = new ApiClient();
