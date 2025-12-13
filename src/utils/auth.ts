export const decodeJWT = (token: string): { exp?: number } => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Token 解码失败:', error);
    return {};
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded.exp) return true;
  return Date.now() >= decoded.exp * 1000;
};

import Taro from "@tarojs/taro";

// 防止重复跳转标志
let isRedirecting = false;

export const getRedirecting = () => isRedirecting;

// 登录页面跳转函数
export const redirectToLogin = () => {
  if (isRedirecting) return;
  isRedirecting = true;
  
  // 获取当前页面路径
  const pages = Taro.getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const currentPath = currentPage?.route;
  
  // 如果当前不在登录页，则跳转
  if (currentPath !== 'pages/login/index') {
    Taro.reLaunch({
      url: '/pages/login/index',
      success: () => {
        isRedirecting = false;
      },
      fail: () => {
        isRedirecting = false;
      }
    });
  } else {
    isRedirecting = false;
  }
};
