<template>
  <bd-page class="prohibit-page">
    <!-- 渐变顶部横幅 -->
    <div class="page-banner prohibit-banner">
      <div class="banner-content">
        <div class="banner-left">
          <h2 class="banner-title">🚫 违禁词列表</h2>
          <p class="banner-desc">管理系统违禁词，保障平台内容安全</p>
        </div>
        <div class="banner-right">
          <el-input v-model="query.search_key" placeholder="请输入违禁词" clearable style="width: 200px" @keyup.enter="getList" />
          <el-button round @click="getList">查询</el-button>
          <el-button round @click="showAddDialog = true">新增违禁词</el-button>
        </div>
      </div>
    </div>

    <!-- 主内容 -->
    <el-card class="main-card" shadow="never">
      <div class="flex-1 overflow-hidden">
        <el-table v-loading="loading" :data="tableData" :border="true" style="width: 100%; height: 100%">
          <el-table-column type="index" :width="42" align="center" fixed="left" />
          <el-table-column prop="content" label="违禁词" />
          <el-table-column prop="is_deleted" label="是否删除" width="160" align="center">
            <template #default="{ row }">
              <el-tag :type="row.is_deleted === 1 ? 'danger' : ''">{{ row.is_deleted === 1 ? '是' : '否' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="注册时间" width="220" />
          <el-table-column label="操作" align="center" fixed="right" width="120">
            <template #default="{ row }">
              <el-button
                :type="row.is_deleted === 0 ? 'danger' : 'warning'"
                link
                size="small"
                @click="onToggleDelete(row)"
              >
                {{ row.is_deleted === 0 ? '删除' : '恢复' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="flex items-center justify-between mt-12px">
        <div></div>
        <el-pagination
          v-model:current-page="query.page_index"
          v-model:page-size="query.page_size"
          :page-sizes="[15, 20, 30, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="onSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </el-card>

    <!-- 添加违禁词弹窗 -->
    <el-dialog v-model="showAddDialog" title="添加违禁词" width="600px" align-center :close-on-click-modal="false" draggable>
      <div>
        <el-input v-model="newContent" :rows="6" type="textarea" placeholder="请输入违禁词" />
      </div>
      <template #footer>
        <el-space>
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" :loading="addLoading" @click="onAdd">发送</el-button>
        </el-space>
      </template>
    </el-dialog>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 违禁词列表
  isAffix: false
</route>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus';
import { prohibitWordsGet, prohibitWordsAdd, prohibitWordsDelete } from '@/api/message';

const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const query = reactive({ search_key: '', page_size: 15, page_index: 1 });

const getList = () => {
  loading.value = true;
  prohibitWordsGet(query).then((r: any) => {
    loading.value = false;
    tableData.value = r.list || [];
    total.value = r.count || 0;
  }).catch(() => { loading.value = false; });
};

const onSizeChange = (val: number) => { query.page_size = val; getList(); };
const onPageChange = (val: number) => { query.page_index = val; getList(); };

const showAddDialog = ref(false);
const addLoading = ref(false);
const newContent = ref('');

const onAdd = () => {
  if (!newContent.value) { ElMessage.info('请输入违禁词！'); return; }
  addLoading.value = true;
  prohibitWordsAdd({ content: newContent.value }).then((r: any) => {
    addLoading.value = false;
    if (r.status === 200 || r === undefined) {
      ElMessage.success('发送成功！');
      newContent.value = '';
      showAddDialog.value = false;
      getList();
    }
  }).catch((e: any) => {
    addLoading.value = false;
    if (e?.status === 400) ElMessage.error(e.msg);
  });
};

const onToggleDelete = (row: any) => {
  const isDelete = row.is_deleted === 0;
  const title = isDelete ? '删除违禁词' : '恢复违禁词';
  const msg = isDelete
    ? `确定要删除违禁词[${row.content}]吗`
    : `确定要恢复违禁词[${row.content}]吗`;
  ElMessageBox.confirm(msg, title, {
    confirmButtonText: '确定', cancelButtonText: '取消', closeOnClickModal: false, type: 'warning'
  }).then(() => {
    const newVal = row.is_deleted === 1 ? 0 : 1;
    prohibitWordsDelete({ is_deleted: newVal, id: row.id }).then((r: any) => {
      if (r.status === 200 || r === undefined) {
        getList();
        ElMessage.success(isDelete ? '删除违禁词成功!' : '恢复违禁词成功!');
      }
    });
  }).catch(() => {
    ElMessage.info('取消成功！');
  });
};

onMounted(() => { getList(); });
</script>

<style lang="scss" scoped>
.prohibit-page { display: flex; flex-direction: column; gap: 12px; }
.page-banner {
  border-radius: 8px; padding: 24px 28px; color: #fff;
  .banner-content { display: flex; align-items: center; justify-content: space-between; }
  .banner-left {
    .banner-title { margin: 0 0 6px; font-size: 20px; font-weight: 600; }
    .banner-desc { margin: 0; font-size: 13px; opacity: 0.85; }
  }
  .banner-right { display: flex; gap: 10px; align-items: center;
    .el-button { --el-button-text-color: #fff; --el-button-bg-color: rgba(255,255,255,0.2); --el-button-border-color: rgba(255,255,255,0.3); --el-button-hover-bg-color: rgba(255,255,255,0.35); --el-button-hover-border-color: rgba(255,255,255,0.5); --el-button-hover-text-color: #fff; backdrop-filter: blur(4px); }
    :deep(.el-input__wrapper) { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.3); color: #fff;
      .el-input__inner { color: #fff; &::placeholder { color: rgba(255,255,255,0.7); } }
    }
  }
}
.prohibit-banner { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 50%, #e67e22 100%); }
.main-card { flex: 1;
  :deep(.el-card__body) { padding: 12px 20px 20px; }
}
</style>
