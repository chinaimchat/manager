import request from '@/utils/axios';

export function messageSendPost(data: any) {
  return request({ url: '/manager/message/send', method: 'post', data });
}

export function messageSendAllPost(data: any) {
  return request({ url: '/manager/message/sendall', method: 'post', data });
}

export function messageSendfriends(data: any) {
  return request({ url: '/manager/message/sendfriends', method: 'post', data });
}

export function messageGet(params: any) {
  return request({ url: '/manager/message', method: 'get', params });
}

export function messageRecordGet(params: any) {
  return request({ url: '/manager/message/record', method: 'get', params });
}

export function messageRecordpersonalGet(params: any) {
  return request({ url: '/manager/message/recordpersonal', method: 'get', params });
}

export function messageDelete(data: any) {
  return request({ url: '/manager/message', method: 'delete', data });
}

export function messageHardDelete(data: any) {
  return request({ url: '/manager/message/hard', method: 'delete', data });
}

export function messageUserDevices(params: any) {
  return request({ url: '/manager/message/devices', method: 'get', params });
}

// ===== 违禁词管理 =====

export function prohibitWordsGet(params: any) {
  return request({ url: '/manager/message/prohibit_words', method: 'get', params });
}
export function prohibitWordsAdd(params: any) {
  return request({ url: '/manager/message/prohibit_words', method: 'post', params });
}
export function prohibitWordsDelete(params: any) {
  return request({ url: '/manager/message/prohibit_words', method: 'delete', params });
}

// ===== 敏感词管理 =====

export function sensitiveWordsGet(params: any) {
  return request({ url: '/manager/message/sensitive_words', method: 'get', params });
}
export function sensitiveWordsAdd(data: any) {
  return request({ url: '/manager/message/sensitive_words', method: 'post', data });
}
export function sensitiveWordsBatchAdd(data: any) {
  return request({ url: '/manager/message/sensitive_words/batch', method: 'post', data });
}
export function sensitiveWordsUpdate(data: any) {
  return request({ url: '/manager/message/sensitive_words', method: 'put', data });
}
export function sensitiveWordsDelete(params: any) {
  return request({ url: '/manager/message/sensitive_words', method: 'delete', params });
}
