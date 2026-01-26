export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
}

// 预设的收入和支出类别
export const DEFAULT_INCOME_CATEGORIES = [
  {
    label: '工资',
    value: 'salary'
  },
  {
    label: '奖金',
    value: 'bonus'
  },
  {
    label: '投资收益',
    value: 'investmentReturns'
  },
  {
    label: '副业收入',
    value: 'sideIncome'
  },
  {
    label: '其他收入',
    value: 'otherIncome'
  }
];
export const DEFAULT_EXPENSE_CATEGORIES = [
  {
    label: '餐饮',
    value: 'food'
  },
  {
    label: '交通',
    value: 'transportation'
  },
  {
    label: '购物',
    value: 'shopping'
  },
  {
    label: '娱乐',
    value: 'entertainment'
  },
  {
    label: '医疗',
    value: 'medical'
  },
  {
    label: '教育',
    value: 'education'
  },
  {
    label: '住房',
    value: 'housing'
  },
  {
    label: '其他支出',
    value: 'otherExpense'
  }
];

export enum CALENDAR_TYPE {
  YEAR= 'year',
  MONTH= 'month',
  WEEK= 'week',
  DAY= 'day',
};
