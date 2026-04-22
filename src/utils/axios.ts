import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { BU_DOU_CONFIG } from '@/config';
import { useUserStore } from '@/stores/modules/user';
import router from '@/router';
const userStore = useUserStore();

const PREFERRED_API_URL_KEY = 'tsdd_manager_preferred_api_url';
const PREFERRED_API_URL_TTL_MS = 10 * 60 * 1000;

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BU_DOU_CONFIG.APP_URL, // BASE_MAIN_URL
  withCredentials: false // 跨域请求时是否需要使用凭证
});

// request 拦截器
axiosInstance.interceptors.request.use(
  config => {
    // 添加token
    if (userStore.token) {
      (config as any).headers['token'] = userStore.token;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// respone 拦截器
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.config?.baseURL) {
      savePreferredAPIURL(String(response.config.baseURL));
    }
    return Promise.resolve(response.data);
  },
  (error: any) => {
    const code = error.response.status;
    if (code == 401) {
      userStore.setToken('');
      userStore.setUserInfo({ name: '您好，超管', uid: '' });
      router.replace('/login');
    }
    if (code == 400) {
      return Promise.reject(error.response.data);
    }
    // 响应失败
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.request.use(config => {
  const candidates = getOrderedAPIURLs();
  if (candidates.length > 0) {
    (config as any).__apiCandidates = candidates;
    (config as any).__apiCandidateIndex = 0;
    config.baseURL = candidates[0];
  }
  return config;
});

axiosInstance.interceptors.response.use(undefined, async (error: any) => {
  const config = error?.config;
  if (!config) {
    return Promise.reject(error);
  }
  const candidates: string[] = (config as any).__apiCandidates || [];
  let index: number = (config as any).__apiCandidateIndex ?? 0;
  if (!shouldRetryWithNextHost(error) || index >= candidates.length - 1) {
    return Promise.reject(error);
  }
  index += 1;
  (config as any).__apiCandidateIndex = index;
  config.baseURL = candidates[index];
  savePreferredAPIURL(candidates[index]);
  return axiosInstance.request(config);
});

export default axiosInstance;

function getOrderedAPIURLs(): string[] {
  const configured = normalizeAPIURLs(BU_DOU_CONFIG.APP_URLS || []);
  if (configured.length === 0) {
    return [];
  }
  const preferred = getPreferredAPIURL();
  if (!preferred || !configured.includes(preferred)) {
    return configured;
  }
  return [preferred, ...configured.filter(item => item !== preferred)];
}

function normalizeAPIURLs(urls: string[]): string[] {
  return Array.from(
    new Set(
      urls
        .map(item => (item || '').trim())
        .filter(item => !!item)
        .map(item => item.replace(/\/+$/, '') + '/')
    )
  );
}

function shouldRetryWithNextHost(error: any): boolean {
  const status = error?.response?.status;
  if (!status) {
    return true;
  }
  return status >= 500;
}

function getPreferredAPIURL(): string | undefined {
  try {
    const raw = window.localStorage.getItem(PREFERRED_API_URL_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw) as { apiURL?: string; ts?: number };
    if (!parsed.apiURL || !parsed.ts) {
      return undefined;
    }
    if (Date.now() - parsed.ts > PREFERRED_API_URL_TTL_MS) {
      return undefined;
    }
    return parsed.apiURL;
  } catch (error) {
    return undefined;
  }
}

function savePreferredAPIURL(apiURL: string) {
  window.localStorage.setItem(PREFERRED_API_URL_KEY, JSON.stringify({ apiURL, ts: Date.now() }));
}
