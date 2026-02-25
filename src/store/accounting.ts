import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as accountingApi from '@/api/accounting';

// 定义记账记录的类型
export type RecordType = 'income' | 'expense';

export interface AccountingRecord {
  id: string;
  type: RecordType;
  amount: number;
  category: string;
  description: string;
  date: string;
  yearMonth: string;

  transactionDate?: string;
  transactionStartDate: string;
  transactionEndDate: string;
  product?: string;
  shop: string;
}

// 记账状态管理
export const useAccountingStore = defineStore('accounting', () => {
  // 状态
  const records = ref<AccountingRecord[]>([]);
  const currentPage = ref(1);
  const isLoading = ref(false);
  const isEnd = ref(false);
  const statistics = ref<{
    totalIncome: number;
    totalExpense: number;
    totalNeutral: number;
    balance: number;
    monthlySummary: Record<string, { income: number; expense: number; balance: number }>;
  }>({ totalIncome: 0, totalExpense: 0, totalNeutral: 0, balance: 0, monthlySummary: {} });
  
  const total = ref(0);

  // 预设的收入和支出类别
  const PRESET_CATEGORIES = {
    income: ['工资', '奖金', '投资收益', '兼职', '礼金', '其他收入'],
    expense: ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '住房', '其他支出']
  };
  
  // 方法：从API加载记账记录
  const loadRecords = async (params: accountingApi.TransactionStatisticsParams, reset = false) => {
    if(isLoading.value){
      return;
    }
    // currentPage.value = params.page || 1;
    if(reset){
      records.value = [];
      isEnd.value = false;
      currentPage.value = 1;
    }
    if(isEnd.value){
      return;
    }
    try {
      isLoading.value = true;
      const fetchedRecords = await accountingApi.getTransactions({
        ...params,
        page: currentPage.value,
      });
      total.value = fetchedRecords.meta.totalItems
      // 数据格式验证
      if (Array.isArray(fetchedRecords.data)) {
        const data = [...records.value, ...fetchedRecords.data]
        records.value = data;
        isEnd.value = data.length >= total.value;
      } else {
        console.error('记账记录数据格式错误');
        records.value = [];
      }
    } catch (error) {
      console.error('加载记账记录失败:', error);
      records.value = [];
    } finally {
      isLoading.value = false;
      currentPage.value++;
    }
  };
  
  // 方法：加载统计信息
  const loadStatistics = async (params: accountingApi.TransactionStatisticsParams, reset = false) => {
    if(reset){
      statistics.value = { totalIncome: 0, totalExpense: 0, totalNeutral: 0, balance: 0, monthlySummary: {} };
    }
    try {
      const stats = await accountingApi.getTransactionStatistics(params);
      statistics.value = stats;
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  };
  
  // 方法：添加新的记账记录
  const addRecord = async (recordData: Omit<AccountingRecord, 'id'>) => {
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
    
    try {
      const newRecord = await accountingApi.createTransaction({
        type: recordData.type,
        amount: recordData.amount,
        category: recordData.category,
        remark: recordData.description || '',
        date: recordData.date
      });
      
      // 使用展开运算符创建新数组，提高响应式性能
      records.value = [newRecord, ...records.value];
      return newRecord;
    } catch (error) {
      console.error('创建记账记录失败:', error);
      return null;
    }
  };

  // 方法：获取指定ID的记账记录
  const getTransaction = async (recordId: string) => {
    if (!recordId) return null;
    
    try {
      const record = await accountingApi.getTransaction(recordId);
      return record;
    } catch (error) {
      console.error('获取记账记录失败:', error);
      return null;
    }
  };
  
  // 方法：更新记账记录
  const updateRecord = async (recordId: string, updatedData: Partial<AccountingRecord>) => {
    // 参数验证
    if (!recordId || !updatedData) return null;
    
    try {
      const updatedRecord = await accountingApi.updateTransaction(recordId, {
        ...updatedData,
        date: updatedData.date,
        amount: updatedData.amount,
        category: updatedData.category,
        remark: updatedData.description
      });
      
      // 更新本地记录
      const index = records.value.findIndex(record => record.id === recordId);
      if (index !== -1) {
        records.value[index] = updatedRecord;
        return updatedRecord;
      }
      return null;
    } catch (error) {
      console.error('更新记账记录失败:', error);
      return null;
    }
  };
  
  // 方法：删除记账记录
  const deleteRecord = async (recordId: string) => {
    if (!recordId) return false;
    
    try {
      const success = await accountingApi.deleteTransaction(recordId);
      if (success) {
        // 使用filter创建新数组，提高响应式性能
        records.value = records.value.filter(record => record.id !== recordId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除记账记录失败:', error);
      return false;
    }
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
  
  // 方法：获取预设类别
  const getPresetCategories = (type: RecordType) => {
    return PRESET_CATEGORIES[type] || [];
  };
  
  // 方法：批量删除记录
  const batchDeleteRecords = async (recordIds: string[]) => {
    if (!Array.isArray(recordIds) || recordIds.length === 0) return false;
    
    try {
      let allSuccess = true;
      for (const id of recordIds) {
        const success = await accountingApi.deleteTransaction(id);
        if (!success) {
          allSuccess = false;
        }
      }
      
      if (allSuccess) {
        // 更新本地记录
        records.value = records.value.filter(record => !recordIds.includes(record.id));
        return true;
      }
      return false;
    } catch (error) {
      console.error('批量删除记录失败:', error);
      return false;
    }
  };
  
  // 方法：清空所有记录（谨慎使用）
  const clearAllRecords = async () => {
    try {
      // 获取所有记录ID
      const recordIds = records.value.map(record => record.id);
      // 批量删除
      const success = await batchDeleteRecords(recordIds);
      return success;
    } catch (error) {
      console.error('清空记录失败:', error);
      return false;
    }
  };
  
  return {
    // 状态
    records,
    isLoading,
    isEnd,
    statistics,
    total,
    
    // 方法
    loadRecords,
    loadStatistics,
    addRecord,
    getTransaction,
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
