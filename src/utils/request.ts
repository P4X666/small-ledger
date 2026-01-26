import Taro from '@tarojs/taro';
import { getBaseUrl } from './base-url';
import { redirectToLogin } from '@/utils/auth';

// API基础URL
const BASE_URL = getBaseUrl();

// 响应数据类型
interface ResponseData {
  code: number;
  message: string;
  data?: any;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface RequestResponse<T> {
  statusCode: number;
  data: ApiResponse<T>;
  header: Record<string, any>;
  cookies: string[];
}

export interface CommonListResponseData {
  data: unknown;
  links: {
    first?: string;
    last?: string;
    current: string;
    prev?: string | null;
    next?: string | null;
  };
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  }
}

interface RequestOptions extends Taro.request.Option {
  showLoading?: boolean;
  loadingTitle?: string;
  loadingMask?: boolean;
}

let loading = false;
/**
 * Taro.request Promise封装
 * @param options Taro.request的所有配置参数
 * @returns Promise对象
 */
export const request = (options: RequestOptions): Promise<any> => {
  const { url, method, showLoading, loadingTitle, loadingMask, ...restOptions } = options;
  // 合并基础配置和用户配置
  const config = {
    url: `${BASE_URL}${url}`,
    method: method || 'GET',
    header: {
      'Content-Type': 'application/json',
      ...options.header
    },
    timeout: options.timeout || 10000,
    ...restOptions
  };

  // 获取本地存储的Token
  const token = Taro.getStorageSync('token');
  if (token) {
    config.header = {
      ...config.header,
      Authorization: `Bearer ${token}`
    };
  }

  // 显示加载状态
  if (showLoading && !loading) {
    loading = true;
    Taro.showLoading({
      title: loadingTitle || '加载中...',
      mask: loadingMask ?? true
    });
  }
  // 返回Promise
  return new Promise((resolve, reject) => {
    // 调用原生Taro.request
    Taro.request({
      ...config,
      // 成功回调
      success: (res) => {
        const { statusCode, data, header, cookies } = res;
        
        // 标准化响应数据
        const response = {
          statusCode,
          data: data as ResponseData,
          header,
          cookies
        };

        // 根据HTTP状态码判断请求是否成功
        if (statusCode >= 200 && statusCode < 300) {
          // 请求成功，resolve响应数据
          resolve(response);
        } else {
          // 请求失败，reject标准化错误信息
          const errorMsg = (data as any).message || `请求失败，状态码：${statusCode}`;
          const error = {
            code: statusCode,
            message: errorMsg,
            response
          };
          
          // Token过期处理
          if (statusCode === 401) {
            Taro.removeStorageSync('token');
            Taro.removeStorageSync('userInfo');
            redirectToLogin();
          }
          
          reject(error);
        }
      },
      // 失败回调
      fail: (err) => {
        // 网络错误或请求失败
        const error = {
          code: err.errMsg || -1,
          message: err.errMsg || '网络请求失败',
          response: null
        };
        reject(error);
      },
      // 完成回调（无论成功或失败都会执行）
      complete: () => {
        // 隐藏加载状态
        if (showLoading && loading) {
          loading = false;
          Taro.hideLoading();
        }
      }
    });
  });
};

const removeUndefined = (obj: any) => {
  const params = {}
  for (const key in obj) {
    if (obj[key] !== undefined) {
      params[key] = obj[key];
    }
  }
  return params;
}

/**
 * GET请求封装
 * @param url 请求URL
 * @param data 请求参数
 * @param options 额外配置
 * @returns Promise对象
 */
export const get = (url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>) => {
  return request({
    url,
    method: 'GET',
    data: removeUndefined(data),
    ...options
  });
};

/**
 * POST请求封装
 * @param url 请求URL
 * @param data 请求参数
 * @param options 额外配置
 * @returns Promise对象
 */
export const post = (url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>) => {
  return request({
    url,
    method: 'POST',
    data: removeUndefined(data),
    ...options
  });
};

/**
 * PUT请求封装
 * @param url 请求URL
 * @param data 请求参数
 * @param options 额外配置
 * @returns Promise对象
 */
export const put = (url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>) => {
  return request({
    url,
    method: 'PUT',
    data: removeUndefined(data),
    ...options
  });
};

/**
 * DELETE请求封装
 * @param url 请求URL
 * @param data 请求参数
 * @param options 额外配置
 * @returns Promise对象
 */
export const del = (url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>) => {
  return request({
    url,
    method: 'DELETE',
    data: removeUndefined(data),
    ...options
  });
};

export default request;