<template>
  <bd-page class="flex-col">
    <div class="flex-1 el-card border-none flex-col box-border overflow-hidden invitecode-page">
      <div class="pl-12px pr-12px box-border bd-title">
        <div class="h-44px flex items-center gap-24px text-14px border-b border-solid border-[var(--el-card-border-color)]">
          <div class="flex items-center gap-8px">
            <span class="text-#606266">邀请码系统：</span>
            <span class="text-#909399">关闭</span>
            <el-switch v-model="inviteSystemOn" :active-value="1" :inactive-value="0" @change="saveSetting('invite_code_system_on', $event)" />
            <span class="text-#e86f4a">启用</span>
          </div>
        </div>
        <div class="h-50px flex items-center justify-between">
          <p class="m-0 font-600">邀请码管理</p>
          <el-form inline class="invite-toolbar-form">
            <el-form-item class="mb-0 !mr-12px">
              <el-input v-model="query.keyword" placeholder="搜索邀请码/名称" clearable class="invite-search-input" />
            </el-form-item>
            <el-form-item class="mb-0 !mr-12px">
              <el-button type="primary" class="invite-main-btn" @click="getList">搜索</el-button>
            </el-form-item>
            <el-form-item class="mb-0 !mr-0">
              <el-button type="primary" class="invite-main-btn" @click="openDialog('add')">添加邀请码</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div class="flex-1 overflow-hidden p-12px">
        <el-table v-loading="loading" :data="tableData" :border="true" style="width: 100%; height: 100%" stripe class="invite-table">
          <el-table-column type="index" :width="42" align="center" fixed="left" />
          <el-table-column prop="code" label="邀请码" width="120" />
          <el-table-column prop="name" label="名称/备注" min-width="170" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small" effect="plain" class="invite-status-tag">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="usage_count" label="使用次数" width="86" align="center" />
          <el-table-column label="自动加群" width="96" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.auto_group_count > 0" type="success" size="small" effect="plain" class="invite-count-tag">{{ `${row.auto_group_count}个群` }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="自动加好友" width="102" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.auto_friend_count > 0" type="success" size="small" effect="plain" class="invite-count-tag">{{ `${row.auto_friend_count}个好友` }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="178">
            <template #default="{ row }">{{ formatTs(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="190" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" class="invite-op-link" @click="openDialog('edit', row)">编辑</el-button>
              <el-button type="primary" link size="small" class="invite-op-link" @click="showUsers(row)">使用记录</el-button>
              <el-button type="primary" link size="small" class="invite-op-link" @click="onDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="bd-card-footer pl-12px pr-12px mb-12px flex items-center justify-between">
        <div class="text-12px text-#909399">共 {{ total }} 条</div>
        <el-pagination
          v-model:current-page="query.page_index"
          v-model:page-size="query.page_size"
          :page-sizes="[15, 20, 30, 50, 100]"
          :background="true"
          layout="sizes, prev, pager, next, jumper"
          :total="total"
          class="invite-pagination"
          @size-change="onSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '添加邀请码' : '编辑邀请码'" width="920px" @close="onDialogClose">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <el-form-item label="邀请码">
          <el-input v-model="form.code" :disabled="dialogMode === 'edit'" maxlength="20" show-word-limit style="width: 360px" />
        </el-form-item>
        <el-form-item label="名称/备注" prop="name">
          <el-input v-model="form.name" maxlength="100" show-word-limit style="width: 360px" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-divider content-position="left">自动加群配置</el-divider>
        <el-form-item label="选择群组">
          <el-select
            v-model="form.groups"
            multiple
            filterable
            remote
            reserve-keyword
            placeholder="请输入群ID/群名称搜索并选择"
            style="width: 100%"
            :loading="groupsLoading"
            :remote-method="queryGroupOptions"
            @visible-change="onGroupDropdownVisible"
          >
            <el-option v-for="item in groupOptions" :key="item.group_no" :label="`${item.name} (${item.group_no})`" :value="item.group_no" />
          </el-select>
        </el-form-item>
        <el-divider content-position="left">自动加好友配置</el-divider>
        <el-form-item label="好友列表">
          <div class="w-full">
            <div class="flex items-center gap-8px mb-8px">
              <el-autocomplete
                v-model="friendKeyword"
                :fetch-suggestions="queryFriendSuggestions"
                placeholder="输入手机/昵称/用户名/UID搜索并选择"
                style="width: 52%"
                clearable
                @select="onSelectFriendSuggestion"
              />
              <el-button type="danger" plain size="small" @click="addFriendByKeyword">新增</el-button>
            </div>
            <div v-for="(item, idx) in form.friends" :key="item.local_id" class="flex items-center gap-8px mb-8px">
              <el-select
                v-model="item.friend_uid"
                filterable
                remote
                reserve-keyword
                placeholder="输入手机/用户名/UID搜索并选择"
                style="width: 38%"
                :loading="friendsLoading"
                :remote-method="queryFriendOptions"
                @visible-change="onFriendDropdownVisible"
              >
                <el-option v-for="u in friendOptions" :key="u.uid" :label="`${u.name || u.uid} (${u.uid})`" :value="u.uid" />
              </el-select>
              <el-input v-model="item.welcome_message" type="textarea" :rows="2" placeholder="好友欢迎词（可选）" style="width: 54%" />
              <el-button type="danger" link @click="removeFriend(idx)">删除</el-button>
            </div>
            <el-button class="w-full !border-#f3d8c5 !text-#d96f52 !bg-#fcf6f1" @click="addFriend">+ 添加好友</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="usersDialogVisible" title="使用记录" width="860px" :close-on-click-modal="false">
      <div class="mb-12px text-14px">
        <span class="font-500">邀请码：</span>
        <span class="text-primary">{{ currentCode }}</span>
      </div>
      <el-table v-loading="usersLoading" :data="usersList" border style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="昵称" min-width="120">
          <template #default="{ row }">{{ row.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="uid" label="UID" min-width="200" />
        <el-table-column prop="username" label="用户名" min-width="120">
          <template #default="{ row }">{{ row.username || '-' }}</template>
        </el-table-column>
        <el-table-column label="手机号" min-width="160">
          <template #default="{ row }">{{ row.zone && row.phone ? `${row.zone}${row.phone}` : '-' }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="使用时间" width="180">
          <template #default="{ row }">{{ row.created_at ? formatTs(row.created_at) : '-' }}</template>
        </el-table-column>
      </el-table>
      <div class="mt-12px flex justify-end">
        <el-pagination
          v-model:current-page="usageQuery.page_index"
          v-model:page-size="usageQuery.page_size"
          :page-sizes="[10, 20, 50]"
          :background="true"
          layout="total, sizes, prev, pager, next"
          :total="usageTotal"
          @size-change="fetchUsage"
          @current-change="fetchUsage"
        />
      </div>
      <template #footer>
        <el-button @click="usersDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 邀请码管理
  isAffix: false
</route>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import {
  inviteCodesGet, inviteCodeCreate, inviteCodeDetail, inviteCodeUpdate,
  inviteCodeDeleteByCode, inviteCodeToggleStatus, inviteCodeUsers
} from '@/api/invite';
import { getAppconfigGet, updateAppconfigPost } from '@/api/setting';
import { groupListGet } from '@/api/group';
import { userListGet } from '@/api/user';

const formatTs = (ts: number | string) => {
  if (!ts) return '';
  if (typeof ts === 'string') return dayjs(ts).format('YYYY-MM-DD HH:mm:ss');
  return dayjs.unix(ts).format('YYYY-MM-DD HH:mm:ss');
};

const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const query = reactive({ keyword: '', page_size: 15, page_index: 1 });
const inviteSystemOn = ref(1);
const appConfig = ref<any>({});

const normalizeRows = (rows: any[]) => {
  return (rows || []).map((item: any) => ({
    ...item,
    code: item.code || item.invite_code || '',
    name: item.name || item.remark || '',
    usage_count: Number(item.usage_count ?? item.used_count ?? 0),
    auto_group_count: Array.isArray(item.groups) ? item.groups.length : 0,
    auto_friend_count: Array.isArray(item.friends) ? item.friends.length : 0
  }));
};

const getList = () => {
  loading.value = true;
  const params: any = { page_index: query.page_index, page_size: query.page_size };
  if (query.keyword) params.keyword = query.keyword;
  inviteCodesGet(params).then((r: any) => {
    const list = Array.isArray(r?.list) ? r.list : (r?.data || []);
    tableData.value = normalizeRows(list);
    total.value = Number(r?.total || tableData.value.length || 0);
  }).catch(() => {}).finally(() => { loading.value = false; });
};

const onSizeChange = (val: number) => { query.page_size = val; query.page_index = 1; getList(); };
const onPageChange = (val: number) => { query.page_index = val; getList(); };

const saveSetting = (field: 'invite_code_system_on', value: number) => {
  const payload = { ...appConfig.value, [field]: value };
  updateAppconfigPost(payload).then(() => {
    appConfig.value = payload;
    ElMessage.success('设置已更新');
  }).catch((e: any) => {
    ElMessage.error(e?.msg || '更新失败');
  });
};

const initSetting = () => {
  getAppconfigGet().then((res: any) => {
    appConfig.value = res || {};
    inviteSystemOn.value = Number(res?.invite_code_system_on ?? 1);
  }).catch(() => {});
};

// Dialog
const dialogVisible = ref(false);
const dialogMode = ref<'add' | 'edit'>('add');
const formRef = ref();
const friendLocalId = ref(1);
const form = reactive({
  id: 0,
  code: '',
  name: '',
  status: 1,
  groups: [] as string[],
  friends: [] as { local_id: number; friend_uid: string; welcome_message: string }[]
});
const formRules = {
  name: [{ required: false, message: '请输入名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const groupsLoading = ref(false);
const groupOptions = ref<any[]>([]);
const friendsLoading = ref(false);
const friendOptions = ref<any[]>([]);

const loadGroupOptions = (keyword = '') => {
  groupsLoading.value = true;
  groupListGet({ page_index: 1, page_size: 50, keyword: keyword.trim() })
    .then((r: any) => {
      const list = r?.list || r?.data || [];
      groupOptions.value = (list || []).map((g: any) => ({
        group_no: String(g.group_no || g.groupNo || ''),
        name: String(g.name || g.group_name || g.group_no || '')
      })).filter((g: any) => g.group_no);
    })
    .finally(() => { groupsLoading.value = false; });
};
const queryGroupOptions = (keyword: string) => {
  loadGroupOptions(keyword || '');
};
const onGroupDropdownVisible = (visible: boolean) => {
  if (visible && groupOptions.value.length === 0) loadGroupOptions('');
};
const loadFriendOptions = (keyword = '') => {
  friendsLoading.value = true;
  userListGet({ page_index: 1, page_size: 50, keyword: keyword.trim() })
    .then((r: any) => {
      const list = r?.list || r?.data || [];
      friendOptions.value = (list || []).map((u: any) => ({
        uid: String(u.uid || ''),
        name: String(u.name || u.username || u.uid || ''),
        username: String(u.username || ''),
        zone: String(u.zone || u.phone_zone || ''),
        phone: String(u.phone || u.mobile || '')
      })).filter((u: any) => u.uid);
    })
    .finally(() => { friendsLoading.value = false; });
};
const queryFriendOptions = (keyword: string) => {
  loadFriendOptions(keyword || '');
};
const onFriendDropdownVisible = (visible: boolean) => {
  if (visible && friendOptions.value.length === 0) loadFriendOptions('');
};
const ensureFriendOptionsByUIDs = async (uids: string[]) => {
  const missing = (uids || [])
    .map(uid => String(uid || '').trim())
    .filter(uid => uid && !(friendOptions.value || []).some((x: any) => String(x.uid || '') === uid));
  if (missing.length === 0) return;
  const fetched: any[] = [];
  await Promise.all(missing.map(async (uid) => {
    try {
      const r: any = await userListGet({ page_index: 1, page_size: 20, keyword: uid });
      const list = r?.list || r?.data || [];
      const exact = (list || []).find((u: any) => String(u.uid || '') === uid);
      if (exact) {
        fetched.push({
          uid: String(exact.uid || ''),
          name: String(exact.name || exact.username || exact.uid || ''),
          username: String(exact.username || ''),
          zone: String(exact.zone || exact.phone_zone || ''),
          phone: String(exact.phone || exact.mobile || '')
        });
      } else {
        fetched.push({ uid, name: uid, username: '', zone: '', phone: '' });
      }
    } catch {
      fetched.push({ uid, name: uid, username: '', zone: '', phone: '' });
    }
  }));
  const merged = [...(friendOptions.value || []), ...fetched];
  const seen = new Set<string>();
  friendOptions.value = merged.filter((u: any) => {
    const uid = String(u.uid || '');
    if (!uid || seen.has(uid)) return false;
    seen.add(uid);
    return true;
  });
};

const friendKeyword = ref('');
const selectedFriendUid = ref('');
const queryFriendSuggestions = async (queryString: string, cb: (list: any[]) => void) => {
  const keyword = (queryString || '').trim();
  const usedUidSet = new Set(form.friends.map(i => i.friend_uid).filter(Boolean));
  try {
    const r: any = await userListGet({ page_index: 1, page_size: 20, keyword });
    const candidates = (r?.list || r?.data || [])
      .map((u: any) => ({
        uid: String(u.uid || ''),
        name: String(u.name || u.username || u.uid || ''),
        username: String(u.username || ''),
        zone: String(u.zone || u.phone_zone || ''),
        phone: String(u.phone || u.mobile || '')
      }))
      .filter((u: any) => u.uid && !usedUidSet.has(String(u.uid || '')));
    friendOptions.value = candidates;
    cb(candidates.map((u: any) => ({
      value: `${u.name || u.uid} (${u.uid})`,
      uid: String(u.uid || '')
    })));
  } catch {
    cb([]);
  }
};
const onSelectFriendSuggestion = (item: any) => {
  selectedFriendUid.value = String(item?.uid || '');
  // 对齐参考站交互：选中候选即加入，避免“选了但未点新增”导致未保存。
  addFriendByKeyword();
};
const addFriend = () => {
  form.friends.push({ local_id: ++friendLocalId.value, friend_uid: '', welcome_message: '' });
};
const addFriendByKeyword = () => {
  const keyword = (friendKeyword.value || '').trim();
  if (!keyword && !selectedFriendUid.value) return;
  let uid = selectedFriendUid.value;
  if (!uid) {
    const lower = keyword.toLowerCase();
    const matched = (friendOptions.value || []).find((u: any) => {
      const vUid = String(u.uid || '');
      const name = String(u.name || '').toLowerCase();
      const username = String(u.username || '').toLowerCase();
      const phone = `${u.zone || ''}${u.phone || ''}`.toLowerCase();
      return vUid.toLowerCase() === lower || name === lower || username === lower || phone === lower;
    });
    uid = matched ? String(matched.uid || '') : '';
  }
  if (!uid) {
    ElMessage.warning('请先从下拉候选中选择好友');
    return;
  }
  if (form.friends.some(i => i.friend_uid === uid)) {
    ElMessage.info('该好友已添加');
  } else {
    form.friends.push({ local_id: ++friendLocalId.value, friend_uid: uid, welcome_message: '' });
  }
  friendKeyword.value = '';
  selectedFriendUid.value = '';
};

const removeFriend = (idx: number) => {
  form.friends.splice(idx, 1);
};
const resetForm = () => {
  form.id = 0;
  form.code = '';
  form.name = '';
  form.status = 1;
  form.groups = [];
  form.friends = [];
  friendKeyword.value = '';
  selectedFriendUid.value = '';
};

const openDialog = async (mode: 'add' | 'edit', row?: any) => {
  dialogMode.value = mode;
  resetForm();
  if (mode === 'edit' && row) {
    form.id = Number(row.id || 0);
    try {
      const detail: any = await inviteCodeDetail(String(row.id || row.code || ''));
      const d = detail?.data || detail || {};
      form.id = Number(d.id || row.id || 0);
      form.code = String(d.code || row.code || row.invite_code || '');
      form.name = String(d.name || row.name || '');
      form.status = Number(d.status ?? row.status ?? 1);
      form.groups = Array.isArray(d.groups) ? d.groups.map((g: any) => String(g.group_no || g)).filter(Boolean) : [];
      form.friends = Array.isArray(d.friends)
        ? d.friends.map((f: any) => ({ local_id: ++friendLocalId.value, friend_uid: String(f.friend_uid || ''), welcome_message: String(f.welcome_message || '') }))
        : [];
      await ensureFriendOptionsByUIDs(form.friends.map(i => i.friend_uid));
    } catch {
      ElMessage.error('加载邀请码详情失败');
      return;
    }
  }
  dialogVisible.value = true;
};

const onDialogClose = () => {
  formRef.value?.resetFields();
  resetForm();
};

const onSubmit = () => {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) return;
    const code = String(form.code || '').trim();
    const basePayload: any = {
      id: form.id || undefined,
      name: form.name,
      remark: form.name,
      status: form.status,
      groups: form.groups,
      friends: form.friends
        .filter(i => i.friend_uid)
        .map(i => ({ friend_uid: i.friend_uid, welcome_message: i.welcome_message || '' }))
    };
    if (dialogMode.value === 'add') {
      // 新增时允许留空，留空则由后端自动生成邀请码。
      if (code) {
        basePayload.code = code;
        basePayload.invite_code = code;
      }
      inviteCodeCreate(basePayload).then(() => {
        ElMessage.success('添加成功');
        dialogVisible.value = false;
        getList();
      }).catch((e: any) => { ElMessage.error(e?.msg || '添加失败'); });
    } else {
      // 编辑时强制不传 code，保证邀请码不可修改。
      delete basePayload.code;
      delete basePayload.invite_code;
      inviteCodeUpdate(basePayload).then(() => {
        ElMessage.success('更新成功');
        dialogVisible.value = false;
        getList();
      }).catch((e: any) => { ElMessage.error(e?.msg || '更新失败'); });
    }
  });
};

const onToggleStatus = (row: any) => {
  const newStatus = row.status === 1 ? 0 : 1;
  const label = newStatus === 1 ? '启用' : '禁用';
  ElMessageBox.confirm(`确定要${label}邀请码 "${row.code}" 吗？`, '操作提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    inviteCodeToggleStatus(row.id || row.code, newStatus).then(() => {
      ElMessage.success(`${label}成功`);
      getList();
    }).catch((e: any) => { ElMessage.error(e?.msg || `${label}失败`); });
  }).catch(() => {});
};

const onDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除邀请码 "${row.code}" 吗？`, '操作提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    inviteCodeDeleteByCode(row.id || row.code).then(() => {
      ElMessage.success('删除成功');
      getList();
    }).catch((e: any) => { ElMessage.error(e?.msg || '删除失败'); });
  }).catch(() => {});
};

// Users dialog
const usersDialogVisible = ref(false);
const usersLoading = ref(false);
const usersList = ref<any[]>([]);
const currentCode = ref('');

const usageQuery = reactive({ page_index: 1, page_size: 10 });
const usageTotal = ref(0);
const normalizeUsageRows = (rows: any[]) => {
  return (rows || []).map((item: any) => ({
    ...item,
    uid: item.uid || item.friend_uid || item.user_uid || '',
    name: item.name || item.nickname || item.user_name || '',
    username: item.username || item.user_name || '',
    zone: item.zone || item.phone_zone || '',
    phone: item.phone || item.mobile || '',
    created_at: item.created_at || item.used_at || item.use_at || item.updated_at || ''
  }));
};
const showUsers = (row: any) => {
  currentCode.value = row.code;
  currentUsageId.value = Number(row.id || 0);
  usageQuery.page_index = 1;
  usersDialogVisible.value = true;
  fetchUsage();
};
const currentUsageId = ref(0);
const fetchUsage = () => {
  usersLoading.value = true;
  usersList.value = [];
  inviteCodeUsers(String(currentUsageId.value || currentCode.value), { ...usageQuery }).then((r: any) => {
    let list: any[] = [];
    if (Array.isArray(r)) list = r;
    else if (Array.isArray(r?.list)) list = r.list;
    else if (Array.isArray(r?.data)) list = r.data;
    else if (Array.isArray(r?.rows)) list = r.rows;
    usersList.value = normalizeUsageRows(list);
    const totals = Number(r?.total ?? r?.count ?? r?.data_total ?? usersList.value.length ?? 0);
    usageTotal.value = totals;
    if (usersList.value.length === 0) ElMessage.info('该邀请码暂无使用者');
  }).catch((e: any) => {
    ElMessage.error(e?.msg || e?.message || '获取使用记录失败');
  }).finally(() => {
    usersLoading.value = false;
  });
};

onMounted(() => {
  initSetting();
  loadGroupOptions();
  loadFriendOptions();
  getList();
});
</script>

<style scoped>
.invitecode-page :deep(.el-switch) {
  --el-switch-on-color: #f08a5d;
  --el-switch-off-color: #dcdfe6;
}

.invite-toolbar-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.invite-search-input {
  width: 220px;
}

.invite-main-btn {
  height: 30px;
  padding: 0 14px;
  border-color: #f08a5d;
  background-color: #f08a5d;
}

.invite-main-btn:hover,
.invite-main-btn:focus {
  border-color: #f29a72;
  background-color: #f29a72;
}

.invite-table :deep(.el-table__header th) {
  height: 40px;
  color: #606266;
  background: #f7f8fa;
}

.invite-table :deep(.el-table__body td) {
  height: 42px;
  color: #606266;
}

.invite-status-tag,
.invite-count-tag {
  border-radius: 2px;
}

.invite-op-link {
  color: #ea7a53;
}

.invite-op-link:hover,
.invite-op-link:focus {
  color: #f08a5d;
}

.invite-pagination :deep(.el-pager li.is-active) {
  border-color: #f08a5d;
  background: #f08a5d;
}
</style>
