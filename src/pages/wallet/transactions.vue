<template>
  <bd-page class="flex-col">
    <div class="flex-1 el-card border-none flex-col box-border overflow-hidden">
      <div class="h-50px pl-12px pr-12px box-border flex items-center justify-between bd-title">
        <div class="bd-title-left">
          <p class="m-0 font-600">交易记录 <span v-if="uid" class="font-400 text-14px text-gray-500">（{{ uid }}）</span></p>
        </div>
        <div class="flex items-center h-50px">
          <el-form inline>
            <el-form-item class="mb-0 !mr-16px">
              <el-input v-model="queryFrom.uid" placeholder="搜索UID" clearable />
            </el-form-item>
            <el-form-item class="mb-0 !mr-0">
              <el-button type="primary" @click="getList">查询</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <div class="flex-1 overflow-hidden p-12px">
        <el-table v-loading="loadTable" :data="tableData" :border="true" style="width: 100%; height: 100%">
          <el-table-column type="index" :width="42" :align="'center'" />
          <el-table-column prop="uid" label="用户UID" min-width="200" />
          <el-table-column prop="type" label="类型" width="140">
            <template #default="{ row }">
              <el-tag :type="typeTagMap[row.type] || 'info'" size="small">{{ typeNameMap[row.type] || row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="{ row }">
              <span :class="row.amount > 0 ? 'text-green-600' : 'text-red-500'">
                {{ row.amount > 0 ? '+' : '' }}{{ Number(row.amount).toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="160" />
          <el-table-column prop="related_id" label="关联ID" width="180" />
          <el-table-column prop="created_at" label="时间" width="170" />
        </el-table>
      </div>
      <div class="bd-card-footer pl-12px pr-12px mb-12px flex items-center justify-between">
        <div></div>
        <el-pagination
          v-model:current-page="queryFrom.page_index"
          v-model:page-size="queryFrom.page_size"
          :page-sizes="[15, 20, 30, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="onSizeChange"
          @current-change="onCurrentChange"
        />
      </div>
    </div>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 交易记录
  isAffix: false
</route>

<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { walletTransactionsGet } from '@/api/wallet';

const route = useRoute();
const uid = ref((route.query.uid as string) || '');

const typeNameMap: Record<string, string> = {
  recharge: '充值',
  admin_recharge: '管理员充值',
  redpacket_send: '发红包',
  redpacket_receive: '收红包',
  transfer_out: '转账支出',
  transfer_in: '转账收入',
  refund: '退款'
};
const typeTagMap: Record<string, string> = {
  recharge: 'success',
  admin_recharge: 'success',
  redpacket_send: 'danger',
  redpacket_receive: 'success',
  transfer_out: 'danger',
  transfer_in: 'success',
  refund: 'warning'
};

const tableData = ref<any[]>([]);
const loadTable = ref(false);
const total = ref(0);
const queryFrom = reactive({ uid: uid.value, page_size: 15, page_index: 1 });

const getList = () => {
  loadTable.value = true;
  walletTransactionsGet(queryFrom).then((res: any) => {
    loadTable.value = false;
    tableData.value = res.list || [];
    total.value = res.count || 0;
  });
};

const onSizeChange = (size: number) => { queryFrom.page_size = size; getList(); };
const onCurrentChange = (current: number) => { queryFrom.page_index = current; getList(); };

onMounted(() => { getList(); });
</script>

<style lang="scss" scoped>
.bd-title {
  border-bottom: 1px solid var(--el-card-border-color);
}
</style>
