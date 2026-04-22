<template>
  <bd-page class="flex-col">
    <div class="el-card border-none box-border mb-12px" style="flex-shrink: 0">
      <div class="h-50px pl-12px pr-12px box-border flex items-center bd-title">
        <p class="m-0 font-600">全局设置</p>
      </div>

      <div class="p-12px">
        <div class="flex items-center justify-between mb-12px">
          <div class="flex items-center">
            <span class="font-500 mr-8px">添加好友免验证</span>
            <span class="text-gray-400 text-12px">开启后，特权号发起好友申请将直接添加为好友，无需对方确认</span>
          </div>
          <el-switch
            v-model="global.friendApplyAutoAcceptOn"
            :loading="globalSaving"
            @change="onToggleFriendApplyAutoAccept"
          />
        </div>

        <div class="flex items-center justify-between mb-12px">
          <div class="flex items-center">
            <span class="font-500 mr-8px">仅特权用户可搜索添加好友</span>
            <span class="text-gray-400 text-12px">开启后，非特权用户无法搜索和添加好友</span>
          </div>
          <el-switch
            v-model="global.privilegeOnlyAddFriendOn"
            :loading="globalSaving"
            @change="onTogglePrivilegeOnlyAddFriend"
          />
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <span class="font-500 mr-8px">邀请码总开关（特权）</span>
            <span class="text-gray-400 text-12px">开启后，同时开启「仅特权用户可群管理、建群与邀请成员」和「注册邀请」；关闭后同步关闭</span>
          </div>
          <el-switch
            v-model="global.privilegeOnlyCreateInviteGroupOn"
            :loading="globalSaving"
            @change="onTogglePrivilegeOnlyCreateInviteGroup"
          />
        </div>

        <div class="flex items-center justify-between mt-12px">
          <div class="flex items-center">
            <span class="font-500 mr-8px">显示对方上次在线时间</span>
            <span class="text-gray-400 text-12px">关闭后，全平台普通用户将不再看到对方的上次在线时间，仅保留当前是否在线状态</span>
          </div>
          <el-switch
            v-model="global.showLastOfflineOn"
            :loading="globalSaving"
            @change="onToggleShowLastOffline"
          />
        </div>

        <div class="flex items-center justify-between mt-12px">
          <div class="flex items-center">
            <span class="font-500 mr-8px">显示对方分端在线信息</span>
            <span class="text-gray-400 text-12px">
              关闭后，全平台客户端不再展示对方「Web/手机/PC 等」在线来源，仅保留是否在线；接口对非本人返回的 device_flag 为占位值
            </span>
          </div>
          <el-switch
            v-model="global.showDeviceOnlineOn"
            :loading="globalSaving"
            @change="onToggleShowDeviceOnline"
          />
        </div>

      </div>
    </div>

    <div class="flex-1 el-card border-none flex-col box-border overflow-hidden">
      <div class="h-50px pl-12px pr-12px box-border flex items-center justify-between bd-title gap-12px">
        <div class="flex items-center gap-12px min-w-0 flex-1">
          <p class="m-0 font-600 flex-shrink-0">特权用户管理</p>
          <el-input
            v-model="listKeyword"
            class="w-380px max-w-full min-w-0"
            placeholder="搜索 UID、昵称、用户名、手机号"
            clearable
            @keyup.enter="onListSearch"
            @clear="onListSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <el-button type="primary" class="flex-shrink-0" @click="openAdd">添加特权用户</el-button>
      </div>

      <div class="flex-1 overflow-hidden p-12px">
        <el-table v-loading="loading" :data="list" border style="width: 100%; height: 100%">
          <el-table-column type="index" width="42" align="center" fixed="left">
            <template #header>
              <i class="i-bd-setting cursor-pointer" style="font-size: 16px" />
            </template>
          </el-table-column>

          <el-table-column prop="uid" label="UID" min-width="160" />
          <el-table-column prop="name" label="昵称" min-width="120" />
          <el-table-column prop="username" label="用户名" min-width="120" />
          <el-table-column prop="phone" label="手机号" min-width="130">
            <template #default="{ row }">
              {{ row.zone && row.phone ? `${row.zone} ${row.phone}` : '-' }}
            </template>
          </el-table-column>

          <el-table-column label="单聊双删" min-width="130">
            <template #default="{ row }">
              <el-switch
                :model-value="Number(row.mutual_delete_person_on) === 1"
                @change="(val) => toggleRowSwitch(row, 'mutual_delete_person_on', val)"
              />
              <span class="text-gray-400 text-12px ml-8px">关闭后该用户在单聊中不可使用特权双删</span>
            </template>
          </el-table-column>

          <el-table-column label="群聊双删" min-width="130">
            <template #default="{ row }">
              <el-switch
                :model-value="Number(row.mutual_delete_group_on) === 1"
                @change="(val) => toggleRowSwitch(row, 'mutual_delete_group_on', val)"
              />
              <span class="text-gray-400 text-12px ml-8px">关闭后该用户在群聊中不可使用特权双删</span>
            </template>
          </el-table-column>

          <el-table-column prop="created_at" label="添加时间" min-width="150" />

          <el-table-column label="操作" align="center" fixed="right" width="120">
            <template #default="{ row }">
              <el-button type="danger" size="small" @click="confirmDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="bd-card-footer pl-12px pr-12px mb-12px flex items-center justify-between">
        <div />
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.page_size"
          :page-sizes="[15, 20, 30, 50, 100]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <el-dialog v-model="addVisible" title="添加特权用户" width="600px" :close-on-click-modal="false">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="搜索用户">
          <el-input
            v-model="keyword"
            placeholder="请输入用户UID/手机号/用户名"
            clearable
            @keyup.enter="searchUser"
          >
            <template #append>
              <el-button :loading="searching" @click="searchUser">搜索</el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item v-if="pickedUser" label="选择用户">
          <div class="flex items-center">
            <el-avatar :size="50" :src="pickedUser.avatar || '/assets/default_avatar.png'" />
            <div class="ml-12px">
              <div class="font-600">{{ pickedUser.name }}</div>
              <div class="text-gray-500 text-sm">UID: {{ pickedUser.uid }}</div>
              <div v-if="pickedUser.phone" class="text-gray-500 text-sm">
                手机号: {{ pickedUser.zone }} {{ pickedUser.phone }}
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item v-if="pickedUser" label="群管理开关">
          <el-switch v-model="addForm.group_manage_on" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item v-if="pickedUser" label="全员拉群开关">
          <el-switch v-model="addForm.all_member_invite_on" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item v-if="pickedUser" label="单聊双删">
          <el-switch v-model="addForm.mutual_delete_person_on" :active-value="1" :inactive-value="0" />
          <span class="text-gray-400 text-12px ml-8px">关闭后该用户在单聊中不可使用特权双删</span>
        </el-form-item>
        <el-form-item v-if="pickedUser" label="群聊双删">
          <el-switch v-model="addForm.mutual_delete_group_on" :active-value="1" :inactive-value="0" />
          <span class="text-gray-400 text-12px ml-8px">关闭后该用户在群聊中不可使用特权双删</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addVisible = false">取消</el-button>
          <el-button type="primary" :disabled="!pickedUser" :loading="adding" @click="submitAdd">
            确定添加
          </el-button>
        </span>
      </template>
    </el-dialog>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 特权用户管理
  isAffix: false
</route>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import {
  privilegeGlobalGet,
  privilegeGlobalPut,
  privilegeUserAddPost,
  privilegeUserDelete,
  privilegeUserListGet,
  privilegeUserSearchGet,
  privilegeUserSwitchPut
} from '@/api/user';
import { getAppconfigGet, updateAppconfigPost } from '@/api/setting';
import { pickArray, pickObject, pickTotal } from '@/utils/api-normalize';

type Row = {
  uid: string;
  name?: string;
  username?: string;
  zone?: string;
  phone?: string;
  avatar?: string;
  created_at?: string;
  group_manage_on: number;
  all_member_invite_on: number;
  mutual_delete_person_on: number;
  mutual_delete_group_on: number;
};

const loading = ref(false);
const list = ref<Row[]>([]);
const total = ref(0);
const query = reactive({ page_size: 15, page: 1 });
const listKeyword = ref('');

const global = reactive({
  privilegeOnlyAddFriendOn: false,
  friendApplyAutoAcceptOn: false,
  privilegeOnlyCreateInviteGroupOn: false,
  showLastOfflineOn: true,
  showDeviceOnlineOn: true
});
const globalSaving = ref(false);

const addVisible = ref(false);
const keyword = ref('');
const searching = ref(false);
const adding = ref(false);
const pickedUser = ref<any>(null);

const addForm = reactive({
  uid: '',
  group_manage_on: 1,
  all_member_invite_on: 0,
  mutual_delete_person_on: 1,
  mutual_delete_group_on: 1
});

async function fetchList() {
  loading.value = true;
  try {
    const res: any = await privilegeUserListGet({
      page: query.page,
      page_size: query.page_size,
      keyword: listKeyword.value.trim()
    });
    list.value = pickArray(res);
    total.value = pickTotal(res);
  } catch (e: any) {
    ElMessage.error(e?.msg || '查询失败');
  } finally {
    loading.value = false;
  }
}

async function fetchGlobal() {
  try {
    const res: any = await privilegeGlobalGet();
    const source = pickObject(res) || {};
    global.privilegeOnlyAddFriendOn = Number(source?.privilege_only_add_friend_on ?? source?.privilegeOnlyAddFriendOn ?? 0) === 1;
    global.friendApplyAutoAcceptOn = Number(source?.friend_apply_auto_accept_on ?? source?.friendApplyAutoAcceptOn ?? 0) === 1;
    global.privilegeOnlyCreateInviteGroupOn =
      Number(source?.privilege_only_create_invite_group_on ?? source?.privilegeOnlyCreateInviteGroupOn ?? 0) === 1;
    global.showLastOfflineOn = Number(source?.show_last_offline_on ?? source?.showLastOfflineOn ?? 1) === 1;
    global.showDeviceOnlineOn = Number(source?.show_device_online_on ?? source?.showDeviceOnlineOn ?? 1) === 1;
  } catch {
    global.privilegeOnlyAddFriendOn = false;
    global.friendApplyAutoAcceptOn = false;
    global.privilegeOnlyCreateInviteGroupOn = false;
    global.showLastOfflineOn = true;
    global.showDeviceOnlineOn = true;
  }
}

function onListSearch() {
  query.page = 1;
  fetchList();
}

function openAdd() {
  addVisible.value = true;
  keyword.value = '';
  pickedUser.value = null;
  addForm.uid = '';
  addForm.group_manage_on = 1;
  addForm.all_member_invite_on = 0;
  addForm.mutual_delete_person_on = 1;
  addForm.mutual_delete_group_on = 1;
}

async function searchUser() {
  if (!keyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词');
    return;
  }
  searching.value = true;
  try {
    const res: any = await privilegeUserSearchGet({ keyword: keyword.value.trim() });
    const user = pickObject(res);
    if (!user?.uid) {
      pickedUser.value = null;
      ElMessage.warning('未找到用户');
      return;
    }
    pickedUser.value = user;
    addForm.uid = user.uid;
  } catch (e: any) {
    pickedUser.value = null;
    ElMessage.error(e?.msg || '搜索失败');
  } finally {
    searching.value = false;
  }
}

async function submitAdd() {
  if (!pickedUser.value || !addForm.uid) {
    ElMessage.warning('请先搜索并选择用户');
    return;
  }
  adding.value = true;
  try {
    await privilegeUserAddPost({ ...addForm, uid: addForm.uid });
    ElMessage.success('添加成功');
    addVisible.value = false;
    fetchList();
  } catch (e: any) {
    ElMessage.error(e?.msg || '添加失败');
  } finally {
    adding.value = false;
  }
}

async function confirmDelete(row: Row) {
  await ElMessageBox.confirm(`确定要删除特权用户 ${row.name || row.uid} 吗？`, '删除特权用户', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    closeOnClickModal: false,
    type: 'warning'
  });
  await privilegeUserDelete({ uid: row.uid });
  ElMessage.success('删除成功');
  fetchList();
}

async function toggleRowSwitch(row: Row, key: keyof Row, val: boolean) {
  const next = val ? 1 : 0;
  const prev = Number(row[key]) === 1 ? 1 : 0;
  (row as any)[key] = next;
  try {
    await privilegeUserSwitchPut({ uid: row.uid, field: key, value: next });
    ElMessage.success('更新成功');
  } catch (err: any) {
    (row as any)[key] = prev;
    ElMessage.error(err?.msg || '更新失败');
  }
}

async function onToggleFriendApplyAutoAccept(v: boolean) {
  globalSaving.value = true;
  try {
    await privilegeGlobalPut({ friend_apply_auto_accept_on: v ? 1 : 0 });
    ElMessage.success(v ? '已开启：添加好友无需验证' : '已关闭：添加好友需要对方确认');
  } catch (e: any) {
    global.friendApplyAutoAcceptOn = !v;
    ElMessage.error(e?.msg || '更新失败');
  } finally {
    globalSaving.value = false;
  }
}

async function onTogglePrivilegeOnlyAddFriend(v: boolean) {
  globalSaving.value = true;
  try {
    await privilegeGlobalPut({ privilege_only_add_friend_on: v ? 1 : 0 });
    ElMessage.success(v ? '已开启：仅特权用户可搜索添加好友' : '已关闭：所有用户均可搜索添加好友');
  } catch (e: any) {
    global.privilegeOnlyAddFriendOn = !v;
    ElMessage.error(e?.msg || '更新失败');
  } finally {
    globalSaving.value = false;
  }
}

async function onTogglePrivilegeOnlyCreateInviteGroup(v: boolean) {
  globalSaving.value = true;
  try {
    await privilegeGlobalPut({ privilege_only_create_invite_group_on: v ? 1 : 0 });
    const appconfigRes: any = await getAppconfigGet();
    const payload = {
      ...(pickObject(appconfigRes) || appconfigRes || {}),
      invite_code_system_on: v ? 1 : 0
    };
    await updateAppconfigPost(payload);
    ElMessage.success(v ? '已开启：邀请码总开关（特权）' : '已关闭：邀请码总开关（特权）');
  } catch (e: any) {
    global.privilegeOnlyCreateInviteGroupOn = !v;
    ElMessage.error(e?.msg || '更新失败');
  } finally {
    globalSaving.value = false;
  }
}

async function onToggleShowLastOffline(v: boolean) {
  globalSaving.value = true;
  try {
    await privilegeGlobalPut({ show_last_offline_on: v ? 1 : 0 });
    ElMessage.success(v ? '已开启：全平台可显示对方上次在线时间' : '已关闭：全平台隐藏对方上次在线时间');
  } catch (e: any) {
    global.showLastOfflineOn = !v;
    ElMessage.error(e?.msg || '更新失败');
  } finally {
    globalSaving.value = false;
  }
}

async function onToggleShowDeviceOnline(v: boolean) {
  globalSaving.value = true;
  try {
    await privilegeGlobalPut({ show_device_online_on: v ? 1 : 0 });
    ElMessage.success(v ? '已开启：全平台可显示对方分端在线信息' : '已关闭：全平台隐藏对方分端在线信息');
  } catch (e: any) {
    global.showDeviceOnlineOn = !v;
    ElMessage.error(e?.msg || '更新失败');
  } finally {
    globalSaving.value = false;
  }
}

fetchList();
fetchGlobal();
</script>
