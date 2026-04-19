import request from '@/utils/axios';

export function web3LabList(params: any) {
  return request({ url: '/manager/web3/laboratory', method: 'get', params });
}
export function web3LabCreate(data: any) {
  return request({ url: '/manager/web3/laboratory', method: 'post', data });
}
export function web3LabUpdate(id: number, data: any) {
  return request({ url: `/manager/web3/laboratory/${id}`, method: 'put', data });
}
export function web3LabUpdateStatus(id: number, data: any) {
  return request({ url: `/manager/web3/laboratory/${id}/status`, method: 'put', data });
}
export function web3LabDelete(id: number) {
  return request({ url: `/manager/web3/laboratory/${id}`, method: 'delete' });
}
