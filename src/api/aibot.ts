import request from '@/utils/axios';

export function aibotConfigGet() {
  return request({ url: '/manager/aibot/config', method: 'get' });
}
export function aibotConfigSave(data: any) {
  return request({ url: '/manager/aibot/config', method: 'post', data });
}
export function aibotToggle(data: any) {
  return request({ url: '/manager/aibot/toggle', method: 'post', data });
}
export function aibotHistoryGet(params: any) {
  return request({ url: '/manager/aibot/history', method: 'get', params });
}
