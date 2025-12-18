export default {
  pages: [
    'pages/index/index',
    'pages/todolist/index',
    'pages/todolist/create/index',
    'pages/todolist/edit/index',
    'pages/accounting/index',
    'pages/goals/index',
    'pages/goals/create/index',
    'pages/goals/edit/index',
    'pages/login/index',
    'pages/register/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ff7d00',
    navigationBarTitleText: '家有小账本',
    navigationBarTextStyle: 'white',
    navigationStyle: 'custom',
  },
  resolveAlias: {
    "@/*": "/*"
  },
  tabBar: {
    custom: true,
    selectedColor: '#ff7d00', // 使用CSS变量--primary-color的实际值，因为app.config.ts不支持CSS变量语法
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
