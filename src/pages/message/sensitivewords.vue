<template>
  <bd-page class="sensitive-page">
    <!-- 渐变顶部横幅 -->
    <div class="page-banner sensitive-banner">
      <div class="banner-content">
        <div class="banner-left">
          <h2 class="banner-title">🔍 敏感词管理</h2>
          <p class="banner-desc">敏感词配置与分类管理，实时推送到所有在线客户端</p>
        </div>
        <div class="banner-right">
          <el-input v-model="query.search_key" placeholder="搜索敏感词" clearable style="width: 180px" @keyup.enter="getList" />
          <el-select v-model="query.category" placeholder="全部分类" clearable style="width: 120px">
            <el-option label="全部分类" value="" />
            <el-option label="默认" value="default" />
            <el-option label="金融相关" value="financial" />
            <el-option label="成人内容" value="adult" />
            <el-option label="广告推广" value="ad" />
            <el-option label="政治敏感" value="political" />
          </el-select>
          <el-button round @click="getList">查询</el-button>
          <el-button round @click="openDialog()">新增敏感词</el-button>
        </div>
      </div>
    </div>

    <!-- 主内容 -->
    <el-card class="main-card" shadow="never">
      <div class="flex-1 overflow-hidden">
        <el-table v-loading="loading" :data="tableData" :border="true" style="width: 100%; height: 100%">
          <el-table-column type="index" :width="42" align="center" fixed="left" />
          <el-table-column prop="content" label="敏感词" min-width="150" />
          <el-table-column prop="category" label="分类" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="categoryMap[row.category || 'default']?.type || 'info'">
                {{ categoryMap[row.category || 'default']?.label || row.category }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="级别" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="levelMap[row.level || 1]?.type || 'info'">
                {{ levelMap[row.level || 1]?.label || row.level }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="is_deleted" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.is_deleted === 1 ? 'danger' : 'success'">
                {{ row.is_deleted === 1 ? '已删除' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="version" label="版本" width="100" align="center" />
          <el-table-column prop="created_at" label="创建时间" width="180" />
          <el-table-column label="操作" align="center" fixed="right" width="160">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="openDialog(row)">编辑</el-button>
              <el-button :type="row.is_deleted === 1 ? 'success' : 'danger'" size="small" @click="onToggleDelete(row)">
                {{ row.is_deleted === 1 ? '恢复' : '删除' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="flex items-center justify-between mt-12px">
        <div class="text-12px text-gray-400">
          敏感词更新后会实时推送到所有在线客户端
        </div>
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

    <!-- 添加/编辑敏感词弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑敏感词' : '添加敏感词'" width="600px" align-center :close-on-click-modal="false" draggable @close="onDialogClose">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <!-- 非编辑 + 批量模式 -->
        <el-form-item v-if="!isEdit && batchMode" label="敏感词" prop="content">
          <el-input v-model="batchText" :rows="6" type="textarea" placeholder="请输入敏感词，多个敏感词用换行分隔" />
          <div class="text-12px text-gray-400 mt-4px">每行一个敏感词，批量添加</div>
        </el-form-item>
        <!-- 单个模式 -->
        <el-form-item v-else label="敏感词" prop="content">
          <el-input v-model="form.content" placeholder="请输入敏感词" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="默认" value="default" />
            <el-option label="金融相关" value="financial" />
            <el-option label="成人内容" value="adult" />
            <el-option label="广告推广" value="ad" />
            <el-option label="政治敏感" value="political" />
          </el-select>
        </el-form-item>
        <el-form-item label="级别" prop="level">
          <el-select v-model="form.level" placeholder="请选择级别" style="width: 100%">
            <el-option label="警告提示" :value="1" />
            <el-option label="拦截消息" :value="2" />
            <el-option label="仅记录" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isEdit">
          <el-checkbox v-model="batchMode">批量添加模式</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-space>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="onSubmit">{{ isEdit ? '保存' : '添加' }}</el-button>
        </el-space>
      </template>
    </el-dialog>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 敏感词管理
  isAffix: false
</route>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  sensitiveWordsGet, sensitiveWordsAdd, sensitiveWordsBatchAdd,
  sensitiveWordsUpdate, sensitiveWordsDelete
} from '@/api/message';

const categoryMap: Record<string, { label: string; type: string }> = {
  default: { label: '默认', type: 'info' },
  financial: { label: '金融', type: 'warning' },
  adult: { label: '成人', type: 'danger' },
  ad: { label: '广告', type: '' },
  political: { label: '政治', type: 'danger' }
};

const levelMap: Record<number, { label: string; type: string }> = {
  1: { label: '警告', type: 'warning' },
  2: { label: '拦截', type: 'danger' },
  3: { label: '记录', type: 'info' }
};

const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const query = reactive({ search_key: '', category: '', page_size: 15, page_index: 1 });

const getList = () => {
  loading.value = true;
  sensitiveWordsGet(query).then((r: any) => {
    loading.value = false;
    tableData.value = r.list || [];
    total.value = r.count || 0;
  }).catch(() => { loading.value = false; });
};

const onSizeChange = (val: number) => { query.page_size = val; getList(); };
const onPageChange = (val: number) => { query.page_index = val; getList(); };

// Dialog
const dialogVisible = ref(false);
const isEdit = ref(false);
const editData = ref<any>(null);
const formRef = ref();
const batchMode = ref(false);
const batchText = ref('');
const submitLoading = ref(false);
const form = reactive({ id: 0, content: '', category: 'default', level: 1 });
const formRules = {
  content: [{ required: true, message: '请输入敏感词', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  level: [{ required: true, message: '请选择级别', trigger: 'change' }]
};

const openDialog = (row?: any) => {
  if (row) {
    isEdit.value = true;
    editData.value = row;
    form.id = row.id;
    form.content = row.content;
    form.category = row.category || 'default';
    form.level = row.level || 1;
  } else {
    isEdit.value = false;
    editData.value = null;
    form.id = 0;
    form.content = '';
    form.category = 'default';
    form.level = 1;
    batchText.value = '';
    batchMode.value = false;
  }
  dialogVisible.value = true;
};

const onDialogClose = () => {
  formRef.value?.resetFields();
};

const onSubmit = async () => {
  if (!isEdit.value && batchMode.value) {
    if (!batchText.value.trim()) { ElMessage.info('请输入敏感词！'); return; }
  } else {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;
    if (!form.content) { ElMessage.info('请输入敏感词！'); return; }
  }

  submitLoading.value = true;
  try {
    if (isEdit.value) {
      const r: any = await sensitiveWordsUpdate({ id: form.id, content: form.content, category: form.category, level: form.level });
      if (r?.status === 200 || r === undefined) {
        ElMessage.success('更新成功！');
        dialogVisible.value = false;
        getList();
      }
    } else if (batchMode.value) {
      const words = batchText.value.split('\n').map(w => w.trim()).filter(w => w);
      if (words.length === 0) { submitLoading.value = false; ElMessage.info('请输入敏感词！'); return; }
      const r: any = await sensitiveWordsBatchAdd({ words, category: form.category, level: form.level });
      if (r?.status === 200 || r === undefined) {
        ElMessage.success(`批量添加成功！成功: ${r?.success_count ?? words.length}，总数: ${r?.total_count ?? words.length}`);
        dialogVisible.value = false;
        getList();
      }
    } else {
      const r: any = await sensitiveWordsAdd({ content: form.content, category: form.category, level: form.level });
      if (r?.status === 200 || r === undefined) {
        ElMessage.success('添加成功！');
        dialogVisible.value = false;
        getList();
      }
    }
  } catch (e: any) {
    if (e?.status === 400) ElMessage.error(e.msg || '操作失败');
  } finally {
    submitLoading.value = false;
  }
};

const onToggleDelete = (row: any) => {
  const isRestore = row.is_deleted === 1;
  const title = isRestore ? '恢复敏感词' : '删除敏感词';
  const msg = isRestore
    ? `确定要恢复敏感词 [${row.content}] 吗？`
    : `确定要删除敏感词 [${row.content}] 吗？`;
  ElMessageBox.confirm(msg, title, {
    confirmButtonText: '确定', cancelButtonText: '取消', closeOnClickModal: false, type: 'warning'
  }).then(() => {
    sensitiveWordsDelete({ id: row.id }).then((r: any) => {
      if (r?.status === 200 || r === undefined) {
        ElMessage.success(isRestore ? '恢复成功！' : '删除成功！');
        getList();
      }
    }).catch((e: any) => { if (e?.msg) ElMessage.error(e.msg); });
  }).catch(() => { ElMessage.info('已取消操作'); });
};

onMounted(() => { getList(); });
</script>

<style lang="scss" scoped>
.sensitive-page { display: flex; flex-direction: column; gap: 12px; }
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
    :deep(.el-select .el-input__wrapper) { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.3);
      .el-input__inner { color: #fff; &::placeholder { color: rgba(255,255,255,0.7); } }
    }
  }
}
.sensitive-banner { background: linear-gradient(135deg, #f39c12 0%, #e67e22 50%, #d35400 100%); }
.main-card { flex: 1;
  :deep(.el-card__body) { padding: 12px 20px 20px; }
}
</style>
