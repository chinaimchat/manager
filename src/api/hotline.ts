import request from '@/utils/axios';

export function hotlineConfigList(params: any) {
  return request({ url: '/manager/hotline/config/list', method: 'get', params });
}
export function hotlineConfigStatistics() {
  return request({ url: '/manager/hotline/config/statistics', method: 'get' });
}
export function hotlineConfigCreate(data: any) {
  return request({ url: '/manager/hotline/config', method: 'post', data });
}
export function hotlineConfigUpdate(id: number, data: any) {
  return request({ url: `/manager/hotline/config/${id}`, method: 'put', data });
}
export function hotlineConfigDelete(id: number) {
  return request({ url: `/manager/hotline/config/${id}`, method: 'delete' });
}
export function hotlineAgentList(params: any) {
  return request({ url: '/manager/hotline/agent', method: 'get', params });
}
export function hotlineAgentAdd(data: any) {
  return request({ url: '/manager/hotline/agent', method: 'post', data });
}
export function hotlineAgentDelete(id: number) {
  return request({ url: `/manager/hotline/agent/${id}`, method: 'delete' });
}

export function hotlineTopicList(params: { app_id: string }) {
  return request({ url: '/manager/hotline/topic', method: 'get', params });
}
export function hotlineTopicCreate(data: { app_id: string; title: string; welcome: string }) {
  return request({ url: '/manager/hotline/topic', method: 'post', data });
}
export function hotlineTopicUpdate(id: number, data: { app_id: string; title: string; welcome: string }) {
  return request({ url: `/manager/hotline/topic/${id}`, method: 'put', data });
}
export function hotlineTopicDelete(id: number, params: { app_id: string }) {
  return request({ url: `/manager/hotline/topic/${id}`, method: 'delete', params });
}
