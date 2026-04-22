import request from '@/utils/axios';

// 添加用户
export function userAddPost(data: any) {
  return request({
    url: '/manager/user/add',
    method: 'post',
    data
  });
}

// 用户列表
export function userListGet(params: any) {
  return request({
    url: '/manager/user/list',
    method: 'get',
    params
  });
}

// 封禁用户列表
export function userDisablelistGet(params: any) {
  return request({
    url: '/manager/user/disablelist',
    method: 'get',
    params
  });
}

// 好友列表
export function userFriendsGet(params: any) {
  return request({
    url: 'manager/user/friends',
    method: 'get',
    params
  });
}

// 黑名单列表
export function userBlacklistGet(params: any) {
  return request({
    url: 'manager/user/blacklist',
    method: 'get',
    params
  });
}

// 用户封禁/解禁
export function userLiftbanPut(params: any) {
  return request({
    url: `manager/user/liftban/${params.uid}/${params.status}`,
    method: 'put'
  });
}

// 重置用户密码（仅超级管理员）
export function userResetPasswordPost(data: { uid: string; new_password: string; new_password_confirmation: string }) {
  return request({
    url: '/manager/user/resetpassword',
    method: 'post',
    data
  });
}

// 特权用户-列表
export function privilegeUserListGet(params: any) {
  return request({
    url: '/manager/user/privilege/list',
    method: 'get',
    params
  });
}

// 特权用户-搜索用户
export function privilegeUserSearchGet(params: any) {
  return request({
    url: '/manager/user/privilege/search-user',
    method: 'get',
    params
  });
}

// 特权用户-新增
export function privilegeUserAddPost(data: any) {
  return request({
    url: '/manager/user/privilege',
    method: 'post',
    data
  });
}

// 特权用户-删除
export function privilegeUserDelete(params: any) {
  return request({
    url: '/manager/user/privilege',
    method: 'delete',
    params
  });
}

// 特权用户-单项开关更新
export function privilegeUserSwitchPut(data: any) {
  return request({
    url: '/manager/user/privilege/switch',
    method: 'put',
    data
  });
}

// 特权用户-全局开关读取
export function privilegeGlobalGet() {
  return request({
    url: '/manager/user/privilege/global',
    method: 'get'
  });
}

// 特权用户-全局开关更新
export function privilegeGlobalPut(data: any) {
  return request({
    url: '/manager/user/privilege/global',
    method: 'put',
    data
  });
}

// 登录IP历史
export function loginIpHistoryGet(params: any) {
  return request({
    url: '/manager/user/login-ip-history',
    method: 'get',
    params
  });
}

// 管理员-列表
export function adminList() {
  return request({
    url: `manager/user/admin`,
    method: 'get'
  });
}

// 管理员-新增
export function adminAdd(data: any) {
  return request({
    url: `manager/user/admin`,
    method: 'post',
    data
  });
}

// 管理员-删除
export function adminDelete(params: any) {
  return request({
    url: `manager/user/admin`,
    method: 'delete',
    params
  });
}
