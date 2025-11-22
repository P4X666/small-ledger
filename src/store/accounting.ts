import Taro from '@tarojs/taro';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 定义记账记录的类型
export type RecordType = 'income' | 'expense';

export interface AccountingRecord {
  id: string;
  type: RecordType;
  amount: number;
  category: string;
  remark: string;
  date: string;
  yearMonth: string;
}

// 记账状态管理
export const useAccountingStore = defineStore('accounting', () => {
  // 状态
  const records = ref<AccountingRecord[]>([]);
  const isLoading = ref(false);
  
  // 本地存储的键名
  const STORAGE_KEY = 'small_ledger_accounting_records';
  
  // 预设的收入和支出类别
  const PRESET_CATEGORIES = {
    income: ['工资', '奖金', '投资收益', '兼职', '礼金', '其他收入'],
    expense: ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '住房', '其他支出']
  };
  
  // 计算属性
  const totalIncome = computed(() => {
    return records.value
      .filter(record => record.type === 'income')
      .reduce((sum, record) => sum + record.amount, 0);
  });
  
  const totalExpense = computed(() => {
    return records.value
      .filter(record => record.type === 'expense')
      .reduce((sum, record) => sum + record.amount, 0);
  });
  
  const totalBalance = computed(() => {
    return totalIncome.value - totalExpense.value;
  });
  
  // 方法：生成唯一ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };
  
  // 方法：从本地存储加载记账记录
  const loadRecords = () => {
    try {
      isLoading.value = true;
      const storedRecords = Taro.getStorageSync(STORAGE_KEY);
      if (storedRecords) {
        const parsedRecords = JSON.parse(storedRecords);
        // 数据格式验证
        if (Array.isArray(parsedRecords)) {
          records.value = parsedRecords.filter(record => {
            // 验证记录的基本字段
            return (
              typeof record.id === 'string' &&
              ['income', 'expense'].includes(record.type) &&
              typeof record.amount === 'number' && record.amount > 0 &&
              typeof record.category === 'string' &&
              typeof record.date === 'string'
            );
          });
        } else {
          console.error('记账记录数据格式错误');
          records.value = [];
        }
      }
    } catch (error) {
      console.error('加载记账记录失败:', error);
      records.value = [];
    } finally {
      isLoading.value = false;
    }
  };
  
  // 方法：保存记录到本地存储
  const saveRecords = () => {
    try {
      Taro.setStorageSync(STORAGE_KEY, JSON.stringify(records.value));
    } catch (error) {
      console.error('保存记账记录失败:', error);
    }
  };
  
  // 方法：格式化年月（YYYY-MM）
  const formatYearMonth = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };
  
  // 方法：添加新的记账记录
  const addRecord = (recordData: Omit<AccountingRecord, 'id'>) => {
    // 输入验证
    if (!recordData.type || !recordData.amount || recordData.amount <= 0 || 
        !recordData.category || !recordData.date) {
      console.error('记账记录信息不完整或金额无效');
      return null;
    }
    
    // 确保类别有效
    if (!PRESET_CATEGORIES[recordData.type].includes(recordData.category)) {
      console.warn(`类别"${recordData.category}"不在预设类别中`);
    }
    
    const newRecord: AccountingRecord = {
      ...recordData,
      id: generateId(),
      // 确保yearMonth字段正确设置
      yearMonth: recordData.yearMonth || formatYearMonth(recordData.date),
      // 确保remark字段存在
      remark: recordData.remark || ''
    };
    
    // 使用展开运算符创建新数组，提高响应式性能
    records.value = [newRecord, ...records.value];
    saveRecords();
    return newRecord;
  };
  
  // 方法：更新记账记录
  const updateRecord = (recordId: string, updatedData: Partial<AccountingRecord>) => {
    // 参数验证
    if (!recordId || !updatedData) return null;
    
    const index = records.value.findIndex(record => record.id === recordId);
    
    if (index !== -1) {
      // 防止ID被修改
      const safeUpdates = { ...updatedData };
      delete (safeUpdates as any).id;
      
      // 金额验证
      if (safeUpdates.amount !== undefined && (typeof safeUpdates.amount !== 'number' || safeUpdates.amount <= 0)) {
        console.error('更新金额无效');
        return null;
      }
      
      // 类别验证
      if (safeUpdates.category && !PRESET_CATEGORIES[records.value[index].type].includes(safeUpdates.category)) {
        console.warn(`类别"${safeUpdates.category}"不在预设类别中`);
      }
      
      // 如果修改了日期，同步更新yearMonth
      if (safeUpdates.date) {
        safeUpdates.yearMonth = formatYearMonth(safeUpdates.date);
      }
      
      // 创建新记录对象以触发响应式更新
      records.value = records.value.map(record => {
        if (record.id === recordId) {
          return { ...record, ...safeUpdates };
        }
        return record;
      });
      
      saveRecords();
      return records.value.find(r => r.id === recordId) || null;
    }
    
    return null;
  };
  
  // 方法：删除记账记录
  const deleteRecord = (recordId: string) => {
    if (!recordId) return false;
    
    const recordIndex = records.value.findIndex(record => record.id === recordId);
    
    if (recordIndex !== -1) {
      // 使用filter创建新数组，提高响应式性能
      records.value = records.value.filter(record => record.id !== recordId);
      saveRecords();
      return true;
    }
    
    return false;
  };
  
  // 方法：获取指定月份的记录
  const getMonthlyRecords = (yearMonth: string) => {
    return records.value.filter(record => record.yearMonth === yearMonth);
  };
  
  // 方法：获取指定月份的收入总额
  const getMonthlyIncome = (yearMonth: string) => {
    return records.value
      .filter(record => record.type === 'income' && record.yearMonth === yearMonth)
      .reduce((sum, record) => sum + record.amount, 0);
  };
  
  // 方法：获取指定月份的支出总额
  const getMonthlyExpense = (yearMonth: string) => {
    return records.value
      .filter(record => record.type === 'expense' && record.yearMonth === yearMonth)
      .reduce((sum, record) => sum + record.amount, 0);
  };
  
  // 方法：获取指定月份的结余
  const getMonthlyBalance = (yearMonth: string) => {
    return getMonthlyIncome(yearMonth) - getMonthlyExpense(yearMonth);
  };
  
  // 方法：获取指定类型和类别的记录
  const getRecordsByCategory = (type: RecordType, category: string) => {
    return records.value.filter(
      record => record.type === type && record.category === category
    );
  };
  
  // 方法：获取所有有记录的月份
  const getAvailableMonths = () => {
    const months = new Set(records.value.map(record => record.yearMonth));
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  };
  
  // 方法：获取每个月的收支汇总
  const getMonthlySummary = () => {
    const summary: Record<string, { income: number; expense: number; balance: number }> = {};
    
    records.value.forEach(record => {
      if (!summary[record.yearMonth]) {
        summary[record.yearMonth] = { income: 0, expense: 0, balance: 0 };
      }
      
      if (record.type === 'income') {
        summary[record.yearMonth].income += record.amount;
      } else {
        summary[record.yearMonth].expense += record.amount;
      }
      
      summary[record.yearMonth].balance = 
        summary[record.yearMonth].income - summary[record.yearMonth].expense;
    });
    
    return summary;
  };
  
  // 方法：获取类别的统计信息
  const getCategoryStatistics = (type: RecordType, yearMonth?: string) => {
    const stats: Record<string, { amount: number; count: number }> = {};
    let filteredRecords = records.value.filter(record => record.type === type);
    
    if (yearMonth) {
      filteredRecords = filteredRecords.filter(record => record.yearMonth === yearMonth);
    }
    
    filteredRecords.forEach(record => {
      if (!stats[record.category]) {
        stats[record.category] = { amount: 0, count: 0 };
      }
      
      stats[record.category].amount += record.amount;
      stats[record.category].count += 1;
    });
    
    return stats;
  };
  
  // 方法：清空所有记录（谨慎使用）
  const clearAllRecords = () => {
    try {
      records.value = [];
      Taro.removeStorageSync(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('清空记录失败:', error);
      return false;
    }
  };
  
  // 方法：获取预设类别
  const getPresetCategories = (type: RecordType) => {
    return PRESET_CATEGORIES[type] || [];
  };
  
  // 方法：批量删除记录
  const batchDeleteRecords = (recordIds: string[]) => {
    if (!Array.isArray(recordIds) || recordIds.length === 0) return false;
    
    try {
      // 只删除存在的记录
      records.value = records.value.filter(record => !recordIds.includes(record.id));
      saveRecords();
      return true;
    } catch (error) {
      console.error('批量删除记录失败:', error);
      return false;
    }
  };
  
  // 初始化时加载数据
  loadRecords();
  
  return {
    // 状态
    records,
    isLoading,
    
    // 计算属性
    totalIncome,
    totalExpense,
    totalBalance,
    
    // 方法
    loadRecords,
    saveRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    getMonthlyRecords,
    getMonthlyIncome,
    getMonthlyExpense,
    getMonthlyBalance,
    getRecordsByCategory,
    getAvailableMonths,
    getMonthlySummary,
    getCategoryStatistics,
    getPresetCategories,
    batchDeleteRecords,
    clearAllRecords
  };
});
