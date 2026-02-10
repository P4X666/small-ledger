import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  getAllSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  updateSavingsGoalAmount,
  getSavingsGoalProgress
} from '@/api/goals';

// 目标周期类型
export type GoalPeriod = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

// 攒钱目标状态类型
export type GoalStatus = 'in_progress' | 'completed' | 'failed';

// 攒钱目标接口
export interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  description: string;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GoalDetail extends Omit<SavingsGoal, 'id'> {

}

// 目标创建数据接口
export interface GoalCreateData {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  description?: string;
  startDate: string;
  endDate: string;
  status?: GoalStatus;
}

// 目标更新数据接口
export interface GoalUpdateData {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: GoalStatus;
}

// 目标进度详情接口
export interface GoalProgressDetails {
  id: number;
  progressPercentage: number;
  daysLeft: number;
  remainingAmount?: number;
  dailyContributionNeeded?: number;
}



// 验证目标数据
const validateGoalData = (data: Partial<GoalCreateData>): boolean => {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return false;
  }
  if (!data.targetAmount || typeof data.targetAmount !== 'number' || data.targetAmount <= 0) {
    return false;
  }
  // if (!data.period || !['monthly', 'quarterly', 'half_yearly', 'yearly'].includes(data.period)) {
  //   return false;
  // }
  if (!data.startDate || new Date(data.startDate).toString() === 'Invalid Date') {
    return false;
  }
  if (!data.endDate || new Date(data.endDate).toString() === 'Invalid Date') {
    return false;
  }
  return true;
};



// 创建目标状态管理
export const useGoalsStore = defineStore('goals', () => {
  // 状态
  const goals = ref<SavingsGoal[]>([]);
  const isLoaded = ref(false);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const total = ref(0);
  const isLoading = ref(false);
  const hasMore = ref(true);

  // 计算属性
  
  // 活跃目标（未完成且未过期）
  const activeGoals = computed(() => {
    const now = new Date();
    return goals.value.filter(goal => 
      goal.currentAmount < goal.targetAmount && new Date(goal.endDate) > now
    ).map(goal => ({
      ...goal,
      progress: calculateProgress(goal)
    }));
  });
  
  // 已完成目标
  const completedGoals = computed(() => {
    return goals.value.filter(goal => 
      goal.currentAmount >= goal.targetAmount || goal.status === 'completed'
    ).sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
  });
  
  // 已过期目标
  const expiredGoals = computed(() => {
    const now = new Date();
    return goals.value.filter(goal => 
      (goal.currentAmount < goal.targetAmount && new Date(goal.endDate) <= now) || goal.status === 'failed'
    ).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  });
  
  // 所有目标（包括历史记录）
  const allGoals = computed(() => {
    return goals.value.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  });
  
  // 总目标数
  const totalGoalsCount = computed(() => goals.value.length);
  
  // 进行中的目标数
  const activeGoalsCount = computed(() => activeGoals.value.length);
  
  // 已完成的目标数
  const completedGoalsCount = computed(() => completedGoals.value.length);
  
  // 已过期的目标数
  const expiredGoalsCount = computed(() => expiredGoals.value.length);
  
  // 辅助函数
  
  // 计算目标完成进度
  const calculateProgress = (goal: SavingsGoal): number => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    return Math.min(Math.max(progress, 0), 100); // 确保进度在0-100之间
  };
  
  // 从API加载目标数据
  const loadGoals = async (reset = true): Promise<void> => {
    if (reset) {
      currentPage.value = 1;
      goals.value = [];
      hasMore.value = true;
    }
    
    if (!hasMore.value || isLoading.value) {
      return;
    }
    
    isLoading.value = true;
    try {
      // 调用API获取带分页的数据
      const params = {
        page: currentPage.value,
        limit: pageSize.value,
        sortBy: 'createdAt',
        order: 'DESC'
      };
      const data = await getAllSavingsGoals(params);
      // 处理数据，添加进度字段
      const processedData = data.data.map(goal => ({
        ...goal,
        progress: calculateProgress(goal)
      })) || [];
      
      
      if (reset) {
        goals.value = processedData;
      } else {
        goals.value = [...goals.value, ...processedData];
      }
      
      // 更新分页信息
      total.value = data.meta.totalItems;
      hasMore.value = goals.value.length < total.value;
      currentPage.value += 1;
      isLoaded.value = true;
    } catch (error) {
      console.error('加载目标数据失败:', error);
      if (reset) {
        goals.value = [];
      }
      isLoaded.value = true;
    } finally {
      isLoading.value = false;
    }
  };
  
  // 加载更多目标数据
  const loadMoreGoals = async (): Promise<void> => {
    await loadGoals(false);
  };
  
  // 操作方法
  
  // 添加新目标
  const addGoal = async (goalData: GoalCreateData): Promise<SavingsGoal | null> => {
    if (!validateGoalData(goalData)) {
      console.error('无效的目标数据');
      return null;
    }
    
    try {
      const newGoal = await createSavingsGoal(goalData);
      const goalWithProgress = {
        ...newGoal,
        progress: calculateProgress(newGoal)
      };
      goals.value.push(goalWithProgress);
      return goalWithProgress;
    } catch (error) {
      console.error('创建目标失败:', error);
      return null;
    }
  };
  
  // 更新目标信息
  const updateGoal = async (goalId: string | number, updateData: GoalUpdateData): Promise<boolean> => {
    const index = goals.value.findIndex(goal => goal.id === goalId);
    
    if (index === -1) {
      console.error('目标不存在');
      return false;
    }
    
    // 如果更新的字段包含关键信息，进行验证
    if (updateData.name || updateData.targetAmount || updateData.startDate || updateData.endDate) {
      const validationData: Partial<GoalCreateData> = {
        ...goals.value[index],
        ...updateData
      };
      
      if (!validateGoalData(validationData)) {
        console.error('无效的更新数据');
        return false;
      }
    }
    
    try {
      const updatedGoal = await updateSavingsGoal(goalId, updateData);
      const goalWithProgress = {
        ...updatedGoal,
        progress: calculateProgress(updatedGoal)
      };
      goals.value[index] = goalWithProgress;
      return true;
    } catch (error) {
      console.error('更新目标失败:', error);
      return false;
    }
  };
  
  // 更新目标金额（增加）
  const updateGoalAmount = async (goalId: string | number, amountToAdd: number): Promise<boolean> => {
    if (typeof amountToAdd !== 'number' || amountToAdd <= 0) {
      console.error('金额必须是正数');
      return false;
    }
    
    const index = goals.value.findIndex(goal => goal.id === goalId);
    
    if (index === -1) {
      console.error('目标不存在');
      return false;
    }
    
    try {
      const currentAmount = goals.value[index].currentAmount;
      const updatedAmount = currentAmount + amountToAdd;
      const updatedGoal = await updateSavingsGoalAmount(goalId, updatedAmount);
      const goalWithProgress = {
        ...updatedGoal,
        progress: calculateProgress(updatedGoal)
      };
      goals.value[index] = goalWithProgress;
      return true;
    } catch (error) {
      console.error('更新目标金额失败:', error);
      return false;
    }
  };
  
  // 删除目标
  const deleteGoal = async (goalId: string | number): Promise<boolean> => {
    const index = goals.value.findIndex(goal => goal.id === goalId);
    
    if (index === -1) {
      console.error('目标不存在');
      return false;
    }
    
    try {
      await deleteSavingsGoal(goalId);
      goals.value.splice(index, 1);
      return true;
    } catch (error) {
      console.error('删除目标失败:', error);
      return false;
    }
  };
  
  // 获取单个目标
  const getGoal = (goalId: string | number): SavingsGoal | undefined => {
    const currentGoal = goals.value.find(goal => goal.id === goalId);
    return currentGoal;
  };
  
  // 根据周期获取目标
  // const getGoalsByPeriod = (period: GoalPeriod): SavingsGoal[] => {
  //   return goals.value.filter(goal => goal.period === period);
  // };
  
  // 获取目标进度详情
  const getGoalProgressDetails = async (goalId: string | number): Promise<GoalProgressDetails | null> => {
    const goal = getGoal(goalId);
    if (!goal) {
      console.error('目标不存在');
      return null;
    }
    
    try {
      const progressDetails = await getSavingsGoalProgress(goalId);
      // 计算额外的进度信息
      const remainingAmount = goal.targetAmount - goal.currentAmount;
      const remainingDays = Math.ceil((new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...progressDetails,
        remainingAmount: Math.max(0, remainingAmount),
        dailyContributionNeeded: remainingDays > 0 ? remainingAmount / remainingDays : 0
      };
    } catch (error) {
      console.error('获取目标进度失败:', error);
      // 降级处理，本地计算进度
      const progress = calculateProgress(goal);
      const remainingAmount = goal.targetAmount - goal.currentAmount;
      const remainingDays = Math.ceil((new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: goal.id,
        progressPercentage: progress,
        daysLeft: Math.max(0, remainingDays),
        remainingAmount: Math.max(0, remainingAmount),
        dailyContributionNeeded: remainingDays > 0 ? remainingAmount / remainingDays : 0
      };
    }
  };
  
  // 获取总体攒钱统计
  const getSavingsStats = () => {
    const totalTargetAmount = goals.value.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalSavedAmount = goals.value.reduce((sum, goal) => sum + goal.currentAmount, 0);
    
    return {
      totalGoals: goals.value.length,
      activeGoals: activeGoals.value.length,
      completedGoals: completedGoals.value.length,
      expiredGoals: expiredGoals.value.length,
      totalTargetAmount,
      totalSavedAmount,
      totalProgress: totalTargetAmount > 0 ? (totalSavedAmount / totalTargetAmount) * 100 : 0
    };
  };
  
  // 重置所有数据（用于调试）
  const resetGoals = async (): Promise<boolean> => {
    goals.value = [];
    return true;
  };
  
  // 暴露状态和方法
  return {
    // 状态
    goals,
    isLoaded,
    currentPage,
    pageSize,
    total,
    isLoading,
    hasMore,
    
    // 计算属性
    activeGoals,
    completedGoals,
    expiredGoals,
    allGoals,
    totalGoalsCount,
    activeGoalsCount,
    completedGoalsCount,
    expiredGoalsCount,
    
    // 方法
    loadGoals,
    loadMoreGoals,
    addGoal,
    updateGoal,
    updateGoalAmount,
    deleteGoal,
    getGoal,
    // getGoalsByPeriod,
    getGoalProgressDetails,
    getSavingsStats,
    resetGoals,
  };
});
