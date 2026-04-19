<template>
  <div class="flex-col">
    <div class="flex-1 el-card border-none flex-col box-border overflow-hidden">
      <div class="h-50px pl-12px pr-12px box-border flex items-center justify-between bd-title">
        <div class="bd-title-left">
          <p class="m-0 font-600">登录IP历史</p>
        </div>

        <div class="flex items-center h-50px">
          <el-form inline>
            <el-form-item class="mb-0 !mr-16px">
              <el-input v-model="query.uid" placeholder="账号/用户名搜索" clearable style="width: 180px" />
            </el-form-item>
            <el-form-item class="mb-0 !mr-16px">
              <el-input v-model="query.login_ip" placeholder="IP地址搜索" clearable style="width: 160px" />
            </el-form-item>
            <el-form-item class="mb-0 !mr-0">
              <el-button type="primary" @click="onSearch">查询</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <el-table v-loading="loading" :data="list" style="width: 100%">
        <el-table-column prop="name" label="昵称" min-width="120" />
        <el-table-column prop="username" label="账号" min-width="140" />
        <el-table-column prop="uid" label="UID" min-width="220" show-overflow-tooltip />
        <el-table-column prop="login_ip" label="登录IP" min-width="140" />
        <el-table-column prop="login_region" label="归属地" min-width="160" />
        <el-table-column prop="created_at" label="登录时间" min-width="160" />
      </el-table>

      <div class="flex justify-end mt-12px pr-12px pb-12px">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.page_size"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  title: 登录IP历史
  isAffix: false
</route>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { loginIpHistoryGet } from '@/api/user';
import { pickArray, pickTotal } from '@/utils/api-normalize';

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);

const query = reactive({
  uid: '',
  login_ip: '',
  page: 1,
  page_size: 20
});

async function fetchList() {
  loading.value = true;
  try {
    const res: any = await loginIpHistoryGet({
      page: query.page,
      page_size: query.page_size,
      uid: query.uid.trim(),
      login_ip: query.login_ip.trim()
    });
    list.value = pickArray(res);
    total.value = pickTotal(res);
  } catch (e: any) {
    ElMessage.error(e?.msg || '查询失败');
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  query.page = 1;
  fetchList();
}

fetchList();
</script>
