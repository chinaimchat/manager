<template>
  <bd-page class="wallet-admin-page">
    <!-- 渐变顶部横幅 -->
    <div class="wallet-banner">
      <div class="banner-content">
        <div class="banner-left">
          <div class="header-title">
            <h2>💰 钱包管理系统</h2>
            <p>用户钱包、充值提现、交易记录的统一管理平台</p>
          </div>
        </div>
        <div class="banner-right">
          <el-button @click="onSyncUserInfo" :loading="syncLoading" round>同步用户信息</el-button>
          <el-button type="primary" @click="loadData" round>
            <el-icon class="mr-4px"><Refresh /></el-icon>刷新数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card stat-pink">
        <div class="stat-icon-wrap pink"><i class="i-bd-every-user" /></div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total_wallets }}</div>
          <div class="stat-label">总钱包数</div>
        </div>
        <div class="stat-badge">
          <span class="badge-text green">+{{ stats.today_new_wallets }}</span>
          <span class="badge-label">今日新增</span>
        </div>
      </div>
      <div class="stat-card stat-orange">
        <div class="stat-icon-wrap orange"><i class="i-bd-wallet" /></div>
        <div class="stat-info">
          <div class="stat-value">¥{{ formatMoney(stats.total_amount) }}</div>
          <div class="stat-label">总余额</div>
        </div>
        <div class="stat-badge">
          <span class="badge-text orange">¥{{ formatMoney(stats.today_amount) }}</span>
          <span class="badge-label">今日变动</span>
        </div>
      </div>
      <div class="stat-card stat-green">
        <div class="stat-icon-wrap green"><i class="i-bd-check-one" /></div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.active_wallets }}</div>
          <div class="stat-label">活跃钱包</div>
        </div>
        <div class="stat-badge">
          <span class="badge-text green">{{ stats.total_wallets === 0 ? '0.0' : (stats.active_wallets / stats.total_wallets * 100).toFixed(1) }}%</span>
          <span class="badge-label">活跃率</span>
        </div>
      </div>
      <div class="stat-card stat-blue">
        <div class="stat-icon-wrap blue"><i class="i-bd-shield" /></div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.frozen_wallets }}</div>
          <div class="stat-label">冻结钱包</div>
        </div>
      </div>
      <div class="stat-card stat-purple">
        <div class="stat-icon-wrap purple"><i class="i-bd-exchange" /></div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.today_transactions }}</div>
          <div class="stat-label">今日交易</div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <el-card class="main-card" shadow="never">
      <el-tabs v-model="activeTab">
        <!-- 👥 钱包管理 -->
        <el-tab-pane label="👥 钱包管理" name="wallets">
          <div class="tab-toolbar">
            <div class="toolbar-left">
              <el-input v-model="walletQuery.keyword" placeholder="搜索用户ID/手机号/昵称/用户名" clearable style="width: 260px" @keyup.enter="getWalletList">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <el-select v-model="walletQuery.status" placeholder="钱包状态" clearable style="width: 130px">
                <el-option label="全部状态" value="" />
                <el-option label="正常" :value="1" />
                <el-option label="冻结" :value="2" />
              </el-select>
              <el-date-picker v-model="walletQuery.startTime" type="date" placeholder="开始时间" value-format="YYYY-MM-DD" style="width: 150px" />
              <span class="date-separator">至</span>
              <el-date-picker v-model="walletQuery.endTime" type="date" placeholder="结束时间" value-format="YYYY-MM-DD" style="width: 150px" />
            </div>
            <div class="toolbar-right">
              <el-button type="warning" @click="getWalletList">搜索</el-button>
              <el-button @click="resetWalletQuery">重置</el-button>
              <el-button type="primary" @click="showAdvanced = !showAdvanced">高级</el-button>
            </div>
          </div>

          <!-- 高级搜索面板 -->
          <div v-if="showAdvanced" class="advanced-panel">
            <div class="advanced-header">
              <span class="advanced-title">🔍 高级搜索</span>
            </div>
            <div class="advanced-body">
              <div class="advanced-row">
                <div class="advanced-field">
                  <span class="advanced-label">金额区间(元)</span>
                  <div class="advanced-range">
                    <el-input-number v-model="walletQuery.minAmount" :min="0" :precision="2" :controls="false" placeholder="最小金额" style="width: 120px" />
                    <span class="range-sep">→</span>
                    <el-input-number v-model="walletQuery.maxAmount" :min="0" :precision="2" :controls="false" placeholder="最大金额" style="width: 120px" />
                  </div>
                </div>
                <div class="advanced-field">
                  <span class="advanced-label">注册时间</span>
                  <div class="advanced-range">
                    <el-date-picker v-model="walletQuery.startTime" type="date" placeholder="注册开始日期" value-format="YYYY-MM-DD" style="width: 150px" />
                    <span class="range-sep">至</span>
                    <el-date-picker v-model="walletQuery.endTime" type="date" placeholder="注册结束日期" value-format="YYYY-MM-DD" style="width: 150px" />
                  </div>
                </div>
                <div class="advanced-field">
                  <span class="advanced-label">排序方式</span>
                  <el-select v-model="walletQuery.sortBy" placeholder="默认排序" clearable style="width: 150px">
                    <el-option label="默认排序" value="" />
                    <el-option label="余额从高到低" value="balance_desc" />
                    <el-option label="余额从低到高" value="balance_asc" />
                    <el-option label="创建时间最新" value="created_desc" />
                    <el-option label="创建时间最早" value="created_asc" />
                  </el-select>
                </div>
              </div>
              <div class="advanced-actions">
                <el-button type="danger" @click="getWalletList">执行高级搜索</el-button>
                <el-button @click="resetAdvanced">重置高级条件</el-button>
                <el-button type="primary" @click="onExportWallets" :loading="exportWalletLoading">导出搜索结果</el-button>
              </div>
            </div>
          </div>

          <el-table v-if="walletList.length > 0" v-loading="walletLoading" :data="walletList" :border="true" style="width: 100%" max-height="460" stripe>
            <el-table-column label="用户信息" width="280" fixed="left">
              <template #default="{ row }">
                <div class="user-info-cell">
                  <div class="user-name" v-if="row.name">
                    <span class="name-label">昵称:</span> {{ row.name }}
                  </div>
                  <div class="user-uid">
                    <span class="uid-label">UID:</span> {{ row.uid }}
                  </div>
                  <div class="user-extra" v-if="row.username || row.phone">
                    <span v-if="row.username" class="user-username">{{ row.username }}</span>
                    <span v-if="row.phone" class="user-phone">{{ row.phone }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="balance" label="余额" width="140" align="right">
              <template #default="{ row }">
                <span class="font-600">¥{{ formatMoney(row.balance) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small" effect="light">
                  {{ row.status === 1 ? '正常' : '冻结' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="170" />
            <el-table-column prop="updated_at" label="更新时间" width="170" />
            <el-table-column label="操作" width="360" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="onViewRecords(row)">交易记录</el-button>
                <el-button type="warning" link size="small" @click="showAdjustDialog(row)">余额调整</el-button>
                <el-button v-if="row.status === 1" type="danger" link size="small" @click="showFreezeDialog(row)">冻结</el-button>
                <el-button v-else type="success" link size="small" @click="onUnfreeze(row)">解冻</el-button>
                <el-button link size="small" @click="onResetPassword(row)">重置密码</el-button>
                <el-button type="success" link size="small" @click="goRechargeAudit(row)">充值审核</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="!walletLoading && walletList.length === 0" class="empty-state">
            <div class="empty-icon">💰</div>
            <h3 class="empty-title">暂无钱包数据</h3>
            <p class="empty-desc">系统中还没有用户钱包记录。当用户首次使用钱包功能时，系统会自动为其创建钱包。</p>
            <el-button type="primary" round @click="loadData">
              <el-icon class="mr-4px"><Refresh /></el-icon>刷新数据
            </el-button>
          </div>

          <div class="flex items-center justify-between mt-12px">
            <span class="text-gray-400 text-13px">共 {{ walletTotal }} 条</span>
            <el-pagination
              v-model:current-page="walletQuery.page"
              v-model:page-size="walletQuery.size"
              :page-sizes="[15, 20, 30, 50, 100]"
              :background="true"
              layout="sizes, prev, pager, next, jumper"
              :total="walletTotal"
              @size-change="getWalletList"
              @current-change="getWalletList"
            />
          </div>
        </el-tab-pane>

        <!-- 📊 交易记录 -->
        <el-tab-pane label="📊 交易记录" name="records">
          <div class="tab-toolbar">
            <div class="toolbar-left">
              <el-input v-model="allRecordsQuery.keyword" placeholder="搜索用户ID/手机号/昵称/用户名" clearable style="width: 260px" @keyup.enter="getAllRecords">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <el-select v-model="allRecordsQuery.type" placeholder="交易类型" clearable style="width: 130px">
                <el-option label="全部类型" value="" />
                <el-option v-for="(name, key) in txTypeName" :key="key" :label="name" :value="key" />
              </el-select>
              <el-date-picker v-model="allRecordsQuery.startTime" type="date" placeholder="开始时间" value-format="YYYY-MM-DD" style="width: 150px" />
              <span class="date-separator">至</span>
              <el-date-picker v-model="allRecordsQuery.endTime" type="date" placeholder="结束时间" value-format="YYYY-MM-DD" style="width: 150px" />
            </div>
            <div class="toolbar-right">
              <el-button type="warning" @click="getAllRecords">搜索</el-button>
              <el-button @click="resetAllRecordsQuery">重置</el-button>
              <el-button @click="onExportRecords" :loading="exportRecordLoading">导出交易记录</el-button>
            </div>
          </div>
          <el-table v-if="allRecordsList.length > 0" v-loading="allRecordsLoading" :data="allRecordsList" :border="true" style="width: 100%" max-height="460" stripe row-key="id">
            <el-table-column prop="id" label="记录ID" width="80" />
            <el-table-column label="用户信息" width="240">
              <template #default="{ row }">
                <div class="user-info-cell">
                  <div class="user-name" v-if="row.name">
                    <span class="name-label">昵称:</span> {{ row.name }}
                  </div>
                  <div class="user-uid">
                    <span class="uid-label">UID:</span> {{ row.uid || row.keyword || '-' }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="changed_amount" label="变动金额" width="120" align="right">
              <template #default="{ row }">
                <span :class="row.changed_amount > 0 ? 'text-green-600' : 'text-red-500'" class="font-600">
                  {{ row.changed_amount > 0 ? '+' : '' }}{{ formatMoney(row.changed_amount) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="balance" label="余额" width="120" align="right">
              <template #default="{ row }">
                <span class="font-600">¥{{ formatMoney(row.balance) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="交易类型" width="130">
              <template #default="{ row }">
                <el-tag :type="txTypeTag[row.type] || 'info'" size="small" effect="light">{{ row.title || txTypeName[row.type] || row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
            <el-table-column prop="created_at" label="创建时间" width="170" />
          </el-table>

          <div v-if="!allRecordsLoading && allRecordsList.length === 0" class="empty-state">
            <div class="empty-icon">📊</div>
            <h3 class="empty-title">暂无交易记录</h3>
            <p class="empty-desc">当有用户进行交易时，记录会显示在这里</p>
          </div>

          <div class="flex items-center justify-between mt-12px">
            <span class="text-gray-400 text-13px">共 {{ allRecordsTotal }} 条</span>
            <el-pagination v-model:current-page="allRecordsQuery.page" v-model:page-size="allRecordsQuery.size" :page-sizes="[15,20,50]" :background="true" layout="sizes, prev, pager, next, jumper" :total="allRecordsTotal" @size-change="getAllRecords" @current-change="getAllRecords" />
          </div>
        </el-tab-pane>

        <!-- 💸 提现管理 -->
        <el-tab-pane label="💸 提现管理" name="withdrawals">
          <el-card shadow="never" class="mb-12px">
            <template #header>
              <span class="font-500">提现手续费</span>
              <span class="text-gray-400 text-13px ml-8px">手续费从提现金额中扣除，实际到账 = 提现金额 - 手续费；比例按申请金额的百分比，固定费为每笔另加</span>
            </template>
            <el-form :inline="true" class="wd-fee-form" @submit.prevent>
              <el-form-item label="比例(%)">
                <el-input-number v-model="wdFeeForm.fee_rate" :min="0" :max="100" :precision="2" :step="0.1" controls-position="right" style="width: 140px" />
              </el-form-item>
              <el-form-item label="固定(元/笔)">
                <el-input-number v-model="wdFeeForm.fee_fixed" :min="0" :precision="2" :step="1" controls-position="right" style="width: 140px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="wdFeeSaving" @click="onSaveWdFee">保存</el-button>
              </el-form-item>
            </el-form>
          </el-card>
          <div class="tab-toolbar">
            <div class="toolbar-left">
              <el-input v-model="wdQuery.keyword" placeholder="搜索提现编号或用户ID" clearable style="width: 260px" @keyup.enter="getWithdrawalList">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <el-select v-model="wdQuery.status" placeholder="提现状态" clearable style="width: 130px">
                <el-option label="全部状态" value="" />
                <el-option label="待审核" :value="0" />
                <el-option label="已批准" :value="1" />
                <el-option label="已拒绝" :value="2" />
              </el-select>
              <el-date-picker v-model="wdQuery.startTime" type="date" placeholder="开始时间" value-format="YYYY-MM-DD" style="width: 150px" />
              <span class="date-separator">至</span>
              <el-date-picker v-model="wdQuery.endTime" type="date" placeholder="结束时间" value-format="YYYY-MM-DD" style="width: 150px" />
            </div>
            <div class="toolbar-right">
              <el-button type="warning" @click="getWithdrawalList">搜索</el-button>
              <el-button @click="resetWdQuery">重置</el-button>
              <el-button type="success" @click="onExportWithdrawals" :loading="exportWdLoading">导出提现</el-button>
            </div>
          </div>
          <el-table v-if="wdList.length > 0" v-loading="wdLoading" :data="wdList" :border="true" style="width: 100%" max-height="460" stripe>
            <el-table-column prop="id" label="提现ID" width="80" />
            <el-table-column prop="withdrawal_no" label="提现编号" min-width="200" show-overflow-tooltip />
            <el-table-column prop="uid" label="用户ID" min-width="200" show-overflow-tooltip />
            <el-table-column prop="amount" label="提现金额" width="120" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="fee" label="手续费" width="100" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.fee) }}</template>
            </el-table-column>
            <el-table-column prop="actual_amount" label="实际到账" width="120" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.actual_amount ?? (row.amount - row.fee)) }}</template>
            </el-table-column>
            <el-table-column prop="address" label="提现地址" min-width="200" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="wdStatusTag[row.status]" size="small" effect="light">{{ wdStatusName[row.status] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="申请时间" width="170" />
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <template v-if="row.status === 0">
                  <el-button type="success" link size="small" @click="onApproveWithdrawal(row)">批准</el-button>
                  <el-button type="danger" link size="small" @click="onRejectWithdrawal(row)">拒绝</el-button>
                </template>
                <span v-else class="text-gray-400 text-13px">{{ wdStatusName[row.status] }}</span>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="!wdLoading && wdList.length === 0" class="empty-state">
            <div class="empty-icon">💸</div>
            <h3 class="empty-title">暂无提现记录</h3>
            <p class="empty-desc">当有用户申请提现时，记录会显示在这里</p>
          </div>

          <div class="flex items-center justify-between mt-12px">
            <span class="text-gray-400 text-13px">共 {{ wdTotal }} 条</span>
            <el-pagination v-model:current-page="wdQuery.page" v-model:page-size="wdQuery.size" :page-sizes="[15,20,30,50]" :background="true" layout="sizes, prev, pager, next, jumper" :total="wdTotal" @size-change="getWithdrawalList" @current-change="getWithdrawalList" />
          </div>
        </el-tab-pane>

        <!-- 💰 充值核销 -->
        <el-tab-pane label="💰 充值核销" name="rechargeAudit">
          <div class="tab-toolbar">
            <div class="toolbar-left">
              <el-input v-model="raQuery.keyword" placeholder="搜索申请单号或用户ID" clearable style="width: 260px" @keyup.enter="getRechargeAppList">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <el-select v-model="raQuery.status" placeholder="审核状态" clearable style="width: 130px">
                <el-option label="全部状态" value="" />
                <el-option label="待审核" :value="0" />
                <el-option label="已通过" :value="1" />
                <el-option label="已拒绝" :value="2" />
              </el-select>
            </div>
            <div class="toolbar-right">
              <el-button type="warning" @click="getRechargeAppList">搜索</el-button>
              <el-button @click="resetRaQuery">重置</el-button>
            </div>
          </div>
          <el-table v-if="raList.length > 0" v-loading="raLoading" :data="raList" :border="true" style="width: 100%" max-height="460" stripe>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="application_no" label="申请单号" min-width="200" show-overflow-tooltip />
            <el-table-column prop="uid" label="用户ID" min-width="180" show-overflow-tooltip />
            <el-table-column prop="amount_u" label="U数量" width="88" align="right">
              <template #default="{ row }">{{ row.amount_u > 0 ? formatMoney(row.amount_u) : '-' }}</template>
            </el-table-column>
            <el-table-column prop="exchange_rate" label="汇率" width="80" align="right">
              <template #default="{ row }">{{ row.exchange_rate > 0 ? formatMoney(row.exchange_rate) : '-' }}</template>
            </el-table-column>
            <el-table-column prop="amount" label="入账(元)" width="100" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="pay_type_name" label="支付类型" width="100" />
            <el-table-column prop="channel_id" label="渠道ID" width="80" align="center" />
            <el-table-column prop="remark" label="用户备注" min-width="120" show-overflow-tooltip />
            <el-table-column label="凭证" width="70" align="center">
              <template #default="{ row }">
                <el-image v-if="row.proof_url" :src="row.proof_url" :preview-src-list="[row.proof_url]" style="width: 36px; height: 36px" fit="cover" />
                <span v-else class="text-gray-300">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="raStatusTag[row.status]" size="small" effect="light">{{ raStatusName[row.status] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="admin_remark" label="管理员备注" min-width="120" show-overflow-tooltip />
            <el-table-column prop="created_at" label="申请时间" width="170" />
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <template v-if="row.status === 0">
                  <el-button type="success" link size="small" @click="onApproveRechargeApp(row)">通过</el-button>
                  <el-button type="danger" link size="small" @click="onRejectRechargeApp(row)">拒绝</el-button>
                </template>
                <span v-else class="text-gray-400 text-13px">{{ raStatusName[row.status] }}</span>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="!raLoading && raList.length === 0" class="empty-state">
            <div class="empty-icon">💰</div>
            <h3 class="empty-title">暂无充值申请</h3>
            <p class="empty-desc">用户在前端提交充值申请后，将显示在此列表供审核</p>
          </div>

          <div class="flex items-center justify-between mt-12px">
            <span class="text-gray-400 text-13px">共 {{ raTotal }} 条</span>
            <el-pagination v-model:current-page="raQuery.page" v-model:page-size="raQuery.size" :page-sizes="[15,20,30,50]" :background="true" layout="sizes, prev, pager, next, jumper" :total="raTotal" @size-change="getRechargeAppList" @current-change="getRechargeAppList" />
          </div>
        </el-tab-pane>

        <!-- 📝 操作日志 -->
        <el-tab-pane label="📝 操作日志" name="logs">
          <div class="log-toolbar">
            <div class="log-toolbar-row">
              <el-input v-model="logQuery.operator_uid" placeholder="搜索操作员UID" clearable style="width: 220px" @keyup.enter="getOperationLogs">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <el-input v-model="logQuery.target_uid" placeholder="搜索目标用户UID" clearable style="width: 220px" @keyup.enter="getOperationLogs">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <el-select v-model="logQuery.operation_type" placeholder="操作类型" clearable style="width: 160px">
                <el-option label="全部操作" value="" />
                <el-option label="余额调整" value="balance_adjust" />
                <el-option label="钱包冻结" value="wallet_freeze" />
                <el-option label="钱包解冻" value="wallet_unfreeze" />
                <el-option label="密码重置" value="password_reset" />
                <el-option label="提现批准" value="withdrawal_approve" />
                <el-option label="提现拒绝" value="withdrawal_reject" />
                <el-option label="充值审核通过" value="recharge_apply_approve" />
                <el-option label="充值审核拒绝" value="recharge_apply_reject" />
                <el-option label="用户同步" value="user_sync" />
                <el-option label="数据导出" value="data_export" />
              </el-select>
              <el-date-picker v-model="logQuery.startTime" type="date" placeholder="开始日期" value-format="YYYY-MM-DD" style="width: 150px" />
              <span class="date-separator">至</span>
              <el-date-picker v-model="logQuery.endTime" type="date" placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 150px" />
            </div>
            <div class="log-toolbar-row">
              <el-button type="warning" @click="getOperationLogs">搜索</el-button>
              <el-button @click="resetLogQuery">重置</el-button>
              <el-button type="success" @click="onExportLogs">导出日志</el-button>
            </div>
          </div>
          <el-table v-if="logList.length > 0" v-loading="logLoading" :data="logList" :border="true" style="width: 100%" max-height="460" stripe>
            <el-table-column prop="id" label="日志ID" width="80" />
            <el-table-column prop="operator_name" label="操作员" width="120" />
            <el-table-column prop="operation_type" label="操作类型" width="120">
              <template #default="{ row }">
                <el-tag :type="opTypeTagType(row.operation_type)" size="small" effect="light">{{ opTypeName(row.operation_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operation_desc" label="操作描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="target_info" label="目标用户" width="160" show-overflow-tooltip />
            <el-table-column prop="result" label="结果" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.result === 'success' ? 'success' : 'danger'" size="small" effect="light">{{ row.result === 'success' ? '成功' : '失败' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="ip_address" label="IP地址" width="140" />
            <el-table-column prop="created_at" label="操作时间" width="170" />
            <el-table-column label="操作" width="80" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="showLogDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="!logLoading && logList.length === 0" class="empty-state">
            <div class="empty-icon">📝</div>
            <h3 class="empty-title">暂无操作日志</h3>
            <p class="empty-desc">系统会自动记录所有管理员操作</p>
          </div>

          <div class="flex items-center justify-between mt-12px">
            <span class="text-gray-400 text-13px">共 {{ logTotal }} 条</span>
            <el-pagination v-model:current-page="logQuery.page" v-model:page-size="logQuery.size" :page-sizes="[15,20,50]" :background="true" layout="sizes, prev, pager, next, jumper" :total="logTotal" @size-change="getOperationLogs" @current-change="getOperationLogs" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 💰 余额调整弹窗 -->
    <el-dialog v-model="adjustVisible" title="💰 余额调整" width="440px" :close-on-click-modal="false">
      <template v-if="adjustTarget">
        <el-descriptions :column="1" border class="mb-16px" size="small">
          <el-descriptions-item label="用户ID">{{ adjustTarget.uid }}</el-descriptions-item>
          <el-descriptions-item label="当前余额">
            <span class="font-600 text-orange-500">¥{{ formatMoney(adjustTarget.balance) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="adjustTarget.status === 1 ? 'success' : 'danger'" size="small">{{ adjustTarget.status === 1 ? '正常' : '冻结' }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <el-form label-width="80px">
        <el-form-item label="调整金额">
          <el-input-number v-model="adjustForm.amount" :precision="2" :step="10" style="width: 100%" />
          <div class="text-12px text-gray-400 mt-4px">正数为增加余额，负数为减少余额</div>
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="adjustForm.reason" type="textarea" :rows="2" placeholder="请输入调整原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">取消</el-button>
        <el-button type="primary" @click="onAdjustBalance">确定调整</el-button>
      </template>
    </el-dialog>

    <!-- 冻结弹窗 -->
    <el-dialog v-model="freezeVisible" title="冻结钱包" width="440px" :close-on-click-modal="false">
      <p class="mb-12px">确定要冻结用户 <strong>{{ freezeTarget?.uid }}</strong> 的钱包吗？</p>
      <el-form label-width="80px">
        <el-form-item label="冻结原因"><el-input v-model="freezeReason" type="textarea" :rows="2" placeholder="冻结操作必须填写原因" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="freezeVisible = false">取消</el-button>
        <el-button type="danger" @click="onFreeze">确认冻结</el-button>
      </template>
    </el-dialog>

    <!-- 解冻弹窗 -->
    <el-dialog v-model="unfreezeVisible" title="解冻账户" width="440px" :close-on-click-modal="false">
      <p class="mb-12px">确定要解冻用户 <strong>{{ unfreezeTarget?.uid }}</strong> 的钱包吗？</p>
      <el-form label-width="80px">
        <el-form-item label="解冻原因"><el-input v-model="unfreezeReason" type="textarea" :rows="2" placeholder="请输入解冻原因（可选）" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="unfreezeVisible = false">取消</el-button>
        <el-button type="success" @click="onConfirmUnfreeze">确认解冻</el-button>
      </template>
    </el-dialog>

    <!-- 拒绝充值申请弹窗 -->
    <el-dialog v-model="raRejectVisible" title="拒绝充值申请" width="440px" :close-on-click-modal="false">
      <p class="mb-12px">确定要拒绝单号 <strong>{{ raRejectTarget?.application_no }}</strong> 的充值申请吗？</p>
      <el-form label-width="80px">
        <el-form-item label="拒绝原因"><el-input v-model="raRejectReason" type="textarea" :rows="2" placeholder="请输入拒绝原因（必填）" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="raRejectVisible = false">取消</el-button>
        <el-button type="danger" @click="onConfirmRejectRechargeApp">确定拒绝</el-button>
      </template>
    </el-dialog>

    <!-- 拒绝提现弹窗 -->
    <el-dialog v-model="rejectVisible" title="拒绝提现" width="440px" :close-on-click-modal="false">
      <p class="mb-12px">确定要拒绝编号为 <strong>{{ rejectTarget?.withdrawal_no }}</strong> 的提现申请吗？</p>
      <el-form label-width="80px">
        <el-form-item label="拒绝原因"><el-input v-model="rejectReason" type="textarea" :rows="2" placeholder="请输入拒绝原因（必填）" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="onConfirmReject">确定拒绝</el-button>
      </template>
    </el-dialog>

    <!-- 🔐 重置支付密码弹窗 -->
    <el-dialog v-model="resetPwdVisible" title="🔐 重置支付密码" width="440px" :close-on-click-modal="false">
      <el-descriptions :column="1" border class="mb-16px" size="small">
        <el-descriptions-item label="用户信息">{{ resetPwdTarget?.uid }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="resetPwdTarget?.status === 1 ? 'success' : 'danger'" size="small">{{ resetPwdTarget?.status === 1 ? '正常' : '冻结' }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <el-form label-width="80px">
        <el-form-item label="新密码"><el-input v-model="resetPwdNewPwd" placeholder="请输入新密码" show-password /></el-form-item>
        <el-form-item label="重置原因"><el-input v-model="resetPwdReason" type="textarea" :rows="2" placeholder="请输入重置原因" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdVisible = false">取消</el-button>
        <el-button type="warning" @click="onConfirmResetPwd">确定重置</el-button>
      </template>
    </el-dialog>

    <!-- 交易记录弹窗 -->
    <el-dialog v-model="recordsVisible" :title="`交易记录 - ${recordsUid}`" width="720px">
      <el-table v-loading="recordsLoading" :data="recordsList" :border="true" max-height="400" stripe>
        <el-table-column prop="id" label="记录ID" width="80" />
        <el-table-column prop="title" label="交易类型" width="120">
          <template #default="{ row }">
            <el-tag :type="txTypeTag[row.type] || 'info'" size="small" effect="light">{{ row.title || txTypeName[row.type] || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="changed_amount" label="变动金额" width="120" align="right">
          <template #default="{ row }">
            <span :class="(row.changed_amount || row.amount) > 0 ? 'text-green-600' : 'text-red-500'" class="font-600">{{ (row.changed_amount || row.amount) > 0 ? '+' : '' }}{{ formatMoney(row.changed_amount || row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" width="170" />
      </el-table>
      <div class="flex items-center justify-end mt-12px">
        <el-pagination v-model:current-page="recordsQuery.page" v-model:page-size="recordsQuery.size" :page-sizes="[10,20,50]" :background="true" layout="total, prev, pager, next" :total="recordsTotal" @current-change="getRecords" />
      </div>
    </el-dialog>

    <!-- 批量余额调整弹窗 -->
    <el-dialog v-model="showBatchAdjust" title="💰 余额调整" width="440px" :close-on-click-modal="false">
      <el-form label-width="80px">
        <el-form-item label="用户ID"><el-input v-model="batchAdjustForm.uid" placeholder="请输入用户ID或手机号" /></el-form-item>
        <el-form-item label="调整金额">
          <el-input-number v-model="batchAdjustForm.amount" :precision="2" :step="10" style="width: 100%" />
          <div class="text-12px text-gray-400 mt-4px">正数为增加余额，负数为减少余额</div>
        </el-form-item>
        <el-form-item label="调整原因"><el-input v-model="batchAdjustForm.reason" type="textarea" :rows="2" placeholder="请输入调整原因" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchAdjust = false">取消</el-button>
        <el-button type="primary" @click="onBatchAdjust">确定调整</el-button>
      </template>
    </el-dialog>

    <!-- 📝 操作日志详情弹窗 -->
    <el-dialog v-model="logDetailVisible" title="📝 操作日志详情" width="600px">
      <el-descriptions :column="2" border v-if="logDetailData">
        <el-descriptions-item label="操作员">{{ logDetailData.operator_name }} ({{ logDetailData.operator }})</el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="opTypeTagType(logDetailData.operation_type)" size="small">{{ opTypeName(logDetailData.operation_type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="目标用户">{{ logDetailData.target_info }}</el-descriptions-item>
        <el-descriptions-item label="结果">
          <el-tag :type="logDetailData.result === 'success' ? 'success' : 'danger'" size="small">{{ logDetailData.result === 'success' ? '成功' : '失败' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">{{ logDetailData.operation_desc }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ logDetailData.ip_address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ logDetailData.created_at }}</el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2" v-if="logDetailData.error_msg">
          <span class="text-red-500">{{ logDetailData.error_msg }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="操作数据" :span="2" v-if="logDetailData.operation_data">
          <el-input type="textarea" :rows="6" :model-value="formatJSON(logDetailData.operation_data)" readonly />
        </el-descriptions-item>
        <el-descriptions-item label="用户代理" :span="2" v-if="logDetailData.user_agent">{{ logDetailData.user_agent }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 钱包管理
  isAffix: false
</route>

<script lang="tsx" setup>
import { nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Search } from '@element-plus/icons-vue';
import {
  walletStatisticsGet, walletListGet, walletBalanceAdjustPost, walletFreezePost,
  walletUnfreezePost, walletRecordsGet, walletPasswordResetPost, walletSyncUserInfoPost,
  withdrawalListGet, withdrawalApprovePost, withdrawalRejectPost, withdrawalConfigGet, withdrawalConfigPost,
  rechargeApplicationListGet, rechargeApplicationApprovePost, rechargeApplicationRejectPost,
  operationLogsGet,
  exportWalletList, exportRecordList, exportWithdrawalList
} from '@/api/wallet';

const formatMoney = (v: number) => Number(v || 0).toFixed(2);

const formatJSON = (s: string) => {
  try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; }
};

const downloadBlob = (data: any, filename: string) => {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

const txTypeName: Record<string, string> = {
  recharge: '充值', admin_recharge: '管理员充值', admin_adjust: '管理员调整',
  redpacket_send: '红包发出', redpacket_receive: '红包收入',
  transfer_out: '转账发出', transfer_in: '转账收入',
  refund: '退款', withdrawal: '提现', withdrawal_freeze: '提现冻结', withdrawal_refund: '提现退款', fee: '手续费'
};
const txTypeTag: Record<string, string> = {
  recharge: 'success', admin_recharge: 'success', admin_adjust: 'warning',
  redpacket_send: 'danger', redpacket_receive: 'success',
  transfer_out: 'danger', transfer_in: 'success',
  refund: 'warning', withdrawal: 'info', withdrawal_freeze: 'warning', withdrawal_refund: 'warning', fee: 'warning'
};
const wdStatusName: Record<number, string> = { 0: '待审核', 1: '已批准', 2: '已拒绝' };
const wdStatusTag: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'danger' };
const raStatusName: Record<number, string> = { 0: '待审核', 1: '已通过', 2: '已拒绝' };
const raStatusTag: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'danger' };

const opTypeNameMap: Record<string, string> = {
  balance_adjust: '余额调整', wallet_freeze: '钱包冻结', wallet_unfreeze: '钱包解冻',
  password_reset: '密码重置', admin_recharge: '充值',
  withdrawal_approve: '提现批准', withdrawal_reject: '提现拒绝',
  recharge_apply_approve: '充值审核通过', recharge_apply_reject: '充值审核拒绝',
  user_sync: '用户同步', data_export: '数据导出'
};
const opTypeTagMap: Record<string, string> = {
  balance_adjust: 'primary', wallet_freeze: 'danger', wallet_unfreeze: 'success',
  password_reset: 'warning', admin_recharge: 'success',
  withdrawal_approve: 'success', withdrawal_reject: 'danger',
  recharge_apply_approve: 'success', recharge_apply_reject: 'danger',
  user_sync: 'info', data_export: 'info'
};
const opTypeName = (a: string) => opTypeNameMap[a] || a;
const opTypeTagType = (a: string) => opTypeTagMap[a] || 'info';

const stats = ref<any>({ total_wallets: 0, total_amount: 0, active_wallets: 0, frozen_wallets: 0, today_new_wallets: 0, today_transactions: 0, today_amount: 0 });
const loadStats = () => { walletStatisticsGet().then((r: any) => { stats.value = r; }).catch(() => {}); };

const activeTab = ref('wallets');

// === Wallet List ===
const walletList = ref<any[]>([]);
const walletLoading = ref(false);
const walletTotal = ref(0);
const walletQuery = reactive({ keyword: '', status: undefined as number | undefined, sortBy: '', minAmount: undefined as number | undefined, maxAmount: undefined as number | undefined, startTime: '', endTime: '', page: 1, size: 20 });
const getWalletList = () => {
  walletLoading.value = true;
  const params: any = { ...walletQuery, sort_by: walletQuery.sortBy, min_amount: walletQuery.minAmount || 0, max_amount: walletQuery.maxAmount || 0, start_time: walletQuery.startTime || '', end_time: walletQuery.endTime || '' };
  if (params.status === undefined) params.status = -1;
  walletListGet(params).then((r: any) => { walletList.value = r.list || []; walletTotal.value = r.total || 0; }).catch(() => {}).finally(() => { walletLoading.value = false; });
};
const showAdvanced = ref(false);
const resetWalletQuery = () => { walletQuery.keyword = ''; walletQuery.status = undefined; walletQuery.sortBy = ''; walletQuery.minAmount = undefined; walletQuery.maxAmount = undefined; walletQuery.startTime = ''; walletQuery.endTime = ''; walletQuery.page = 1; getWalletList(); };
const resetAdvanced = () => { walletQuery.minAmount = undefined; walletQuery.maxAmount = undefined; walletQuery.sortBy = ''; walletQuery.startTime = ''; walletQuery.endTime = ''; };

// === Balance Adjust ===
const adjustVisible = ref(false);
const adjustTarget = ref<any>(null);
const adjustForm = reactive({ uid: '', amount: 0, reason: '' });
const showAdjustDialog = (row: any) => { adjustTarget.value = row; adjustForm.uid = row.uid; adjustForm.amount = 0; adjustForm.reason = ''; adjustVisible.value = true; };
const onAdjustBalance = () => {
  if (adjustForm.amount === 0) { ElMessage.warning('请输入调整金额'); return; }
  if (!adjustForm.reason) { ElMessage.warning('请输入调整原因'); return; }
  walletBalanceAdjustPost(adjustForm).then(() => { ElMessage.success('余额调整成功'); adjustVisible.value = false; getWalletList(); loadStats(); }).catch((e: any) => { ElMessage.error(e?.msg || '余额调整失败'); });
};

// === Batch Adjust ===
const showBatchAdjust = ref(false);
const showBatchFreezeMode = ref(false);
const batchAdjustForm = reactive({ uid: '', amount: 0, reason: '' });
const onBatchAdjust = () => {
  if (!batchAdjustForm.uid) { ElMessage.warning('请输入用户ID'); return; }
  if (batchAdjustForm.amount === 0) { ElMessage.warning('请输入调整金额'); return; }
  if (!batchAdjustForm.reason) { ElMessage.warning('请输入调整原因'); return; }
  walletBalanceAdjustPost(batchAdjustForm).then(() => { ElMessage.success('余额调整成功'); showBatchAdjust.value = false; batchAdjustForm.uid = ''; batchAdjustForm.amount = 0; batchAdjustForm.reason = ''; getWalletList(); loadStats(); }).catch((e: any) => { ElMessage.error(e?.msg || '余额调整失败'); });
};

// === Freeze / Unfreeze ===
const freezeVisible = ref(false);
const freezeTarget = ref<any>(null);
const freezeReason = ref('');
const showFreezeDialog = (row: any) => { freezeTarget.value = row; freezeReason.value = ''; freezeVisible.value = true; };
const onFreeze = () => {
  if (!freezeReason.value) { ElMessage.warning('冻结操作必须填写原因'); return; }
  walletFreezePost({ uid: freezeTarget.value.uid, reason: freezeReason.value }).then(() => { ElMessage.success('钱包冻结成功'); freezeVisible.value = false; getWalletList(); loadStats(); }).catch((e: any) => { ElMessage.error(e?.msg || '操作失败'); });
};
const unfreezeVisible = ref(false);
const unfreezeTarget = ref<any>(null);
const unfreezeReason = ref('');
const onUnfreeze = (row: any) => { unfreezeTarget.value = row; unfreezeReason.value = ''; unfreezeVisible.value = true; };
const onConfirmUnfreeze = () => {
  walletUnfreezePost({ uid: unfreezeTarget.value.uid, reason: unfreezeReason.value }).then(() => { ElMessage.success('钱包解冻成功'); unfreezeVisible.value = false; getWalletList(); loadStats(); }).catch((e: any) => { ElMessage.error(e?.msg || '操作失败'); });
};

// === Reset Password ===
const resetPwdVisible = ref(false);
const resetPwdTarget = ref<any>(null);
const resetPwdReason = ref('');
const resetPwdNewPwd = ref('');
const onResetPassword = (row: any) => { resetPwdTarget.value = row; resetPwdReason.value = ''; resetPwdNewPwd.value = ''; resetPwdVisible.value = true; };
const onConfirmResetPwd = () => {
  walletPasswordResetPost({ uid: resetPwdTarget.value.uid, reason: resetPwdReason.value, new_password: resetPwdNewPwd.value }).then(() => { ElMessage.success('密码重置成功'); resetPwdVisible.value = false; }).catch((e: any) => { ElMessage.error(e?.msg || '密码重置失败'); });
};

// === Sync ===
const syncLoading = ref(false);
const onSyncUserInfo = () => {
  ElMessageBox.confirm('此操作将从用户表同步手机号和区号信息到钱包表，确定要继续吗？', '用户同步', { type: 'info' }).then(() => {
    syncLoading.value = true;
    walletSyncUserInfoPost().then((r: any) => { ElMessage.success(`同步完成，共同步 ${r.synced || 0} 个用户`); getWalletList(); }).catch(() => { ElMessage.error('同步用户信息失败'); }).finally(() => { syncLoading.value = false; });
  }).catch(() => {});
};

// === View Records (dialog) ===
const recordsVisible = ref(false);
const recordsUid = ref('');
const recordsList = ref<any[]>([]);
const recordsLoading = ref(false);
const recordsTotal = ref(0);
const recordsQuery = reactive({ keyword: '', page: 1, size: 10 });
const onViewRecords = (row: any) => { recordsUid.value = row.uid; recordsQuery.keyword = row.uid; recordsQuery.page = 1; recordsVisible.value = true; getRecords(); };
const getRecords = () => {
  recordsLoading.value = true;
  walletRecordsGet(recordsQuery).then((r: any) => { recordsList.value = r.list || []; recordsTotal.value = r.total || 0; }).catch(() => {}).finally(() => { recordsLoading.value = false; });
};

// === All Records (tab) ===
const allRecordsList = ref<any[]>([]);
const allRecordsLoading = ref(false);
const allRecordsTotal = ref(0);
const allRecordsQuery = reactive({ keyword: '', type: '', startTime: '', endTime: '', page: 1, size: 20 });
const getAllRecords = () => {
  allRecordsLoading.value = true;
  const params: any = { ...allRecordsQuery, start_time: allRecordsQuery.startTime || '', end_time: allRecordsQuery.endTime || '' };
  walletRecordsGet(params).then((r: any) => { allRecordsList.value = r.list || []; allRecordsTotal.value = r.total || 0; }).catch(() => {}).finally(() => { allRecordsLoading.value = false; });
};
const resetAllRecordsQuery = () => { allRecordsQuery.keyword = ''; allRecordsQuery.type = ''; allRecordsQuery.startTime = ''; allRecordsQuery.endTime = ''; allRecordsQuery.page = 1; getAllRecords(); };

// === Withdrawal ===
const wdFeeForm = reactive({ fee_rate: 0, fee_fixed: 0 });
const wdFeeSaving = ref(false);
const loadWdFeeConfig = () => {
  withdrawalConfigGet().then((r: any) => {
    wdFeeForm.fee_rate = Number(r.fee_rate) || 0;
    wdFeeForm.fee_fixed = Number(r.fee_fixed) || 0;
  }).catch(() => {});
};
const onSaveWdFee = () => {
  wdFeeSaving.value = true;
  withdrawalConfigPost({
    fee_rate: String(wdFeeForm.fee_rate ?? 0),
    fee_fixed: String(wdFeeForm.fee_fixed ?? 0)
  }).then(() => { ElMessage.success('提现手续费已保存'); }).catch((e: any) => { ElMessage.error(e?.msg || '保存失败'); }).finally(() => { wdFeeSaving.value = false; });
};

const wdList = ref<any[]>([]);
const wdLoading = ref(false);
const wdTotal = ref(0);
const wdQuery = reactive({ keyword: '', status: undefined as number | undefined, startTime: '', endTime: '', page: 1, size: 20 });
const getWithdrawalList = () => {
  wdLoading.value = true;
  const params: any = { ...wdQuery, status: wdQuery.status ?? -1, start_time: wdQuery.startTime || '', end_time: wdQuery.endTime || '' };
  withdrawalListGet(params).then((r: any) => { wdList.value = r.list || []; wdTotal.value = r.total || 0; }).catch(() => {}).finally(() => { wdLoading.value = false; });
};
const resetWdQuery = () => { wdQuery.keyword = ''; wdQuery.status = undefined; wdQuery.startTime = ''; wdQuery.endTime = ''; wdQuery.page = 1; getWithdrawalList(); };
const onApproveWithdrawal = (row: any) => {
  ElMessageBox.confirm(`确定批准编号为 ${row.withdrawal_no} 的提现申请吗？`, '批准提现', { type: 'warning' }).then(() => {
    withdrawalApprovePost({ id: row.id }).then(() => { ElMessage.success('提现申请已批准'); getWithdrawalList(); }).catch((e: any) => { ElMessage.error(e?.msg || '批准提现失败'); });
  }).catch(() => {});
};
const rejectVisible = ref(false);
const rejectTarget = ref<any>(null);
const rejectReason = ref('');
const onRejectWithdrawal = (row: any) => { rejectTarget.value = row; rejectReason.value = ''; rejectVisible.value = true; };
const onConfirmReject = () => {
  if (!rejectReason.value) { ElMessage.warning('请输入拒绝原因'); return; }
  withdrawalRejectPost({ id: rejectTarget.value.id, remark: rejectReason.value }).then(() => { ElMessage.success('提现申请已拒绝'); rejectVisible.value = false; getWithdrawalList(); }).catch((e: any) => { ElMessage.error(e?.msg || '拒绝提现失败'); });
};

// === Recharge application audit ===
const raList = ref<any[]>([]);
const raLoading = ref(false);
const raTotal = ref(0);
const raQuery = reactive({ keyword: '', status: undefined as number | undefined, page: 1, size: 20 });
const getRechargeAppList = () => {
  raLoading.value = true;
  const st = raQuery.status;
  const statusParam = st === undefined || st === '' ? -1 : st;
  const params: any = { ...raQuery, status: statusParam };
  rechargeApplicationListGet(params).then((r: any) => { raList.value = r.list || []; raTotal.value = r.total || 0; }).catch(() => {}).finally(() => { raLoading.value = false; });
};
const resetRaQuery = () => { raQuery.keyword = ''; raQuery.status = undefined; raQuery.page = 1; getRechargeAppList(); };
const goRechargeAudit = (row: any) => {
  raQuery.keyword = row.uid;
  raQuery.status = 0;
  raQuery.page = 1;
  activeTab.value = 'rechargeAudit';
  nextTick(() => getRechargeAppList());
};
const onApproveRechargeApp = (row: any) => {
  ElMessageBox.confirm(`确定通过单号 ${row.application_no} 的充值申请吗？通过后金额将入账用户钱包。`, '通过充值申请', { type: 'warning' }).then(() => {
    rechargeApplicationApprovePost({ id: row.id }).then(() => { ElMessage.success('已通过并入账'); getRechargeAppList(); loadStats(); }).catch((e: any) => { ElMessage.error(e?.msg || '操作失败'); });
  }).catch(() => {});
};
const raRejectVisible = ref(false);
const raRejectTarget = ref<any>(null);
const raRejectReason = ref('');
const onRejectRechargeApp = (row: any) => { raRejectTarget.value = row; raRejectReason.value = ''; raRejectVisible.value = true; };
const onConfirmRejectRechargeApp = () => {
  if (!raRejectReason.value) { ElMessage.warning('请输入拒绝原因'); return; }
  rechargeApplicationRejectPost({ id: raRejectTarget.value.id, remark: raRejectReason.value }).then(() => { ElMessage.success('已拒绝该申请'); raRejectVisible.value = false; getRechargeAppList(); }).catch((e: any) => { ElMessage.error(e?.msg || '操作失败'); });
};

// === Operation Logs ===
const logList = ref<any[]>([]);
const logLoading = ref(false);
const logTotal = ref(0);
const logQuery = reactive({ operator_uid: '', target_uid: '', operation_type: '', startTime: '', endTime: '', page: 1, size: 20 });
const getOperationLogs = () => {
  logLoading.value = true;
  const params: any = { ...logQuery, start_time: logQuery.startTime || '', end_time: logQuery.endTime || '' };
  operationLogsGet(params).then((r: any) => { logList.value = r.list || []; logTotal.value = r.total || 0; }).catch((e: any) => { console.error('操作日志加载失败', e); }).finally(() => { logLoading.value = false; });
};
const resetLogQuery = () => { Object.assign(logQuery, { page: 1, size: 20, operator_uid: '', target_uid: '', operation_type: '', startTime: '', endTime: '' }); getOperationLogs(); };

// Log detail dialog
const logDetailVisible = ref(false);
const logDetailData = ref<any>(null);
const showLogDetail = (row: any) => { logDetailData.value = row; logDetailVisible.value = true; };

// === Export ===
const exportWalletLoading = ref(false);
const exportRecordLoading = ref(false);
const exportWdLoading = ref(false);

const onExportWallets = async () => {
  try {
    ElMessage.info('正在准备导出钱包列表，请稍候...');
    exportWalletLoading.value = true;
    const params: any = { ...walletQuery, sort_by: walletQuery.sortBy };
    if (params.status === undefined) params.status = -1;
    delete params.page; delete params.size;
    const data = await exportWalletList(params);
    const now = new Date();
    const filename = `钱包列表_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.csv`;
    downloadBlob(data, filename);
    ElMessage.success(`导出成功！文件：${filename}`);
  } catch (e: any) {
    console.error('导出钱包列表失败:', e);
    ElMessage.error('导出钱包列表失败，请重试');
  } finally {
    exportWalletLoading.value = false;
  }
};

const onExportRecords = async () => {
  try {
    ElMessage.info('正在准备导出交易记录，请稍候...');
    exportRecordLoading.value = true;
    const params: any = { ...allRecordsQuery };
    delete params.page; delete params.size;
    const data = await exportRecordList(params);
    const now = new Date();
    const filename = `交易记录_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.csv`;
    downloadBlob(data, filename);
    ElMessage.success(`导出成功！文件：${filename}`);
  } catch (e: any) {
    console.error('导出交易记录失败:', e);
    ElMessage.error('导出交易记录失败，请重试');
  } finally {
    exportRecordLoading.value = false;
  }
};

const onExportWithdrawals = async () => {
  try {
    ElMessage.info('正在准备导出提现记录，请稍候...');
    exportWdLoading.value = true;
    const params: any = { ...wdQuery };
    if (params.status === undefined) params.status = -1;
    delete params.page; delete params.size;
    const data = await exportWithdrawalList(params);
    const now = new Date();
    const filename = `提现记录_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.csv`;
    downloadBlob(data, filename);
    ElMessage.success(`导出成功！文件：${filename}`);
  } catch (e: any) {
    console.error('导出提现记录失败:', e);
    ElMessage.error('导出提现记录失败，请重试');
  } finally {
    exportWdLoading.value = false;
  }
};

const onExportLogs = () => {
  ElMessage.info('导出功能开发中...');
};

const loadData = () => { loadStats(); getWalletList(); };
watch(activeTab, (tab) => {
  if (tab === 'records') getAllRecords();
  else if (tab === 'withdrawals') { loadWdFeeConfig(); getWithdrawalList(); }
  else if (tab === 'rechargeAudit') getRechargeAppList();
  else if (tab === 'logs') getOperationLogs();
});
onMounted(() => { loadData(); });
</script>

<style lang="scss" scoped>
.wallet-admin-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wallet-banner {
  background: linear-gradient(135deg, #ff6b35 0%, #f7453b 50%, #ff8c42 100%);
  border-radius: 8px;
  padding: 24px 28px;
  color: #fff;
  .banner-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .header-title {
    h2 {
      margin: 0 0 6px;
      font-size: 20px;
      font-weight: 600;
    }
    p {
      margin: 0;
      font-size: 13px;
      opacity: 0.85;
    }
  }
  .banner-right {
    display: flex;
    gap: 10px;
    .el-button {
      --el-button-text-color: #fff;
      --el-button-bg-color: rgba(255,255,255,0.2);
      --el-button-border-color: rgba(255,255,255,0.3);
      --el-button-hover-bg-color: rgba(255,255,255,0.35);
      --el-button-hover-border-color: rgba(255,255,255,0.5);
      --el-button-hover-text-color: #fff;
      backdrop-filter: blur(4px);
    }
    .el-button--primary {
      --el-button-bg-color: rgba(255,255,255,0.95);
      --el-button-text-color: #f7453b;
      --el-button-border-color: rgba(255,255,255,0.95);
      --el-button-hover-bg-color: #fff;
      --el-button-hover-text-color: #ff6b35;
      --el-button-hover-border-color: #fff;
      font-weight: 600;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}
.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
}
.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
  &.pink { background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: #fff; }
  &.orange { background: linear-gradient(135deg, #ffa502, #ff6348); color: #fff; }
  &.green { background: linear-gradient(135deg, #2ed573, #26ae60); color: #fff; }
  &.blue { background: linear-gradient(135deg, #54a0ff, #2e86de); color: #fff; }
  &.purple { background: linear-gradient(135deg, #a55eea, #8854d0); color: #fff; }
}
.stat-info {
  flex: 1;
  .stat-value { font-size: 22px; font-weight: 700; color: #1a1a2e; line-height: 1.2; }
  .stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
}
.stat-badge {
  text-align: right;
  .badge-text {
    display: block;
    font-size: 13px;
    font-weight: 600;
    &.green { color: #2ed573; }
    &.orange { color: #ff6348; }
    &.blue { color: #54a0ff; }
  }
  .badge-label { font-size: 11px; color: #c0c4cc; }
}

.main-card {
  flex: 1;
  :deep(.el-card__body) { padding: 12px 20px 20px; }
  :deep(.el-tabs__item) {
    font-size: 14px;
  }
}
.tab-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 8px;
  .toolbar-left, .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .date-separator {
    color: #909399;
    font-size: 13px;
    flex-shrink: 0;
  }
}

.advanced-panel {
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 14px;
  .advanced-header {
    margin-bottom: 12px;
    .advanced-title { font-size: 14px; font-weight: 600; color: #303133; }
  }
  .advanced-body {
    .advanced-row {
      display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 14px;
    }
    .advanced-field {
      display: flex; align-items: center; gap: 8px;
      .advanced-label { font-size: 13px; color: #606266; white-space: nowrap; min-width: 70px; }
      .advanced-range { display: flex; align-items: center; gap: 6px;
        .range-sep { color: #909399; font-size: 13px; }
      }
    }
    .advanced-actions {
      display: flex; gap: 8px;
    }
  }
}

.log-toolbar {
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  .log-toolbar-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  .empty-icon { font-size: 64px; margin-bottom: 16px; }
  .empty-title { font-size: 18px; color: #303133; margin: 0 0 8px; font-weight: 600; }
  .empty-desc { font-size: 13px; color: #909399; margin: 0 0 20px; line-height: 1.8; }
}

.user-info-cell {
  line-height: 1.6;
  .user-name {
    font-weight: 600;
    color: #303133;
    font-size: 13px;
    .name-label { color: #909399; font-weight: 400; font-size: 12px; }
  }
  .user-uid {
    color: #606266;
    font-size: 12px;
    word-break: break-all;
    .uid-label { color: #909399; }
  }
  .user-extra {
    display: flex;
    gap: 8px;
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }
}
</style>
