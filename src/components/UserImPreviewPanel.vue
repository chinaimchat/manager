<template>
  <div class="user-im-panel-root">
    <div class="im-shell">
      <aside class="im-sidebar">
        <div class="im-sidebar-head">
          <div class="im-sidebar-title">
            <span class="im-name">{{ displaySubjectName }}</span>
            <el-tag size="small" type="info" effect="plain">管理员预览</el-tag>
          </div>
          <div class="im-sidebar-sub">
            与「好友列表 + 群列表」聊天记录同源；底部输入框以当前登录管理员身份发消息（非模拟该用户）。单聊发信会出现在本窗口同一私聊会话中。
          </div>
          <el-input
            v-model="friendKeyword"
            size="small"
            clearable
            placeholder="搜索好友 / 群名称、UID、群号"
            class="im-search"
            @keyup.enter="loadSessions"
          />
          <el-button size="small" type="primary" class="w-full mt-8px" @click="loadSessions">刷新列表</el-button>
        </div>
        <el-scrollbar v-loading="sessionsLoading" class="im-peer-list">
          <div v-if="displayFriends.length" class="im-section-label">单聊</div>
          <div
            v-for="f in displayFriends"
            :key="'f-' + f.uid"
            class="im-peer"
            :class="{ active: peer?.kind === 'p2p' && peer.uid === f.uid }"
            @click="selectFriend(f)"
          >
            <el-avatar :size="40" :src="avatarUserUrl(f.uid)">{{ (f.remark || f.name || '').slice(0, 1) }}</el-avatar>
            <div class="im-peer-meta">
              <div class="im-peer-name">{{ f.remark || f.name }}</div>
              <div class="im-peer-id text-ellipsis">{{ f.uid }}</div>
            </div>
          </div>

          <div v-if="displayGroups.length" class="im-section-label im-section-label--group">群聊</div>
          <div
            v-for="g in displayGroups"
            :key="'g-' + g.group_no"
            class="im-peer"
            :class="{ active: peer?.kind === 'group' && peer.group_no === g.group_no }"
            @click="selectGroup(g)"
          >
            <el-avatar :size="40" :src="avatarGroupUrl(g.group_no)">{{ (g.name || '群').slice(0, 1) }}</el-avatar>
            <div class="im-peer-meta">
              <div class="im-peer-name">
                <el-tag size="small" type="warning" effect="plain" class="im-tag-group">群</el-tag>
                {{ g.name || g.group_no }}
              </div>
              <div class="im-peer-id text-ellipsis">{{ g.group_no }}</div>
            </div>
          </div>

          <div v-if="!sessionsLoading && displayFriends.length === 0 && displayGroups.length === 0" class="im-empty">暂无会话</div>
        </el-scrollbar>
      </aside>
      <section class="im-main">
        <div class="im-main-split" :class="{ 'is-channel-info-open': showChannelInfo }">
          <div class="im-main-chat">
            <header class="im-chat-head" :class="{ 'is-clickable': !!peer }" @click="onChatHeadClick">
              <template v-if="peer?.kind === 'p2p'">
                <el-avatar :size="44" :src="avatarUserUrl(peer.uid)">{{ (peer.remark || peer.name || '').slice(0, 1) }}</el-avatar>
                <div class="im-chat-head-text">
                  <div class="im-chat-title">{{ peer.remark || peer.name }}</div>
                  <div class="im-chat-sub">{{ peer.uid }}</div>
                </div>
              </template>
              <template v-else-if="peer?.kind === 'group'">
                <el-avatar :size="44" :src="avatarGroupUrl(peer.group_no)">{{ (peer.name || '群').slice(0, 1) }}</el-avatar>
                <div class="im-chat-head-text">
                  <div class="im-chat-title">{{ peer.name || peer.group_no }}</div>
                  <div class="im-chat-sub">{{ peer.group_no }}</div>
                </div>
              </template>
              <template v-else>
                <div class="im-chat-title im-placeholder">请选择左侧会话</div>
              </template>
            </header>
            <div class="im-msg-wrap">
              <div ref="msgViewportRef" v-loading="msgsLoading" class="im-msg-viewport" @scroll.passive="onMsgViewportScroll">
                <div v-if="peer" class="im-msg-inner">
                  <div v-if="olderLoading" class="im-msg-top-hint">加载更早消息…</div>
                  <div v-else-if="hasOlderMore" class="im-msg-top-hint">上滑加载更早消息</div>
                  <div v-else-if="messages.length" class="im-msg-top-hint im-msg-top-hint--muted">没有更多历史</div>
                  <div v-if="msgKeywordActive" class="im-msg-keyword-bar">
                    <span class="im-msg-keyword-bar-text">当前搜索：<b>{{ msgQuery.keyword }}</b></span>
                    <el-button type="primary" link size="small" @click="clearConversationKeywordSearch">清除</el-button>
                  </div>
                  <div
                    v-for="row in displayMessages"
                    :key="row.message_id"
                    class="im-row"
                    :class="rowIsSelf(row) ? 'is-self' : 'is-peer'"
                    :data-msg-id="String(row.message_id ?? '')"
                  >
                    <el-avatar :size="36" :src="avatarUserUrl(row.sender)" class="im-bubble-avatar" />
                    <div class="im-bubble-col">
                      <div class="im-bubble-meta">
                        <span class="im-bubble-name">{{ row.sender_name || row.sender }}</span>
                        <span class="im-bubble-time">{{ row.created_at }}</span>
                      </div>
                      <div class="im-bubble">
                        <template v-if="row.revoke === 1">
                          <span class="im-muted">[已撤回]</span>
                        </template>
                        <template v-else-if="row.is_deleted === 1">
                          <span class="im-muted">[已删除]</span>
                        </template>
                        <template v-else-if="isEncrypt(row)">
                          <span class="im-muted">[加密消息，无法查看]</span>
                        </template>
                        <BdMsg v-else-if="row.payload" :msg="row.payload" />
                      </div>
                    </div>
                  </div>
                  <div v-if="!msgsLoading && displayMessages.length === 0" class="im-empty-main">暂无消息</div>
                </div>
              </div>
            </div>
            <footer v-if="peer && canSendAsAdmin" class="im-footer">
              <div class="im-compose">
                <div class="im-compose-toolbar">
                  <el-popover v-model:visible="emojiPopoverVisible" placement="top-start" :width="300" trigger="click">
                    <template #reference>
                      <button type="button" class="im-compose-tool" title="表情" aria-label="表情">
                        <el-icon><ChatDotRound /></el-icon>
                      </button>
                    </template>
                    <div class="im-emoji-grid">
                      <button
                        v-for="em in EMOJI_PALETTE"
                        :key="em"
                        type="button"
                        class="im-emoji-cell"
                        @click="insertEmoji(em)"
                      >
                        {{ em }}
                      </button>
                    </div>
                  </el-popover>
                  <el-tooltip content="截屏消息请在用户端发送；也可将图片粘贴到输入框" placement="top">
                    <button type="button" class="im-compose-tool" aria-label="截图" @click="onScreenshotToolClick">
                      <el-icon><Crop /></el-icon>
                    </button>
                  </el-tooltip>
                  <el-tooltip content="发送图片" placement="top">
                    <button
                      type="button"
                      class="im-compose-tool"
                      :disabled="uploadingImage || uploadingVideo"
                      aria-label="图片"
                      @click="pickImage"
                    >
                      <el-icon><Picture /></el-icon>
                    </button>
                  </el-tooltip>
                  <el-tooltip content="发送视频" placement="top">
                    <button
                      type="button"
                      class="im-compose-tool"
                      :disabled="uploadingImage || uploadingVideo"
                      aria-label="视频"
                      @click="pickVideo"
                    >
                      <el-icon><VideoCamera /></el-icon>
                    </button>
                  </el-tooltip>
                  <el-tooltip content="文件消息请在用户端发送" placement="top">
                    <button type="button" class="im-compose-tool" aria-label="附件" @click="onAttachmentToolClick">
                      <el-icon><Paperclip /></el-icon>
                    </button>
                  </el-tooltip>
                  <input ref="imgInputRef" type="file" accept="image/*" class="im-hidden-file" @change="onImageChosen" />
                  <input ref="videoInputRef" type="file" accept="video/*" class="im-hidden-file" @change="onVideoChosen" />
                </div>
                <div class="im-compose-input-row">
                  <el-input
                    ref="sendComposeRef"
                    v-model="sendDraft"
                    type="textarea"
                    :autosize="{ minRows: 3, maxRows: 10 }"
                    resize="none"
                    placeholder="按 Ctrl + Enter 换行，按 Enter 发送"
                    class="im-compose-textarea"
                    @keydown.enter.exact="onComposeEnter"
                    @keydown.ctrl.enter.exact="onComposeCtrlEnter"
                    @paste="onComposePaste"
                  />
                  <el-button type="primary" :loading="sendLoading" class="im-compose-send-btn" @click="sendAdminMessage">发送</el-button>
                </div>
              </div>
            </footer>
          </div>

          <!-- 与 Web「点击会话头」一致的右侧「聊天信息」滑层（ChannelSetting） -->
          <aside v-if="peer" class="im-channel-setting" aria-label="聊天信息">
            <div class="im-cs-header">
              <button type="button" class="im-cs-close" aria-label="关闭" @click.stop="closeChannelInfo">×</button>
              <div class="im-cs-title">{{ channelSettingTitle }}</div>
            </div>
            <el-scrollbar class="im-cs-scroll">
              <div class="im-cs-participants">
                <template v-if="peer.kind === 'p2p'">
                  <div class="im-cs-peer">
                    <el-avatar :size="52" :src="avatarUserUrl(peer.uid)">{{ (peer.remark || peer.name || '').slice(0, 1) }}</el-avatar>
                    <span class="im-cs-peer-name">{{ peer.remark || peer.name || peer.uid }}</span>
                  </div>
                </template>
                <template v-else>
                  <div class="im-cs-peer">
                    <el-avatar :size="52" :src="avatarGroupUrl(peer.group_no)">{{ (peer.name || '群').slice(0, 1) }}</el-avatar>
                    <span class="im-cs-peer-name">{{ peer.name || peer.group_no }}</span>
                  </div>
                </template>
                <el-tooltip content="发起群聊、加成员请在用户端操作" placement="top">
                  <button type="button" class="im-cs-add" aria-label="添加">+</button>
                </el-tooltip>
              </div>

              <div class="im-cs-gap" />
              <div class="im-cs-row" role="button" tabindex="0" @click="onChannelSearchClick">查找聊天内容</div>

              <div class="im-cs-gap" />
              <div class="im-cs-row" role="button" tabindex="0" @click="copyChannelId">复制{{ peer.kind === 'p2p' ? ' UID' : '群号' }}</div>
              <div class="im-cs-row" role="button" tabindex="0" @click="findChannelInList">{{ peer.kind === 'p2p' ? '用户列表中查找' : '群列表中查找' }}</div>
              <div v-if="peer.kind === 'p2p'" class="im-cs-row" role="button" tabindex="0" @click="insertPeerMention">在输入框插入 @UID</div>
            </el-scrollbar>
          </aside>
        </div>
      </section>
    </div>

    <!-- 与 Web「查找聊天内容」全局搜索类似：本会话内关键词检索 -->
    <el-dialog
      v-model="showConvSearchDialog"
      title="查找聊天内容"
      width="560px"
      append-to-body
      destroy-on-close
      class="im-conv-search-dialog"
      @opened="onConvSearchDialogOpened"
    >
      <div class="im-csd-body">
        <div class="im-csd-toolbar">
          <el-input
            ref="convSearchInputRef"
            v-model="convSearchDraft"
            clearable
            placeholder="输入关键词，搜索本会话记录"
            @keyup.enter="runConvSearchDialog"
          />
          <el-button type="primary" :loading="convSearchLoading" @click="runConvSearchDialog">搜索</el-button>
        </div>
        <div v-loading="convSearchLoading" class="im-csd-list-wrap">
          <el-scrollbar max-height="380px">
            <div v-if="!convSearchLoading && convSearchResults.length === 0" class="im-csd-empty">
              输入关键词后点击「搜索」，结果将显示在下方；点击一条可定位到会话中的位置。
            </div>
            <button
              v-for="row in convSearchResults"
              :key="row.message_id"
              type="button"
              class="im-csd-item"
              @click="applyConvSearchHit(row)"
            >
              <div class="im-csd-meta">{{ row.created_at }} · {{ row.sender_name || row.sender }}</div>
              <div class="im-csd-digest">{{ messageDigest(row) }}</div>
            </button>
          </el-scrollbar>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ChatDotRound, Crop, Picture, VideoCamera, Paperclip } from '@element-plus/icons-vue';
import BdMsg from '@/components/BdMsg/index.vue';
import { BU_DOU_CONFIG } from '@/config';
import { userFriendsGet } from '@/api/user';
import { messageImageUploadPost, messageRecordpersonalGet, messageRecordGet, messageSendPost } from '@/api/message';
import { groupMemberGroupsGet } from '@/api/group';
import { useUserStore } from '@/stores/modules/user';

type P2pPeer = { kind: 'p2p'; uid: string; name: string; remark?: string };
type GroupPeer = { kind: 'group'; group_no: string; name: string };
type SessionPeer = P2pPeer | GroupPeer | null;

const MSG_PAGE_SIZE = 30;
const SCROLL_TOP_LOAD_THRESHOLD = 250;

const props = defineProps<{
  uid: string;
  name?: string;
}>();

const userStore = useUserStore();
const router = useRouter();
const subjectUidStr = computed(() => String(props.uid || '').trim());
const displaySubjectName = computed(() => String(props.name || '').trim() || subjectUidStr.value || '用户');

const friendKeyword = ref('');
const friends = ref<any[]>([]);
const groups = ref<any[]>([]);
const sessionsLoading = ref(false);
const peer = ref<SessionPeer>(null);

/** 与 Web 会话页一致：点击标题栏切换右侧「聊天信息」 */
const showChannelInfo = ref(false);
const msgViewportRef = ref<HTMLElement | null>(null);
const msgsLoading = ref(false);
const olderLoading = ref(false);
const msgTotal = ref(0);
const messages = ref<any[]>([]);
const msgQuery = reactive({
  keyword: '',
  page_size: MSG_PAGE_SIZE
});
const nextOlderPage = ref(2);
const hasOlderMore = ref(true);
let olderLoadTimer: ReturnType<typeof setTimeout> | null = null;

/** 与 Web「查找聊天内容」一致：弹窗内检索当前会话 */
const showConvSearchDialog = ref(false);
const convSearchDraft = ref('');
const convSearchResults = ref<any[]>([]);
const convSearchLoading = ref(false);
const convSearchInputRef = ref<any>(null);

const msgKeywordActive = computed(() => !!String(msgQuery.keyword || '').trim());

const sendDraft = ref('');
const sendLoading = ref(false);
const uploadingImage = ref(false);
const uploadingVideo = ref(false);
const imgInputRef = ref<HTMLInputElement | null>(null);
const videoInputRef = ref<HTMLInputElement | null>(null);
const sendComposeRef = ref<any>(null);
const emojiPopoverVisible = ref(false);

/** 与 Web 输入栏表情入口类似：常用表情一键插入 */
const EMOJI_PALETTE = [
  '😀',
  '😃',
  '😄',
  '😁',
  '😅',
  '😂',
  '🤣',
  '😊',
  '😇',
  '🙂',
  '😉',
  '😍',
  '🥰',
  '😘',
  '😋',
  '😎',
  '🤔',
  '😢',
  '😭',
  '😤',
  '👍',
  '👎',
  '👏',
  '🙏',
  '💪',
  '🔥',
  '❤️',
  '✨',
  '⭐',
  '🎉',
  '💯'
];

const canSendAsAdmin = computed(() => userStore.userInfo?.role === 'superAdmin');

const channelSettingTitle = computed(() => {
  const p = peer.value;
  if (!p) return '聊天信息';
  if (p.kind === 'p2p') return '聊天信息（1）';
  return '聊天信息（群聊）';
});

const kw = () => friendKeyword.value.trim().toLowerCase();

const displayFriends = computed(() => {
  const k = kw();
  if (!k) return friends.value;
  return friends.value.filter(
    (f: any) =>
      String(f.uid || '')
        .toLowerCase()
        .includes(k) ||
      String(f.name || '')
        .toLowerCase()
        .includes(k) ||
      String(f.remark || '')
        .toLowerCase()
        .includes(k)
  );
});

const displayGroups = computed(() => {
  const k = kw();
  if (!k) return groups.value;
  return groups.value.filter(
    (g: any) =>
      String(g.group_no || '')
        .toLowerCase()
        .includes(k) ||
      String(g.name || '')
        .toLowerCase()
        .includes(k)
  );
});

const avatarUserUrl = (uid: string) => {
  if (!uid) return '';
  return `${BU_DOU_CONFIG.APP_URL}users/${uid}/avatar`;
};

const avatarGroupUrl = (groupNo: string) => {
  if (!groupNo) return '';
  return `${BU_DOU_CONFIG.APP_URL}groups/${groupNo}/avatar`;
};

/** 接口按时间倒序分页；内存中保持时间正序，列表自上而下由旧到新（与 Web 会话区一致） */
const displayMessages = computed(() => messages.value || []);

function messageSortKey(m: any): number {
  const id = Number(m?.message_id);
  if (Number.isFinite(id) && id > 0) return id;
  return 0;
}

function sortMessagesAsc(list: any[]) {
  return [...list].sort((a, b) => messageSortKey(a) - messageSortKey(b));
}

function mergeMessagesDedupeAsc(a: any[], b: any[]) {
  const byId = new Map<string, any>();
  for (const m of [...(a || []), ...(b || [])]) {
    const id = String(m?.message_id || '');
    if (!id) continue;
    if (!byId.has(id)) byId.set(id, m);
  }
  return sortMessagesAsc([...byId.values()]);
}

async function copyText(label: string, text: string) {
  const t = String(text || '').trim();
  if (!t) {
    ElMessage.warning(`${label}为空`);
    return;
  }
  try {
    await navigator.clipboard.writeText(t);
    ElMessage.success('已复制到剪贴板');
  } catch {
    ElMessage.error('复制失败，请手动选择复制');
  }
}

function onChatHeadClick() {
  if (!peer.value) return;
  showChannelInfo.value = !showChannelInfo.value;
}

function closeChannelInfo() {
  showChannelInfo.value = false;
}

function onChannelSearchClick() {
  if (!peer.value) return;
  showChannelInfo.value = false;
  convSearchDraft.value = String(msgQuery.keyword || '');
  convSearchResults.value = [];
  showConvSearchDialog.value = true;
}

function onConvSearchDialogOpened() {
  void nextTick(() => convSearchInputRef.value?.focus?.());
}

function messageDigest(row: any): string {
  if (!row) return '';
  if (row.revoke === 1) return '[已撤回]';
  if (row.is_deleted === 1) return '[已删除]';
  if (row.signal === 1 || row.is_encrypt === 1) return '[加密消息]';
  const pl = row.payload;
  if (pl && typeof pl === 'object') {
    const t = Number(pl.type);
    if (t === 1 && pl.content) return String(pl.content).slice(0, 200);
    if (t === 2) return '[图片]';
    if (t === 5) return '[视频]';
    if (t === 8) return `[文件] ${pl.name || pl.title || ''}`;
  }
  if (row.content) return String(row.content).slice(0, 200);
  return '[消息]';
}

async function runConvSearchDialog() {
  if (!peer.value) return;
  const q = convSearchDraft.value.trim();
  if (!q) {
    ElMessage.info('请输入关键词');
    return;
  }
  convSearchLoading.value = true;
  try {
    const res: any = await fetchMessagePage(1, { keyword: q });
    const pageDesc = res?.list || [];
    convSearchResults.value = sortMessagesAsc(pageListToAsc(pageDesc));
    if (!convSearchResults.value.length) {
      ElMessage.info('未找到匹配记录，可尝试其它关键词');
    }
  } catch (e: any) {
    if (e?.msg) ElMessage.error(e.msg);
    convSearchResults.value = [];
  } finally {
    convSearchLoading.value = false;
  }
}

async function applyConvSearchHit(row: any) {
  const q = convSearchDraft.value.trim();
  if (!q || !peer.value) return;
  const mid = String(row?.message_id ?? '');
  showConvSearchDialog.value = false;
  msgQuery.keyword = q;
  await reloadMessagesFromLatest();
  if (mid) {
    await scrollToMessageById(mid);
  }
}

async function scrollToMessageById(mid: string) {
  await nextTick();
  const vp = msgViewportRef.value;
  if (!vp || !mid) return;
  const el = vp.querySelector(`[data-msg-id="${mid}"]`) as HTMLElement | null;
  el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

async function clearConversationKeywordSearch() {
  msgQuery.keyword = '';
  await reloadMessagesFromLatest();
}

function copyChannelId() {
  const p = peer.value;
  if (!p) return;
  if (p.kind === 'p2p') void copyText('UID', p.uid);
  else void copyText('群号', p.group_no);
}

function findChannelInList() {
  const p = peer.value;
  if (!p) return;
  if (p.kind === 'p2p') void router.push({ path: '/user/userlist', query: { keyword: p.uid } });
  else void router.push({ path: '/group/grouplist', query: { keyword: p.group_no } });
}

function insertPeerMention() {
  const p = peer.value;
  if (!p || p.kind !== 'p2p') return;
  const at = `@${p.uid} `;
  sendDraft.value = sendDraft.value ? `${sendDraft.value}${at}` : at;
  ElMessage.success('已插入到输入框');
}

function rowIsSelf(row: any) {
  const uid = String(row?.sender || '');
  return uid === subjectUidStr.value || uid === String(userStore.userInfo?.uid || '');
}

function isEncrypt(row: any) {
  return row?.signal === 1 || row?.is_encrypt === 1;
}

function selectFriend(f: any) {
  peer.value = {
    kind: 'p2p',
    uid: f.uid,
    name: f.name || '',
    remark: f.remark
  };
  void reloadMessagesFromLatest();
}

function selectGroup(g: any) {
  peer.value = {
    kind: 'group',
    group_no: g.group_no,
    name: g.name || ''
  };
  void reloadMessagesFromLatest();
}

async function loadSessions() {
  if (!subjectUidStr.value) {
    return;
  }
  sessionsLoading.value = true;
  peer.value = null;
  messages.value = [];
  msgTotal.value = 0;
  try {
    const [fr, gr] = await Promise.all([
      userFriendsGet({
        uid: subjectUidStr.value,
        keyword: '',
        sort_type: 1,
        page_size: 500,
        page_index: 1
      }),
      groupMemberGroupsGet({ uid: subjectUidStr.value })
    ]);
    friends.value = Array.isArray(fr) ? fr : fr?.list || [];
    groups.value = Array.isArray(gr) ? gr : gr?.list || [];

    const fk = friendKeyword.value.trim();
    const firstF = fk
      ? friends.value.find(
          (f: any) =>
            String(f.uid || '').includes(fk) ||
            String(f.name || '').includes(fk) ||
            String(f.remark || '').includes(fk)
        )
      : friends.value[0];
    const firstG = fk
      ? groups.value.find((g: any) => String(g.group_no || '').includes(fk) || String(g.name || '').includes(fk))
      : groups.value[0];

    if (firstF) {
      selectFriend(firstF);
    } else if (firstG) {
      selectGroup(firstG);
    }
  } catch (e: any) {
    if (e?.msg) ElMessage.error(e.msg);
    friends.value = [];
    groups.value = [];
  } finally {
    sessionsLoading.value = false;
  }
}

async function sendAdminMessage() {
  const text = sendDraft.value.trim();
  const p = peer.value;
  if (!text || !p || !subjectUidStr.value) {
    if (p && !text) ElMessage.info('请输入要发送的内容');
    return;
  }
  const u = userStore.userInfo;
  if (!u?.uid) {
    ElMessage.error('未获取到登录管理员信息');
    return;
  }
  const body: Record<string, unknown> = {
    sender: u.uid,
    sender_name: u.name || u.uid,
    received_channel_id: p.kind === 'p2p' ? p.uid : p.group_no,
    received_channel_type: p.kind === 'p2p' ? 1 : 2,
    content: text
  };
  if (p.kind === 'p2p') {
    body.conversation_subject_uid = subjectUidStr.value;
  }
  sendLoading.value = true;
  try {
    const res: any = await messageSendPost(body);
    if (res?.status === 200) {
      ElMessage.success('发送成功');
      sendDraft.value = '';
      await loadMessagesExpectingNew();
    } else {
      ElMessage.error(res?.msg || '发送失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || '发送失败');
  } finally {
    sendLoading.value = false;
  }
}

async function sendImageMessage(file: File) {
  const p = peer.value;
  const u = userStore.userInfo;
  if (!p || !subjectUidStr.value || !u?.uid) return;
  uploadingImage.value = true;
  try {
    const uploadRes: any = await messageImageUploadPost(file);
    const imgPath = String(uploadRes?.path || uploadRes?.data?.path || '').trim();
    if (!imgPath) {
      ElMessage.error('图片上传成功但未返回路径');
      return;
    }
    const body: Record<string, unknown> = {
      sender: u.uid,
      sender_name: u.name || u.uid,
      received_channel_id: p.kind === 'p2p' ? p.uid : p.group_no,
      received_channel_type: p.kind === 'p2p' ? 1 : 2,
      content: '',
      payload: {
        type: 2,
        url: imgPath,
        from_uid: u.uid
      }
    };
    if (p.kind === 'p2p') {
      body.conversation_subject_uid = subjectUidStr.value;
    }
    const res: any = await messageSendPost(body);
    if (res?.status === 200) {
      ElMessage.success('图片发送成功');
      await loadMessagesExpectingNew();
    } else {
      ElMessage.error(res?.msg || '图片发送失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || '图片发送失败');
  } finally {
    uploadingImage.value = false;
  }
}

async function sendVideoMessage(file: File) {
  const p = peer.value;
  const u = userStore.userInfo;
  if (!p || !subjectUidStr.value || !u?.uid) return;
  uploadingVideo.value = true;
  try {
    const uploadRes: any = await messageImageUploadPost(file);
    const vidPath = String(uploadRes?.path || uploadRes?.data?.path || '').trim();
    if (!vidPath) {
      ElMessage.error('视频上传成功但未返回路径');
      return;
    }
    const body: Record<string, unknown> = {
      sender: u.uid,
      sender_name: u.name || u.uid,
      received_channel_id: p.kind === 'p2p' ? p.uid : p.group_no,
      received_channel_type: p.kind === 'p2p' ? 1 : 2,
      content: '',
      payload: {
        type: 5,
        url: vidPath,
        from_uid: u.uid
      }
    };
    if (p.kind === 'p2p') {
      body.conversation_subject_uid = subjectUidStr.value;
    }
    const res: any = await messageSendPost(body);
    if (res?.status === 200) {
      ElMessage.success('视频发送成功');
      await loadMessagesExpectingNew();
    } else {
      ElMessage.error(res?.msg || '视频发送失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || '视频发送失败');
  } finally {
    uploadingVideo.value = false;
  }
}

function getComposeTextarea(): HTMLTextAreaElement | null {
  const root = sendComposeRef.value?.$el as HTMLElement | undefined;
  return root?.querySelector?.('textarea') ?? null;
}

function insertEmoji(em: string) {
  sendDraft.value = (sendDraft.value || '') + em;
  emojiPopoverVisible.value = false;
  void nextTick(() => getComposeTextarea()?.focus());
}

function onComposeEnter(ev: KeyboardEvent) {
  if (ev.isComposing) return;
  ev.preventDefault();
  void sendAdminMessage();
}

function onComposeCtrlEnter(ev: KeyboardEvent) {
  if (ev.isComposing) return;
  ev.preventDefault();
  onComposeInsertNewline();
}

function onComposeInsertNewline() {
  const ta = getComposeTextarea();
  const v = sendDraft.value || '';
  if (!ta) {
    sendDraft.value = `${v}\n`;
    return;
  }
  const start = ta.selectionStart ?? v.length;
  const end = ta.selectionEnd ?? v.length;
  sendDraft.value = v.slice(0, start) + '\n' + v.slice(end);
  void nextTick(() => {
    const el = getComposeTextarea();
    if (!el) return;
    const pos = start + 1;
    el.focus();
    el.setSelectionRange(pos, pos);
  });
}

async function onComposePaste(ev: ClipboardEvent) {
  const items = ev.clipboardData?.files;
  if (!items?.length) return;
  const file = items[0];
  if (!file.type.startsWith('image/')) return;
  ev.preventDefault();
  await sendImageMessage(file);
}

function onScreenshotToolClick() {
  ElMessage.info('截屏消息请在用户端发送；也可将图片粘贴到输入框');
}

function onAttachmentToolClick() {
  ElMessage.info('文件消息请在用户端发送');
}

function pickImage() {
  imgInputRef.value?.click();
}

function pickVideo() {
  videoInputRef.value?.click();
}

function onImageChosen(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件');
    input.value = '';
    return;
  }
  void sendImageMessage(file);
  input.value = '';
}

function onVideoChosen(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('video/')) {
    ElMessage.warning('请选择视频文件');
    input.value = '';
    return;
  }
  void sendVideoMessage(file);
  input.value = '';
}

/** 发送后 IM 落库/扩展表可能略晚于接口返回，多刷几次直到出现新 message_id */
async function loadMessagesExpectingNew() {
  const baseline = new Set((messages.value || []).map((m: any) => String(m.message_id || '')));
  for (let i = 0; i < 10; i++) {
    await loadMessages();
    const list = messages.value || [];
    if (list.some((m: any) => !baseline.has(String(m.message_id || '')))) {
      return;
    }
    await new Promise((r) => setTimeout(r, 100 + i * 90));
  }
}

/** 将单页接口列表（新→旧）转为内存正序（旧→新） */
function pageListToAsc(list: any[]) {
  const raw = [...(list || [])];
  return raw.reverse();
}

async function fetchMessagePage(pageIndex: number, opts?: { keyword?: string }) {
  const p = peer.value;
  if (!p || !subjectUidStr.value) return { list: [] as any[], count: 0 };
  const kw =
    opts?.keyword !== undefined ? String(opts.keyword ?? '').trim() : String(msgQuery.keyword || '').trim();
  if (p.kind === 'p2p') {
    const params: Record<string, unknown> = {
      uid: subjectUidStr.value,
      touid: p.uid,
      keyword: kw,
      page_size: msgQuery.page_size,
      page_index: pageIndex
    };
    if (canSendAsAdmin.value) {
      params.blend_admin_sends = 1;
    }
    return messageRecordpersonalGet(params) as Promise<any>;
  }
  return messageRecordGet({
    channel_id: p.group_no,
    keyword: kw,
    page_size: msgQuery.page_size,
    page_index: pageIndex
  }) as Promise<any>;
}

function scrollMsgViewportToBottom() {
  const el = msgViewportRef.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}

/** 重置并只拉取「最新一页」（换会话、发送后等） */
async function reloadMessagesFromLatest() {
  const p = peer.value;
  if (!p || !subjectUidStr.value) {
    messages.value = [];
    msgTotal.value = 0;
    hasOlderMore.value = false;
    nextOlderPage.value = 2;
    return;
  }
  msgsLoading.value = true;
  nextOlderPage.value = 2;
  hasOlderMore.value = true;
  try {
    const res: any = await fetchMessagePage(1);
    const pageDesc = res?.list || [];
    messages.value = sortMessagesAsc(pageListToAsc(pageDesc));
    msgTotal.value = res?.count ?? 0;
    hasOlderMore.value = pageDesc.length >= msgQuery.page_size;
    await nextTick();
    scrollMsgViewportToBottom();
  } catch (e: any) {
    if (e?.msg) ElMessage.error(e.msg);
    messages.value = [];
    msgTotal.value = 0;
    hasOlderMore.value = false;
  } finally {
    msgsLoading.value = false;
  }
}

/** 与 loadMessagesExpectingNew 等内部调用兼容 */
async function loadMessages() {
  await reloadMessagesFromLatest();
}

function onMsgViewportScroll(ev: Event) {
  const el = ev.target as HTMLElement;
  if (!el || olderLoading.value || msgsLoading.value || !hasOlderMore.value || !peer.value) return;
  if (el.scrollTop > SCROLL_TOP_LOAD_THRESHOLD) return;
  if (olderLoadTimer) clearTimeout(olderLoadTimer);
  olderLoadTimer = setTimeout(() => {
    olderLoadTimer = null;
    void loadOlderMessages();
  }, 120);
}

async function loadOlderMessages() {
  const p = peer.value;
  const el = msgViewportRef.value;
  if (!p || !subjectUidStr.value || !el || olderLoading.value || msgsLoading.value || !hasOlderMore.value) return;
  const pageIndex = nextOlderPage.value;
  olderLoading.value = true;
  const prevHeight = el.scrollHeight;
  const prevTop = el.scrollTop;
  try {
    const res: any = await fetchMessagePage(pageIndex);
    const pageDesc = res?.list || [];
    if (!pageDesc.length) {
      hasOlderMore.value = false;
      return;
    }
    const olderAsc = pageListToAsc(pageDesc);
    messages.value = mergeMessagesDedupeAsc(olderAsc, messages.value);
    if (pageDesc.length < msgQuery.page_size) {
      hasOlderMore.value = false;
    } else {
      nextOlderPage.value = pageIndex + 1;
    }
    await nextTick();
    const nextHeight = el.scrollHeight;
    el.scrollTop = nextHeight - prevHeight + prevTop;
  } catch (e: any) {
    if (e?.msg) ElMessage.error(e.msg);
    hasOlderMore.value = false;
  } finally {
    olderLoading.value = false;
  }
}

watch(
  () => subjectUidStr.value,
  (id) => {
    if (id) {
      friendKeyword.value = '';
      void loadSessions();
    }
  },
  { immediate: true }
);

watch(peer, () => {
  showChannelInfo.value = false;
  showConvSearchDialog.value = false;
  convSearchDraft.value = '';
  convSearchResults.value = [];
  msgQuery.keyword = '';
});
</script>

<style lang="scss" scoped>
.user-im-panel-root {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.im-shell {
  display: flex;
  flex: 1;
  min-height: 0;
  border-radius: 0;
  overflow: hidden;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
}
.im-sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e8e8e8;
  background: #f7f7f7;
}
.im-sidebar-head {
  padding: 14px 12px;
  border-bottom: 1px solid #e8e8e8;
  background: linear-gradient(180deg, #fafafa 0%, #f4f4f4 100%);
}
.im-sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.im-name {
  font-weight: 600;
  font-size: 15px;
  color: #1a1a1a;
}
.im-sidebar-sub {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
  margin-bottom: 10px;
  line-height: 1.45;
}
.im-search {
  width: 100%;
}
.mt-8px {
  margin-top: 8px;
}
.im-peer-list {
  flex: 1;
  min-height: 0;
}
.im-section-label {
  padding: 8px 14px 4px;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  letter-spacing: 0.02em;
}
.im-section-label--group {
  margin-top: 4px;
}
.im-peer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid #ededed;
  transition: background 0.15s;
  &:hover {
    background: #efefef;
  }
  &.active {
    background: #fff;
    box-shadow: inset 3px 0 0 var(--el-color-primary);
  }
}
.im-peer-meta {
  flex: 1;
  min-width: 0;
}
.im-peer-name {
  font-size: 14px;
  font-weight: 500;
  color: #222;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.im-tag-group {
  flex-shrink: 0;
}
.im-peer-id {
  font-size: 12px;
  color: #999;
}
.im-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
}
.im-main-split {
  --im-channel-setting-w: 300px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  transition: grid-template-columns 0.18s ease-in-out;
  &.is-channel-info-open {
    grid-template-columns: minmax(0, 1fr) var(--im-channel-setting-w);
  }
}
.im-main-chat {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.im-channel-setting {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ededed;
  border-left: 1px solid #dcdcdc;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.06);
}
.im-cs-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 10px 12px 6px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}
.im-cs-close {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #707579;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #333;
  }
}
.im-cs-title {
  flex: 1;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #222;
  padding-right: 36px;
  box-sizing: border-box;
}
.im-cs-scroll {
  flex: 1;
  min-height: 0;
  :deep(.el-scrollbar__view) {
    padding-bottom: 16px;
  }
}
.im-cs-participants {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 16px 8px;
  background: #fff;
}
.im-cs-peer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  max-width: 88px;
}
.im-cs-peer-name {
  font-size: 13px;
  color: #333;
  text-align: center;
  word-break: break-all;
  line-height: 1.35;
}
.im-cs-add {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px dashed #c8c8c8;
  background: #fafafa;
  color: #999;
  font-size: 28px;
  line-height: 1;
  cursor: default;
  flex-shrink: 0;
  margin-top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.im-cs-gap {
  height: 8px;
  background: #ededed;
  border-top: 1px solid #e4e4e4;
  border-bottom: 1px solid #e4e4e4;
}
.im-cs-row {
  padding: 14px 16px;
  font-size: 15px;
  color: #222;
  background: #fff;
  border-bottom: 1px solid #efefef;
  cursor: pointer;
  user-select: none;
  &:active {
    background: #f5f5f5;
  }
}
.im-chat-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
  flex-shrink: 0;
  &.is-clickable {
    cursor: pointer;
    &:hover {
      background: #f3f3f3;
    }
  }
}
.im-chat-head-text {
  min-width: 0;
}
.im-chat-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}
.im-chat-sub {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}
.im-placeholder {
  color: #999;
  font-weight: 500;
}
.im-msg-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #eceff1;
}
.im-msg-viewport {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}
.im-msg-top-hint {
  text-align: center;
  font-size: 12px;
  color: #888;
  padding: 8px 12px 4px;
}
.im-msg-top-hint--muted {
  color: #aaa;
}
.im-msg-keyword-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 4px 0 10px;
  padding: 8px 12px;
  font-size: 13px;
  color: #555;
  background: #fff8e6;
  border: 1px solid #ffe0a3;
  border-radius: 8px;
}
.im-msg-keyword-bar-text {
  min-width: 0;
  word-break: break-all;
}
.im-msg-inner {
  padding: 16px 20px 24px;
  min-height: 120px;
}
.im-row {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  align-items: flex-start;
  &.is-self {
    flex-direction: row-reverse;
    .im-bubble-col {
      align-items: flex-end;
    }
    .im-bubble {
      background: var(--el-color-primary);
      color: #fff;
      border-radius: 12px 4px 12px 12px;
      :deep(span) {
        color: #fff;
      }
    }
    .im-bubble-meta {
      flex-direction: row-reverse;
    }
  }
  &.is-peer .im-bubble {
    background: #fff;
    border-radius: 4px 12px 12px 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }
}
.im-hidden-file {
  display: none;
}
.im-bubble-col {
  display: flex;
  flex-direction: column;
  max-width: min(560px, calc(100% - 52px));
}
.im-bubble-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}
.im-bubble-name {
  font-weight: 500;
  color: #555;
}
.im-bubble {
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
.im-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 14px;
  border-top: 1px solid #e8e8e8;
  background: #fafafa;
}
.im-compose {
  width: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 -2px 10px rgba(114, 114, 114, 0.06);
  border: 1px solid #ececec;
  overflow: hidden;
}
.im-compose-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 40px;
  padding: 0 6px 0 10px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}
.im-compose-tool {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-color-primary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  &:hover:not(:disabled) {
    background: rgba(var(--el-color-primary-rgb), 0.08);
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}
.im-compose-input-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 8px 10px 10px;
  background: #fff;
}
.im-compose-textarea {
  flex: 1;
  min-width: 0;
  :deep(.el-textarea__inner) {
    min-height: 72px !important;
    border: none;
    box-shadow: none;
    padding: 6px 4px;
    font-size: 14px;
    line-height: 1.5;
    resize: none;
    &:focus {
      box-shadow: none;
    }
  }
}
.im-compose-send-btn {
  flex-shrink: 0;
  margin-bottom: 2px;
}
.im-emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 220px;
  overflow-y: auto;
}
.im-emoji-cell {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: #f5f5f5;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  &:hover {
    background: #eaeaea;
  }
}
.im-empty,
.im-empty-main {
  padding: 28px 12px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
.im-muted {
  color: #999;
}
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.im-csd-body {
  padding: 0 4px 8px;
}
.im-csd-toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
  .el-input {
    flex: 1;
    min-width: 0;
  }
}
.im-csd-list-wrap {
  min-height: 120px;
}
.im-csd-empty {
  padding: 24px 12px;
  text-align: center;
  font-size: 13px;
  color: #999;
  line-height: 1.5;
}
.im-csd-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 12px 10px;
  margin: 0;
  border: none;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  cursor: pointer;
  border-radius: 0;
  &:hover {
    background: #f7f9fc;
  }
}
.im-csd-meta {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}
.im-csd-digest {
  font-size: 14px;
  color: #222;
  line-height: 1.45;
  word-break: break-word;
}
</style>
