<template>
  <bd-page class="flex-col">
    <div class="flex-1 el-card border-none flex-col box-border overflow-hidden">
      <div class="h-50px pl-12px pr-12px box-border flex items-center justify-between bd-title">
        <div class="bd-title-left">
          <p class="m-0 font-600">实验室管理</p>
        </div>
        <div class="flex items-center h-50px gap-8px">
          <el-form inline>
            <el-form-item class="mb-0 !mr-12px">
              <el-input v-model="query.keyword" placeholder="短链接/URL/备注" clearable style="width: 200px" @keyup.enter="getList" />
            </el-form-item>
            <el-form-item class="mb-0 !mr-12px">
              <el-select v-model="query.status" placeholder="全部" clearable style="width: 100px" @change="getList">
                <el-option label="全部" :value="-1" />
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item class="mb-0 !mr-12px">
              <el-button type="warning" @click="getList">查询</el-button>
            </el-form-item>
            <el-form-item class="mb-0 !mr-0">
              <el-button type="danger" @click="showDialog(null)">新增短链接</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <div class="flex-1 overflow-hidden p-12px">
        <el-table v-loading="loading" :data="tableData" :border="true" style="width: 100%; height: 100%" stripe>
          <el-table-column type="index" :width="42" align="center" />
          <el-table-column prop="short_url" label="短链接/口令" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <el-link type="primary" :underline="false">{{ row.short_url }}</el-link>
            </template>
          </el-table-column>
          <el-table-column prop="url" label="完整URL" min-width="300" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small" effect="light">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
          <el-table-column prop="created_at" label="创建时间" width="170">
            <template #default="{ row }">{{ formatTs(row.created_at) }}</template>
          </el-table-column>
          <el-table-column prop="updated_at" label="更新时间" width="170">
            <template #default="{ row }">{{ formatTs(row.updated_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="showDialog(row)">编辑</el-button>
              <el-button v-if="row.status === 1" type="warning" link size="small" @click="toggleStatus(row, 0)">禁用</el-button>
              <el-button v-else type="success" link size="small" @click="toggleStatus(row, 1)">启用</el-button>
              <el-button type="danger" link size="small" @click="onDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="bd-card-footer pl-12px pr-12px mb-12px flex items-center justify-between">
        <div></div>
        <el-pagination
          v-model:current-page="query.page_index"
          v-model:page-size="query.page_size"
          :page-sizes="[15, 20, 30, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑' : '新增'" width="600px" :close-on-click-modal="false">
      <el-form :model="form" label-width="120px" ref="formRef" :rules="formRules">
        <el-form-item label="短链接/口令" prop="short_url">
          <el-input v-model="form.short_url" placeholder="请输入短链接/口令" maxlength="255" />
        </el-form-item>
        <el-form-item label="完整URL" prop="url">
          <el-input v-model="form.url" type="textarea" :rows="3" placeholder="请输入完整的URL" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">确定</el-button>
      </template>
    </el-dialog>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 实验室管理
  isAffix: false
</route>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus';
import { web3LabList, web3LabCreate, web3LabUpdate, web3LabUpdateStatus, web3LabDelete } from '@/api/web3';

const formatTs = (ts: any) => {
  if (!ts) return '';
  if (typeof ts === 'string' && ts.includes('-')) return ts;
  const d = new Date(Number(ts) * 1000);
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const query = reactive({ keyword: '', status: -1, page_index: 1, page_size: 15 });

const getList = () => {
  loading.value = true;
  web3LabList(query).then((r: any) => {
    tableData.value = r.data || [];
    total.value = r.total || 0;
  }).catch(() => {}).finally(() => { loading.value = false; });
};

const dialogVisible = ref(false);
const editing = ref<any>(null);
const formRef = ref<any>(null);
const form = reactive({ short_url: '', url: '', status: 1, remark: '' });
const formRules = {
  short_url: [{ required: true, message: '请输入短链接/口令', trigger: 'blur' }],
};

const showDialog = (row: any) => {
  editing.value = row;
  if (row) {
    form.short_url = row.short_url;
    form.url = row.url || '';
    form.status = row.status;
    form.remark = row.remark || '';
  } else {
    form.short_url = '';
    form.url = '';
    form.status = 1;
    form.remark = '';
  }
  dialogVisible.value = true;
};

const onSubmit = () => {
  if (!form.short_url.trim()) { ElMessage.warning('请输入短链接/口令'); return; }
  const fn = editing.value
    ? web3LabUpdate(editing.value.id, form)
    : web3LabCreate(form);
  fn.then(() => {
    ElMessage.success(editing.value ? '编辑成功' : '新增成功');
    dialogVisible.value = false;
    getList();
  }).catch((e: any) => { ElMessage.error(e?.msg || '操作失败'); });
};

const toggleStatus = (row: any, status: number) => {
  web3LabUpdateStatus(row.id, { status }).then(() => {
    ElMessage.success(status === 1 ? '已启用' : '已禁用');
    getList();
  }).catch(() => { ElMessage.error('操作失败'); });
};

const onDelete = (row: any) => {
  ElMessageBox.confirm(`确定删除「${row.short_url}」吗？`, '确认删除', { type: 'warning' }).then(() => {
    web3LabDelete(row.id).then(() => { ElMessage.success('删除成功'); getList(); }).catch(() => { ElMessage.error('删除失败'); });
  }).catch(() => {});
};

onMounted(() => { getList(); });
</script>

<style lang="scss" scoped>
.bd-title {
  border-bottom: 1px solid var(--el-card-border-color);
}
</style>
