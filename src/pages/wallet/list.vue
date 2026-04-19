<template>
  <bd-page class="rp-admin-page">
    <!-- 渐变顶部横幅 -->
    <div class="page-banner rp-banner">
      <div class="banner-content">
        <div class="banner-left">
          <h2 class="banner-title">🧧 红包管理系统</h2>
          <p class="banner-desc">红包发放、领取记录、数据分析的统一管理平台</p>
        </div>
        <div class="banner-right">
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
          <div class="stat-card total-redpackets">
            <div class="stat-icon"><el-icon><Present /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.total_redpackets }}</div>
              <div class="stat-label">总红包数</div>
            </div>
            <div class="stat-trend">
              <span class="trend-value">+{{ stats.today_redpackets }}</span>
              <span class="trend-label">今日新增</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card total-amount">
            <div class="stat-icon"><el-icon><Wallet /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">¥{{ formatAmount(stats.total_amount) }}</div>
              <div class="stat-label">总发放金额</div>
            </div>
            <div class="stat-trend">
              <span class="trend-value">¥{{ formatAmount(stats.today_amount) }}</span>
              <span class="trend-label">今日发放</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card total-received">
            <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">¥{{ formatAmount(stats.total_received) }}</div>
              <div class="stat-label">已领取金额</div>
            </div>
            <div class="stat-trend">
              <span class="trend-value">{{ stats.completion_rate?.toFixed(1) || '0.0' }}%</span>
              <span class="trend-label">完成率</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card active-redpackets">
            <div class="stat-icon"><el-icon><Timer /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.active_redpackets }}</div>
              <div class="stat-label">活跃红包</div>
            </div>
            <div class="stat-trend">
              <span class="trend-value">{{ stats.total_redpackets > 0 ? Math.round(stats.active_redpackets / stats.total_redpackets * 100) : 0 }}%</span>
              <span class="trend-label">活跃率</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 主内容 -->
    <div class="main-content">
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <!-- 🧧 红包管理 Tab -->
        <el-tab-pane label="🧧 红包管理" name="redpackets">
          <div class="tab-content">
            <div class="search-section">
              <el-row :gutter="16" class="search-row">
                <el-col :span="6">
                  <el-input v-model="rpQuery.keyword" placeholder="搜索红包ID/标题/发送者ID" clearable @keyup.enter="searchRedpackets">
                    <template #prefix><el-icon><Search /></el-icon></template>
                  </el-input>
                </el-col>
                <el-col :span="4">
                  <el-select v-model="rpQuery.type" placeholder="红包类型" clearable>
                    <el-option label="全部类型" value="" />
                    <el-option label="个人红包" :value="1" />
                    <el-option label="拼手气红包" :value="2" />
                    <el-option label="普通红包" :value="3" />
                    <el-option label="专属红包" :value="4" />
                  </el-select>
                </el-col>
                <el-col :span="4">
                  <el-select v-model="rpQuery.status" placeholder="红包状态" clearable>
                    <el-option label="全部状态" value="" />
                    <el-option label="领取中" :value="0" />
                    <el-option label="已完成" :value="1" />
                    <el-option label="已过期" :value="2" />
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-date-picker v-model="rpDateRange" type="datetimerange" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" />
                </el-col>
                <el-col :span="4">
                  <el-button type="warning" @click="searchRedpackets"><el-icon><Search /></el-icon> 搜索</el-button>
                  <el-button @click="resetRedpackets"><el-icon><Refresh /></el-icon> 重置</el-button>
                </el-col>
              </el-row>
              <el-row :gutter="16" class="search-row" style="margin-top: 16px">
                <el-col :span="24">
                  <el-button type="warning" @click="exportRedpacketList">导出红包列表</el-button>
                </el-col>
              </el-row>
            </div>
            <div class="table-section">
              <div v-if="!rpLoading && rpList.length === 0 && stats.total_redpackets === 0" class="empty-state">
                <div class="empty-icon">🧧</div>
                <div class="empty-title">暂无红包数据</div>
                <div class="empty-description">系统中还没有红包记录。当用户发送红包时，记录会显示在这里。</div>
                <el-button type="primary" @click="refreshAll"><el-icon><Refresh /></el-icon> 刷新数据</el-button>
              </div>
              <el-table v-else v-loading="rpLoading" :data="rpList" style="width: 100%" :height="500">
                <el-table-column prop="redpacket_no" label="红包编号" width="180" />
                <el-table-column prop="creater_name" label="创建者" width="120" />
                <el-table-column prop="channel_type" label="场景" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.channel_type === 1 ? 'success' : 'primary'">{{ getSceneTypeText(row.channel_type) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="type" label="类型" width="100">
                  <template #default="{ row }">
                    <el-tag :type="{ 1: 'warning', 2: 'danger', 3: '', 4: 'success' }[row.type as number] || 'info'">{{ getTypeText(row.type) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="amount" label="金额" width="120" align="right">
                  <template #default="{ row }">
                    <span class="amount-text">¥{{ formatAmount(row.amount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="num" label="数量" width="80" />
                <el-table-column prop="receive_num" label="已领取" width="80" />
                <el-table-column prop="completion_rate" label="完成率" width="100">
                  <template #default="{ row }">
                    <el-progress :percentage="row.completion_rate" :stroke-width="8" :show-text="false" />
                    <span class="completion-text">{{ row.completion_rate.toFixed(1) }}%</span>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="130">
                  <template #default="{ row }">
                    <el-tag :type="getRedpacketStatusType(row)">{{ getRedpacketStatusText(row) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="创建时间" width="160" />
                <el-table-column label="操作" width="200" fixed="right">
                  <template #default="{ row }">
                    <el-button type="warning" size="small" @click="showRedpacketDetail(row)">详情</el-button>
                    <el-button v-if="row.status !== 2" type="success" size="small" @click="showStatusManage(row)">管理</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div class="pagination-section">
                <el-pagination v-model:current-page="rpQuery.page" v-model:page-size="rpQuery.size" :page-sizes="[10, 20, 50, 100]" :total="rpTotal" layout="total, sizes, prev, pager, next, jumper" @size-change="searchRedpackets" @current-change="loadRedpackets" />
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 📊 数据分析 Tab -->
        <el-tab-pane label="📊 数据分析" name="analytics">
          <div class="tab-content">
            <div class="analytics-section">
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="analytics-card">
                    <div class="card-header">
                      <h3>🧧 红包类型分析</h3>
                      <el-button type="warning" link @click="loadTypeAnalytics">刷新</el-button>
                    </div>
                    <div v-loading="analyticsLoading.type" class="card-content">
                      <div class="analytics-item">
                        <div class="item-label">个人红包</div>
                        <div class="item-data">
                          <span class="data-value">{{ typeAnalytics.individual.count }}</span>
                          <span class="data-unit">个</span>
                          <span class="data-amount">¥{{ formatAmount(typeAnalytics.individual.amount) }}</span>
                        </div>
                      </div>
                      <div class="analytics-item">
                        <div class="item-label">拼手气红包</div>
                        <div class="item-data">
                          <span class="data-value">{{ typeAnalytics.group_random.count }}</span>
                          <span class="data-unit">个</span>
                          <span class="data-amount">¥{{ formatAmount(typeAnalytics.group_random.amount) }}</span>
                        </div>
                      </div>
                      <div class="analytics-item">
                        <div class="item-label">普通红包</div>
                        <div class="item-data">
                          <span class="data-value">{{ typeAnalytics.group_normal.count }}</span>
                          <span class="data-unit">个</span>
                          <span class="data-amount">¥{{ formatAmount(typeAnalytics.group_normal.amount) }}</span>
                        </div>
                      </div>
                      <div class="analytics-item">
                        <div class="item-label">专属红包</div>
                        <div class="item-data">
                          <span class="data-value">{{ typeAnalytics.exclusive.count }}</span>
                          <span class="data-unit">个</span>
                          <span class="data-amount">¥{{ formatAmount(typeAnalytics.exclusive.amount) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="analytics-card">
                    <div class="card-header">
                      <h3>🔍 使用场景分析</h3>
                      <el-button type="warning" link @click="loadSceneAnalytics">刷新</el-button>
                    </div>
                    <div v-loading="analyticsLoading.scene" class="card-content">
                      <div class="analytics-item">
                        <div class="item-label">单聊红包</div>
                        <div class="item-data">
                          <span class="data-value">{{ sceneAnalytics.private_chat.count }}</span>
                          <span class="data-unit">个</span>
                          <span class="data-amount">¥{{ formatAmount(sceneAnalytics.private_chat.amount) }}</span>
                        </div>
                      </div>
                      <div class="analytics-item">
                        <div class="item-label">群聊红包</div>
                        <div class="item-data">
                          <span class="data-value">{{ sceneAnalytics.group_chat.count }}</span>
                          <span class="data-unit">个</span>
                          <span class="data-amount">¥{{ formatAmount(sceneAnalytics.group_chat.amount) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-col>
              </el-row>
              <div class="trend-analytics">
                <div class="analytics-card">
                  <div class="card-header">
                    <h3>📈 红包发放趋势（最近30天）</h3>
                    <el-button type="warning" link @click="loadTrendAnalytics">刷新</el-button>
                  </div>
                  <div v-loading="analyticsLoading.trend" class="card-content">
                    <div class="trend-chart">
                      <div class="trend-summary">
                        <div class="summary-item">
                          <div class="summary-label">最近30天红包数</div>
                          <div class="summary-value">{{ trendData.daily_redpackets.reduce((s: number, d: any) => s + (d.count || d.value || 0), 0) }}</div>
                        </div>
                        <div class="summary-item">
                          <div class="summary-label">最近30天发放金额</div>
                          <div class="summary-value">¥{{ formatAmount(trendData.daily_amount.reduce((s: number, d: any) => s + (d.amount || d.value || 0), 0)) }}</div>
                        </div>
                        <div class="summary-item">
                          <div class="summary-label">最近30天领取金额</div>
                          <div class="summary-value">¥{{ formatAmount(trendData.daily_received.reduce((s: number, d: any) => s + (d.amount || d.value || 0), 0)) }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 📝 红包记录 Tab -->
        <el-tab-pane label="📝 红包记录" name="records">
          <div class="tab-content">
            <div class="rec-toolbar">
              <div class="rec-toolbar-left">
                <el-input v-model="recQuery.redpacket_no" placeholder="红包编号" clearable style="width: 220px" @keyup.enter="loadRecords">
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
                <el-input v-model="recQuery.receiver" placeholder="领取者UID或名称" clearable style="width: 260px" @keyup.enter="loadRecords">
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
              </div>
              <div class="rec-toolbar-right">
                <el-button type="warning" @click="loadRecords">搜索</el-button>
                <el-button @click="resetRecords">重置</el-button>
                <el-button type="success" @click="loadRecords">刷新</el-button>
              </div>
            </div>
            <el-table v-loading="recLoading" :data="recList" :border="true" style="width: 100%" stripe>
              <el-table-column prop="id" label="记录ID" width="80" />
              <el-table-column prop="redpacket_no" label="红包编号" width="180" show-overflow-tooltip />
              <el-table-column prop="receiver" label="领取者UID" width="160" show-overflow-tooltip />
              <el-table-column prop="receiver_name" label="领取者名称" width="110" />
              <el-table-column prop="amount" label="领取金额" width="100" align="right">
                <template #default="{ row }">
                  <span class="amount-text">¥{{ formatAmount(row.amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="type" label="红包类型" width="100">
                <template #default="{ row }">
                  <el-tag :type="({ 1: 'warning', 2: 'danger', 3: '', 4: 'success' } as Record<number, string>)[row.type] || 'info'" size="small">{{ getTypeText(row.type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="channel_type" label="场景" width="80" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.channel_type === 1 ? 'success' : 'primary'" size="small">{{ getSceneTypeText(row.channel_type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="is_lucky" label="手气" width="100" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.is_lucky || row.is_luck || row.is_best" type="warning" size="small">🎉 最佳</el-tag>
                  <el-tag v-else-if="row.is_worst" type="info" size="small">😅 倒霉蛋</el-tag>
                  <span v-else class="luck-plain">—</span>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="创建时间" width="160" />
              <el-table-column prop="received_at" label="领取时间" width="160">
                <template #default="{ row }">{{ row.received_at || row.created_at }}</template>
              </el-table-column>
              <el-table-column prop="received" label="领取状态" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.received ? 'success' : 'info'" size="small">{{ row.received ? '已领取' : '未领取' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
            </el-table>
            <div class="flex items-center justify-between" style="margin-top: 12px">
              <span style="color: #909399; font-size: 13px">共 {{ recTotal }} 条</span>
              <el-pagination v-model:current-page="recQuery.page" v-model:page-size="recQuery.size" :page-sizes="[10, 20, 50, 100]" :background="true" :total="recTotal" layout="sizes, prev, pager, next, jumper" @size-change="loadRecords" @current-change="loadRecords" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 🛡️ 风控管理 Tab -->
        <el-tab-pane label="🛡️ 风控管理" name="risk">
          <div class="tab-content">
            <!-- 风控统计 -->
            <div class="risk-stats-grid">
              <div class="risk-stat-item">
                <div class="risk-stat-value">{{ riskData.statistics.total_events }}</div>
                <div class="risk-stat-label">总风险事件</div>
                <div class="risk-stat-bar pink"></div>
              </div>
              <div class="risk-stat-item">
                <div class="risk-stat-value">{{ riskData.statistics.today_events }}</div>
                <div class="risk-stat-label">今日事件</div>
                <div class="risk-stat-bar green"></div>
              </div>
              <div class="risk-stat-item">
                <div class="risk-stat-value">{{ riskData.statistics.pending_events }}</div>
                <div class="risk-stat-label">待处理</div>
                <div class="risk-stat-bar dark"></div>
              </div>
              <div class="risk-stat-item">
                <div class="risk-stat-value">{{ riskData.statistics.high_risk_events }}</div>
                <div class="risk-stat-label">高风险</div>
                <div class="risk-stat-bar purple"></div>
              </div>
            </div>

            <!-- 风控规则配置（放在前面） -->
            <el-card shadow="never" style="margin-bottom: 16px">
              <template #header>
                <div class="card-header-flex">
                  <span class="font-600">🔧 风控规则配置</span>
                  <div style="display: flex; gap: 8px">
                    <el-button type="primary" size="small" @click="showRuleDialog(null)">+ 添加规则</el-button>
                    <el-button size="small" @click="loadRiskRules">刷新规则</el-button>
                  </div>
                </div>
              </template>
              <el-table v-loading="rulesLoading" :data="riskRules" :border="true" style="width: 100%" stripe>
                <el-table-column prop="name" label="规则名称" width="200" />
                <el-table-column prop="type" label="类型" width="120">
                  <template #default="{ row }">
                    <el-tag :type="ruleTypeTagMap[row.type] || 'info'" size="small">{{ getRuleTypeName(row.type) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="threshold" label="阈值" width="120">
                  <template #default="{ row }">{{ formatThreshold(row.threshold, row.type) }}</template>
                </el-table-column>
                <el-table-column prop="time_window" label="时间窗口" width="100">
                  <template #default="{ row }">{{ formatTimeWindow(row.time_window) }}</template>
                </el-table-column>
                <el-table-column prop="enabled" label="状态" width="80" align="center">
                  <template #default="{ row }">
                    <el-switch v-model="row.enabled" :active-value="1" :inactive-value="0" @change="toggleRiskRule(row)" />
                  </template>
                </el-table-column>
                <el-table-column prop="sort_order" label="排序" width="60" align="center" />
                <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
                <el-table-column label="操作" width="120" fixed="right" align="center">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" link @click="showRuleDialog(row)">编辑</el-button>
                    <el-button type="danger" size="small" link @click="deleteRule(row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>

            <!-- 最新风险事件（放在后面） -->
            <el-card shadow="never">
              <template #header>
                <div class="card-header-flex">
                  <span class="font-600">⚠️ 最新风险事件</span>
                  <div style="display: flex; gap: 8px">
                    <el-button type="warning" size="small" @click="batchUnbanStart" :disabled="selectedRiskEvents.length === 0">批量解封 ({{ selectedRiskEvents.length }})</el-button>
                    <el-button type="danger" size="small" @click="loadRiskMonitor">刷新数据</el-button>
                  </div>
                </div>
              </template>
              <el-table v-loading="riskLoading" :data="riskData.events" :border="true" ref="riskTableRef" @selection-change="onRiskSelectionChange" style="width: 100%" stripe>
                <el-table-column type="selection" width="50" />
                <el-table-column prop="id" label="事件ID" width="80" />
                <el-table-column prop="uid" label="用户ID" width="150" />
                <el-table-column prop="event_type" label="事件类型" width="150" />
                <el-table-column prop="risk_level" label="风险级别" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getRiskLevelType(row.risk_level)" size="small">{{ getRiskLevelText(row.risk_level) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getRiskEventStatusType(row.status)" size="small">{{ getRiskEventStatusText(row.status) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="发生时间" width="160" />
                <el-table-column label="操作" width="250" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" link @click="showRiskEventDetail(row)">详情</el-button>
                    <template v-if="row.status === 'pending'">
                      <el-button type="success" size="small" link @click="handleRiskAction(row, 'handled')">处理</el-button>
                      <el-button type="info" size="small" link @click="handleRiskAction(row, 'ignored')">忽略</el-button>
                    </template>
                    <el-button v-if="row.status !== 'pending'" type="warning" size="small" link @click="startUnban(row)">解封</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- ⚙️ 配置管理 Tab -->
        <el-tab-pane label="⚙️ 配置管理" name="config">
          <div class="tab-content">
            <el-alert type="info" :closable="false" style="margin-bottom: 20px">
              <p>在这里可以配置红包系统的关键参数，包括过期时间、金额限制等。修改配置后会立即生效。</p>
            </el-alert>
            <el-card shadow="never" style="margin-bottom: 20px">
              <template #header>
                <div class="card-header-flex">
                  <span class="font-600">⏰ 红包过期设置 <el-tag type="warning" size="small" effect="plain">保存即生效</el-tag></span>
                  <el-button type="primary" size="small" @click="saveConfig" :loading="configSaving"><el-icon><Check /></el-icon> 保存配置</el-button>
                </div>
              </template>
              <el-form ref="configFormRef" :model="config" label-width="180px">
                <el-row :gutter="40">
                  <el-col :span="12">
                    <el-form-item label="* 红包过期时间" prop="expire_hours">
                      <el-input-number v-model="config.expire_hours" :min="1" :max="168" style="width: 100%" />
                      <div class="form-tip">红包支付后多长时间自动过期（1-168小时，一小时：1小时）</div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="* 过期检查间隔" prop="expire_check_interval_min">
                      <el-input-number v-model="config.expire_check_interval_min" :min="1" :max="1440" style="width: 100%" />
                      <div class="form-tip">系统检查红包过期的间隔（1-1440分钟，一小时：1分钟）</div>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="40">
                  <el-col :span="12">
                    <el-form-item label="单个红包最小金额">
                      <el-input-number v-model="config.min_amount_display" :min="0.01" :max="99999" :precision="2" style="width: 100%" @change="(v: number) => { config.min_amount_per_redpacket = Math.round((v || 0) * 100) }" />
                      <div class="form-tip">单个红包的最小金额限制（当前：¥{{ config.min_amount_display?.toFixed(2) }}）</div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="单个红包最大金额">
                      <el-input-number v-model="config.max_amount_display" :min="0.01" :max="99999" :precision="2" style="width: 100%" @change="(v: number) => { config.max_amount_per_redpacket = Math.round((v || 0) * 100) }" />
                      <div class="form-tip">单个红包的最大金额限制（当前：¥{{ config.max_amount_display?.toFixed(2) }}）</div>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="40">
                  <el-col :span="12">
                    <el-form-item label="用户日发送金额限制">
                      <el-input-number v-model="config.daily_amount_display" :min="0.01" :max="999999" :precision="2" style="width: 100%" @change="(v: number) => { config.max_daily_amount_per_user = Math.round((v || 0) * 100) }" />
                      <div class="form-tip">用户每日可发送红包总金额（当前：¥{{ config.daily_amount_display?.toFixed(2) }}）</div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="* 每小时发送数量限制">
                      <el-input-number v-model="config.max_redpackets_per_hour" :min="1" :max="10000" style="width: 100%" />
                      <div class="form-tip">用户每小时可发送红包数量（一小时：{{ config.max_redpackets_per_hour }}个）</div>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="40">
                  <el-col :span="12">
                    <el-form-item label="* 批量过期处理数量">
                      <el-input-number v-model="config.batch_expire_limit" :min="1" :max="1000" style="width: 100%" />
                      <div class="form-tip">每次批量处理过期红包的数量（一般：100个）</div>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-divider />
                <h4 style="margin-bottom: 16px">🔧 系统开关</h4>
                <el-row :gutter="40">
                  <el-col :span="8">
                    <el-form-item label="风控系统">
                      <el-switch v-model="config.enable_risk_control" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" />
                      <div class="form-tip">开启后系统将对红包发送行为进行风控监控</div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="自动过期处理">
                      <el-switch v-model="config.enable_auto_expire" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" />
                      <div class="form-tip">开启后系统将自动处理过期红包</div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="过期退款">
                      <el-switch v-model="config.refund_on_expire" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" />
                      <div class="form-tip">开启后红包过期时自动退回用户余额</div>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-card>

            <!-- 当前配置状态 -->
            <el-card shadow="never">
              <template #header>
                <span class="font-600">📋 当前配置状态</span>
              </template>
              <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="红包过期时间">{{ config.expire_hours }}小时</el-descriptions-item>
                <el-descriptions-item label="检查频率">{{ config.expire_check_interval_min }}分钟</el-descriptions-item>
                <el-descriptions-item label="批量处理限制">{{ config.batch_expire_limit }}个</el-descriptions-item>
                <el-descriptions-item label="最小金额">¥{{ config.min_amount_display?.toFixed(2) }}</el-descriptions-item>
                <el-descriptions-item label="最大金额">¥{{ config.max_amount_display?.toFixed(2) }}</el-descriptions-item>
                <el-descriptions-item label="日发送限额">¥{{ config.daily_amount_display?.toFixed(2) }}</el-descriptions-item>
                <el-descriptions-item label="风控系统">
                  <el-tag :type="config.enable_risk_control ? 'success' : 'danger'" size="small">{{ config.enable_risk_control ? '已启用' : '已禁用' }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="自动过期">
                  <el-tag :type="config.enable_auto_expire ? 'success' : 'danger'" size="small">{{ config.enable_auto_expire ? '已启用' : '已禁用' }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="过期退款">
                  <el-tag :type="config.refund_on_expire ? 'success' : 'danger'" size="small">{{ config.refund_on_expire ? '已启用' : '已禁用' }}</el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 🧧 红包详情弹窗 -->
    <el-dialog v-model="detailVisible" title="🧧 红包详情" width="640px">
      <template v-if="detailData">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="红包编号">{{ detailData.redpacket_no }}</el-descriptions-item>
          <el-descriptions-item label="创建者">{{ detailData.creater_name || detailData.uid }}</el-descriptions-item>
          <el-descriptions-item label="红包类型"><el-tag :type="({ 1: 'warning', 2: 'danger', 3: '', 4: 'success' } as Record<number, string>)[detailData.type] || 'info'" size="small">{{ getTypeText(detailData.type) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="getRedpacketStatusType(detailData)" size="small">{{ getRedpacketStatusText(detailData) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="红包金额"><span class="font-600 text-red-500">¥{{ formatAmount(detailData.amount || detailData.total_amount) }}</span></el-descriptions-item>
          <el-descriptions-item label="数量">{{ detailData.num || detailData.total_count }}</el-descriptions-item>
          <el-descriptions-item label="剩余金额">¥{{ formatAmount(detailData.remaining_amount || detailData.balance) }}</el-descriptions-item>
          <el-descriptions-item label="已领取数">{{ detailData.receive_num || 0 }}</el-descriptions-item>
          <el-descriptions-item label="场景" :span="1"><el-tag :type="detailData.channel_type === 1 ? 'success' : 'primary'" size="small">{{ getSceneTypeText(detailData.channel_type) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="祝福语" :span="1">{{ detailData.blessing || detailData.remark || '恭喜发财，大吉大利' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ detailData.created_at }}</el-descriptions-item>
        </el-descriptions>
        <p class="mt-16px mb-8px font-600">领取记录</p>
        <el-table :data="detailData.records || []" :border="true" max-height="280" stripe>
          <el-table-column type="index" :width="42" align="center" />
          <el-table-column prop="uid" label="领取者" min-width="180" />
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }"><span class="font-600 text-green-600">¥{{ formatAmount(row.amount) }}</span></template>
          </el-table-column>
          <el-table-column label="手气" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.is_best === 1 || row.is_lucky === 1" type="warning" size="small">🎉 最佳</el-tag>
              <el-tag v-else-if="row.is_worst === 1" type="info" size="small">😅 倒霉蛋</el-tag>
              <span v-else class="luck-plain">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="领取时间" width="170" />
        </el-table>
      </template>
    </el-dialog>

    <!-- 🔧 红包状态管理弹窗 -->
    <el-dialog v-model="statusVisible" title="🔧 红包状态管理" width="500px">
      <el-form v-if="statusTarget" ref="statusFormRef" :model="statusForm" :rules="statusFormRules" label-width="100px">
        <el-form-item label="当前状态">
          <el-tag :type="getRedpacketStatusType(statusTarget)">{{ getRedpacketStatusText(statusTarget) }}</el-tag>
        </el-form-item>
        <el-form-item label="新状态" prop="status">
          <el-select v-model="statusForm.status" placeholder="选择新状态">
            <el-option label="领取中（还可继续领取）" :value="0" />
            <el-option label="已完成（已全部领完）" :value="1" />
            <el-option label="已过期" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作原因" prop="reason">
          <el-input v-model="statusForm.reason" type="textarea" placeholder="请输入状态变更原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusVisible = false">取消</el-button>
        <el-button type="primary" :loading="statusSaving" @click="submitStatusChange">确定</el-button>
      </template>
    </el-dialog>

    <!-- ⚠️ 风险事件详情弹窗 -->
    <el-dialog v-model="riskDetailVisible" title="⚠️ 风险事件详情" width="600px">
      <template v-if="riskDetailData">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="事件ID">{{ riskDetailData.id }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ riskDetailData.uid }}</el-descriptions-item>
          <el-descriptions-item label="事件类型">{{ riskDetailData.event_type }}</el-descriptions-item>
          <el-descriptions-item label="风险级别"><el-tag :type="getRiskLevelType(riskDetailData.risk_level)" size="small">{{ getRiskLevelText(riskDetailData.risk_level) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="处理状态"><el-tag :type="getRiskEventStatusType(riskDetailData.status)" size="small">{{ getRiskEventStatusText(riskDetailData.status) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ riskDetailData.created_at }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ riskDetailData.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="riskDetailVisible = false">关闭</el-button>
        <el-button v-if="riskDetailData && riskDetailData.status === 'pending'" type="success" @click="handleRiskAction(riskDetailData, 'handled')">处理</el-button>
      </template>
    </el-dialog>

    <!-- 🔓 风险解封弹窗 -->
    <el-dialog v-model="unbanVisible" title="🔓 风险解封" width="500px">
      <el-form ref="unbanFormRef" :model="unbanForm" :rules="unbanFormRules" label-width="100px">
        <el-form-item label="解封原因" prop="reason">
          <el-input v-model="unbanForm.reason" type="textarea" :rows="3" placeholder="请详细说明解封原因（必填，至少10个字符）" />
        </el-form-item>
        <el-form-item label="解封类型" prop="unbanType">
          <el-radio-group v-model="unbanForm.unbanType">
            <el-radio label="permanent">永久解封</el-radio>
            <el-radio label="temporary">临时解封</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="unbanForm.unbanType === 'temporary'" label="解封时长">
          <el-select v-model="unbanForm.duration" placeholder="选择解封时长">
            <el-option label="1小时" :value="1" />
            <el-option label="6小时" :value="6" />
            <el-option label="12小时" :value="12" />
            <el-option label="24小时" :value="24" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="unbanVisible = false">取消</el-button>
        <el-button type="primary" :loading="unbanSaving" @click="submitUnban">确定解封</el-button>
      </template>
    </el-dialog>

    <!-- 🔓 批量风险解封弹窗 -->
    <el-dialog v-model="batchUnbanVisible" title="🔓 批量风险解封" width="500px">
      <el-alert type="warning" :closable="false" title="批量解封警告" style="margin-bottom: 16px">
        即将对 {{ selectedRiskEvents.length }} 个风险事件执行解封操作
      </el-alert>
      <el-form ref="batchUnbanFormRef" :model="batchUnbanForm" :rules="batchUnbanFormRules" label-width="100px">
        <el-form-item label="解封原因" prop="reason">
          <el-input v-model="batchUnbanForm.reason" type="textarea" :rows="3" placeholder="请详细说明批量解封原因（必填，至少10个字符）" />
        </el-form-item>
        <el-form-item label="解封类型" prop="unbanType">
          <el-radio-group v-model="batchUnbanForm.unbanType">
            <el-radio label="permanent">永久解封</el-radio>
            <el-radio label="temporary">临时解封</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="batchUnbanForm.unbanType === 'temporary'" label="解封时长">
          <el-select v-model="batchUnbanForm.duration" placeholder="选择解封时长">
            <el-option label="1小时" :value="1" />
            <el-option label="6小时" :value="6" />
            <el-option label="12小时" :value="12" />
            <el-option label="24小时" :value="24" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchUnbanVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchUnbanSaving" @click="submitBatchUnban">确定批量解封</el-button>
      </template>
    </el-dialog>

    <!-- 风控规则弹窗 -->
    <el-dialog v-model="ruleDialogVisible" :title="ruleEditing ? '编辑风控规则' : '添加风控规则'" width="550px">
      <el-form ref="ruleFormRef" :model="ruleForm" label-width="100px">
        <el-form-item label="规则名称" prop="name" :rules="[{ required: true, message: '请输入规则名称', trigger: 'blur' }]">
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类型" prop="type" :rules="[{ required: true, message: '请选择规则类型', trigger: 'change' }]">
          <el-select v-model="ruleForm.type" placeholder="请选择规则类型">
            <el-option label="发送频率" value="frequency" />
            <el-option label="单个金额" value="amount" />
            <el-option label="日发送金额" value="daily_amount" />
            <el-option label="领取频率" value="receive_frequency" />
            <el-option label="异常时间" value="time_pattern" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isAmountType(ruleForm.type)" label="金额(元)">
          <el-input-number v-model="ruleForm.displayAmount" :min="0" :precision="2" style="width: 100%" placeholder="请输入金额（元）" @change="(v: number) => { ruleForm.threshold = Math.round((v || 0) * 100) }" />
          <div class="form-tip">{{ getThresholdTip(ruleForm.type) }}</div>
        </el-form-item>
        <el-form-item v-else label="阈值" prop="threshold">
          <el-input-number v-model="ruleForm.threshold" :min="0" style="width: 100%" :placeholder="getThresholdPlaceholder(ruleForm.type)" />
          <div class="form-tip">{{ getThresholdTip(ruleForm.type) }}</div>
        </el-form-item>
        <el-form-item label="时间窗口">
          <el-select v-model="ruleForm.time_window" placeholder="请选择时间窗口">
            <el-option label="无限制" :value="0" />
            <el-option label="1分钟" :value="60" />
            <el-option label="5分钟" :value="300" />
            <el-option label="10分钟" :value="600" />
            <el-option label="30分钟" :value="1800" />
            <el-option label="1小时" :value="3600" />
            <el-option label="6小时" :value="21600" />
            <el-option label="12小时" :value="43200" />
            <el-option label="24小时" :value="86400" />
            <el-option label="1天" :value="86400" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则描述">
          <el-input v-model="ruleForm.description" type="textarea" :rows="2" placeholder="请输入规则描述" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="ruleForm.sort_order" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="ruleForm.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="ruleSaving" @click="submitRule">确定</el-button>
      </template>
    </el-dialog>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 红包管理
  isAffix: false
</route>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Search, Download, Present, Wallet, CircleCheck, Timer, Warning, Clock, CircleClose, Document, Check } from '@element-plus/icons-vue';
import {
  redpacketListGet, redpacketDetailGet, redpacketStatusUpdate, redpacketRecordsGet,
  redpacketStatisticsGet, redpacketConfigGet, redpacketConfigUpdate,
  redpacketAnalyticsType, redpacketAnalyticsScene, redpacketAnalyticsTrend,
  redpacketExportList, redpacketRiskMonitor, redpacketRiskAction, redpacketRiskBatchAction,
  redpacketRiskRules, redpacketRiskRuleCreate, redpacketRiskRuleUpdate, redpacketRiskRuleDelete, redpacketRiskRuleToggle,
} from '@/api/wallet';

const formatAmount = (v: any) => {
  if (v == null || isNaN(Number(v))) return '0.00';
  return Number(v).toFixed(2);
};

/** 与后端一致：0=进行中可领取，1=已全部领完，2=已过期。多份红包未领完时显示「领取中(剩N份)」。 */
const getRedpacketStatusText = (row: { status: number; num?: number; total_count?: number; receive_num?: number }) => {
  const total = Number(row.num ?? row.total_count ?? 0);
  const received = Number(row.receive_num ?? 0);
  const hasRemain = total > 0 && received < total;
  if (row.status === 2) return hasRemain ? '已过期(未领完)' : '已过期';
  if (row.status === 1) return '已完成';
  if (hasRemain) return `领取中(剩${total - received}份)`;
  return '领取中';
};
const getRedpacketStatusType = (row: { status: number; num?: number; total_count?: number; receive_num?: number }) => {
  const total = Number(row.num ?? row.total_count ?? 0);
  const received = Number(row.receive_num ?? 0);
  const hasRemain = total > 0 && received < total;
  if (row.status === 2) return hasRemain ? 'warning' : 'info';
  if (row.status === 1) return 'success';
  return 'primary';
};
const getTypeText = (t: number) => ({ 1: '个人红包', 2: '拼手气红包', 3: '普通红包', 4: '专属红包' }[t] || '未知类型');
const getSceneTypeText = (s: number) => ({ 1: '单聊', 2: '群聊' }[s] || '未知场景');
const getRiskLevelText = (l: string) => ({ low: '低风险', medium: '中风险', high: '高风险' }[l] || '未知');
const getRiskLevelType = (l: string) => ({ low: 'success', medium: 'warning', high: 'danger' }[l] || 'info');
const getRiskEventStatusText = (s: string) => ({ pending: '待处理', handled: '已处理', ignored: '已忽略', unbanned: '已解封' }[s] || '未知');
const getRiskEventStatusType = (s: string) => ({ pending: 'warning', handled: 'success', ignored: 'info', unbanned: '' }[s] || 'info');
const getRuleTypeName = (t: string) => ({ frequency: '发送频率', amount: '单个金额', daily_amount: '日发送金额', receive_frequency: '领取频率', time_pattern: '异常时间' }[t] || t);
const ruleTypeTagMap: Record<string, string> = { frequency: 'warning', amount: 'danger', daily_amount: 'danger', receive_frequency: 'success', time_pattern: 'info' };
const isAmountType = (t: string) => ['amount', 'daily_amount'].includes(t);
const formatThreshold = (v: number, type: string) => isAmountType(type) ? `¥${(v / 100).toFixed(2)}` : String(v);
const formatTimeWindow = (s: number) => {
  if (s === 0) return '无限制';
  if (s < 60) return `${s}秒`;
  if (s < 3600) return `${Math.floor(s / 60)}分钟`;
  if (s < 86400) return `${Math.floor(s / 3600)}小时`;
  return `${Math.floor(s / 86400)}天`;
};
const getThresholdPlaceholder = (t: string) => ({ frequency: '如：10（次数）', amount: '如：100000（分，即1000元）', daily_amount: '如：1000000（分，即10000元）', receive_frequency: '如：50（次数）', time_pattern: '如：5（次数）' }[t] || '请输入阈值');
const getThresholdTip = (t: string) => ({ frequency: '用户在时间窗口内可发送的红包数量', amount: '单个红包的最大金额，支持小数点（如：1000.50元）', daily_amount: '用户每日可发送的红包总金额，支持小数点（如：10000.00元）', receive_frequency: '用户在时间窗口内可领取的红包数量', time_pattern: '在异常时间段（如凌晨2-6点）发送红包的数量限制' }[t] || '');

const downloadFile = (blob: Blob, name: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  window.URL.revokeObjectURL(url);
};

// ===== State =====
const activeTab = ref('redpackets');
const stats = ref<any>({ total_redpackets: 0, total_amount: 0, total_received: 0, active_redpackets: 0, today_redpackets: 0, today_amount: 0, completion_rate: 0 });

// 红包管理
const rpList = ref<any[]>([]);
const rpLoading = ref(false);
const rpTotal = ref(0);
const rpQuery = reactive({ page: 1, size: 20, keyword: '', status: undefined as any, type: undefined as any });
const rpDateRange = ref<string[] | null>(null);

// 红包记录
const recList = ref<any[]>([]);
const recLoading = ref(false);
const recTotal = ref(0);
const recQuery = reactive({ redpacket_no: '', receiver: '', page: 1, size: 20 });

// 数据分析
const typeAnalytics = ref<any>({ individual: { count: 0, amount: 0 }, group_random: { count: 0, amount: 0 }, group_normal: { count: 0, amount: 0 }, exclusive: { count: 0, amount: 0 } });
const sceneAnalytics = ref<any>({ private_chat: { count: 0, amount: 0 }, group_chat: { count: 0, amount: 0 } });
const trendData = ref<any>({ daily_redpackets: [], daily_amount: [], daily_received: [] });
const analyticsLoading = ref({ type: false, scene: false, trend: false });

// 风控管理
const riskData = ref<any>({ statistics: { total_events: 0, today_events: 0, pending_events: 0, high_risk_events: 0 }, events: [] });
const riskLoading = ref(false);
const riskRules = ref<any[]>([]);
const rulesLoading = ref(false);
const selectedRiskEvents = ref<any[]>([]);
const riskTableRef = ref<any>(null);

// 配置
const config = reactive<any>({ expire_hours: 1, expire_check_interval_min: 5, max_amount_per_redpacket: 100000, max_daily_amount_per_user: 1000000, max_redpackets_per_hour: 1000, min_amount_per_redpacket: 100, batch_expire_limit: 100, enable_risk_control: 0, enable_auto_expire: 1, refund_on_expire: 1, min_amount_display: 1, max_amount_display: 1000, daily_amount_display: 10000 });
const configSaving = ref(false);
const configFormRef = ref<any>(null);

// 弹窗状态
const detailVisible = ref(false);
const detailData = ref<any>(null);
const statusVisible = ref(false);
const statusTarget = ref<any>(null);
const statusForm = reactive({ status: 0, reason: '' });
const statusSaving = ref(false);
const statusFormRef = ref<any>(null);
const statusFormRules = { status: [{ required: true, message: '请选择新状态', trigger: 'change' }], reason: [{ required: true, message: '请输入操作原因', trigger: 'blur' }] };

const riskDetailVisible = ref(false);
const riskDetailData = ref<any>(null);

const unbanVisible = ref(false);
const unbanTarget = ref<any>(null);
const unbanForm = reactive({ reason: '', unbanType: 'permanent', duration: 24 });
const unbanSaving = ref(false);
const unbanFormRef = ref<any>(null);
const unbanFormRules = { reason: [{ required: true, message: '请输入解封原因', trigger: 'blur' }, { min: 10, max: 1000, message: '解封原因长度在10到1000个字符', trigger: 'blur' }], unbanType: [{ required: true, message: '请选择解封类型', trigger: 'change' }] };

const batchUnbanVisible = ref(false);
const batchUnbanForm = reactive({ reason: '', unbanType: 'permanent', duration: 24 });
const batchUnbanSaving = ref(false);
const batchUnbanFormRef = ref<any>(null);
const batchUnbanFormRules = { reason: [{ required: true, message: '请输入批量解封原因', trigger: 'blur' }, { min: 10, max: 1000, message: '解封原因长度在10到1000个字符', trigger: 'blur' }], unbanType: [{ required: true, message: '请选择解封类型', trigger: 'change' }] };

const ruleDialogVisible = ref(false);
const ruleEditing = ref(false);
const ruleEditingId = ref(0);
const ruleForm = reactive<any>({ name: '', type: '', threshold: 0, displayAmount: 0, time_window: 0, enabled: 1, description: '', sort_order: 1 });
const ruleSaving = ref(false);
const ruleFormRef = ref<any>(null);

// ===== Load Functions =====

const loadStats = async () => {
  try {
    const r: any = await redpacketStatisticsGet();
    if (r && typeof r === 'object') stats.value = r;
  } catch { ElMessage.error('加载统计数据失败'); }
};

const loadRedpackets = async () => {
  rpLoading.value = true;
  try {
    const params: any = { ...rpQuery };
    if (params.status === '' || params.status == null) delete params.status;
    if (params.type === '' || params.type == null) delete params.type;
    if (rpDateRange.value) { params.start_time = rpDateRange.value[0]; params.end_time = rpDateRange.value[1]; }
    const r: any = await redpacketListGet(params);
    if (r?.list) { rpList.value = r.list; rpTotal.value = r.total || 0; }
    else { rpList.value = []; rpTotal.value = 0; }
  } catch { ElMessage.error('加载红包列表失败'); rpList.value = []; rpTotal.value = 0; }
  finally { rpLoading.value = false; }
};

const searchRedpackets = () => { rpQuery.page = 1; loadRedpackets(); };
const resetRedpackets = () => { Object.assign(rpQuery, { page: 1, size: 20, keyword: '', status: undefined, type: undefined }); rpDateRange.value = null; loadRedpackets(); };

const showRedpacketDetail = async (row: any) => {
  try {
    const r: any = await redpacketDetailGet(row.redpacket_no);
    detailData.value = r; detailVisible.value = true;
  } catch { ElMessage.error('获取红包详情失败'); }
};

const showStatusManage = (row: any) => {
  statusTarget.value = row;
  statusForm.status = row.status;
  statusForm.reason = '';
  statusVisible.value = true;
};

const submitStatusChange = async () => {
  if (!statusFormRef.value || !statusTarget.value) return;
  try {
    await statusFormRef.value.validate();
    statusSaving.value = true;
    await redpacketStatusUpdate(statusTarget.value.id, statusForm);
    ElMessage.success('红包状态更新成功');
    statusVisible.value = false;
    loadRedpackets();
  } catch { ElMessage.error('状态更新失败'); }
  finally { statusSaving.value = false; }
};

const exportRedpacketList = async () => {
  try {
    ElMessage.info('正在准备导出红包列表，请稍候...');
    const params: any = { ...rpQuery };
    if (rpDateRange.value) { params.start_time = rpDateRange.value[0]; params.end_time = rpDateRange.value[1]; }
    delete params.page; delete params.size;
    const r: any = await redpacketExportList(params);
    const d = new Date();
    const ts = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}_${d.getHours().toString().padStart(2, '0')}${d.getMinutes().toString().padStart(2, '0')}`;
    downloadFile(r, `红包列表_${ts}.csv`);
    ElMessage.success('导出成功！');
  } catch { ElMessage.error('导出红包列表失败，请重试'); }
};

// 红包记录
const loadRecords = async () => {
  recLoading.value = true;
  try {
    const r: any = await redpacketRecordsGet(recQuery);
    recList.value = r?.list || []; recTotal.value = r?.total || 0;
  } catch { ElMessage.error('加载红包记录失败'); recList.value = []; recTotal.value = 0; }
  finally { recLoading.value = false; }
};
const resetRecords = () => { recQuery.redpacket_no = ''; recQuery.receiver = ''; recQuery.page = 1; recQuery.size = 20; loadRecords(); };

// 数据分析
const loadTypeAnalytics = async () => {
  analyticsLoading.value.type = true;
  try { const r: any = await redpacketAnalyticsType(); typeAnalytics.value = r || { individual: { count: 0, amount: 0 }, group_random: { count: 0, amount: 0 }, group_normal: { count: 0, amount: 0 }, exclusive: { count: 0, amount: 0 } }; }
  catch { ElMessage.error('加载类型分析失败'); } finally { analyticsLoading.value.type = false; }
};
const loadSceneAnalytics = async () => {
  analyticsLoading.value.scene = true;
  try { const r: any = await redpacketAnalyticsScene(); sceneAnalytics.value = r || { private_chat: { count: 0, amount: 0 }, group_chat: { count: 0, amount: 0 } }; }
  catch { ElMessage.error('加载场景分析失败'); } finally { analyticsLoading.value.scene = false; }
};
const loadTrendAnalytics = async () => {
  analyticsLoading.value.trend = true;
  try {
    const r: any = await redpacketAnalyticsTrend();
    trendData.value = { daily_redpackets: r?.daily_redpackets || [], daily_amount: r?.daily_amount || [], daily_received: r?.daily_received || [] };
  } catch { ElMessage.error('加载趋势分析失败'); } finally { analyticsLoading.value.trend = false; }
};
const loadAllAnalytics = () => { loadTypeAnalytics(); loadSceneAnalytics(); loadTrendAnalytics(); };

// 风控管理
const loadRiskMonitor = async () => {
  riskLoading.value = true;
  try {
    const r: any = await redpacketRiskMonitor();
    riskData.value = r || { statistics: { total_events: 0, today_events: 0, pending_events: 0, high_risk_events: 0 }, events: [] };
  } catch { ElMessage.error('加载风控监控数据失败'); } finally { riskLoading.value = false; }
};

const loadRiskRules = async () => {
  rulesLoading.value = true;
  try { const r: any = await redpacketRiskRules(); riskRules.value = r || []; }
  catch { ElMessage.error('加载风控规则失败'); riskRules.value = []; } finally { rulesLoading.value = false; }
};

const onRiskSelectionChange = (rows: any[]) => { selectedRiskEvents.value = rows; };

const handleRiskAction = async (event: any, action: string) => {
  const actionName = action === 'handled' ? '处理' : '忽略';
  try {
    const { value } = await ElMessageBox.prompt(`请输入${actionName}原因：`, `${actionName}风险事件`, {
      confirmButtonText: '确定', cancelButtonText: '取消', inputType: 'textarea',
      inputValidator: (v: string) => v?.trim() ? true : '请输入操作原因',
    });
    await redpacketRiskAction({ action, event_id: event.id, reason: value.trim() });
    ElMessage.success(`风险事件${actionName}成功`);
    riskDetailVisible.value = false;
    loadRiskMonitor();
  } catch (e: any) { if (e !== 'cancel') ElMessage.error(`操作失败：${e}`); }
};

const showRiskEventDetail = (row: any) => { riskDetailData.value = row; riskDetailVisible.value = true; };

const startUnban = (row: any) => {
  if (row.status === 'pending') { ElMessage.warning('请先处理或忽略该风险事件，才能进行解封操作'); return; }
  unbanTarget.value = row; unbanForm.reason = ''; unbanForm.unbanType = 'permanent'; unbanForm.duration = 24;
  unbanVisible.value = true;
};

const submitUnban = async () => {
  if (!unbanFormRef.value || !unbanTarget.value) return;
  try { await unbanFormRef.value.validate(); } catch { return; }
  unbanSaving.value = true;
  try {
    await redpacketRiskAction({
      action: 'unban_risk', event_id: unbanTarget.value.id, reason: unbanForm.reason,
      unban_type: unbanForm.unbanType, duration: unbanForm.unbanType === 'temporary' ? unbanForm.duration : null,
    });
    ElMessage.success('风险解封成功！'); unbanVisible.value = false; loadRiskMonitor();
  } catch (e: any) { ElMessage.error(e.message || '风险解封失败'); }
  finally { unbanSaving.value = false; }
};

const batchUnbanStart = () => {
  const pending = selectedRiskEvents.value.filter(e => e.status === 'pending');
  if (pending.length > 0) { ElMessage.warning(`选中的事件中有 ${pending.length} 个待处理事件，请先处理或忽略这些事件`); return; }
  batchUnbanForm.reason = ''; batchUnbanForm.unbanType = 'permanent'; batchUnbanForm.duration = 24;
  batchUnbanVisible.value = true;
};

const submitBatchUnban = async () => {
  if (!batchUnbanFormRef.value || selectedRiskEvents.value.length === 0) return;
  try { await batchUnbanFormRef.value.validate(); } catch { return; }
  batchUnbanSaving.value = true;
  try {
    await redpacketRiskBatchAction({
      action: 'batch_unban_risk', event_ids: selectedRiskEvents.value.map(e => e.id),
      reason: batchUnbanForm.reason, unban_type: batchUnbanForm.unbanType,
      duration: batchUnbanForm.unbanType === 'temporary' ? batchUnbanForm.duration : null,
    });
    ElMessage.success(`批量风险解封成功！已解封 ${selectedRiskEvents.value.length} 个事件`);
    batchUnbanVisible.value = false; selectedRiskEvents.value = [];
    riskTableRef.value?.clearSelection(); loadRiskMonitor();
  } catch (e: any) { ElMessage.error(e.message || '批量风险解封失败'); }
  finally { batchUnbanSaving.value = false; }
};

// 风控规则
const showRuleDialog = (row: any) => {
  if (row) {
    ruleEditing.value = true; ruleEditingId.value = row.id;
    ruleForm.name = row.name; ruleForm.type = row.type; ruleForm.threshold = row.threshold;
    ruleForm.displayAmount = isAmountType(row.type) ? row.threshold / 100 : 0;
    ruleForm.time_window = row.time_window; ruleForm.enabled = row.enabled;
    ruleForm.description = row.description; ruleForm.sort_order = row.sort_order;
  } else {
    ruleEditing.value = false; ruleEditingId.value = 0;
    ruleForm.name = ''; ruleForm.type = ''; ruleForm.threshold = 0; ruleForm.displayAmount = 0;
    ruleForm.time_window = 0; ruleForm.enabled = 1; ruleForm.description = ''; ruleForm.sort_order = 1;
  }
  ruleDialogVisible.value = true;
};

const submitRule = async () => {
  if (ruleFormRef.value) { try { await ruleFormRef.value.validate(); } catch { return; } }
  ruleSaving.value = true;
  try {
    const data = { ...ruleForm };
    if (isAmountType(data.type)) data.threshold = Math.round((data.displayAmount || 0) * 100);
    delete data.displayAmount;
    if (ruleEditing.value) {
      await redpacketRiskRuleUpdate(ruleEditingId.value, data);
      ElMessage.success('更新风控规则成功！');
    } else {
      await redpacketRiskRuleCreate(data);
      ElMessage.success('创建风控规则成功！');
    }
    ruleDialogVisible.value = false; loadRiskRules();
  } catch (e: any) { ElMessage.error(e.message || '操作失败'); }
  finally { ruleSaving.value = false; }
};

const deleteRule = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除风控规则"${row.name}"吗？删除后无法恢复。`, '删除风控规则', {
      confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning', confirmButtonClass: 'el-button--danger',
    });
    await redpacketRiskRuleDelete(row.id);
    ElMessage.success('删除风控规则成功！'); loadRiskRules();
  } catch (e: any) { if (e !== 'cancel') ElMessage.error(e.message || '删除失败'); }
};

const toggleRiskRule = async (row: any) => {
  try { await redpacketRiskRuleToggle(row.id, row.enabled); ElMessage.success(`风控规则${row.enabled ? '启用' : '禁用'}成功！`); }
  catch (e: any) { row.enabled = row.enabled ? 0 : 1; ElMessage.error(e.message || '操作失败'); }
};

// 配置
const loadConfig = async () => {
  try {
    configSaving.value = true;
    const r: any = await redpacketConfigGet();
    Object.assign(config, r);
    config.min_amount_display = r.min_amount_per_redpacket / 100;
    config.max_amount_display = r.max_amount_per_redpacket / 100;
    config.daily_amount_display = r.max_daily_amount_per_user / 100;
  } catch (e: any) { ElMessage.error('加载红包配置失败'); }
  finally { configSaving.value = false; }
};

const saveConfig = async () => {
  if (configFormRef.value) { try { await configFormRef.value.validate(); } catch { return; } }
  configSaving.value = true;
  try {
    const data = {
      expire_hours: config.expire_hours, expire_check_interval_min: config.expire_check_interval_min,
      max_amount_per_redpacket: config.max_amount_per_redpacket, max_daily_amount_per_user: config.max_daily_amount_per_user,
      max_redpackets_per_hour: config.max_redpackets_per_hour, min_amount_per_redpacket: config.min_amount_per_redpacket,
      batch_expire_limit: config.batch_expire_limit, enable_risk_control: config.enable_risk_control,
      enable_auto_expire: config.enable_auto_expire, refund_on_expire: config.refund_on_expire,
    };
    await redpacketConfigUpdate(data);
    ElMessage.success('红包配置保存成功！配置已立即生效');
  } catch { ElMessage.error('保存配置失败'); }
  finally { configSaving.value = false; }
};

// Tab切换
const onTabChange = (tab: string) => {
  switch (tab) {
    case 'redpackets': loadRedpackets(); break;
    case 'analytics': loadAllAnalytics(); break;
    case 'records': loadRecords(); break;
    case 'risk': loadRiskMonitor(); loadRiskRules(); break;
    case 'config': loadConfig(); break;
  }
};

const refreshAll = () => { loadStats(); loadRedpackets(); };

onMounted(() => { loadStats(); loadRedpackets(); });

watch(() => ruleForm.type, (n, o) => {
  if (n !== o) {
    if (isAmountType(n)) { ruleForm.displayAmount = 0; ruleForm.threshold = 0; }
    else { ruleForm.threshold = 0; ruleForm.displayAmount = 0; }
  }
});
</script>

<style lang="scss" scoped>
.rp-admin-page { display: flex; flex-direction: column; gap: 12px; }

.page-banner {
  border-radius: 8px; padding: 24px 28px; color: #fff;
  .banner-content { display: flex; align-items: center; justify-content: space-between; }
  .banner-left {
    .banner-title { margin: 0 0 6px; font-size: 20px; font-weight: 600; }
    .banner-desc { margin: 0; font-size: 13px; opacity: 0.85; }
  }
  .banner-right {
    .el-button { --el-button-text-color: #fff; --el-button-bg-color: rgba(255,255,255,0.2); --el-button-border-color: rgba(255,255,255,0.3); --el-button-hover-bg-color: rgba(255,255,255,0.35); --el-button-hover-border-color: rgba(255,255,255,0.5); --el-button-hover-text-color: #fff; backdrop-filter: blur(4px); }
  }
}
.rp-banner { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 50%, #e67e22 100%); }

.statistics-section { margin-bottom: 12px; }
.stat-card {
  background: #fff; border-radius: 8px; padding: 18px 20px; display: flex; align-items: center; gap: 14px; border: 1px solid #f0f0f0; transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
}
.stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.total-redpackets .stat-icon { background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: #fff; }
.total-amount .stat-icon { background: linear-gradient(135deg, #ffa502, #ff6348); color: #fff; }
.total-received .stat-icon { background: linear-gradient(135deg, #2ed573, #26ae60); color: #fff; }
.active-redpackets .stat-icon { background: linear-gradient(135deg, #54a0ff, #2e86de); color: #fff; }
.stat-content { flex: 1;
  .stat-value { font-size: 22px; font-weight: 700; color: #1a1a2e; line-height: 1.2; }
  .stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
}
.stat-trend { text-align: right;
  .trend-value { display: block; font-size: 13px; font-weight: 600; color: #2ed573; }
  .trend-label { font-size: 11px; color: #c0c4cc; }
}

.main-content {
  background: #fff; border-radius: 8px; padding: 12px 20px 20px; border: 1px solid #f0f0f0;
}

.tab-content { padding: 0; }
.search-section { margin-bottom: 16px; }
.search-row { margin-bottom: 0; }
.table-section { }
.pagination-section { display: flex; justify-content: flex-start; margin-top: 16px; }
.amount-text { font-weight: 600; color: #e74c3c; }
.completion-text { font-size: 12px; color: #909399; margin-left: 8px; }

.empty-state {
  text-align: center; padding: 60px 0;
  .empty-icon { font-size: 64px; margin-bottom: 16px; }
  .empty-title { font-size: 18px; font-weight: 600; color: #303133; margin-bottom: 8px; }
  .empty-description { font-size: 14px; color: #909399; margin-bottom: 20px; }
}

.analytics-section {
  .analytics-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
      h3 { margin: 0; font-size: 16px; }
    }
    .card-content { }
  }
  .analytics-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f5f5f5;
    &:last-child { border-bottom: none; }
    .item-label { font-size: 14px; color: #606266; }
    .item-data { display: flex; align-items: center; gap: 8px;
      .data-value { font-size: 20px; font-weight: 700; color: #1a1a2e; }
      .data-unit { font-size: 12px; color: #909399; }
      .data-amount { font-size: 14px; color: #e74c3c; font-weight: 600; }
    }
  }
}

.trend-analytics { margin-top: 20px; }
.trend-chart { }
.trend-summary { display: flex;
  .summary-item { flex: 1; text-align: center; padding: 12px 0;
    .summary-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
    .summary-value { font-size: 22px; font-weight: 700; color: #1a1a2e; }
  }
}

.luck-plain { color: #c0c4cc; font-size: 13px; }
.rec-toolbar {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;
  .rec-toolbar-left, .rec-toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
}

.risk-stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;
}
.risk-stat-item {
  background: #fff; border: 1px solid #f0f0f0; border-radius: 8px; padding: 16px 20px; position: relative; overflow: hidden;
  .risk-stat-value { font-size: 28px; font-weight: 700; color: #1a1a2e; line-height: 1.2; }
  .risk-stat-label { font-size: 13px; color: #909399; margin-top: 4px; margin-bottom: 12px; }
  .risk-stat-bar { height: 4px; border-radius: 2px;
    &.pink { background: linear-gradient(90deg, #ff6b6b, #ee5a24); }
    &.green { background: linear-gradient(90deg, #2ed573, #26ae60); }
    &.dark { background: linear-gradient(90deg, #2c3e50, #34495e); }
    &.purple { background: linear-gradient(90deg, #a29bfe, #6c5ce7); }
  }
}

.card-header-flex { display: flex; align-items: center; justify-content: space-between; }
.font-600 { font-weight: 600; }
.form-tip { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
