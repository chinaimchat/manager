const home: Menu.MenuOptions = {
  component: '/message/sendmsglist',
  name: 'message',
  path: '/message',
  meta: {
    icon: 'i-bd-message',
    isAffix: false,
    isFull: false,
    isHide: false,
    isKeepAlive: true,
    isLink: '',
    index: 4,
    title: '系统通知'
  },
  children: [
    {
      component: '/message/sendmsglist',
      name: 'messageSendmsglist',
      path: '/message/sendmsglist',
      meta: {
        icon: 'i-bd-communication',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        title: '系统通知记录'
      }
    },
    {
      component: '/message/prohibitwords',
      name: 'messageProhibitwords',
      path: '/message/prohibitwords',
      meta: {
        icon: 'i-bd-message-security',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        title: '违禁词列表'
      }
    },
    {
      component: '/message/sensitivewords',
      name: 'messageSensitivewords',
      path: '/message/sensitivewords',
      meta: {
        icon: 'i-bd-shield',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        title: '敏感词管理'
      }
    }
  ]
};
export default home;
