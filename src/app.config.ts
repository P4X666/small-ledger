export default {
  pages: [
    'pages/index/index',
    'pages/todolist/index',
    'pages/accounting/index',
    'pages/goals/index',
    'pages/goals/create/index',
    'pages/goals/edit/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#667eea',
    navigationBarTitleText: '家有小账本',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#999',
    selectedColor: '#667eea',
    backgroundColor: '#fff',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/todolist/index',
        text: '任务'
      },
      {
        pagePath: 'pages/accounting/index',
        text: '记账'
      },
      {
        pagePath: 'pages/goals/index',
        text: '目标'
      }
    ]
  }
}
