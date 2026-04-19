const home: Menu.MenuOptions = {
  component: '/wallet/list',
  name: 'walletMenu',
  path: '/wallet',
  meta: {
    icon: 'i-bd-wallet',
    isAffix: false,
    isFull: false,
    isHide: false,
    isKeepAlive: true,
    isLink: '',
    index: 5,
    title: '财务管理'
  },
  children: [
    {
      component: '/wallet/wallet',
      name: 'walletManage',
      path: '/wallet/wallet',
      meta: {
        icon: 'i-bd-wallet',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        title: '💰 钱包管理'
      }
    },
    {
      component: '/wallet/transactions',
      name: 'transactionsList',
      path: '/wallet/transactions',
      meta: {
        icon: 'i-bd-doc-search',
        isAffix: false,
        isFull: false,
        isHide: true,
        isKeepAlive: true,
        isLink: '',
        title: '交易记录'
      }
    },
    {
      component: '/wallet/list',
      name: 'redpacketList',
      path: '/wallet/list',
      meta: {
        icon: 'i-bd-gift',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        title: '🧧 红包管理'
      }
    },
    {
      component: '/wallet/transfer',
      name: 'transferList',
      path: '/wallet/transfer',
      meta: {
        icon: 'i-bd-exchange',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        title: '💸 转账管理'
      }
    },
    {
      component: '/wallet/paymentconfig',
      name: 'paymentConfig',
      path: '/wallet/paymentconfig',
      meta: {
        icon: 'i-bd-wallet',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        title: '💳 支付配置'
      }
    }
  ]
};
export default home;
