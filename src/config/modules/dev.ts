const runtimeAPIURL =
  (typeof window !== 'undefined' && (window as any)?.TSDD_CONFIG?.APP_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_API_URL) ||
  '/api/v1/';

export default {
  APP_ENV: 'dev',
  APP_URL: runtimeAPIURL,
  // 用户端 IM Web 根地址，供「以此用户视角查看」新开标签页；也可用 window.TSDD_CONFIG.CLIENT_WEB_URL 覆盖
  CLIENT_WEB_URL: ''
};
