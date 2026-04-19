<template>
  <bd-page class="transfer-admin-page">
    <!-- 渐变顶部横幅 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h2>💫 转账管理系统</h2>
          <p>转账记录、资金流转、风险监控的统一管理平台</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="refreshAll">
            <el-icon><Refresh /></el-icon> 刷新数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card total-transfers">
            <div class="stat-icon"><el-icon><Switch /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.total_transfers }}</div>
              <div class="stat-label">总转账数</div>
            </div>
            <div class="stat-trend">
              <span class="trend-value">+{{ stats.today_transfers }}</span>
              <span class="trend-label">今日转账</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card total-amount">
            <div class="stat-icon"><el-icon><Wallet /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">¥{{ formatAmount(stats.total_amount) }}</div>
              <div class="stat-label">总转账金额</div>
            </div>
            <div class="stat-trend">
              <span class="trend-value">¥{{ formatAmount(stats.today_amount) }}</span>
              <span class="trend-label">今日金额</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card completed-transfers">
            <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.completed_transfers }}</div>
              <div class="stat-label">已完成转账</div>
            </div>
            <div class="stat-trend">
              <span class="trend-value">{{ stats.completion_rate?.toFixed(1) || '0.0' }}%</span>
              <span class="trend-label">完成率</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card pending-transfers">
            <div class="stat-icon"><el-icon><Clock /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.pending_transfers }}</div>
              <div class="stat-label">待审核转账</div>
            </div>
            <div class="stat-trend">
              <span class="trend-value">{{ stats.total_transfers > 0 ? Math.round(stats.pending_transfers / stats.total_transfers * 100) : 0 }}%</span>
              <span class="trend-label">占比</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 主内容 -->
    <div class="main-content">
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <!-- 💸 转账管理 Tab -->
        <el-tab-pane label="💰 转账管理" name="transfers">
          <div class="tab-content">
            <div class="tf-toolbar">
              <div class="tf-toolbar-row">
                <el-input v-model="tfQuery.keyword" placeholder="搜索转账编号/发送用户UID" clearable style="width: 240px" @keyup.enter="searchTransfers">
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
                <el-select v-model="tfQuery.status" placeholder="转账状态" clearable style="width: 120px">
                  <el-option label="全部状态" value="" />
                  <el-option label="待确认" :value="0" />
                  <el-option label="已完成" :value="1" />
                  <el-option label="已退回" :value="2" />
                </el-select>
                <el-date-picker v-model="tfStartTime" type="date" placeholder="开始时间" value-format="YYYY-MM-DD" style="width: 140px" />
                <span class="date-sep">至</span>
                <el-date-picker v-model="tfEndTime" type="date" placeholder="结束时间" value-format="YYYY-MM-DD" style="width: 140px" />
                <el-input v-model="tfQuery.min_amount" placeholder="最小金额(元)" clearable style="width: 120px" type="number" />
                <el-input v-model="tfQuery.max_amount" placeholder="最大金额(元)" clearable style="width: 120px" type="number" />
              </div>
              <div class="tf-toolbar-row">
                <div class="tf-toolbar-left">
                  <el-button type="success" @click="exportTransfers">导出列表</el-button>
                </div>
                <div class="tf-toolbar-right">
                  <el-button type="warning" @click="searchTransfers">搜索</el-button>
                  <el-button @click="resetTransfers">重置</el-button>
                </div>
              </div>
            </div>
            <el-table v-loading="tfLoading" :data="tfList" :border="true" style="width: 100%" stripe>
              <el-table-column prop="transfer_no" label="转账编号" width="180" show-overflow-tooltip />
              <el-table-column label="发送方" width="130">
                <template #default="{ row }">
                  <div class="user-info">
                    <div class="user-name">{{ row.from_name || row.from_uid }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="接收方" width="130">
                <template #default="{ row }">
                  <div class="user-info">
                    <div class="user-name">{{ row.to_name || row.to_uid }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="金额" width="110" align="right">
                <template #default="{ row }">
                  <span class="amount-text">¥{{ formatAmount(row.amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
              <el-table-column prop="created_at" label="创建时间" width="160" />
              <el-table-column label="操作" width="180" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button type="primary" size="small" link @click="showDetail(row)">详情</el-button>
                  <el-button v-if="row.status !== 2 && row.status !== 3" type="warning" size="small" link @click="showStatusManage(row)">管理</el-button>
                  <el-button v-if="row.status === 0 || row.status === 1" type="danger" size="small" link @click="showRefund(row)">退回</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="flex items-center justify-between" style="margin-top: 12px">
              <span style="color: #909399; font-size: 13px">共 {{ tfTotal }} 条</span>
              <el-pagination v-model:current-page="tfQuery.page" v-model:page-size="tfQuery.size" :page-sizes="[10, 20, 50, 100]" :background="true" :total="tfTotal" layout="sizes, prev, pager, next, jumper" @size-change="searchTransfers" @current-change="loadTransfers" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 📊 数据分析 Tab -->
        <el-tab-pane label="📊 数据分析" name="analytics">
          <div class="tab-content">
            <div class="analytics-section">
              <el-row :gutter="20" style="margin-bottom: 20px">
                <!-- 用户转账排行 -->
                <el-col :span="12">
                  <el-card shadow="never" class="analytics-card-equal">
                    <template #header>
                      <div class="card-header">
                        <span class="font-600">👤 用户转账排行</span>
                        <el-button type="warning" link @click="loadUserAnalytics"><el-icon><Refresh /></el-icon></el-button>
                      </div>
                    </template>
                    <div v-loading="analyticsLoading.user" class="analytics-content">
                      <el-tabs>
                        <el-tab-pane label="发送排行" name="senders">
                          <div class="ranking-list">
                            <div v-for="(item, idx) in (userAnalytics.top_senders || []).slice(0, 10)" :key="item.uid" class="ranking-item">
                              <div class="rank-number">{{ idx + 1 }}</div>
                              <div class="user-info">
                                <div class="user-name">{{ item.name || item.uid }}</div>
                                <div class="user-stats">{{ item.count }}次 · ¥{{ formatAmount(item.amount) }}</div>
                              </div>
                            </div>
                            <el-empty v-if="!userAnalytics.top_senders?.length" description="暂无数据" />
                          </div>
                        </el-tab-pane>
                        <el-tab-pane label="接收排行" name="receivers">
                          <div class="ranking-list">
                            <div v-for="(item, idx) in (userAnalytics.top_receivers || []).slice(0, 10)" :key="item.uid" class="ranking-item">
                              <div class="rank-number">{{ idx + 1 }}</div>
                              <div class="user-info">
                                <div class="user-name">{{ item.name || item.uid }}</div>
                                <div class="user-stats">{{ item.count }}次 · ¥{{ formatAmount(item.amount) }}</div>
                              </div>
                            </div>
                            <el-empty v-if="!userAnalytics.top_receivers?.length" description="暂无数据" />
                          </div>
                        </el-tab-pane>
                      </el-tabs>
                    </div>
                  </el-card>
                </el-col>
                <!-- 24小时转账分布 -->
                <el-col :span="12">
                  <el-card shadow="never" class="analytics-card-equal">
                    <template #header>
                      <div class="card-header">
                        <span class="font-600">⏰ 24小时转账分布</span>
                        <el-button type="warning" link @click="loadAmountAnalytics"><el-icon><Refresh /></el-icon></el-button>
                      </div>
                    </template>
                    <div v-loading="analyticsLoading.amount" class="analytics-content">
                      <div class="amount-stats-grid">
                        <div class="amount-stat-box">
                          <div class="stat-label-sm">平均金额</div>
                          <div class="stat-value-lg">¥{{ formatAmount(amountAnalytics.avg_amount) }}</div>
                        </div>
                        <div class="amount-stat-box">
                          <div class="stat-label-sm">最大单笔</div>
                          <div class="stat-value-lg">¥{{ formatAmount(amountAnalytics.max_transfer) }}</div>
                        </div>
                        <div class="amount-stat-box">
                          <div class="stat-label-sm">总金额</div>
                          <div class="stat-value-lg">¥{{ formatAmount(amountAnalytics.total_amount) }}</div>
                        </div>
                      </div>
                      <el-empty v-if="!amountAnalytics.hourly_distribution?.length" description="暂无分布数据" :image-size="80" />
                    </div>
                  </el-card>
                </el-col>
              </el-row>

              <!-- 转账趋势分析 -->
              <el-card shadow="never" style="margin-bottom: 20px">
                <template #header>
                  <div class="card-header">
                    <span class="font-600">📈 转账趋势分析（最近30天）</span>
                    <el-button type="warning" link @click="loadTrendAnalytics"><el-icon><Refresh /></el-icon></el-button>
                  </div>
                </template>
                <div v-loading="analyticsLoading.trend" class="analytics-content">
                  <el-tabs>
                    <el-tab-pane label="转账数量" name="count">
                      <div class="trend-summary">
                        <div class="summary-item" v-for="item in trendData.daily_counts.slice(-7)" :key="item.date">
                          <span class="summary-date">{{ item.date?.slice(5) }}</span>
                          <span class="summary-value">{{ item.count }}笔</span>
                        </div>
                      </div>
                      <div class="trend-total">近30天共 {{ trendData.daily_counts.reduce((s: number, d: any) => s + (d.count || 0), 0) }} 笔转账</div>
                    </el-tab-pane>
                    <el-tab-pane label="转账金额" name="amount">
                      <div class="trend-summary">
                        <div class="summary-item" v-for="item in trendData.daily_amounts.slice(-7)" :key="item.date">
                          <span class="summary-date">{{ item.date?.slice(5) }}</span>
                          <span class="summary-value">¥{{ formatAmount(item.amount) }}</span>
                        </div>
                      </div>
                      <div class="trend-total">近30天共 ¥{{ formatAmount(trendData.daily_amounts.reduce((s: number, d: any) => s + (d.amount || 0), 0)) }}</div>
                    </el-tab-pane>
                    <el-tab-pane label="完成转账" name="completed">
                      <div class="trend-summary">
                        <div class="summary-item" v-for="item in trendData.daily_completed.slice(-7)" :key="item.date">
                          <span class="summary-date">{{ item.date?.slice(5) }}</span>
                          <span class="summary-value">{{ item.count }}笔 ¥{{ formatAmount(item.amount) }}</span>
                        </div>
                      </div>
                      <div class="trend-total">近30天完成 {{ trendData.daily_completed.reduce((s: number, d: any) => s + (d.count || 0), 0) }} 笔</div>
                    </el-tab-pane>
                  </el-tabs>
                </div>
              </el-card>

              <!-- 金额区间分布 + 状态分布 -->
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card shadow="never" class="analytics-card-equal">
                    <template #header>
                      <div class="card-header">
                        <span class="font-600">💰 金额区间分布</span>
                        <el-button type="warning" link @click="loadAmountAnalytics"><el-icon><Refresh /></el-icon></el-button>
                      </div>
                    </template>
                    <div v-loading="analyticsLoading.amount" class="analytics-content">
                      <div class="amount-stats-grid">
                        <div class="amount-stat-box">
                          <div class="stat-label-sm">平均金额</div>
                          <div class="stat-value-lg">¥{{ formatAmount(amountAnalytics.avg_amount) }}</div>
                        </div>
                        <div class="amount-stat-box">
                          <div class="stat-label-sm">最大单笔</div>
                          <div class="stat-value-lg">¥{{ formatAmount(amountAnalytics.max_transfer) }}</div>
                        </div>
                        <div class="amount-stat-box">
                          <div class="stat-label-sm">总金额</div>
                          <div class="stat-value-lg">¥{{ formatAmount(amountAnalytics.total_amount) }}</div>
                        </div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card shadow="never" class="analytics-card-equal">
                    <template #header>
                      <div class="card-header">
                        <span class="font-600">📊 状态分布</span>
                        <el-button type="warning" link @click="loadSummaryAnalytics"><el-icon><Refresh /></el-icon></el-button>
                      </div>
                    </template>
                    <div v-loading="analyticsLoading.summary" class="analytics-content">
                      <div class="status-list">
                        <div class="status-row">
                          <el-tag type="success" effect="light">已完成</el-tag>
                          <span class="status-count">{{ summaryData.completed ?? 0 }} 笔</span>
                        </div>
                        <div class="status-row">
                          <el-tag type="warning" effect="light">待确认</el-tag>
                          <span class="status-count">{{ summaryData.pending ?? 0 }} 笔</span>
                        </div>
                        <div class="status-row">
                          <el-tag type="danger" effect="light">已退回</el-tag>
                          <span class="status-count">{{ summaryData.failed ?? 0 }} 笔</span>
                        </div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-tab-pane>

        <!-- 🛡️ 风控管理 Tab -->
        <el-tab-pane label="🛡️ 风控管理" name="risk">
          <div class="tab-content">
            <!-- 风控统计 -->
            <div class="risk-mini-stats">
              <div class="risk-mini-item">
                <el-icon class="risk-mini-icon" style="color: #ff6b6b"><Warning /></el-icon>
                <div class="risk-mini-value">{{ riskStats.large_transfers_today || 0 }}</div>
                <div class="risk-mini-label">今日大额转账</div>
              </div>
              <div class="risk-mini-item">
                <el-icon class="risk-mini-icon" style="color: #ffa502"><User /></el-icon>
                <div class="risk-mini-value">{{ riskStats.frequent_users_today || 0 }}</div>
                <div class="risk-mini-label">频繁转账用户</div>
              </div>
              <div class="risk-mini-item">
                <el-icon class="risk-mini-icon" style="color: #ff4757"><CircleClose /></el-icon>
                <div class="risk-mini-value">{{ riskStats.failed_transfers_today || 0 }}</div>
                <div class="risk-mini-label">今日退回</div>
              </div>
              <div class="risk-mini-item">
                <el-icon class="risk-mini-icon" style="color: #2c3e50"><View /></el-icon>
                <div class="risk-mini-value">{{ riskStats.suspicious_patterns_today || 0 }}</div>
                <div class="risk-mini-label">可疑模式</div>
              </div>
            </div>

            <!-- 风险预警 -->
            <el-card shadow="never">
              <template #header>
                <span class="font-600">⚠️ 风险预警：</span>
              </template>
              <div v-if="riskAlerts.length > 0" class="risk-alerts">
                <div v-for="alert in riskAlerts" :key="alert.id" class="alert-item">
                  <div class="alert-icon">
                    <el-icon v-if="alert.level === 'high'" color="#ff4757"><Warning /></el-icon>
                    <el-icon v-else-if="alert.level === 'medium'" color="#ffa502"><Warning /></el-icon>
                    <el-icon v-else color="#2ed573"><Warning /></el-icon>
                  </div>
                  <div class="alert-content">
                    <div class="alert-title">{{ alert.title }}</div>
                    <div class="alert-description">{{ alert.description }}</div>
                    <div class="alert-meta">
                      <el-tag v-if="alert.level" :type="alert.level === 'high' ? 'danger' : alert.level === 'medium' ? 'warning' : 'success'" size="small">{{ alert.level === 'high' ? '高风险' : alert.level === 'medium' ? '中风险' : '低风险' }}</el-tag>
                      <span class="alert-time">{{ alert.created_at }}</span>
                    </div>
                  </div>
                  <div class="alert-actions">
                    <el-button type="primary" size="small" link @click="investigateTransfer(alert.transfer_no)">调查</el-button>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无风险预警" />
            </el-card>
          </div>
        </el-tab-pane>

        <!-- ⚙️ 系统配置 Tab -->
        <el-tab-pane label="⚙️ 系统配置" name="config">
          <div class="tab-content">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="font-600">🔧 转账系统配置</span>
                  <el-button type="warning" @click="saveConfig" :loading="configSaving">+ 保存配置</el-button>
                </div>
              </template>
              <el-form :model="configDisplay" label-width="120px">
                <el-row :gutter="40">
                  <el-col :span="12">
                    <el-form-item label="最大转账金额">
                      <el-input-number v-model="configDisplay.max_amount" :min="0" :precision="2" :step="1" controls-position="right" style="width: 100%" />
                      <span class="config-unit">元</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="转账过期时间">
                      <el-input-number v-model="configRaw.expire_hours" :min="1" :max="168" controls-position="right" style="width: 100%" />
                      <span class="config-unit">小时</span>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="40">
                  <el-col :span="12">
                    <el-form-item label="最小转账金额">
                      <el-input-number v-model="configDisplay.min_amount" :min="0" :precision="2" :step="1" controls-position="right" style="width: 100%" />
                      <span class="config-unit">元</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="手续费率">
                      <el-input-number v-model="configRaw.fee_rate" :min="0" :max="10" :precision="2" :step="0.1" controls-position="right" style="width: 100%" />
                      <span class="config-unit">%</span>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="40">
                  <el-col :span="12">
                    <el-form-item label="日转账限额">
                      <el-input-number v-model="configDisplay.daily_limit" :min="0" :precision="2" :step="1000" controls-position="right" style="width: 100%" />
                      <span class="config-unit">元</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="风险阈值">
                      <el-input-number v-model="configDisplay.risk_threshold" :min="0" :precision="2" :step="100" controls-position="right" style="width: 100%" />
                      <span class="config-unit">元</span>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 转账详情弹窗 -->
    <el-dialog v-model="detailVisible" title="转账详情" width="800px" @close="detailData = null">
      <div v-if="detailData" class="transfer-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="转账编号">{{ detailData.transfer_no }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(detailData.status)">{{ getStatusText(detailData.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发送方">
            <div class="user-detail">
              <div>{{ detailData.from_name || detailData.from_uid }}</div>
              <div class="user-id-small">{{ detailData.from_uid }}</div>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="接收方">
            <div class="user-detail">
              <div>{{ detailData.to_name || detailData.to_uid }}</div>
              <div class="user-id-small">{{ detailData.to_uid }}</div>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="转账金额">
            <span class="amount-large">¥{{ formatAmount(detailData.amount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detailData.created_at }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-actions" style="margin-top: 16px; text-align: right">
          <el-button v-if="detailData.status !== 2 && detailData.status !== 3" type="warning" @click="showStatusManage(detailData)">状态管理</el-button>
          <el-button v-if="detailData.status === 0 || detailData.status === 1" type="danger" @click="showRefund(detailData)">退回转账</el-button>
          <el-button @click="investigateTransfer(detailData.transfer_no)">标记调查</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 状态管理弹窗 -->
    <el-dialog v-model="statusVisible" title="状态管理" width="500px">
      <el-form v-if="statusTarget" label-width="100px">
        <el-form-item label="当前状态">
          <el-tag :type="getStatusType(statusTarget.status)">{{ getStatusText(statusTarget.status) }}</el-tag>
        </el-form-item>
        <el-form-item label="新状态">
          <el-select v-model="statusForm.status" placeholder="请选择新状态">
            <el-option label="待确认" :value="0" />
            <el-option label="已完成" :value="1" />
            <el-option label="已退回" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="变更原因">
          <el-input v-model="statusForm.remark" type="textarea" placeholder="请输入状态变更原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusVisible = false">取消</el-button>
        <el-button type="primary" :loading="statusSaving" @click="submitStatusChange">确定</el-button>
      </template>
    </el-dialog>

    <!-- 退回转账弹窗 -->
    <el-dialog v-model="refundVisible" title="退回转账" width="500px">
      <el-form label-width="100px">
        <el-form-item label="退回原因">
          <el-input v-model="refundForm.reason" type="textarea" :rows="3" placeholder="请输入退回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundVisible = false">取消</el-button>
        <el-button type="danger" :loading="refundSaving" @click="submitRefund">确定退回</el-button>
      </template>
    </el-dialog>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 转账管理
  isAffix: false
</route>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Search, Download, Wallet, CircleCheck, Clock, Switch, Warning, CircleClose, User, View, Check } from '@element-plus/icons-vue';
import {
  transferListGet, transferDetailGet, transferStatusUpdate, transferRefund,
  transferStatisticsGet, transferConfigGet, transferConfigUpdate,
  transferAnalyticsUser, transferAnalyticsTrend, transferAnalyticsAmount, transferAnalyticsSummary,
  transferRiskMonitor, transferRiskAction, transferRiskAlerts,
  transferExportList,
} from '@/api/wallet';

const formatAmount = (v: any) => {
  if (v == null || isNaN(Number(v))) return '0.00';
  return Number(v).toFixed(2);
};
// 与后端 TFStatus 一致：0 待确认 1 已完成 2 已退回（3 为历史错误状态，视为已退回）
const getStatusText = (s: number) => ({ 0: '待确认', 1: '已完成', 2: '已退回', 3: '已退回' }[s] || '未知状态');
const getStatusType = (s: number) => ({ 0: 'warning', 1: 'success', 2: 'info', 3: 'info' }[s] || 'info');

const downloadFile = (blob: Blob, name: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  window.URL.revokeObjectURL(url);
};

// ===== State =====
const activeTab = ref('transfers');
const stats = ref<any>({ total_transfers: 0, total_amount: 0, completed_transfers: 0, pending_transfers: 0, today_transfers: 0, today_amount: 0, completion_rate: 0 });

// 转账管理
const tfList = ref<any[]>([]);
const tfLoading = ref(false);
const tfTotal = ref(0);
const tfQuery = reactive<any>({ page: 1, size: 20, keyword: '', status: undefined, min_amount: undefined, max_amount: undefined });
const tfStartTime = ref('');
const tfEndTime = ref('');

// 数据分析
const userAnalytics = ref<any>({ top_senders: [], top_receivers: [] });
const trendData = ref<any>({ daily_counts: [], daily_amounts: [], daily_completed: [] });
const amountAnalytics = ref<any>({ avg_amount: 0, max_transfer: 0, total_amount: 0, hourly_distribution: [] });
const summaryData = ref<any>({ total_transfers: 0, total_amount: 0, avg_amount: 0, completed: 0, pending: 0, failed: 0 });
const analyticsLoading = ref({ user: false, trend: false, amount: false, summary: false });

// 风控
const riskStats = ref<any>({});
const riskAlerts = ref<any[]>([]);

// 配置
const configRaw = ref<any>({ max_amount: 520001, min_amount: 100, daily_limit: 1000120, expire_hours: 24, fee_rate: 0, risk_threshold: 100000 });
const configDisplay = ref<any>({ max_amount: 5200.01, min_amount: 1, daily_limit: 10001.2, risk_threshold: 1000 });
const configSaving = ref(false);

// 弹窗
const detailVisible = ref(false);
const detailData = ref<any>(null);
const statusVisible = ref(false);
const statusTarget = ref<any>(null);
const statusForm = reactive({ status: 0, remark: '' });
const statusSaving = ref(false);
const refundVisible = ref(false);
const refundTarget = ref<any>(null);
const refundForm = reactive({ reason: '' });
const refundSaving = ref(false);

// ===== Load Functions =====

const loadStats = async () => {
  try { const r: any = await transferStatisticsGet(); if (r && typeof r === 'object') stats.value = r; }
  catch { ElMessage.error('加载统计数据失败'); }
};

const loadTransfers = async () => {
  tfLoading.value = true;
  try {
    const params: any = { ...tfQuery };
    if (params.status === '' || params.status == null) delete params.status;
    if (tfStartTime.value) params.start_time = tfStartTime.value;
    if (tfEndTime.value) params.end_time = tfEndTime.value;
    const r: any = await transferListGet(params);
    tfList.value = r?.list || []; tfTotal.value = r?.total || 0;
  } catch { ElMessage.error('加载转账列表失败'); tfList.value = []; tfTotal.value = 0; }
  finally { tfLoading.value = false; }
};

const searchTransfers = () => { tfQuery.page = 1; loadTransfers(); };
const resetTransfers = () => {
  Object.assign(tfQuery, { page: 1, size: 20, keyword: '', status: undefined, min_amount: undefined, max_amount: undefined });
  tfStartTime.value = ''; tfEndTime.value = ''; loadTransfers();
};

const showDetail = async (row: any) => {
  try {
    const r: any = await transferDetailGet(row.transfer_no);
    detailData.value = r; detailVisible.value = true;
  } catch { ElMessage.error('获取转账详情失败'); }
};

const showStatusManage = (row: any) => {
  statusTarget.value = row; statusForm.status = row.status; statusForm.remark = '';
  statusVisible.value = true;
};

const submitStatusChange = async () => {
  if (!statusTarget.value) return;
  statusSaving.value = true;
  try {
    await transferStatusUpdate(statusTarget.value.transfer_no, statusForm);
    ElMessage.success('转账状态更新成功'); statusVisible.value = false;
    loadTransfers(); loadStats();
  } catch { ElMessage.error('状态更新失败'); }
  finally { statusSaving.value = false; }
};

const showRefund = (row: any) => {
  refundTarget.value = row; refundForm.reason = ''; refundVisible.value = true;
};

const submitRefund = async () => {
  if (!refundForm.reason.trim()) { ElMessage.warning('请输入退回原因'); return; }
  refundSaving.value = true;
  try {
    await transferRefund(refundTarget.value.transfer_no, { reason: refundForm.reason });
    ElMessage.success('转账退回成功'); refundVisible.value = false;
    loadTransfers(); loadStats();
  } catch { ElMessage.error('转账退回失败'); }
  finally { refundSaving.value = false; }
};

const exportTransfers = async () => {
  try {
    ElMessage.info('正在导出...');
    const params: any = { ...tfQuery };
    if (tfStartTime.value) params.start_time = tfStartTime.value;
    if (tfEndTime.value) params.end_time = tfEndTime.value;
    delete params.page; delete params.size;
    const r: any = await transferExportList(params);
    const d = new Date();
    const ts = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}_${d.getHours().toString().padStart(2, '0')}${d.getMinutes().toString().padStart(2, '0')}`;
    downloadFile(r, `转账列表_${ts}.csv`);
    ElMessage.success('导出成功！');
  } catch { ElMessage.error('导出失败'); }
};

// 数据分析
const loadUserAnalytics = async () => {
  analyticsLoading.value.user = true;
  try { const r: any = await transferAnalyticsUser(); userAnalytics.value = r || { top_senders: [], top_receivers: [] }; }
  catch { ElMessage.error('加载用户分析失败'); } finally { analyticsLoading.value.user = false; }
};

const loadTrendAnalytics = async () => {
  analyticsLoading.value.trend = true;
  try {
    const r: any = await transferAnalyticsTrend();
    trendData.value = { daily_counts: r?.daily_counts || [], daily_amounts: r?.daily_amounts || [], daily_completed: r?.daily_completed || [] };
  } catch { ElMessage.error('加载趋势分析失败'); } finally { analyticsLoading.value.trend = false; }
};

const loadAmountAnalytics = async () => {
  analyticsLoading.value.amount = true;
  try { const r: any = await transferAnalyticsAmount(); amountAnalytics.value = r || {}; }
  catch { ElMessage.error('加载金额分析失败'); } finally { analyticsLoading.value.amount = false; }
};

const loadSummaryAnalytics = async () => {
  analyticsLoading.value.summary = true;
  try { const r: any = await transferAnalyticsSummary(); summaryData.value = r || {}; }
  catch { ElMessage.error('加载汇总分析失败'); } finally { analyticsLoading.value.summary = false; }
};

const loadAllAnalytics = () => { loadUserAnalytics(); loadTrendAnalytics(); loadAmountAnalytics(); loadSummaryAnalytics(); };

// 风控
const loadRiskMonitor = async () => {
  try { const r: any = await transferRiskMonitor(); riskStats.value = r?.risk_statistics || {}; }
  catch { ElMessage.error('加载风险监控失败'); }
};

const loadRiskAlerts = async () => {
  try { const r: any = await transferRiskAlerts(); riskAlerts.value = r?.alerts || []; }
  catch { ElMessage.error('加载风险预警失败'); }
};

const investigateTransfer = async (transferNo: string) => {
  try {
    await ElMessageBox.confirm('确认将此转账标记为调查中？', '调查确认', {
      confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning',
    });
    await transferRiskAction({ action: 'investigate', transfer_no: transferNo, reason: '管理员标记调查' });
    ElMessage.success('已标记为调查中');
    loadTransfers(); detailVisible.value = false;
  } catch (e: any) { if (e !== 'cancel') ElMessage.error('操作失败'); }
};

// 配置
const loadConfig = async () => {
  try {
    const r: any = await transferConfigGet();
    configRaw.value = r;
    configDisplay.value = {
      max_amount: Number(r.max_amount) / 100,
      min_amount: Number(r.min_amount) / 100,
      daily_limit: Number(r.daily_limit) / 100,
      risk_threshold: Number(r.risk_threshold) / 100,
    };
  } catch { ElMessage.error('加载配置失败'); }
};

const saveConfig = async () => {
  configSaving.value = true;
  try {
    const data = {
      max_amount: String(Math.round(configDisplay.value.max_amount * 100)),
      min_amount: String(Math.round(configDisplay.value.min_amount * 100)),
      daily_limit: String(Math.round(configDisplay.value.daily_limit * 100)),
      expire_hours: String(configRaw.value.expire_hours),
      fee_rate: String(configRaw.value.fee_rate),
      risk_threshold: String(Math.round(configDisplay.value.risk_threshold * 100)),
    };
    await transferConfigUpdate(data);
    ElMessage.success('配置保存成功');
    Object.assign(configRaw.value, data);
  } catch { ElMessage.error('保存配置失败'); }
  finally { configSaving.value = false; }
};

// Tab切换
const onTabChange = (tab: string) => {
  switch (tab) {
    case 'transfers': loadTransfers(); break;
    case 'analytics': loadAllAnalytics(); break;
    case 'risk': loadRiskMonitor(); loadRiskAlerts(); break;
    case 'config': loadConfig(); break;
  }
};

const onInitTransfer = () => {
  ElMessage.info('发起转账功能开发中...');
};

const refreshAll = () => { loadStats(); loadTransfers(); };

onMounted(() => { loadStats(); loadTransfers(); });
</script>

<style lang="scss" scoped>
.transfer-admin-page { display: flex; flex-direction: column; gap: 12px; }

.page-header {
  border-radius: 8px; padding: 24px 28px; color: #fff;
  background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 50%, #74b9ff 100%);
  .header-content { display: flex; align-items: center; justify-content: space-between; }
  .header-title {
    h2 { margin: 0 0 6px; font-size: 20px; font-weight: 600; }
    p { margin: 0; font-size: 13px; opacity: 0.85; }
  }
  .header-actions {
    .el-button { --el-button-text-color: #fff; --el-button-bg-color: rgba(255,255,255,0.2); --el-button-border-color: rgba(255,255,255,0.3); --el-button-hover-bg-color: rgba(255,255,255,0.35); --el-button-hover-border-color: rgba(255,255,255,0.5); --el-button-hover-text-color: #fff; backdrop-filter: blur(4px); }
  }
}

.statistics-section { margin-bottom: 12px; }
.stat-card {
  background: #fff; border-radius: 8px; padding: 18px 20px; display: flex; align-items: center; gap: 14px; border: 1px solid #f0f0f0; transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
}
.stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.total-transfers .stat-icon { background: linear-gradient(135deg, #a29bfe, #6c5ce7); color: #fff; }
.total-amount .stat-icon { background: linear-gradient(135deg, #ffa502, #ff6348); color: #fff; }
.completed-transfers .stat-icon { background: linear-gradient(135deg, #2ed573, #26ae60); color: #fff; }
.pending-transfers .stat-icon { background: linear-gradient(135deg, #54a0ff, #2e86de); color: #fff; }
.stat-content { flex: 1;
  .stat-value { font-size: 22px; font-weight: 700; color: #1a1a2e; line-height: 1.2; }
  .stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
}
.stat-trend { text-align: right;
  .trend-value { display: block; font-size: 13px; font-weight: 600; color: #2ed573; }
  .trend-label { font-size: 11px; color: #c0c4cc; }
}

.main-content { background: #fff; border-radius: 8px; padding: 12px 20px 20px; border: 1px solid #f0f0f0; }
.tab-content { padding: 0; }
.amount-text { font-weight: 600; color: #6c5ce7; }

.tf-toolbar {
  display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px;
  .tf-toolbar-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .tf-toolbar-left, .tf-toolbar-right { display: flex; align-items: center; gap: 8px; }
  .tf-toolbar-row:nth-child(2) { justify-content: space-between; }
  .date-sep { color: #909399; font-size: 13px; flex-shrink: 0; }
}

.transfer-no .no-text { font-family: monospace; font-size: 13px; color: #409eff; }
.user-info {
  .user-name { font-size: 13px; font-weight: 500; color: #303133; }
  .user-id { font-size: 11px; color: #909399; }
}
.action-buttons { display: flex; gap: 4px; }

.risk-mini-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;
}
.risk-mini-item {
  display: flex; align-items: center; gap: 8px; padding: 12px 16px;
  .risk-mini-icon { font-size: 18px; flex-shrink: 0; }
  .risk-mini-value { font-size: 18px; font-weight: 700; color: #1a1a2e; }
  .risk-mini-label { font-size: 12px; color: #909399; }
}

.analytics-card-equal { height: 100%; }
.font-600 { font-weight: 600; }
.card-header { display: flex; align-items: center; justify-content: space-between; }

.ranking-list {
  .ranking-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f5f5f5;
    &:last-child { border-bottom: none; }
  }
  .rank-number { width: 28px; height: 28px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #606266; flex-shrink: 0; }
  .ranking-item:nth-child(1) .rank-number { background: #ff6b6b; color: #fff; }
  .ranking-item:nth-child(2) .rank-number { background: #ffa502; color: #fff; }
  .ranking-item:nth-child(3) .rank-number { background: #2ed573; color: #fff; }
  .user-name { font-size: 14px; font-weight: 500; }
  .user-stats { font-size: 12px; color: #909399; }
}

.trend-summary { display: flex; gap: 16px; flex-wrap: wrap; padding: 12px 0;
  .summary-item { display: flex; flex-direction: column; align-items: center; padding: 8px 16px; background: #f8f9fa; border-radius: 6px;
    .summary-date { font-size: 12px; color: #909399; }
    .summary-value { font-size: 14px; font-weight: 600; color: #303133; }
  }
}
.trend-total { font-size: 13px; color: #909399; padding-top: 8px; }

.amount-stats-grid {
  display: flex; justify-content: space-around; padding: 20px 0;
  .amount-stat-box {
    text-align: center; flex: 1;
    .stat-label-sm { font-size: 13px; color: #909399; margin-bottom: 8px; }
    .stat-value-lg { font-size: 24px; font-weight: 700; color: #1a1a2e; }
  }
}

.status-list {
  padding: 4px 0;
  .status-row {
    display: flex; align-items: center; justify-content: space-between; padding: 14px 0;
    border-bottom: 1px solid #f5f5f5;
    &:last-child { border-bottom: none; }
    .status-count { font-size: 14px; font-weight: 600; color: #303133; }
  }
}

.risk-alerts {
  .alert-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 0; border-bottom: 1px solid #f5f5f5;
    &:last-child { border-bottom: none; }
  }
  .alert-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
  .alert-content { flex: 1;
    .alert-title { font-weight: 600; font-size: 14px; color: #303133; margin-bottom: 4px; }
    .alert-description { font-size: 13px; color: #606266; margin-bottom: 6px; }
    .alert-meta { display: flex; align-items: center; gap: 8px;
      .alert-time { font-size: 12px; color: #c0c4cc; }
    }
  }
  .alert-actions { flex-shrink: 0; }
  .no-alerts { padding: 20px 0; }
}

.config-content { padding: 16px 0; }
.config-unit { margin-left: 8px; font-size: 13px; color: #909399; }

.transfer-detail {
  .user-detail { .user-id-small { font-size: 12px; color: #909399; } }
  .amount-large { font-size: 22px; font-weight: 700; color: #6c5ce7; }
}
</style>
