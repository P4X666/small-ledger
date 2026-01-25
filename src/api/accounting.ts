import { get, post, put, del } from '../utils/request';
import type { AccountingRecord, RecordType } from '@/store/accounting';

// API响应数据类型
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// Taro请求响应类型
interface RequestResponse<T> {
  statusCode: number;
  data: ApiResponse<T>;
  header: Record<string, any>;
  cookies: string[];
}

// 创建交易记录请求参数
interface CreateTransactionParams {
  type: RecordType;
  amount: number;
  category: string;
  remark?: string;
  date: string;
}

// 更新交易记录请求参数
type UpdateTransactionParams = Partial<CreateTransactionParams>;

// 交易记录列表响应
interface TransactionListResponse {
  data: AccountingRecord[];
  links?: {
    first?: string;
    last?: string;
    current: string;
    prev?: string | null;
    next?: string | null;
  };
  meta?: {
    currentPage?: number;
    itemsPerPage?: number;
    totalItems?: number;
    totalPages?: number;
  };
}

// 交易统计响应
interface TransactionStatisticsResponse {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlySummary: Record<string, {
    income: number;
    expense: number;
    balance: number;
  }>;
}

/**
 * 获取所有交易记录
 * @returns 交易记录列表
 */
export const getTransactions = async (): Promise<AccountingRecord[]> => {
  try {
    const response = await get('/api/transactions', {}, {
      showLoading: true,
      loadingTitle: '加载交易记录中...'
    });
    return (response as RequestResponse<TransactionListResponse>).data.data.data;
  } catch (error: any) {
    throw new Error(error.message || '获取交易记录失败');
  }
};

/**
 * 获取单个交易记录
 * @param id 交易记录ID
 * @returns 交易记录详情
 */
export const getTransaction = async (id: string): Promise<AccountingRecord> => {
  try {
    const response = await get(`/api/transactions/${id}`, {}, {
      showLoading: true,
      loadingTitle: '加载交易记录详情中...'
    });
    return (response as RequestResponse<AccountingRecord>).data.data;
  } catch (error: any) {
    throw new Error(error.message || '获取交易记录详情失败');
  }
};

/**
 * 创建交易记录
 * @param params 交易记录参数
 * @returns 创建的交易记录
 */
export const createTransaction = async (params: CreateTransactionParams): Promise<AccountingRecord> => {
  try {
    const response = await post('/api/transactions', params, {
      showLoading: true,
      loadingTitle: '创建交易记录中...'
    });
    return (response as RequestResponse<AccountingRecord>).data.data;
  } catch (error: any) {
    throw new Error(error.message || '创建交易记录失败');
  }
};

/**
 * 更新交易记录
 * @param id 交易记录ID
 * @param params 交易记录更新参数
 * @returns 更新后的交易记录
 */
export const updateTransaction = async (id: string, params: UpdateTransactionParams): Promise<AccountingRecord> => {
  try {
    const response = await put(`/api/transactions/${id}`, params, {
      showLoading: true,
      loadingTitle: '更新交易记录中...'
    });
    return (response as RequestResponse<AccountingRecord>).data.data;
  } catch (error: any) {
    throw new Error(error.message || '更新交易记录失败');
  }
};

/**
 * 删除交易记录
 * @param id 交易记录ID
 * @returns 删除结果
 */
export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    const response = await del(`/api/transactions/${id}`, {}, {
      showLoading: true,
      loadingTitle: '删除交易记录中...'
    });
    return (response as RequestResponse<boolean>).data.code === 200;
  } catch (error: any) {
    throw new Error(error.message || '删除交易记录失败');
  }
};

/**
 * 获取交易统计信息
 * @returns 交易统计信息
 */
export const getTransactionStatistics = async (): Promise<TransactionStatisticsResponse> => {
  try {
    const response = await get('/api/transactions/statistics', {}, {
      showLoading: true,
      loadingTitle: '加载统计信息中...'
    });
    return (response as RequestResponse<TransactionStatisticsResponse>).data.data;
  } catch (error: any) {
    throw new Error(error.message || '获取统计信息失败');
  }
};
