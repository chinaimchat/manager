<template>
  <div class="hotline-cs-panel">
    <!-- 统计卡片 -->
    <div class="mb-16px grid grid-cols-4 gap-16px">
      <el-card shadow="never" class="stat-item">
        <div class="flex items-center w-full">
          <div class="w-60px h-60px rounded-full bg-blue-100 flex items-center justify-center mr-16px">
            <i class="i-bd-peoples-two text-blue-500 text-24px" />
          </div>
          <div>
            <div class="text-24px font-600">{{ stats.total_configs }}</div>
            <div class="text-gray-400 text-13px">客服配置数</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="never" class="stat-item">
        <div class="flex items-center w-full">
          <div class="w-60px h-60px rounded-full bg-green-100 flex items-center justify-center mr-16px">
            <i class="i-bd-every-user text-green-500 text-24px" />
          </div>
          <div>
            <div class="text-24px font-600">{{ stats.total_agents }}</div>
            <div class="text-gray-400 text-13px">客服总数</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="never" class="stat-item">
        <div class="flex items-center w-full">
          <div class="w-60px h-60px rounded-full bg-orange-100 flex items-center justify-center mr-16px">
            <i class="i-bd-check-one text-orange-500 text-24px" />
          </div>
          <div>
            <div class="text-24px font-600">{{ stats.online_agents }}</div>
            <div class="text-gray-400 text-13px">工作中客服</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="never" class="stat-item">
        <div class="flex items-center w-full">
          <div class="w-60px h-60px rounded-full bg-purple-100 flex items-center justify-center mr-16px">
            <i class="i-bd-communication text-purple-500 text-24px" />
          </div>
          <div>
            <div class="text-24px font-600">{{ stats.today_sessions }}</div>
            <div class="text-gray-400 text-13px">今日会话</div>
          </div>
        </div>
      </el-card>
    </div>

    <div class="flex-1 el-card border-none flex-col box-border overflow-hidden inner-card">
      <div class="h-50px pl-12px pr-12px box-border flex items-center justify-between bd-title">
        <div class="bd-title-left flex items-center">
          <p class="m-0 font-600">客服配置列表</p>
        </div>
        <div class="flex items-center h-50px gap-12px">
          <el-button type="primary" @click="showConfigDialog(null)">
            <i class="i-bd-add mr-4px" />新增配置
          </el-button>
          <el-button @click="loadData">
            <i class="i-bd-redo mr-4px" />刷新
          </el-button>
        </div>
      </div>
      <div class="flex-1 overflow-hidden p-12px">
        <el-table v-loading="loading" :data="tableData" :border="true" style="width: 100%; height: 100%" stripe>
          <el-table-column prop="id" label="ID" width="70" align="center" />
          <el-table-column prop="logo" label="Logo" width="80" align="center">
            <template #default="{ row }">
              <el-avatar v-if="row.logo" :src="row.logo" :size="36" />
              <span v-else class="text-gray-300">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="app_name" label="应用名称" min-width="140" />
          <el-table-column prop="app_id" label="应用ID" min-width="120" show-overflow-tooltip />
          <el-table-column prop="uid" label="系统账号UID" min-width="120" show-overflow-tooltip />
          <el-table-column prop="color" label="主题颜色" width="110" align="center">
            <template #default="{ row }">
              <div class="flex items-center justify-center gap-6px">
                <div :style="{ width: '20px', height: '20px', borderRadius: '4px', background: row.color || '#409eff' }" />
                <span class="text-12px text-gray-400">{{ row.color }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="chat_bg" label="聊天背景" min-width="120" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.chat_bg" class="text-12px text-blue-500">{{ row.chat_bg }}</span>
              <span v-else class="text-gray-300">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="agent_count" label="客服数量" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small">{{ row.agent_count || 0 }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="170">
            <template #default="{ row }">{{ formatTs(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="showAgentPanel(row)">客服管理</el-button>
              <el-button type="warning" link size="small" @click="showConfigDialog(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="onDeleteConfig(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pl-12px pr-12px mb-12px flex items-center justify-between">
        <div></div>
        <el-pagination
          v-model:current-page="query.page_index"
          v-model:page-size="query.page_size"
          :page-sizes="[15, 20, 30, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </div>

    <el-dialog v-model="cfgDialogVisible" :title="editingCfg ? '编辑配置' : '新增配置'" width="640px" :close-on-click-modal="false">
      <div class="cfg-dlg-scroll">
        <el-form :model="cfgForm" label-width="120px">
          <el-form-item label="应用ID：" required>
            <el-input v-model="cfgForm.app_id" placeholder="请输入应用ID" :disabled="!!editingCfg" />
          </el-form-item>
          <el-form-item label="应用名称：" required>
            <el-input v-model="cfgForm.app_name" placeholder="请输入应用名称" />
          </el-form-item>
          <el-form-item label="系统账号UID：">
            <el-input v-model="cfgForm.uid" placeholder="系统消息将以此uid的名义发送" />
          </el-form-item>
          <el-form-item label="Logo：">
            <el-input v-model="cfgForm.logo" placeholder="请输入Logo URL" />
          </el-form-item>
          <el-form-item label="主题颜色：">
            <el-color-picker v-model="cfgForm.color" />
            <span class="ml-8px text-gray-400 text-12px">{{ cfgForm.color }}</span>
          </el-form-item>
          <el-form-item label="聊天背景：">
            <el-input v-model="cfgForm.chat_bg" placeholder="请输入聊天背景URL" />
          </el-form-item>
        </el-form>

        <template v-if="editingCfg">
          <el-divider content-position="left">咨询话题与欢迎语</el-divider>
          <p class="topic-hint text-12px text-gray-500 m-0 mb-10px leading-relaxed">
            访客按话题进线后，系统会以上方「系统账号UID」身份自动发送该话题下的欢迎语（与客服工作台话题数据一致）。
          </p>
          <div v-loading="topicLoading" class="topic-block">
            <el-table :data="topicList" border size="small" max-height="220">
              <el-table-column prop="title" label="话题标题" min-width="100" show-overflow-tooltip />
              <el-table-column prop="welcome" label="欢迎语" min-width="160" show-overflow-tooltip />
              <el-table-column label="默认" width="70" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.is_default === 1" type="warning" size="small">默认</el-tag>
                  <span v-else class="text-gray-300">-</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="openTopicEdit(row)">编辑</el-button>
                  <el-button type="danger" link size="small" :disabled="row.is_default === 1" @click="removeTopic(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="mt-10px flex flex-col gap-8px">
              <el-input v-model="newTopic.title" placeholder="新话题标题" />
              <el-input v-model="newTopic.welcome" type="textarea" :rows="2" placeholder="新话题欢迎语（进线后自动发送）" />
              <el-button type="primary" plain size="small" class="self-start" @click="addTopic">添加话题</el-button>
            </div>
          </div>
        </template>
        <el-alert
          v-else
          type="info"
          :closable="false"
          class="mt-4px"
          title="保存本配置后，请再次点「编辑」进入此窗口，即可在下方维护咨询话题与欢迎语。"
        />
      </div>
      <template #footer>
        <el-button @click="cfgDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="topicEditVisible" title="编辑话题" width="480px" :close-on-click-modal="false" append-to-body>
      <el-form label-width="88px">
        <el-form-item label="话题标题">
          <el-input v-model="topicEditForm.title" placeholder="标题" />
        </el-form-item>
        <el-form-item label="欢迎语">
          <el-input v-model="topicEditForm.welcome" type="textarea" :rows="4" placeholder="欢迎语" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="topicEditVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTopicEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="agentDrawerVisible" :title="`客服管理 - ${currentConfig?.app_name || ''} (${currentConfig?.app_id || ''})`" size="600px">
      <div class="mb-12px flex gap-8px flex-wrap">
        <el-input v-model="newAgent.uid" placeholder="客服UID" style="flex: 1; min-width: 120px" />
        <el-input v-model="newAgent.name" placeholder="客服名称" style="width: 100px" />
        <el-select v-model="newAgent.role" placeholder="角色" style="width: 120px">
          <el-option label="客服" value="agent" />
          <el-option label="管理员" value="manager" />
          <el-option label="账户管理员" value="usermanager" />
        </el-select>
        <el-input v-model="newAgent.position" placeholder="职位" style="width: 100px" />
        <el-button type="primary" @click="addAgent">添加</el-button>
      </div>
      <el-table v-loading="agentLoading" :data="agentList" :border="true" style="width: 100%" stripe>
        <el-table-column prop="uid" label="UID" min-width="100" show-overflow-tooltip />
        <el-table-column prop="name" label="名称" min-width="80" />
        <el-table-column prop="role" label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row.role)" size="small">{{ roleName(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="position" label="职位" width="80" />
        <el-table-column prop="is_work" label="工作状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_work === 1 ? 'success' : 'info'" size="small">{{ row.is_work === 1 ? '工作中' : '休息' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="账号状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '正常' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="removeAgent(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  hotlineConfigList, hotlineConfigStatistics, hotlineConfigCreate,
  hotlineConfigUpdate, hotlineConfigDelete, hotlineAgentList,
  hotlineAgentAdd, hotlineAgentDelete,
  hotlineTopicList, hotlineTopicCreate, hotlineTopicUpdate, hotlineTopicDelete,
} from '@/api/hotline';

const formatTs = (ts: any) => {
  if (!ts) return '';
  if (typeof ts === 'string' && ts.includes('-')) return ts;
  const d = new Date(Number(ts) * 1000);
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const roleName = (r: string) => {
  const map: Record<string, string> = { admin: '超级管理员', manager: '管理员', usermanager: '账户管理员', agent: '客服' };
  return map[r] || r || '客服';
};
const roleTagType = (r: string) => {
  const map: Record<string, string> = { admin: 'danger', manager: 'warning', usermanager: '', agent: 'success' };
  return map[r] || '';
};

const stats = reactive({ total_configs: 0, total_agents: 0, online_agents: 0, today_sessions: 0 });
const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const query = reactive({ page_index: 1, page_size: 15 });

const loadStats = () => {
  hotlineConfigStatistics().then((r: any) => { Object.assign(stats, r); }).catch(() => {});
};
const loadList = () => {
  loading.value = true;
  hotlineConfigList(query).then((r: any) => {
    tableData.value = r.data || [];
    total.value = r.total || 0;
  }).catch(() => {}).finally(() => { loading.value = false; });
};
const loadData = () => { loadStats(); loadList(); };

const cfgDialogVisible = ref(false);
const editingCfg = ref<any>(null);
const cfgForm = reactive({ app_id: '', app_name: '', uid: '', logo: '', color: '#409eff', chat_bg: '' });

const topicList = ref<any[]>([]);
const topicLoading = ref(false);
const newTopic = reactive({ title: '', welcome: '' });
const topicEditVisible = ref(false);
const topicEditId = ref(0);
const topicEditForm = reactive({ title: '', welcome: '' });

const loadTopics = () => {
  if (!editingCfg.value?.app_id) {
    topicList.value = [];
    return;
  }
  topicLoading.value = true;
  hotlineTopicList({ app_id: editingCfg.value.app_id })
    .then((r: any) => {
      topicList.value = Array.isArray(r) ? r : [];
    })
    .catch(() => {
      topicList.value = [];
    })
    .finally(() => {
      topicLoading.value = false;
    });
};

watch(cfgDialogVisible, (open) => {
  if (open && editingCfg.value) loadTopics();
});

const showConfigDialog = (row: any) => {
  editingCfg.value = row;
  if (row) {
    Object.assign(cfgForm, { app_id: row.app_id, app_name: row.app_name, uid: row.uid, logo: row.logo, color: row.color || '#409eff', chat_bg: row.chat_bg || '' });
  } else {
    Object.assign(cfgForm, { app_id: '', app_name: '', uid: '', logo: '', color: '#409eff', chat_bg: '' });
    topicList.value = [];
  }
  cfgDialogVisible.value = true;
  if (row) loadTopics();
};

const addTopic = () => {
  if (!editingCfg.value?.app_id) return;
  if (!newTopic.title.trim()) {
    ElMessage.warning('请输入话题标题');
    return;
  }
  if (!newTopic.welcome.trim()) {
    ElMessage.warning('请输入欢迎语');
    return;
  }
  hotlineTopicCreate({
    app_id: editingCfg.value.app_id,
    title: newTopic.title.trim(),
    welcome: newTopic.welcome.trim(),
  })
    .then(() => {
      ElMessage.success('已添加');
      Object.assign(newTopic, { title: '', welcome: '' });
      loadTopics();
    })
    .catch((e: any) => {
      ElMessage.error(e?.msg || e?.message || '添加失败');
    });
};

const openTopicEdit = (row: any) => {
  topicEditId.value = row.id;
  topicEditForm.title = row.title || '';
  topicEditForm.welcome = row.welcome || '';
  topicEditVisible.value = true;
};

const saveTopicEdit = () => {
  if (!editingCfg.value?.app_id) return;
  if (!topicEditForm.title.trim() || !topicEditForm.welcome.trim()) {
    ElMessage.warning('标题与欢迎语不能为空');
    return;
  }
  hotlineTopicUpdate(topicEditId.value, {
    app_id: editingCfg.value.app_id,
    title: topicEditForm.title.trim(),
    welcome: topicEditForm.welcome.trim(),
  })
    .then(() => {
      ElMessage.success('已保存');
      topicEditVisible.value = false;
      loadTopics();
    })
    .catch((e: any) => {
      ElMessage.error(e?.msg || e?.message || '保存失败');
    });
};

const removeTopic = (row: any) => {
  if (!editingCfg.value?.app_id) return;
  if (row.is_default === 1) return;
  ElMessageBox.confirm(`确定删除话题「${row.title}」吗？`, '确认删除', { type: 'warning' })
    .then(() => hotlineTopicDelete(row.id, { app_id: editingCfg.value.app_id }))
    .then(() => {
      ElMessage.success('已删除');
      loadTopics();
    })
    .catch((e: any) => {
      if (e !== 'cancel') ElMessage.error(e?.msg || e?.message || '删除失败');
    });
};

const saveConfig = () => {
  if (!cfgForm.app_name.trim()) { ElMessage.warning('请输入应用名称'); return; }
  if (!editingCfg.value && !cfgForm.app_id.trim()) { ElMessage.warning('请输入应用ID'); return; }
  const wasNew = !editingCfg.value;
  const fn = editingCfg.value
    ? hotlineConfigUpdate(editingCfg.value.id, cfgForm)
    : hotlineConfigCreate(cfgForm);
  fn.then(() => {
    ElMessage.success(wasNew ? '新增成功，可在下方维护话题' : '编辑成功');
    loadData();
    if (wasNew) {
      hotlineConfigList({ page_index: 1, page_size: 200 }).then((r: any) => {
        const rows = r.data || [];
        const row = rows.find((x: any) => x.app_id === cfgForm.app_id.trim());
        if (row) {
          editingCfg.value = row;
          loadTopics();
        } else {
          cfgDialogVisible.value = false;
        }
      }).catch(() => {
        cfgDialogVisible.value = false;
      });
    } else {
      cfgDialogVisible.value = false;
    }
  }).catch((e: any) => { ElMessage.error(e?.msg || '操作失败'); });
};

const onDeleteConfig = (row: any) => {
  ElMessageBox.confirm(`确定删除「${row.app_name}」(${row.app_id}) 及其所有客服吗？`, '确认删除', { type: 'warning' }).then(() => {
    hotlineConfigDelete(row.id).then(() => { ElMessage.success('删除成功'); loadData(); }).catch(() => { ElMessage.error('删除失败'); });
  }).catch(() => {});
};

const agentDrawerVisible = ref(false);
const currentConfig = ref<any>(null);
const agentList = ref<any[]>([]);
const agentLoading = ref(false);
const newAgent = reactive({ uid: '', name: '', role: 'agent', position: '' });

const showAgentPanel = (row: any) => {
  currentConfig.value = row;
  agentDrawerVisible.value = true;
  loadAgents();
};

const loadAgents = () => {
  if (!currentConfig.value) return;
  agentLoading.value = true;
  hotlineAgentList({ app_id: currentConfig.value.app_id }).then((r: any) => {
    agentList.value = Array.isArray(r) ? r : (r?.data || r?.list || []);
  }).catch(() => {}).finally(() => { agentLoading.value = false; });
};

const addAgent = () => {
  if (!newAgent.uid.trim()) { ElMessage.warning('请输入客服UID'); return; }
  hotlineAgentAdd({
    app_id: currentConfig.value.app_id,
    uid: newAgent.uid.trim(),
    name: newAgent.name.trim() || newAgent.uid.trim(),
    role: newAgent.role,
    position: newAgent.position.trim()
  }).then(() => {
    ElMessage.success('添加成功');
    Object.assign(newAgent, { uid: '', name: '', role: 'agent', position: '' });
    loadAgents();
    loadData();
  }).catch((e: any) => { ElMessage.error(e?.msg || '添加失败'); });
};

const removeAgent = (row: any) => {
  ElMessageBox.confirm(`确定移除客服「${row.name || row.uid}」吗？`, '确认移除', { type: 'warning' }).then(() => {
    hotlineAgentDelete(row.id).then(() => { ElMessage.success('移除成功'); loadAgents(); loadData(); }).catch(() => { ElMessage.error('移除失败'); });
  }).catch(() => {});
};

onMounted(() => { loadData(); });
</script>

<style lang="scss" scoped>
.hotline-cs-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.stat-item :deep(.el-card__body) {
  padding: 16px 20px;
}
.inner-card {
  border: 1px solid var(--el-card-border-color);
  border-radius: 4px;
}
.bd-title {
  border-bottom: 1px solid var(--el-card-border-color);
}
.cfg-dlg-scroll {
  max-height: min(72vh, 720px);
  overflow-y: auto;
  padding-right: 4px;
}
.topic-block {
  margin-bottom: 4px;
}
</style>
