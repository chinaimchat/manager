/**
 * 管理端与当前页同源加载文件预览（走 nginx /api → 后端 /v1）。
 * 与 paymentconfig.vue 中逻辑一致，避免 APP_URL + path 在 path 已为绝对地址或
 * 需统一走 /api/v1/file/preview/ 时裂图。
 */
export function resolveFilePreviewSameOrigin(path: string): string {
  const p = (path || '').trim();
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) {
    try {
      const u = new URL(p);
      if (u.pathname.includes('/file/preview/')) {
        return `${u.pathname}${u.search}`;
      }
    } catch {
      /* ignore */
    }
    return p;
  }
  const rest = p.replace(/^\/+/, '').replace(/^file\/preview\/?/i, '');
  if (!rest) return '';
  return `/api/v1/file/preview/${rest}`;
}
