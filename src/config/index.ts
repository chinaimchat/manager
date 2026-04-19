// 首页地址（默认）
export const HOME_URL = '/home';

// 登录页地址（默认）
export const LOGIN_URL = '/login';

// 默认主题颜色
export const DEFAULT_PRIMARY = '#E4633B';

// 路由白名单地址（必须是本地存在的路由 staticRouter.ts 中）
export const ROUTER_WHITE_LIST: string[] = ['/login'];

// 自定义应用根据运行环境获取配置
const modules: any = {};
const moduleFiles = import.meta.glob('./modules/*.ts', { import: 'default', eager: true });

Object.keys(moduleFiles).forEach(name => {
  const key = name.replace('./modules/', '').replace('.ts', '').trim();
  modules[key] = moduleFiles[name];
});

const TSDD_CONFIG = window.TSDD_CONFIG ? window.TSDD_CONFIG : {};
// 默认应用配置
export const BU_DOU_CONFIG = {
  APP_TITLE: 'AI抖商学院后台',
  APP_TITLE_SHORT: 'AI抖商学院',
  /** 用户端 Web 地址，留空则「以此用户视角查看」仅提示需在 window.TSDD_CONFIG 或 env 模块中配置 */
  CLIENT_WEB_URL: '',
  ...modules[process.env.APP_ENV as any],
  ...TSDD_CONFIG
  // APP_URL: '/api/v1/' // 正式环境地址 (通用打包镜像，用此相对地址)
};
