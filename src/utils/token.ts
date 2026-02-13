import Taro from "@tarojs/taro";

let token = '';

/**
 * 获取token
 * @returns token
 */
export const getToken = () => {
    if (!token) {
        token = Taro.getStorageSync('token');
    }
    return token;
}

/**
 * 设置token
 * @param newToken 新token
 */
export const setToken = (newToken: string) => {
    if(token === newToken) return;
    token = newToken;
    Taro.setStorageSync('token', newToken);
}
