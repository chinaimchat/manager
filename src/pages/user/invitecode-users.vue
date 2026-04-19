<template>
  <bd-page class="flex-col">
    <div class="flex-1 el-card border-none flex-col box-border overflow-hidden">
      <div class="h-50px pl-12px pr-12px box-border flex items-center justify-between bd-title">
        <div class="bd-title-left">
          <p class="m-0 font-600">邀请码使用记录</p>
        </div>
        <el-button @click="router.back()">返回</el-button>
      </div>
      <div class="p-12px text-14px">
        <span class="font-500">邀请码：</span>
        <span class="text-primary">{{ code }}</span>
      </div>
      <div class="flex-1 overflow-hidden p-12px pt-0">
        <el-table v-loading="loading" :data="usersList" border style="width: 100%; height: 100%">
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
      </div>
    </div>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 邀请码使用记录
  isAffix: false
</route>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import { inviteCodeUsers } from '@/api/invite';

const route = useRoute();
const router = useRouter();
const code = computed(() => String(route.query.code || ''));
const loading = ref(false);
const usersList = ref<any[]>([]);

const formatTs = (ts: number | string) => {
  if (!ts) return '';
  if (typeof ts === 'string') return dayjs(ts).format('YYYY-MM-DD HH:mm:ss');
  return dayjs.unix(ts).format('YYYY-MM-DD HH:mm:ss');
};

const getUsers = () => {
  if (!code.value) return;
  loading.value = true;
  inviteCodeUsers(code.value)
    .then((r: any) => {
      if (Array.isArray(r)) usersList.value = r;
      else if (Array.isArray(r?.data)) usersList.value = r.data;
      else if (Array.isArray(r?.list)) usersList.value = r.list;
      else usersList.value = [];
      if (usersList.value.length === 0) ElMessage.info('该邀请码暂无使用者');
    })
    .catch((e: any) => {
      ElMessage.error(e?.msg || '获取使用记录失败');
    })
    .finally(() => {
      loading.value = false;
    });
};

onMounted(() => {
  getUsers();
});
</script>
