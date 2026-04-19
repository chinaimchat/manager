import request from '@/utils/axios';

const fallbackWhenNotFound = (e: any) => {
  const status = e?.response?.status;
  const message = `${e?.message || ''} ${e?.response?.data?.msg || ''}`.toLowerCase();
  return status === 404 || message.includes('not found');
};

async function requestWithFallback(primary: any, fallback?: any) {
  try {
    return await request(primary);
  } catch (e: any) {
    if (!fallback || !fallbackWhenNotFound(e)) throw e;
    return request(fallback);
  }
}

export function inviteCodesGet(params: any) {
  return requestWithFallback(
    { url: '/manager/invitecode', method: 'get', params },
    { url: '/manager/invite/codes', method: 'get', params }
  );
}
export function inviteCodeCreate(data: any) {
  return requestWithFallback(
    { url: '/manager/invitecode', method: 'post', data },
    { url: '/manager/invite/code', method: 'post', data }
  );
}
export function inviteCodeDetail(idOrCode: string) {
  return requestWithFallback(
    { url: `/manager/invitecode/${idOrCode}`, method: 'get' },
    { url: `/manager/invite/code/${idOrCode}`, method: 'get' }
  );
}
export function inviteCodeUpdate(data: any) {
  const idOrCode = data?.id || data?.code || data?.invite_code;
  return requestWithFallback(
    { url: `/manager/invitecode/${idOrCode}`, method: 'put', data },
    { url: '/manager/invite/code', method: 'put', data }
  );
}
export function inviteCodeDeleteByCode(idOrCode: string) {
  return requestWithFallback(
    { url: `/manager/invitecode/${idOrCode}`, method: 'delete' },
    { url: `/manager/invite/code/${idOrCode}`, method: 'delete' }
  );
}
export function inviteCodeToggleStatus(idOrCode: string, status: number) {
  return requestWithFallback(
    { url: `/manager/invitecode/${idOrCode}`, method: 'put', data: { status } },
    { url: `/manager/invite/code/${idOrCode}/status`, method: 'put', data: { status } }
  );
}
export function inviteCodeUsers(idOrCode: string, params?: any) {
  return requestWithFallback(
    { url: `/manager/invitecode/${idOrCode}/usage`, method: 'get', params },
    { url: `/manager/invitecode/${idOrCode}/users`, method: 'get', params }
  );
}
