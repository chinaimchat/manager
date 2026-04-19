<template>
  <bd-page class="flex-col">
    <div class="flex-1 el-card border-none flex-col box-border overflow-hidden">
      <div class="h-50px pl-12px pr-12px box-border flex items-center justify-between bd-title">
        <div class="bd-title-left">
          <p class="m-0 font-600">{{ isEdit ? '编辑邀请码' : '添加邀请码' }}</p>
        </div>
      </div>
      <div class="flex-1 overflow-auto p-12px">
        <div class="w-560px">
          <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
            <el-form-item label="邀请码" prop="code">
              <el-input v-model="form.code" :disabled="isEdit" maxlength="20" show-word-limit />
            </el-form-item>
            <el-form-item label="名称/备注" prop="name">
              <el-input v-model="form.name" maxlength="100" show-word-limit />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="自动加群配置">
              <el-select
                v-model="form.groups"
                multiple
                filterable
                placeholder="请选择自动加入的群组"
                style="width: 100%"
                :loading="groupsLoading"
              >
                <el-option v-for="item in groupOptions" :key="item.group_no" :label="`${item.name} (${item.group_no})`" :value="item.group_no" />
              </el-select>
            </el-form-item>
            <el-form-item label="自动加好友">
              <el-select
                v-model="form.friends"
                multiple
                filterable
                placeholder="请选择自动添加的好友"
                style="width: 100%"
                :loading="friendsLoading"
              >
                <el-option v-for="item in friendOptions" :key="item.uid" :label="`${item.name || item.uid} (${item.uid})`" :value="item.uid" />
              </el-select>
            </el-form-item>
            <el-form-item label="系统欢迎词">
              <el-input v-model="form.system_welcome" type="textarea" :rows="4" placeholder="用户注册后，系统账号将发送欢迎词（可选）" />
            </el-form-item>
            <el-form-item>
              <el-button @click="router.back()">取消</el-button>
              <el-button :loading="submitting" type="primary" @click="onSubmit">保存</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 邀请码编辑
  isAffix: false
</route>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { inviteCodeCreate, inviteCodeDetail, inviteCodeUpdate } from '@/api/invite';
import { groupListGet } from '@/api/group';
import { userFriendsGet } from '@/api/user';

const router = useRouter();
const route = useRoute();
const isEdit = computed(() => route.query.mode === 'edit');

const formRef = ref();
const submitting = ref(false);
const form = reactive({
  code: '',
  name: '',
  status: 1,
  groups: [] as string[],
  friends: [] as string[],
  system_welcome: ''
});
const formRules = {
  code: [{ required: true, message: '请输入邀请码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const initData = () => {
  form.code = String(route.query.code || '');
  form.name = String(route.query.name || '');
  form.status = Number(route.query.status || 1);
};

const groupsLoading = ref(false);
const groupOptions = ref<any[]>([]);
const friendsLoading = ref(false);
const friendOptions = ref<any[]>([]);

const loadGroupOptions = () => {
  groupsLoading.value = true;
  groupListGet({ page_index: 1, page_size: 200 })
    .then((r: any) => {
      groupOptions.value = Array.isArray(r?.data) ? r.data : [];
    })
    .finally(() => {
      groupsLoading.value = false;
    });
};

const loadFriendOptions = () => {
  friendsLoading.value = true;
  userFriendsGet({ page_index: 1, page_size: 200 })
    .then((r: any) => {
      friendOptions.value = Array.isArray(r?.data) ? r.data : [];
    })
    .finally(() => {
      friendsLoading.value = false;
    });
};

const loadDetail = () => {
  if (!isEdit.value || !form.code) return;
  inviteCodeDetail(form.code)
    .then((r: any) => {
      const data = r?.data || r || {};
      form.name = String(data?.name || form.name || '');
      form.status = Number(data?.status ?? form.status);
      form.groups = Array.isArray(data?.groups)
        ? data.groups.map((g: any) => String(g?.group_no || g)).filter(Boolean)
        : [];
      form.friends = Array.isArray(data?.friends)
        ? data.friends.map((f: any) => String(f?.friend_uid || f?.uid || f)).filter(Boolean)
        : [];
      form.system_welcome = String(data?.system_welcome || '');
    })
    .catch(() => {});
};

const onSubmit = () => {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) return;
    submitting.value = true;
    const payload = {
      code: form.code,
      invite_code: form.code,
      name: form.name,
      remark: form.name,
      status: form.status,
      groups: form.groups,
      friends: form.friends,
      system_welcome: form.system_welcome
    };
    const req = isEdit.value ? inviteCodeUpdate(payload) : inviteCodeCreate(payload);
    req
      .then(() => {
        ElMessage.success(isEdit.value ? '更新成功' : '添加成功');
        router.push('/user/invitelist');
      })
      .catch((e: any) => {
        ElMessage.error(e?.msg || (isEdit.value ? '更新失败' : '添加失败'));
      })
      .finally(() => {
        submitting.value = false;
      });
  });
};

onMounted(() => {
  initData();
  loadGroupOptions();
  loadFriendOptions();
  loadDetail();
});
</script>
