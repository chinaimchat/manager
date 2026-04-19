export default {
  component: '/web3/laboratory',
  name: 'web3',
  path: '/web3',
  meta: {
    icon: 'i-bd-tool',
    isAffix: false,
    isFull: false,
    isHide: false,
    isKeepAlive: true,
    isLink: '',
    index: 9,
    title: 'Web3'
  },
  children: [
    {
      component: '/web3/laboratory',
      name: 'web3Laboratory',
      path: '/web3/laboratory',
      meta: {
        icon: 'i-bd-laboratory',
        isAffix: false,
        isFull: false,
        isHide: false,
        isKeepAlive: true,
        isLink: '',
        title: '实验室管理'
      }
    }
  ]
}
