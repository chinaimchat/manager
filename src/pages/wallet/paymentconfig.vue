<template>
  <bd-page class="pay-admin-page">
    <!-- 渐变顶部横幅 -->
    <div class="page-banner pay-banner">
      <div class="banner-content">
        <div class="banner-left">
          <h2 class="banner-title">💳 支付配置管理</h2>
        </div>
        <div class="banner-right">
          <el-button round :loading="saveAllLoading" @click="saveAllConfig">保存所有配置</el-button>
        </div>
      </div>
    </div>

    <!-- 主内容 -->
    <el-card class="main-card" shadow="never">
      <el-tabs v-model="activeTab" class="payment-config-tabs">
            <!-- 充值渠道管理 -->
            <el-tab-pane label="充值渠道管理" name="channels">
              <div class="w-full">
                <div class="ch-toolbar">
                  <el-button type="warning" @click="showChannelDialog(null)">+ 添加渠道</el-button>
                  <el-button @click="loadChannels">刷新</el-button>
                </div>
                <el-table v-loading="chLoading" :data="channelList" :border="true" style="width: 100%" stripe>
                  <el-table-column prop="id" label="ID" width="80" />
                  <el-table-column prop="title" label="渠道名称" min-width="120" />
                  <el-table-column prop="pay_type" label="支付类型" width="100">
                    <template #default="{ row }">
                      <el-tag :type="payTypeTag[row.pay_type]" size="small">{{ payTypeName[row.pay_type] }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="收款信息" min-width="200" show-overflow-tooltip>
                    <template #default="{ row }">
                      <div class="text-12px leading-snug">
                        <div v-if="row.pay_address" class="truncate">地址：{{ row.pay_address }}</div>
                        <div v-if="row.qr_url || row.qr_image_url" class="text-gray-500">已配二维码</div>
                        <div v-if="row.pay_type === 4 && row.install_key">汇率：{{ row.install_key }}</div>
                        <div v-else-if="row.install_key && !row.pay_address">其它：{{ row.install_key }}</div>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" width="80" align="center">
                    <template #default="{ row }">
                      <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="created_at" label="创建时间" width="160" />
                  <el-table-column label="操作" width="200" fixed="right" align="center">
                    <template #default="{ row }">
                      <el-button size="small" type="primary" link @click="showChannelDialog(row)">编辑</el-button>
                      <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" link @click="toggleChannelStatus(row)">{{ row.status === 1 ? '停用' : '启用' }}</el-button>
                      <el-button size="small" type="danger" link @click="deleteChannel(row)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <!-- Udun币种管理 -->
            <el-tab-pane label="Udun币种管理" name="coins">
              <div class="w-full">
                <div class="ch-toolbar">
                  <el-button type="warning" @click="syncCoinTypes" :loading="coinSyncing">同步币种</el-button>
                  <el-button @click="loadCoins">刷新</el-button>
                </div>
                <el-table v-loading="coinLoading" :data="coinList" :border="true" style="width: 100%" stripe>
                  <el-table-column prop="id" label="ID" width="60" />
                  <el-table-column prop="symbol" label="币种符号" width="90" />
                  <el-table-column prop="coin_name" label="币种名称" min-width="110" />
                  <el-table-column prop="name" label="显示名称" width="90" />
                  <el-table-column prop="logo" label="图标" width="70" align="center">
                    <template #default="{ row }">
                      <el-image v-if="row.logo" :src="row.logo" :preview-src-list="[row.logo]" style="width: 32px; height: 32px" fit="cover" />
                      <span v-else class="text-gray-300">-</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="main_symbol" label="主链" width="80" />
                  <el-table-column prop="decimals" label="精度" width="60" align="center" />
                  <el-table-column prop="min_trade" label="最小交易额" width="100" />
                  <el-table-column prop="balance" label="余额" width="100">
                    <template #default="{ row }">{{ row.balance || '0' }}</template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" width="80" align="center">
                    <template #default="{ row }">
                      <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="tips" label="提示信息" min-width="120" show-overflow-tooltip />
                  <el-table-column prop="created_at" label="创建时间" width="150" />
                  <el-table-column label="操作" width="160" fixed="right" align="center">
                    <template #default="{ row }">
                      <el-button size="small" type="primary" link @click="showCoinEditDialog(row)">编辑</el-button>
                      <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" link @click="toggleCoinStatus(row)">{{ row.status === 1 ? '停用' : '启用' }}</el-button>
                      <el-button size="small" type="danger" link @click="deleteCoin(row)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <!-- Udun配置 -->
            <el-tab-pane label="Udun配置" name="udun">
              <div class="w-full">
                <el-form :model="udunConfig" label-width="180px" style="max-width: 700px">
                  <el-form-item label="配置ID：">
                    <el-input v-model="udunConfig.id" disabled placeholder="配置ID" />
                    <div class="text-xs text-gray-500 mt-1">系统自动生成</div>
                  </el-form-item>
                  <el-form-item label="API基础URL：">
                    <el-input v-model="udunConfig.base_url" placeholder="Udun API基础URL" />
                    <div class="text-xs text-gray-500 mt-1">例如：https://api.udun.io</div>
                  </el-form-item>
                  <el-form-item label="商户号：">
                    <el-input v-model="udunConfig.merchant_id" placeholder="Udun商户号" />
                  </el-form-item>
                  <el-form-item label="签名密钥：">
                    <el-input v-model="udunConfig.sign_key" type="password" placeholder="Udun签名密钥" show-password />
                  </el-form-item>
                  <el-form-item label="回调地址：">
                    <el-input v-model="udunConfig.callback_url" placeholder="支付结果回调地址" />
                    <div class="text-xs text-gray-500 mt-1">必须是外网可访问的URL</div>
                  </el-form-item>
                  <el-form-item label="请求超时时间：">
                    <el-input v-model="udunConfig.timeout" type="number" placeholder="请求超时时间（秒）" />
                    <div class="text-xs text-gray-500 mt-1">单位：秒</div>
                  </el-form-item>
                  <el-form-item label="状态：">
                    <el-switch v-model="udunConfig.status" :active-value="1" :inactive-value="0" inactive-text="禁用" active-text="启用" />
                  </el-form-item>
                  <el-form-item v-if="udunConfig.created_at" label="创建时间：">
                    <el-input v-model="udunConfig.created_at" disabled />
                  </el-form-item>
                  <el-form-item v-if="udunConfig.updated_at" label="更新时间：">
                    <el-input v-model="udunConfig.updated_at" disabled />
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>
    </el-card>

    <!-- 渠道编辑弹窗 -->
    <el-dialog v-model="chDialogVisible" :title="editingChannel ? '编辑充值渠道' : '添加充值渠道'" width="600px" destroy-on-close>
      <el-form :model="chForm" label-width="100px" :rules="chRules" ref="chFormRef">
        <el-form-item label="渠道名称" prop="title">
          <el-input v-model="chForm.title" placeholder="请输入渠道名称" />
        </el-form-item>
        <el-form-item label="支付类型" prop="pay_type">
          <el-select v-model="chForm.pay_type" placeholder="请选择支付类型" style="width: 100%">
            <el-option label="支付宝" :value="2" />
            <el-option label="微信" :value="3" />
            <el-option label="USDT-TRC20" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="链上地址">
          <el-input v-model="chForm.pay_address" placeholder="链上收款地址（给用户复制）" clearable />
          <div class="text-11px text-gray-500 mt-1">用户充值页展示，可与下方图片配合使用。</div>
        </el-form-item>
        <el-form-item label="上传图片">
          <div class="ch-qr-upload-row">
            <div class="ch-qr-preview-box">
              <img
                v-if="qrImageDisplayURL"
                :key="qrImageDisplayURL"
                :src="qrImageDisplayURL"
                class="ch-qr-preview"
                alt="图片预览"
                @error="onQrPreviewError"
              />
              <span v-else class="ch-qr-placeholder">暂无图片</span>
            </div>
            <div class="ch-qr-upload-actions">
              <el-upload
                class="ch-qr-upload-inline"
                :show-file-list="false"
                accept="image/*"
                :http-request="handleQrHttpRequest"
              >
                <el-button type="primary">
                  <el-icon class="ch-qr-btn-icon"><Upload /></el-icon>
                  选择图片上传
                </el-button>
              </el-upload>
              <el-button v-if="chForm.qr_image_url" type="danger" plain @click="clearQrImage">清除图片</el-button>
              <p class="ch-qr-hint">上传成功后立即显示缩略图，保存渠道后用户端可获取该图片。</p>
            </div>
          </div>
        </el-form-item>
        <el-form-item v-if="chForm.pay_type === 4" label="汇率" prop="install_key">
          <el-input v-model="chForm.install_key" placeholder="如 7.2 表示 1U 可兑 7.20 元（app 入账金额）" />
        </el-form-item>
        <el-form-item v-else label="扩展配置">
          <el-input v-model="chForm.install_key" placeholder="选填：扩展参数，兼容旧数据" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="chForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-8px">
          <el-button @click="chDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="chSaving" @click="saveChannel">{{ editingChannel ? '更新' : '创建' }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 币种编辑弹窗 -->
    <el-dialog v-model="coinDialogVisible" :title="editingCoin ? '编辑币种' : '币种详情'" width="600px" destroy-on-close>
      <el-form :model="coinForm" label-width="100px" :rules="coinRules" ref="coinFormRef">
        <el-form-item label="币种符号"><el-input v-model="coinForm.symbol" disabled /></el-form-item>
        <el-form-item label="币种名称"><el-input v-model="coinForm.coin_name" disabled /></el-form-item>
        <el-form-item label="显示名称"><el-input v-model="coinForm.name" placeholder="前端显示的名称" /></el-form-item>
        <el-form-item label="最小交易额" prop="min_trade"><el-input v-model="coinForm.min_trade" placeholder="请输入最小交易额" /></el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="coinForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="提示信息"><el-input v-model="coinForm.tips" type="textarea" :rows="2" placeholder="请输入提示信息" /></el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-8px">
          <el-button @click="coinDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="coinSaving" @click="saveCoin">{{ editingCoin ? '更新' : '保存' }}</el-button>
        </div>
      </template>
    </el-dialog>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 支付配置
  isAffix: false
</route>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload } from '@element-plus/icons-vue';
import type { UploadRequestOptions } from 'element-plus';
import { BU_DOU_CONFIG } from '@/config';
import {
  rechargeChannelList, rechargeChannelGet, rechargeChannelCreate, rechargeChannelUpdate, rechargeChannelUpdateStatus, rechargeChannelDelete,
  udunConfigGet, udunConfigUpdate,
  udunCoinTypeList, udunCoinTypeSync, udunCoinTypeUpdate, udunCoinTypeUpdateStatus, udunCoinTypeDelete,
  managerUploadImage
} from '@/api/wallet';

const payTypeName: Record<number, string> = { 2: '支付宝', 3: '微信', 4: 'USDT-TRC20' };
const payTypeTag: Record<number, string> = { 2: 'success', 3: 'primary', 4: 'warning' };

const activeTab = ref('channels');
const saveAllLoading = ref(false);

// ===== 充值渠道 =====
const channelList = ref<any[]>([]);
const chLoading = ref(false);
const chDialogVisible = ref(false);
const chSaving = ref(false);
const editingChannel = ref<any>(null);
const chFormRef = ref<any>(null);
const chForm = reactive({
  app_id: 'tsdd_app',
  pay_type: 2,
  icon: '',
  qr_url: '',
  qr_image_url: '',
  pay_address: '',
  install_key: '',
  status: 1,
  title: '',
  remark: '',
});

const qrLocalPreviewUrl = ref('');
const revokeQrLocalPreview = () => {
  if (qrLocalPreviewUrl.value) {
    URL.revokeObjectURL(qrLocalPreviewUrl.value);
    qrLocalPreviewUrl.value = '';
  }
};

const handleQrHttpRequest = async (options: UploadRequestOptions) => {
  const file = options.file as File;
  revokeQrLocalPreview();
  qrLocalPreviewUrl.value = URL.createObjectURL(file);
  try {
    const data = (await managerUploadImage(file)) as any;
    const path = data?.path ?? data?.data?.path;
    if (!path) {
      ElMessage.warning('上传成功但未返回路径');
      revokeQrLocalPreview();
      options.onError?.(new Error('no path') as any);
      return;
    }
    chForm.qr_image_url = path;
    ElMessage.success('图片上传成功，请点击下方「更新」按钮保存渠道');
    options.onSuccess?.(data);
  } catch (e: any) {
    revokeQrLocalPreview();
    ElMessage.error(e?.msg || e?.message || '上传失败');
    options.onError?.(e);
  }
};

/**
 * 管理端与当前页同源加载文件预览（走 nginx /api → 后端 /v1）。
 * 避免使用服务端配置的公网 APIBaseURL：在 localhost:83、内网 IP 访问后台时，
 * 若 img 指向外网域名会裂图。
 */
function resolveFilePreviewSameOrigin(path: string): string {
  const p = (path || '').trim();
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) {
    try {
      const u = new URL(p);
      if (u.pathname.includes('/file/preview/')) {
        return `${u.pathname}${u.search}`;
      }
    } catch {
      /* ignore */
    }
    return p;
  }
  const rest = p.replace(/^\/+/, '').replace(/^file\/preview\/?/i, '');
  if (!rest) return '';
  return `/api/v1/file/preview/${rest}`;
}

const qrImageDisplayURL = computed(() => {
  if (qrLocalPreviewUrl.value) return qrLocalPreviewUrl.value;
  return resolveFilePreviewSameOrigin(chForm.qr_image_url);
});

const onQrPreviewError = () => {};

const clearQrImage = () => {
  revokeQrLocalPreview();
  chForm.qr_image_url = '';
};

watch(chDialogVisible, (open) => {
  if (!open) revokeQrLocalPreview();
});

const chRules = {
  title: [{ required: true, message: '请输入渠道名称', trigger: 'blur' }],
  pay_type: [{ required: true, message: '请选择支付类型', trigger: 'change' }],
  install_key: [
    {
      validator: (_rule: any, v: string, cb: (e?: Error) => void) => {
        if (chForm.pay_type !== 4) {
          cb();
          return;
        }
        if (v === undefined || v === null || String(v).trim() === '') {
          cb(new Error('USDT-TRC20 渠道请输入汇率'));
          return;
        }
        const n = Number(String(v).trim());
        if (Number.isNaN(n) || n <= 0) {
          cb(new Error('汇率须为大于 0 的数字'));
          return;
        }
        cb();
      },
      trigger: 'blur',
    },
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

const loadChannels = async () => {
  chLoading.value = true;
  try {
    const r: any = await rechargeChannelList({ page_index: 1, page_size: 100 });
    const raw = Array.isArray(r) ? r : (r?.data ?? r?.list);
    channelList.value = Array.isArray(raw) ? raw : [];
  } catch (e: any) {
    console.error('获取充值渠道列表失败:', e);
    ElMessage.error('获取充值渠道列表失败');
  } finally { chLoading.value = false; }
};

const showChannelDialog = async (row: any) => {
  revokeQrLocalPreview();
  editingChannel.value = row;
  if (row) {
    try {
      const ch: any = await rechargeChannelGet(row.id);
      const data = ch?.data ?? ch;
      const imgPath = data?.qr_image_url ?? data?.qrImageUrl ?? row.qr_image_url ?? row.qrImageUrl ?? '';
      Object.assign(chForm, {
        app_id: data?.app_id ?? row.app_id,
        pay_type: data?.pay_type ?? row.pay_type,
        icon: data?.icon ?? row.icon ?? '',
        qr_url: data?.qr_url ?? row.qr_url ?? '',
        qr_image_url: imgPath,
        pay_address: data?.pay_address ?? row.pay_address ?? '',
        install_key: data?.install_key ?? row.install_key ?? '',
        status: data?.status ?? row.status ?? 1,
        title: data?.title ?? row.title ?? '',
        remark: data?.remark ?? row.remark ?? '',
      });
    } catch (e: any) {
      console.error('获取渠道详情失败:', e);
      ElMessage.error('获取渠道详情失败，使用列表数据');
      Object.assign(chForm, {
        app_id: row.app_id,
        pay_type: row.pay_type,
        icon: row.icon || '',
        qr_url: row.qr_url || '',
        qr_image_url: row.qr_image_url || row.qrImageUrl || '',
        pay_address: row.pay_address || '',
        install_key: row.install_key || '',
        status: row.status,
        title: row.title,
        remark: row.remark || '',
      });
    }
  } else {
    Object.assign(chForm, {
      app_id: 'tsdd_app',
      pay_type: 2,
      icon: '',
      qr_url: '',
      qr_image_url: '',
      pay_address: '',
      install_key: '',
      status: 1,
      title: '',
      remark: '',
    });
  }
  chDialogVisible.value = true;
};

const saveChannel = async () => {
  if (chFormRef.value) {
    try { await chFormRef.value.validate(); } catch { return; }
  }
  chSaving.value = true;
  try {
    const payload = {
      app_id: chForm.app_id,
      pay_type: chForm.pay_type,
      icon: chForm.icon,
      qr_url: chForm.qr_url,
      qr_image_url: String(chForm.qr_image_url || '').trim(),
      pay_address: chForm.pay_address,
      install_key: chForm.install_key,
      title: chForm.title,
      remark: chForm.remark,
    };
    if (editingChannel.value) {
      await rechargeChannelUpdate(editingChannel.value.id, payload);
      ElMessage.success('更新渠道成功');
    } else {
      await rechargeChannelCreate({ ...payload, status: chForm.status });
      ElMessage.success('创建渠道成功');
    }
    await loadChannels();
    chDialogVisible.value = false;
    Object.assign(chForm, {
      app_id: 'tsdd_app',
      pay_type: 2,
      icon: '',
      qr_url: '',
      qr_image_url: '',
      pay_address: '',
      install_key: '',
      status: 1,
      title: '',
      remark: '',
    });
  } catch (e: any) {
    console.error('提交渠道失败:', e);
    ElMessage.error('提交渠道失败');
  } finally { chSaving.value = false; }
};

const toggleChannelStatus = async (row: any) => {
  const newStatus = row.status === 1 ? 0 : 1;
  const text = newStatus === 1 ? '启用' : '停用';
  try {
    await ElMessageBox.confirm(`确定要${text}渠道"${row.title}"吗？`, '确认操作', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' });
    await rechargeChannelUpdateStatus(row.id, { status: newStatus });
    ElMessage.success(`${text}成功`);
    loadChannels();
  } catch (e: any) {
    if (e !== 'cancel') { console.error('切换渠道状态失败:', e); ElMessage.error('切换渠道状态失败'); }
  }
};

const deleteChannel = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除渠道"${row.title}"吗？此操作不可恢复！`, '确认删除', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' });
    await rechargeChannelDelete(row.id);
    ElMessage.success('删除渠道成功');
    loadChannels();
  } catch (e: any) {
    if (e !== 'cancel') { console.error('删除渠道失败:', e); ElMessage.error('删除渠道失败'); }
  }
};

// ===== Udun配置 =====
const udunConfig = reactive<any>({ id: 0, base_url: '', merchant_id: '', sign_key: '', callback_url: '', timeout: 30, status: 1, created_at: '', updated_at: '' });

const loadUdunConfig = async () => {
  try {
    const r: any = await udunConfigGet();
    if (r && typeof r === 'object') {
      Object.assign(udunConfig, r);
    } else {
      ElMessage.error('支付配置数据格式错误');
    }
  } catch (e: any) {
    console.error('获取支付配置失败：', e);
    ElMessage.error('获取支付配置失败');
  }
};

const validateUdunConfig = (): string[] => {
  const errors: string[] = [];
  if (udunConfig.base_url) {
    if (!udunConfig.merchant_id) errors.push('Udun商户号不能为空');
    if (!udunConfig.sign_key) errors.push('Udun签名密钥不能为空');
    if (!udunConfig.callback_url) errors.push('Udun回调地址不能为空');
    if (udunConfig.base_url && !/^https?:\/\/./.test(udunConfig.base_url)) errors.push('Udun API基础URL格式不正确');
    if (udunConfig.callback_url && !/^https?:\/\/./.test(udunConfig.callback_url)) errors.push('Udun回调地址格式不正确');
    if (udunConfig.timeout <= 0) errors.push('请求超时时间必须大于0');
  }
  return errors;
};

const saveUdunConfigOnly = async () => {
  const errors = validateUdunConfig();
  if (errors.length > 0) {
    ElMessage.error(`配置验证失败：${errors[0]}`);
    return;
  }
  if (!udunConfig.id) {
    ElMessage.error('配置ID不能为空');
    return;
  }
  await udunConfigUpdate(udunConfig.id, {
    base_url: udunConfig.base_url?.trim() || '',
    merchant_id: udunConfig.merchant_id?.trim() || '',
    sign_key: udunConfig.sign_key?.trim() || '',
    callback_url: udunConfig.callback_url?.trim() || '',
    timeout: Number(udunConfig.timeout),
    status: Number(udunConfig.status),
  });
};

const saveAllConfig = async () => {
  const errors = validateUdunConfig();
  if (errors.length > 0) {
    ElMessage.error(`配置验证失败：${errors[0]}`);
    return;
  }
  saveAllLoading.value = true;
  try {
    await saveUdunConfigOnly();
    ElMessage.success('保存配置成功');
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || '保存失败';
    ElMessage.error(msg);
  } finally { saveAllLoading.value = false; }
};

// ===== Udun币种 =====
const coinList = ref<any[]>([]);
const coinLoading = ref(false);
const coinSyncing = ref(false);
const coinDialogVisible = ref(false);
const coinSaving = ref(false);
const editingCoin = ref<any>(null);
const coinFormRef = ref<any>(null);
const coinForm = reactive<any>({ id: null, symbol: '', coin_name: '', name: '', main_symbol: '', decimals: '', min_trade: '', status: 1, tips: '' });
const coinRules = {
  min_trade: [{ required: true, message: '请输入最小交易额', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

const loadCoins = async () => {
  coinLoading.value = true;
  try {
    const r: any = await udunCoinTypeList();
    coinList.value = Array.isArray(r) ? r : (r?.data || r?.list || []);
  } catch (e: any) {
    console.error('获取币种列表失败:', e);
    ElMessage.error('获取币种列表失败');
  } finally { coinLoading.value = false; }
};

const syncCoinTypes = async () => {
  coinSyncing.value = true;
  try {
    await udunCoinTypeSync();
    ElMessage.success('同步币种成功');
    loadCoins();
  } catch (e: any) {
    console.error('同步币种失败:', e);
    ElMessage.error('同步币种失败');
  } finally { coinSyncing.value = false; }
};

const showCoinEditDialog = (row: any) => {
  editingCoin.value = row;
  Object.assign(coinForm, {
    id: row.id, symbol: row.symbol, coin_name: row.coin_name, name: row.name,
    main_symbol: row.main_symbol, decimals: row.decimals, min_trade: row.min_trade,
    status: row.status, tips: row.tips,
  });
  coinDialogVisible.value = true;
};

const saveCoin = async () => {
  if (coinFormRef.value) {
    try { await coinFormRef.value.validate(); } catch { return; }
  }
  coinSaving.value = true;
  try {
    await udunCoinTypeUpdate(coinForm.id, {
      name: coinForm.name, min_trade: coinForm.min_trade,
      status: coinForm.status, tips: coinForm.tips,
    });
    ElMessage.success('更新币种成功');
    coinDialogVisible.value = false;
    loadCoins();
  } catch (e: any) {
    console.error('更新币种失败:', e);
    ElMessage.error('更新币种失败');
  } finally { coinSaving.value = false; }
};

const toggleCoinStatus = async (row: any) => {
  const newStatus = row.status === 1 ? 0 : 1;
  const text = newStatus === 1 ? '启用' : '停用';
  try {
    await ElMessageBox.confirm(`确定要${text}币种"${row.symbol}"吗？`, '确认操作', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' });
    await udunCoinTypeUpdateStatus(row.id, { status: newStatus });
    ElMessage.success(`${text}成功`);
    loadCoins();
  } catch (e: any) {
    if (e !== 'cancel') { console.error('切换币种状态失败:', e); ElMessage.error('切换币种状态失败'); }
  }
};

const deleteCoin = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除币种"${row.symbol}"吗？此操作不可恢复！`, '确认删除', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' });
    await udunCoinTypeDelete(row.id);
    ElMessage.success('删除币种成功');
    loadCoins();
  } catch (e: any) {
    if (e !== 'cancel') { console.error('删除币种失败:', e); ElMessage.error('删除币种失败'); }
  }
};

// ===== Lifecycle =====
const loadData = () => { loadChannels(); loadUdunConfig(); loadCoins(); };
watch(activeTab, (tab) => {
  if (tab === 'channels') loadChannels();
  else if (tab === 'udun') loadUdunConfig();
  else if (tab === 'coins') loadCoins();
});
onMounted(() => { loadData(); });
</script>

<style lang="scss" scoped>
.pay-admin-page { display: flex; flex-direction: column; gap: 12px; }
.page-banner {
  border-radius: 8px; padding: 24px 28px; color: #fff;
  .banner-content { display: flex; align-items: center; justify-content: space-between; }
  .banner-left {
    .banner-title { margin: 0; font-size: 20px; font-weight: 600; }
  }
  .banner-right { display: flex; gap: 10px;
    .el-button { --el-button-text-color: #fff; --el-button-bg-color: rgba(255,255,255,0.2); --el-button-border-color: rgba(255,255,255,0.3); --el-button-hover-bg-color: rgba(255,255,255,0.35); --el-button-hover-border-color: rgba(255,255,255,0.5); --el-button-hover-text-color: #fff; backdrop-filter: blur(4px); }
  }
}
.pay-banner { background: linear-gradient(135deg, #00b894 0%, #00cec9 50%, #0984e3 100%); }
.main-card { flex: 1;
  :deep(.el-card__body) { padding: 12px 20px 20px; }
}
.payment-config-tabs {
  :deep(.el-tabs__content) { padding: 0; }
}
.ch-toolbar {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;
}
.ch-qr-upload-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}
.ch-qr-preview-box {
  width: 120px;
  height: 120px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  overflow: hidden;
}
.ch-qr-placeholder {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: 8px;
  text-align: center;
}
.ch-qr-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.ch-qr-upload-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.ch-qr-upload-inline {
  display: inline-block;
}
.ch-qr-btn-icon {
  margin-right: 4px;
  vertical-align: middle;
}
.ch-qr-hint {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  max-width: 400px;
}
</style>
