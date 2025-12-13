import { post } from '../utils/request';

// API响应数据类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// Taro请求响应类型
export interface RequestResponse<T> {
  statusCode: number;
  data: ApiResponse<T>;
  header: Record<string, any>;
  cookies: string[];
}

// 用户登录请求参数类型
export interface LoginParams {
  username: string;
  password: string;
}

// 用户注册请求参数类型
export interface RegisterParams {
  username: string;
  password: string;
}

// 登录响应数据类型
export interface LoginData {
  data: {
    token: string;
    user: {
      id: number;
      username: string;
      created_at: string;
      updated_at: string;
    };
  };
}

// 注册响应数据类型
export interface RegisterData {
  id: number;
  username: string;
  created_at: string;
  updated_at: string;
}

/**
 * 用户登录
 * @param params 登录参数
 * @returns 登录响应数据
 */
export const login = async (params: LoginParams): Promise<LoginData> => {
  try {
    const response = await post('/api/auth/login', params, {
      showLoading: true,
      loadingTitle: '登录中...'
    });
    return (response as RequestResponse<LoginData>).data.data;
  } catch (error: any) {
    throw new Error(error.message || '登录失败，请重试');
  }
};

/**
 * 用户注册
 * @param params 注册参数
 * @returns 注册响应数据
 */
export const register = async (params: RegisterParams): Promise<RegisterData> => {
  try {
    const response = await post('/api/auth/register', params, {
      showLoading: true,
      loadingTitle: '注册中...'
    });
    return (response as RequestResponse<RegisterData>).data.data;
  } catch (error: any) {
    throw new Error(error.message || '注册失败，请重试');
  }
};