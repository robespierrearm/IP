// Клиент для работы с API routes (безопасно через сервер)

interface ApiResponse<T> {
  data?: T;
  count?: number;
  success: boolean;
  error?: string;
}

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // Важно для cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Client Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Тендеры
  async getTenders(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString();
    return this.request(`/tenders${query ? `?${query}` : ''}`);
  }

  async createTender(tender: any) {
    return this.request('/tenders', {
      method: 'POST',
      body: JSON.stringify(tender),
    });
  }

  async updateTender(id: number, updates: any) {
    return this.request('/tenders', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...updates }),
    });
  }

  async deleteTender(id: number) {
    return this.request(`/tenders?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Поставщики
  async getSuppliers(params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString();
    return this.request(`/suppliers${query ? `?${query}` : ''}`);
  }

  async createSupplier(supplier: any) {
    return this.request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    });
  }

  async updateSupplier(id: number, updates: any) {
    return this.request('/suppliers', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...updates }),
    });
  }

  async deleteSupplier(id: number) {
    return this.request(`/suppliers?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Расходы
  async getExpenses(params?: {
    tender_id?: number;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.tender_id) searchParams.set('tender_id', params.tender_id.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString();
    return this.request(`/expenses${query ? `?${query}` : ''}`);
  }

  async createExpense(expense: any) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  async deleteExpense(id: number) {
    return this.request(`/expenses?id=${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
