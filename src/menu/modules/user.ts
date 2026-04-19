const home: Menu.MenuOptions = {
  component: '/user/adduser',
  name: 'use',
  path: '/user',
  meta: {
    icon: 'i-bd-user',
    isAffix: false,
    isFull: false,
    isHide: false,
    isKeepAlive: true,
    isLink: '',
    index: 2,
    title: '用户'
  },
  children: [
    {
      component: '/user/adduser',
      name: 'userAdduser',
      path: '/user/adduser',
      meta: {
        icon: 'i-bd-add-user',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        title: '新增用户'
      }
    },
    {
      component: '/user/userlist',
      name: 'userUserlist',
      path: '/user/userlist',
      meta: {
        icon: 'i-bd-every-user',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        title: '用户列表'
      }
    },
    {
      component: '/user/disablelist',
      name: 'userDisablelist',
      path: '/user/disablelist',
      meta: {
        icon: 'i-bd-wrong-user',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        title: '封禁用户列表'
      }
    },
    {
      component: '/user/agentlist',
      name: 'userAgentlist',
      path: '/user/agentlist',
      meta: {
        icon: 'i-bd-headset',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        title: '客服配置管理'
      }
    },
    {
      component: '/user/invitelist',
      name: 'userInvitelist',
      path: '/user/invitelist',
      meta: {
        icon: 'i-bd-key',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        title: '邀请码管理'
      }
    },
    {
      component: '/user/privilegeusers',
      name: 'userPrivilegeusers',
      path: '/user/privilegeusers',
      meta: {
        icon: 'i-bd-permissions',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        title: '特权用户管理'
      }
    },
    {
      component: '/user/loginiphistory',
      name: 'userLoginiphistory',
      path: '/user/loginiphistory',
      meta: {
        icon: 'i-bd-history-query',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        title: '登录IP历史'
      }
    },
    {
      component: '/user/administrator',
      name: 'userAdministrator',
      path: '/user/administrator',
      meta: {
        icon: 'i-bd-permissions',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        auth: ['superAdmin'],
        title: '管理员管理'
      }
    }
  ]
};
export default home;
