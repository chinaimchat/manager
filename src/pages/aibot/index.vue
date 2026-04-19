<template>
  <bd-page class="aibot-page">
    <!-- 统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card" :class="config.enabled ? 'active' : 'inactive'">
            <div class="stat-icon">
              <i :class="config.enabled ? 'i-bd-check-one' : 'i-bd-close-one'" style="font-size: 28px" />
            </div>
            <div class="stat-content">
              <div class="stat-label">服务状态</div>
              <div class="stat-value">{{ config.enabled ? '运行中' : '已停止' }}</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card provider">
            <div class="stat-icon">
              <i class="i-bd-robot" style="font-size: 28px" />
            </div>
            <div class="stat-content">
              <div class="stat-label">AI提供商</div>
              <div class="stat-value">{{ providerLabel[config.provider] || config.provider || 'DeepSeek' }}</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card model">
            <div class="stat-icon">
              <i class="i-bd-cpu" style="font-size: 28px" />
            </div>
            <div class="stat-content">
              <div class="stat-label">当前模型</div>
              <div class="stat-value">{{ config.model || 'deepseek-chat' }}</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card account">
            <div class="stat-icon">
              <i class="i-bd-every-user" style="font-size: 28px" />
            </div>
            <div class="stat-content">
              <div class="stat-label">系统账号</div>
              <div class="stat-value">{{ config.system_uid || 'u_10000' }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="16" class="main-content">
      <!-- 左侧 -->
      <el-col :xs="24" :lg="12">
        <!-- 配置管理卡片 -->
        <el-card class="config-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <i class="i-bd-setting" style="font-size: 18px" />
              <span>配置管理</span>
            </div>
          </template>

          <el-form :model="form" label-width="120px" label-position="left">
            <el-form-item label="启用状态">
              <el-switch v-model="form.enabled" active-text="启用" inactive-text="禁用"
                :loading="toggling" @change="onToggle" />
              <div class="form-tip">{{ config.enabled ? 'AI机器人当前正在运行' : 'AI机器人当前已停止' }}</div>
            </el-form-item>

            <el-divider />

            <el-form-item label="AI提供商">
              <el-radio-group v-model="form.provider" :disabled="!form.enabled" @change="onProviderChange">
                <el-radio label="deepseek">DeepSeek</el-radio>
                <el-radio label="openai" disabled>OpenAI (即将支持)</el-radio>
              </el-radio-group>
              <div class="form-tip">选择AI服务提供商，切换后需要重新配置API密钥</div>
            </el-form-item>

            <el-form-item label="API密钥">
              <el-input v-model="form.api_key" type="password"
                :placeholder="config.has_api_key ? 'API密钥已配置，留空则不修改' : '请输入API密钥'"
                :disabled="!form.enabled" show-password clearable>
                <template #prepend>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
              <div class="form-tip">
                <template v-if="config.has_api_key">
                  <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
                  <span style="color: #67c23a">API密钥已配置</span>
                  <span style="margin-left: 8px; color: #909399">（留空则不修改）</span>
                </template>
                <template v-else>
                  <el-icon color="#f56c6c"><CircleCloseFilled /></el-icon>
                  <span style="color: #f56c6c">API密钥未配置</span>
                </template>
                <el-divider direction="vertical" />
                <el-link type="primary" href="https://platform.deepseek.com" target="_blank" :underline="false">
                  <el-icon><Link /></el-icon> 获取DeepSeek API密钥
                </el-link>
              </div>
            </el-form-item>

            <el-form-item label="模型名称">
              <el-select v-model="form.model" placeholder="请选择模型" :disabled="!form.enabled" style="width: 100%">
                <el-option label="deepseek-chat（通用对话）" value="deepseek-chat" />
                <el-option label="deepseek-coder（代码辅助）" value="deepseek-coder" />
              </el-select>
              <div class="form-tip">deepseek-chat 适合日常对话，deepseek-coder 适合代码相关问题</div>
            </el-form-item>

            <el-divider>高级参数</el-divider>

            <el-form-item label="最大Token数">
              <div class="slider-container">
                <el-slider v-model="form.max_tokens" :min="100" :max="4000" :step="100"
                  :disabled="!form.enabled" :marks="tokenMarks"
                  show-input :show-input-controls="false" />
              </div>
              <div class="form-tip">控制AI回复的最大长度，建议值：2000</div>
            </el-form-item>

            <el-form-item label="温度参数">
              <div class="slider-container">
                <el-slider v-model="form.temperature" :min="0" :max="2" :step="0.1"
                  :disabled="!form.enabled" :marks="tempMarks"
                  show-input :show-input-controls="false" />
              </div>
              <div class="form-tip">值越高回复越随机，值越低回复越确定，建议值：0.7</div>
            </el-form-item>

            <el-form-item>
              <el-space>
                <el-button type="primary" :loading="saving" :disabled="!form.enabled" @click="saveConfig">
                  <el-icon><Select /></el-icon> 保存配置
                </el-button>
                <el-button @click="resetForm">
                  <el-icon><RefreshLeft /></el-icon> 重置
                </el-button>
              </el-space>
            </el-form-item>

            <el-divider>配置信息</el-divider>

            <el-form-item v-if="config.id" label="配置ID">
              <span class="config-info-text">#{{ config.id }}</span>
            </el-form-item>

            <el-form-item label="配置状态">
              <el-tag :type="config.id ? 'success' : 'info'" size="small">{{ config.id ? '已保存到数据库' : '未保存（仅内存）' }}</el-tag>
            </el-form-item>

            <el-form-item label="API密钥状态">
              <div class="api-key-display">
                <el-tag :type="config.has_api_key ? 'success' : 'danger'" size="small" style="margin-right: 8px">
                  <el-icon style="margin-right: 4px; vertical-align: middle">
                    <CircleCheckFilled v-if="config.has_api_key" />
                    <CircleCloseFilled v-else />
                  </el-icon>
                  {{ config.has_api_key ? '已配置' : '未配置' }}
                </el-tag>
                <template v-if="config.has_api_key && maskedKey">
                  <span class="api-key-masked">
                    <el-icon style="margin-right: 4px"><Lock /></el-icon>
                    <code style="font-size: 12px; color: #606266">{{ maskedKey }}</code>
                    <el-button text type="primary" size="small" @click="showFullKey = !showFullKey" style="margin-left: 8px">
                      {{ showFullKey ? '隐藏' : '显示完整' }}
                    </el-button>
                  </span>
                  <div v-if="showFullKey && fullApiKey" style="margin-top: 8px">
                    <el-input :model-value="fullApiKey" readonly type="text">
                      <template #append>
                        <el-button :icon="CopyDocument" @click="copyApiKey" :loading="copying">复制</el-button>
                      </template>
                    </el-input>
                  </div>
                </template>
              </div>
            </el-form-item>

            <el-form-item v-if="config.created_at" label="创建时间">
              <span class="config-info-text"><el-icon><Clock /></el-icon> {{ formatTime(config.created_at) }}</span>
            </el-form-item>

            <el-form-item v-if="config.updated_at" label="更新时间">
              <span class="config-info-text"><el-icon><Clock /></el-icon> {{ formatTime(config.updated_at) }}</span>
            </el-form-item>

            <el-alert v-if="!config.id" title="提示" type="info" :closable="false" style="margin-top: 12px">
              <template #default>
                <p style="margin: 0">当前配置仅保存在内存中，重启服务后会丢失。请点击"保存配置"按钮将配置保存到数据库。</p>
              </template>
            </el-alert>
          </el-form>
        </el-card>

        <!-- 使用说明卡片 -->
        <el-card class="help-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="20"><InfoFilled /></el-icon>
              <span>使用说明</span>
            </div>
          </template>

          <el-steps direction="vertical" :active="config.has_api_key ? 3 : 1">
            <el-step title="配置API密钥" description="获取并填入DeepSeek API密钥" />
            <el-step title="启用AI机器人" description="打开启用开关，保存配置" />
            <el-step title="开始使用" :description="`用户发送消息给系统账号 ${config.system_uid || 'u_10000'}，即可获得AI回复`" />
          </el-steps>

          <el-alert v-if="!config.has_api_key" title="温馨提示" type="warning" :closable="false" style="margin-top: 16px">
            <template #default>
              <p style="margin: 0 0 8px 0">请先配置API密钥才能使用AI机器人功能。</p>
              <p style="margin: 0">
                访问
                <el-link type="primary" href="https://platform.deepseek.com" target="_blank" :underline="false">DeepSeek开放平台</el-link>
                获取免费API密钥。
              </p>
            </template>
          </el-alert>
        </el-card>
      </el-col>

      <!-- 右侧：对话历史查询 -->
      <el-col :xs="24" :lg="12">
        <el-card class="history-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="20"><ChatDotRound /></el-icon>
              <span>对话历史查询</span>
            </div>
          </template>

          <div class="history-search">
            <el-input v-model="historyUid" placeholder="输入用户UID查询对话历史" clearable @keyup.enter="searchHistory">
              <template #prepend>
                <el-icon><User /></el-icon>
                <span style="margin-left: 4px">UID</span>
              </template>
              <template #append>
                <el-button type="primary" :loading="historyLoading" :disabled="!historyUid" @click="searchHistory">
                  <el-icon><Search /></el-icon> 查询
                </el-button>
              </template>
            </el-input>
            <div class="search-tip">
              <el-icon><InfoFilled /></el-icon>
              <span>查询指定用户与AI机器人的对话历史</span>
            </div>
          </div>

          <div v-loading="historyLoading" class="history-list">
            <template v-if="historyList.length > 0">
              <el-alert :title="`共查询到 ${historyList.length} 条对话记录`" type="info" :closable="false" style="margin-bottom: 16px" />
              <div v-for="(item, idx) in historyList" :key="item.id || idx" class="history-item">
                <div class="message user-message">
                  <div class="message-header">
                    <el-tag type="primary" size="small">
                      <el-icon><User /></el-icon> 用户
                    </el-tag>
                    <span class="message-time">{{ formatTime(item.created_at || item.createdAt) }}</span>
                  </div>
                  <div class="message-content">{{ item.user_message || item.userMessage || '（消息内容为空）' }}</div>
                </div>
                <div class="message bot-message">
                  <div class="message-header">
                    <el-tag type="success" size="small">
                      <i class="i-bd-robot mr-4px" /> AI助手
                    </el-tag>
                    <span class="message-time">{{ formatTime(item.created_at || item.createdAt) }}</span>
                  </div>
                  <div class="message-content">{{ item.bot_reply || item.botReply || '（回复内容为空）' }}</div>
                </div>
              </div>
            </template>
            <el-empty v-else-if="historyUid && historySearched" description="该用户暂无对话历史" :image-size="120" />
            <el-empty v-else description="请输入用户UID并点击查询按钮" :image-size="120" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: AI机器人
  isAffix: false
</route>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import {
  Search, User, InfoFilled, ChatDotRound, Clock, Link, CopyDocument,
  Lock, Select, RefreshLeft, CircleCheckFilled, CircleCloseFilled
} from '@element-plus/icons-vue';
import { aibotConfigGet, aibotConfigSave, aibotToggle, aibotHistoryGet } from '@/api/aibot';

const providerLabel: Record<string, string> = { deepseek: 'DeepSeek', openai: 'OpenAI' };

const tokenMarks = { 100: '100', 2000: '2000', 4000: '4000' } as any;
const tempMarks = { 0: '确定', 1: '平衡', 2: '随机' } as any;

const config = reactive<any>({
  id: null, enabled: false, provider: 'deepseek', model: 'deepseek-chat',
  has_api_key: false, system_uid: 'u_10000', max_tokens: 2000, temperature: 0.7,
  created_at: null, updated_at: null
});
const form = reactive<any>({
  enabled: false, provider: 'deepseek', api_key: '', model: 'deepseek-chat',
  max_tokens: 2000, temperature: 0.7
});
const toggling = ref(false);
const saving = ref(false);
const fullApiKey = ref('');
const showFullKey = ref(false);
const copying = ref(false);

const maskedKey = computed(() => {
  if (!config.has_api_key || !fullApiKey.value) return '';
  const k = fullApiKey.value;
  if (k.length <= 8) return '****';
  return `${k.substring(0, 4)}${'*'.repeat(Math.max(8, k.length - 8))}${k.substring(k.length - 4)}`;
});

const formatTime = (t: any) => {
  if (!t) return '';
  try {
    const d = new Date(t);
    const Y = d.getFullYear(), M = String(d.getMonth() + 1).padStart(2, '0'),
      D = String(d.getDate()).padStart(2, '0'),
      h = String(d.getHours()).padStart(2, '0'), m = String(d.getMinutes()).padStart(2, '0');
    return `${Y}-${M}-${D} ${h}:${m}`;
  } catch { return String(t); }
};

const loadConfig = async () => {
  try {
    const r: any = await aibotConfigGet();
    Object.assign(config, {
      id: r.id || null, enabled: r.enabled || false, provider: r.provider || 'deepseek',
      model: r.model || 'deepseek-chat', has_api_key: r.has_api_key || false,
      system_uid: r.system_uid || 'u_10000', max_tokens: r.max_tokens || 2000,
      temperature: r.temperature || 0.7, created_at: r.created_at || null, updated_at: r.updated_at || null
    });
    Object.assign(form, {
      enabled: config.enabled, provider: config.provider, api_key: '',
      model: config.model, max_tokens: config.max_tokens, temperature: config.temperature
    });
    if (config.has_api_key && r.api_key) fullApiKey.value = r.api_key;
    else fullApiKey.value = '';
    showFullKey.value = false;
  } catch (e: any) { ElMessage.error(e?.msg || '获取配置失败'); }
};

const onToggle = async (val: boolean) => {
  toggling.value = true;
  try {
    await aibotToggle({ enabled: val });
    config.enabled = val;
    ElMessage.success(val ? 'AI机器人已启用' : 'AI机器人已禁用');
  } catch (e: any) {
    ElMessage.error(e?.msg || '操作失败');
    form.enabled = !val;
  } finally { toggling.value = false; }
};

const onProviderChange = (val: string) => {
  form.api_key = '';
  ElMessage.info(`已切换到 ${providerLabel[val] || val}，请重新配置API密钥`);
};

const saveConfig = async () => {
  if (!form.api_key && !config.has_api_key) { ElMessage.warning('请输入API密钥'); return; }
  if (!form.model) { ElMessage.warning('请选择模型'); return; }
  if (form.max_tokens < 100 || form.max_tokens > 4000) { ElMessage.warning('最大Token数应在100-4000之间'); return; }
  if (form.temperature < 0 || form.temperature > 2) { ElMessage.warning('温度参数应在0-2之间'); return; }
  saving.value = true;
  try {
    const data: any = { provider: form.provider, model: form.model, max_tokens: form.max_tokens, temperature: form.temperature };
    if (form.api_key) data.api_key = form.api_key;
    await aibotConfigSave(data);
    form.api_key = '';
    await loadConfig();
    ElMessage.success(config.id ? `配置已保存到数据库（ID: #${config.id}）` : '配置保存成功');
  } catch (e: any) { ElMessage.error(e?.msg || '保存失败'); }
  finally { saving.value = false; }
};

const resetForm = () => {
  Object.assign(form, {
    enabled: config.enabled, provider: config.provider, api_key: '',
    model: config.model, max_tokens: config.max_tokens, temperature: config.temperature
  });
  ElMessage.info('已重置为当前配置');
};

const copyApiKey = async () => {
  if (!fullApiKey.value) { ElMessage.warning('API密钥不可用'); return; }
  copying.value = true;
  try {
    await navigator.clipboard.writeText(fullApiKey.value);
    ElMessage.success('API密钥已复制到剪贴板');
  } catch {
    const el = document.createElement('textarea');
    el.value = fullApiKey.value;
    el.style.position = 'fixed'; el.style.opacity = '0';
    document.body.appendChild(el); el.select();
    try { document.execCommand('copy'); ElMessage.success('API密钥已复制到剪贴板'); }
    catch { ElMessage.error('复制失败，请手动复制'); }
    document.body.removeChild(el);
  } finally { copying.value = false; }
};

// History
const historyUid = ref('');
const historyList = ref<any[]>([]);
const historyLoading = ref(false);
const historySearched = ref(false);

const searchHistory = async () => {
  const uid = historyUid.value.trim();
  if (!uid) { ElMessage.warning('请输入用户UID'); return; }
  if (uid.length < 3) { ElMessage.warning('UID格式不正确，请输入有效的用户UID'); return; }
  historyLoading.value = true;
  historySearched.value = true;
  try {
    const r: any = await aibotHistoryGet({ uid, limit: 50 });
    let list: any[] = [];
    if (Array.isArray(r)) list = r;
    else if (r?.data && Array.isArray(r.data)) list = r.data;
    else if (r?.list && Array.isArray(r.list)) list = r.list;
    historyList.value = list;
    if (list.length === 0) ElMessage.info('该用户暂无对话历史');
    else ElMessage.success(`查询到 ${list.length} 条对话记录`);
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || '查询失败');
    historyList.value = [];
  } finally { historyLoading.value = false; }
};

onMounted(() => { loadConfig(); });
</script>

<style lang="scss" scoped>
.aibot-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.stats-section {
  margin-bottom: 0;
}
.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
  margin-bottom: 12px;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-1px); }
  &.active .stat-icon { background: linear-gradient(135deg, #67c23a, #85ce61); color: #fff; }
  &.inactive .stat-icon { background: linear-gradient(135deg, #f56c6c, #f89898); color: #fff; }
  &.provider .stat-icon { background: linear-gradient(135deg, #409eff, #79bbff); color: #fff; }
  &.model .stat-icon { background: linear-gradient(135deg, #e6a23c, #eebe77); color: #fff; }
  &.account .stat-icon { background: linear-gradient(135deg, #909399, #b1b3b8); color: #fff; }
}
.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-content {
  flex: 1;
  .stat-label { font-size: 12px; color: #909399; margin-bottom: 4px; }
  .stat-value { font-size: 18px; font-weight: 700; color: #1a1a2e; }
}
.main-content {
  margin-top: 0;
}
.config-card, .help-card, .history-card {
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.slider-container {
  width: 100%;
  padding-bottom: 20px;
}
.config-info-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #606266;
}
.api-key-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.api-key-masked {
  display: inline-flex;
  align-items: center;
}
.history-search {
  margin-bottom: 16px;
  .search-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}
.history-list {
  min-height: 200px;
}
.history-item {
  margin-bottom: 16px;
}
.message {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 4px;
  &.user-message {
    background: #ecf5ff;
    border-left: 3px solid #409eff;
  }
  &.bot-message {
    background: #f0f9eb;
    border-left: 3px solid #67c23a;
  }
  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .message-time { font-size: 12px; color: #909399; }
  .message-content {
    font-size: 13px;
    color: #303133;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
