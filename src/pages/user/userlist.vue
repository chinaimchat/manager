<template>
  <bd-page class="flex-col">
    <!-- 布局 -->

    <div class="flex-1 el-card border-none flex-col box-border overflow-hidden">
      <div class="h-50px pl-12px pr-12px box-border flex items-center justify-between bd-title">
        <div class="bd-title-left">
          <p class="m-0 font-600">用户列表</p>
        </div>
        <div class="flex items-center h-50px">
          <el-form inline>
            <el-form-item class="mb-0 !mr-16px">
              <el-input v-model="queryFrom.keyword" placeholder="uid/手机号/用户名" clearable />
            </el-form-item>
            <el-form-item class="mb-0 !mr-0">
              <el-button type="primary" @click="getUserList">查询</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <div class="flex-1 overflow-hidden p-12px">
        <el-table v-loading="loadTable" :data="tableData" :border="true" style="width: 100%; height: 100%">
          <el-table-column type="index" :width="42" :align="'center'" :fixed="'left'">
            <template #header>
              <i-bd-setting class="cursor-pointer" size="16" />
            </template>
          </el-table-column>
          <el-table-column v-for="item in column" v-bind="item" :key="item.prop">
            <template #default="scope">
              <template v-if="item.render">
                <component :is="item.render" :row="scope.row"> </component>
              </template>
              <template v-else-if="item.formatter">
                <slot :name="item.prop" :row="scope.row">{{ item.formatter(scope.row) }}</slot>
              </template>
              <template v-else-if="item.prop">
                <slot :name="item.prop" :row="scope.row">{{ scope.row[item.prop!] }}</slot>
              </template>
            </template>
          </el-table-column>
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
    <!-- 发消息 -->
    <bd-send-msg v-model:value="sendValue" v-bind="sendInfo" />
    <!-- 查看设备 -->
    <Devices v-model:value="devicesValue" :uid="devicesUid" />
    <el-dialog
      v-model="resetPwdVisible"
      title="重置用户密码"
      width="420px"
      append-to-body
      destroy-on-close
      @closed="onResetPwdClosed"
    >
      <div class="mb-12px text-14px">用户：{{ resetPwdUser?.name }}（{{ resetPwdUser?.uid }}）</div>
      <el-input
        v-model="resetPwdForm.p1"
        class="mb-12px"
        type="password"
        show-password
        placeholder="新密码（至少6位）"
        autocomplete="new-password"
      />
      <el-input
        v-model="resetPwdForm.p2"
        type="password"
        show-password
        placeholder="确认新密码"
        autocomplete="new-password"
      />
      <template #footer>
        <el-button @click="resetPwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetPwdLoading" @click="submitResetPwd">确定</el-button>
      </template>
    </el-dialog>
    <!-- 以此用户视角查看：内嵌用户端 Web -->
    <el-dialog
      v-model="viewAsVisible"
      :title="viewAsDialogTitle"
      width="80%"
      top="2vh"
      append-to-body
      destroy-on-close
      class="view-as-user-dialog"
      @closed="onViewAsClosed"
    >
      <iframe
        v-if="viewAsIframeSrc"
        :key="viewAsIframeSrc"
        class="view-as-iframe"
        :src="viewAsIframeSrc"
        title="用户端预览"
      />
    </el-dialog>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 用户列表
  isAffix: false
</route>

<script lang="tsx" setup>
import { useRouter } from 'vue-router';
import {
  ElButton,
  ElSpace,
  ElAvatar,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElMessage,
  ElMessageBox
} from 'element-plus';
import Devices from '@/pages/message/components/Devices.vue';
import { useUserStore } from '@/stores/modules/user';
import { BU_DOU_CONFIG } from '@/config';
// API 接口
import { userListGet, userLiftbanPut, userResetPasswordPost, userImpersonatePost } from '@/api/user';

const router = useRouter();
const userStore = useUserStore();

const isSuperAdmin = () => userStore.userInfo.role === 'superAdmin';

function utf8ToB64(s: string) {
  return btoa(unescape(encodeURIComponent(s)));
}
/**
 * 表格
 */
const column = reactive<Column.ColumnOptions[]>([
  {
    prop: 'name',
    label: '昵称',
    fixed: 'left',
    width: 140
  },
  {
    prop: 'phone',
    label: '手机号',
    fixed: 'left',
    width: 120
  },
  {
    prop: 'username',
    label: '用户',
    width: 120
  },
  {
    prop: 'avatar',
    label: '头像',
    align: 'center',
    width: 80,
    render: (scope: any) => {
      let img_url = '';
      if (scope.row['uid']) {
        img_url = `${BU_DOU_CONFIG.APP_URL}users/${scope.row['uid']}/avatar`;
      }
      return (
        <ElAvatar src={img_url} size={54}>
          {scope.row['name']}
        </ElAvatar>
      );
    }
  },
  {
    prop: 'uid',
    label: '用户ID',
    minWidth: 300
  },
  {
    prop: 'status',
    label: '用户状态',
    width: 86,
    formatter(row: any) {
      return row.status === 1 ? '正常' : '封禁';
    }
  },
  {
    prop: 'short_no',
    label: 'UID',
    width: 180
  },
  {
    prop: 'sex',
    label: '性别',
    width: 60,
    formatter(row: any) {
      return row.sex === 1 ? '男' : '女';
    }
  },
  {
    prop: 'register_time',
    label: '注册时间',
    width: 170
  },
  {
    prop: 'device_name',
    label: '登录设备',
    width: 140
  },
  {
    prop: 'device_model',
    label: '登录设备型号',
    width: 140
  },
  {
    prop: 'online',
    label: '在线状态',
    width: 90,
    formatter(row: any) {
      return row.online === 1 ? '在线' : '离线';
    }
  },
  {
    prop: 'last_online_time',
    label: '最后离线时间',
    width: 150
  },
  {
    prop: 'operation',
    label: '操作',
    align: 'center',
    fixed: 'right',
    width: 220,
    render: (scope: any) => {
      return (
        <ElSpace>
          <ElButton type="primary" onClick={() => onSand(scope.row)}>
            发消息
          </ElButton>
          <ElDropdown
            v-slots={{
              default: () => <ElButton class={'bu-button'}>更多</ElButton>,
              dropdown: () => {
                return (
                  <ElDropdownMenu>
                    <ElDropdownItem onClick={() => onFriends(scope.row)}>
                      <i-bd-every-user class={'mr-4px'} />
                      好友与聊天记录
                    </ElDropdownItem>
                    <ElDropdownItem onClick={() => onUseBlackList(scope.row)}>
                      <i-bd-personal-privacy class={'mr-4px'} />
                      黑名单列表
                    </ElDropdownItem>
                    <ElDropdownItem onClick={() => onUseLiftban(scope.row)}>
                      <i-bd-info class={'mr-4px'} />
                      {scope.row.status === 1 ? '封禁' : '解禁'}
                    </ElDropdownItem>
                    <ElDropdownItem onClick={() => onDevices(scope.row)}>
                      <i-bd-devices class={'mr-4px'} />
                      查看设备
                    </ElDropdownItem>
                    {isSuperAdmin() ? (
                      <ElDropdownItem divided onClick={() => onResetPwdOpen(scope.row)}>
                        <i-bd-lock class={'mr-4px'} />
                        重置密码
                      </ElDropdownItem>
                    ) : null}
                    {isSuperAdmin() ? (
                      <ElDropdownItem onClick={() => onViewAsUser(scope.row)}>
                        <i-bd-user-to-user-transmission class={'mr-4px'} />
                        以此用户视角查看
                      </ElDropdownItem>
                    ) : null}
                  </ElDropdownMenu>
                );
              }
            }}
          />
        </ElSpace>
      );
    }
  }
]);
const tableData = ref<any[]>([]);
const loadTable = ref<boolean>(false);
// 分页
const total = ref(0);

// 查询
const queryFrom = reactive({
  keyword: '',
  page_size: 15,
  page_index: 1
});

const getUserList = () => {
  loadTable.value = true;
  userListGet(queryFrom).then((res: any) => {
    loadTable.value = false;
    tableData.value = res.list;
    total.value = res.count;
  });
};

// 分页page-size
const onSizeChange = (size: number) => {
  queryFrom.page_size = size;
  getUserList();
};

// 分页page-size
const onCurrentChange = (current: number) => {
  queryFrom.page_index = current;
  getUserList();
};

// 发送信息
const sendValue = ref<boolean>(false);
const sendInfo = ref({
  receivederChannelType: 1,
  receiveder: '',
  receivederName: '',
  sender: '',
  senderName: ''
});
const onSand = (item: any) => {
  sendValue.value = true;
  sendInfo.value = {
    receivederChannelType: 1,
    receiveder: item.uid,
    receivederName: item.name,
    sender: userStore.userInfo.uid,
    senderName: userStore.userInfo.name
  };
};

// 好友列表
const onFriends = (item: any) => {
  router.push({
    path: '/user/friends',
    query: {
      uid: item.uid,
      name: item.name
    }
  });
};

// 黑名单列表
const onUseBlackList = (item: any) => {
  router.push({
    path: '/user/userblacklist',
    query: {
      uid: item.uid,
      name: item.name
    }
  });
};

// 用户封禁/解封操作
const onUseLiftban = (item: any) => {
  const text = item.status == 1 ? '封禁' : '解禁';
  ElMessageBox.confirm(`确定要${text}用户${item.name} 吗`, `${text}用户`, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    closeOnClickModal: false,
    type: 'warning'
  })
    .then(() => {
      const fromLiftban = {
        uid: item.uid,
        status: item.status == 1 ? 0 : 1
      };
      userLiftbanPut(fromLiftban)
        .then((_res: any) => {
          getUserList();
          ElMessage({
            type: 'success',
            message: `${text}用户成功！`
          });
        })
        .catch(err => {
          if (err.status == 400) {
            ElMessage.error(err.msg);
          }
        });
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消成功！'
      });
    });
};

// 查看设备
const devicesValue = ref(false);
const devicesUid = ref('');

const onDevices = (item: any) => {
  devicesUid.value = item.uid;
  devicesValue.value = true;
};

// 重置密码（超级管理员）
const resetPwdVisible = ref(false);
const resetPwdLoading = ref(false);
const resetPwdUser = ref<any>(null);
const resetPwdForm = reactive({ p1: '', p2: '' });

const onResetPwdOpen = (row: any) => {
  resetPwdUser.value = row;
  resetPwdForm.p1 = '';
  resetPwdForm.p2 = '';
  resetPwdVisible.value = true;
};

const onResetPwdClosed = () => {
  resetPwdUser.value = null;
  resetPwdForm.p1 = '';
  resetPwdForm.p2 = '';
};

const submitResetPwd = () => {
  if (!resetPwdUser.value?.uid) return;
  if (resetPwdForm.p1.length < 6) {
    ElMessage.warning('密码长度必须大于6位');
    return;
  }
  if (resetPwdForm.p1 !== resetPwdForm.p2) {
    ElMessage.warning('两次输入的密码不一致');
    return;
  }
  resetPwdLoading.value = true;
  userResetPasswordPost({
    uid: resetPwdUser.value.uid,
    new_password: resetPwdForm.p1,
    new_password_confirmation: resetPwdForm.p2
  })
    .then(() => {
      ElMessage.success('重置密码成功');
      resetPwdVisible.value = false;
    })
    .catch((err: any) => {
      if (err?.msg) ElMessage.error(err.msg);
    })
    .finally(() => {
      resetPwdLoading.value = false;
    });
};

// 以此用户视角查看（弹窗内嵌 iframe，超级管理员）
const viewAsVisible = ref(false);
const viewAsDialogTitle = ref('');
const viewAsIframeSrc = ref('');

const onViewAsClosed = () => {
  viewAsIframeSrc.value = '';
  viewAsDialogTitle.value = '';
};

const onViewAsUser = async (row: any) => {
  const clientBase = String((BU_DOU_CONFIG as any).CLIENT_WEB_URL || '').trim();
  if (!clientBase) {
    ElMessage.warning('请先在配置中设置 CLIENT_WEB_URL（用户端 Web 根地址），或在 window.TSDD_CONFIG 中注入');
    return;
  }
  try {
    const r: any = await userImpersonatePost({ uid: row.uid });
    const payload = {
      uid: r.uid,
      token: r.token,
      name: r.name || '',
      short_no: r.short_no || '',
      app_id: r.app_id || '',
      role: '',
      sex: typeof r.sex === 'number' ? r.sex : 0,
      is_work: false
    };
    const frag = 'mgr=' + utf8ToB64(JSON.stringify(payload));
    const base = clientBase.replace(/\/$/, '');
    const sep = base.includes('#') ? '&' : '#';
    viewAsDialogTitle.value = `用户端预览 · ${row.name || row.uid}`;
    viewAsIframeSrc.value = `${base}${sep}${frag}`;
    viewAsVisible.value = true;
  } catch (err: any) {
    if (err?.msg) ElMessage.error(err.msg);
  }
};

// 初始化
onMounted(() => {
  getUserList();
});
</script>

<style lang="scss" scoped>
// 样式
.bd-title {
  border-bottom: 1px solid var(--el-card-border-color);
}
</style>

<style lang="scss">
/* 弹窗内嵌用户端：占满对话框主体区域 */
.view-as-user-dialog .el-dialog__body {
  padding: 0;
  height: calc(100vh - 140px);
  box-sizing: border-box;
}
.view-as-iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
