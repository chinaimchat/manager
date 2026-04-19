import request from '@/utils/axios';

// ===== 钱包管理 =====

export function walletStatisticsGet() {
  return request({ url: '/manager/wallet/statistics', method: 'get' });
}

export function walletListGet(params: any) {
  return request({ url: '/manager/wallet/list', method: 'get', params });
}

export function walletBalanceAdjustPost(data: any) {
  return request({ url: '/manager/wallet/balance/adjust', method: 'post', data });
}

export function walletFreezePost(data: any) {
  return request({ url: '/manager/wallet/balance/freeze', method: 'post', data });
}

export function walletUnfreezePost(data: any) {
  return request({ url: '/manager/wallet/balance/unfreeze', method: 'post', data });
}

export function walletRecordsGet(params: any) {
  return request({ url: '/manager/wallet/records', method: 'get', params });
}

export function walletPasswordResetPost(data: any) {
  return request({ url: '/manager/wallet/password/reset', method: 'post', data });
}

export function walletSyncUserInfoPost() {
  return request({ url: '/manager/wallet/sync-userinfo', method: 'post' });
}

export function walletRechargePost(data: any) {
  return request({ url: '/manager/wallet/recharge', method: 'post', data });
}

// ===== 交易记录 =====

export function walletTransactionsGet(params: any) {
  return request({ url: '/manager/wallet/transactions', method: 'get', params });
}

// ===== 提现管理 =====

export function withdrawalListGet(params: any) {
  return request({ url: '/manager/wallet/withdrawal/list', method: 'get', params });
}

export function withdrawalConfigGet() {
  return request({ url: '/manager/wallet/withdrawal/config', method: 'get' });
}

export function withdrawalConfigPost(data: { fee_rate: string; fee_fixed: string }) {
  return request({ url: '/manager/wallet/withdrawal/config', method: 'post', data });
}

export function withdrawalApprovePost(data: any) {
  return request({ url: '/manager/wallet/withdrawal/approve', method: 'post', data });
}

export function withdrawalRejectPost(data: any) {
  return request({ url: '/manager/wallet/withdrawal/reject', method: 'post', data });
}

export function rechargeApplicationListGet(params: any) {
  return request({ url: '/manager/wallet/recharge/applications', method: 'get', params });
}

export function rechargeApplicationApprovePost(data: any) {
  return request({ url: '/manager/wallet/recharge/application/approve', method: 'post', data });
}

export function rechargeApplicationRejectPost(data: any) {
  return request({ url: '/manager/wallet/recharge/application/reject', method: 'post', data });
}

// ===== 操作日志 =====

export function operationLogsGet(params: any) {
  return request({ url: '/manager/wallet/operation-logs', method: 'get', params });
}

// ===== 数据导出 =====

export function exportWalletList(params: any) {
  return request({ url: '/manager/wallet/export/wallets', method: 'get', params, responseType: 'blob' });
}

export function exportRecordList(params: any) {
  return request({ url: '/manager/wallet/export/records', method: 'get', params, responseType: 'blob' });
}

export function exportWithdrawalList(params: any) {
  return request({ url: '/manager/wallet/export/withdrawals', method: 'get', params, responseType: 'blob' });
}

// ===== 红包（管理端，与后端 /v1/manager/wallet/redpacket 对齐）=====

const RP_BASE = '/manager/wallet/redpacket';

export function redpacketListGet(params: any) {
  return request({ url: `${RP_BASE}/list`, method: 'get', params });
}

export function redpacketDetailGet(packetNo: string) {
  return request({ url: `${RP_BASE}/detail/${packetNo}`, method: 'get' });
}

export function redpacketStatusUpdate(id: number, data: any) {
  return request({ url: `${RP_BASE}/status/${id}`, method: 'put', data });
}

export function redpacketRecordsGet(params: any) {
  return request({ url: `${RP_BASE}/records`, method: 'get', params });
}

export function redpacketStatisticsGet() {
  return request({ url: `${RP_BASE}/statistics`, method: 'get' });
}

export function redpacketConfigGet() {
  return request({ url: `${RP_BASE}/config`, method: 'get' });
}

export function redpacketConfigUpdate(data: any) {
  return request({ url: `${RP_BASE}/config`, method: 'put', data });
}

export function redpacketAnalyticsType() {
  return request({ url: `${RP_BASE}/analytics/type`, method: 'get' });
}

export function redpacketAnalyticsScene() {
  return request({ url: `${RP_BASE}/analytics/scene`, method: 'get' });
}

export function redpacketAnalyticsTrend() {
  return request({ url: `${RP_BASE}/analytics/trend`, method: 'get' });
}

export function redpacketAnalyticsSummary() {
  return request({ url: `${RP_BASE}/analytics/summary`, method: 'get' });
}

export function redpacketExportList(params: any) {
  return request({ url: `${RP_BASE}/export/redpackets`, method: 'get', params, responseType: 'blob' });
}

export function redpacketExportAnalytics() {
  return request({ url: `${RP_BASE}/export/analytics`, method: 'get', responseType: 'blob' });
}

export function redpacketRiskMonitor() {
  return request({ url: `${RP_BASE}/risk/monitor`, method: 'get' });
}

export function redpacketRiskAction(data: any) {
  return request({ url: `${RP_BASE}/risk/action`, method: 'post', data });
}

export function redpacketRiskBatchAction(data: any) {
  return request({ url: `${RP_BASE}/risk/batch_action`, method: 'post', data });
}

export function redpacketRiskRules() {
  return request({ url: `${RP_BASE}/risk/rules`, method: 'get' });
}

export function redpacketRiskRuleCreate(data: any) {
  return request({ url: `${RP_BASE}/risk/rules`, method: 'post', data });
}

export function redpacketRiskRuleUpdate(id: number, data: any) {
  return request({ url: `${RP_BASE}/risk/rules/${id}`, method: 'put', data });
}

export function redpacketRiskRuleDelete(id: number) {
  return request({ url: `${RP_BASE}/risk/rules/${id}`, method: 'delete' });
}

export function redpacketRiskRuleToggle(id: number, enabled: number) {
  return request({ url: `${RP_BASE}/risk/rules/${id}/toggle`, method: 'put', data: { enabled } });
}

// ===== 转账 =====

export function transferListGet(params: any) {
  return request({ url: '/manager/transfer/list', method: 'get', params });
}

export function transferDetailGet(transferNo: string) {
  return request({ url: `/manager/transfer/detail/${transferNo}`, method: 'get' });
}

export function transferStatusUpdate(transferNo: string, data: any) {
  return request({ url: `/manager/transfer/status/${transferNo}`, method: 'put', data });
}

export function transferRefund(transferNo: string, data: any) {
  return request({ url: `/manager/transfer/refund/${transferNo}`, method: 'post', data });
}

export function transferStatisticsGet() {
  return request({ url: '/manager/transfer/statistics', method: 'get' });
}

export function transferConfigGet() {
  return request({ url: '/manager/transfer/config', method: 'get' });
}

export function transferConfigUpdate(data: any) {
  return request({ url: '/manager/transfer/config', method: 'put', data });
}

export function transferAnalyticsUser() {
  return request({ url: '/manager/transfer/analytics/user', method: 'get' });
}

export function transferAnalyticsTrend() {
  return request({ url: '/manager/transfer/analytics/trend', method: 'get' });
}

export function transferAnalyticsAmount() {
  return request({ url: '/manager/transfer/analytics/amount', method: 'get' });
}

export function transferAnalyticsSummary() {
  return request({ url: '/manager/transfer/analytics/summary', method: 'get' });
}

export function transferRiskMonitor() {
  return request({ url: '/manager/transfer/risk/monitor', method: 'get' });
}

export function transferRiskAction(data: any) {
  return request({ url: '/manager/transfer/risk/action', method: 'post', data });
}

export function transferRiskAlerts() {
  return request({ url: '/manager/transfer/risk/alerts', method: 'get' });
}

export function transferExportList(params: any) {
  return request({ url: '/manager/transfer/export/transfers', method: 'get', params, responseType: 'blob' });
}

export function transferExportAnalytics() {
  return request({ url: '/manager/transfer/export/analytics', method: 'get', responseType: 'blob' });
}

// ===== 支付配置 =====

export function managerUploadImage(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('contenttype', file.type || 'image/png');
  return request({ url: '/manager/upload/image', method: 'post', data: fd });
}

export function rechargeChannelList(params?: { page_index?: number; page_size?: number }) {
  return request({ url: '/manager/pay/recharge-channels', method: 'get', params });
}
export function rechargeChannelGet(id: number) {
  return request({ url: `/manager/pay/recharge-channels/${id}`, method: 'get' });
}
export function rechargeChannelCreate(data: any) {
  return request({ url: '/manager/pay/recharge-channels', method: 'post', data });
}
export function rechargeChannelUpdate(id: number, data: any) {
  return request({ url: `/manager/pay/recharge-channels/${id}`, method: 'put', data });
}
export function rechargeChannelUpdateStatus(id: number, data: any) {
  return request({ url: `/manager/pay/recharge-channels/${id}/status`, method: 'put', data });
}
export function rechargeChannelDelete(id: number) {
  return request({ url: `/manager/pay/recharge-channels/${id}`, method: 'delete' });
}

export function udunConfigGet() {
  return request({ url: '/manager/udun/config', method: 'get' });
}
export function udunConfigUpdate(id: number, data: any) {
  return request({ url: `/manager/udun/config/${id}`, method: 'put', data });
}

export function udunCoinTypeList() {
  return request({ url: '/manager/udun/coin-types', method: 'get' });
}
export function udunCoinTypeSync() {
  return request({ url: '/manager/udun/coin-types/sync', method: 'post' });
}
export function udunCoinTypeUpdate(id: number, data: any) {
  return request({ url: `/manager/udun/coin-types/${id}`, method: 'put', data });
}
export function udunCoinTypeUpdateStatus(id: number, data: any) {
  return request({ url: `/manager/udun/coin-types/${id}/status`, method: 'put', data });
}
export function udunCoinTypeDelete(id: number) {
  return request({ url: `/manager/udun/coin-types/${id}`, method: 'delete' });
}
