import Taro from '@tarojs/taro';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 目标周期类型
export type GoalPeriod = 'month' | 'quarter' | 'half_year' | 'year';

// 攒钱目标接口
export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  description?: string;
  period: GoalPeriod;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  isCompleted: boolean;
  progress: number;
}

// 目标创建数据接口
export interface GoalCreateData {
  title: string;
  targetAmount: number;
  description?: string;
  period: GoalPeriod;
  endDate: string;
}

// 目标更新数据接口
export interface GoalUpdateData {
  title?: string;
  targetAmount?: number;
  description?: string;
  period?: GoalPeriod;
  endDate?: string;
}

// 目标进度详情接口
export interface GoalProgressDetails extends SavingsGoal {
  progress: number;
  remainingAmount: number;
  remainingDays: number;
  dailyContributionNeeded: number;
}

// 存储键名
const STORAGE_KEY = 'small-ledger-goals';

// 生成唯一ID
const generateId = (): string => {
  // 使用更健壮的ID生成方式
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// 验证目标数据
const validateGoalData = (data: Partial<GoalCreateData>): boolean => {
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    return false;
  }
  if (!data.targetAmount || typeof data.targetAmount !== 'number' || data.targetAmount <= 0) {
    return false;
  }
  if (!data.period || !['month', 'quarter', 'half_year', 'year'].includes(data.period)) {
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
      goal.currentAmount >= goal.targetAmount
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  });
  
  // 已过期目标
  const expiredGoals = computed(() => {
    const now = new Date();
    return goals.value.filter(goal => 
      goal.currentAmount < goal.targetAmount && new Date(goal.endDate) <= now
    ).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  });
  
  // 所有目标（包括历史记录）
  const allGoals = computed(() => {
    return goals.value.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
  
  // 从本地存储加载目标数据
  const loadGoals = (): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const storedData = Taro.getStorageSync(STORAGE_KEY);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          // 数据验证
          if (Array.isArray(parsedData)) {
            // 过滤掉无效的目标数据
            goals.value = parsedData.filter((item: any) => {
              return item && typeof item === 'object' &&
                     item.id && item.title && item.targetAmount !== undefined &&
                     item.currentAmount !== undefined && item.period && item.endDate;
            });
          }
        }
        isLoaded.value = true;
      } catch (error) {
        console.error('加载目标数据失败:', error);
        goals.value = [];
        isLoaded.value = true;
      } finally {
        resolve();
      }
    });
  };
  
  // 保存目标数据到本地存储
  const saveGoals = (): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        Taro.setStorageSync(STORAGE_KEY, JSON.stringify(goals.value));
        resolve(true);
      } catch (error) {
        console.error('保存目标数据失败:', error);
        resolve(false);
      }
    });
  };
  
  // 操作方法
  
  // 添加新目标
  const addGoal = async (goalData: GoalCreateData): Promise<SavingsGoal | null> => {
    if (!validateGoalData(goalData)) {
      console.error('无效的目标数据');
      return null;
    }
    
    const now = new Date().toISOString();
    
    const newGoal: SavingsGoal = {
      id: generateId(),
      title: goalData.title.trim(),
      targetAmount: goalData.targetAmount,
      currentAmount: 0,
      description: goalData.description?.trim() || '',
      period: goalData.period,
      endDate: goalData.endDate,
      createdAt: now,
      updatedAt: now,
      isCompleted: false,
      progress: 0
    };
    
    goals.value.push(newGoal);
    const saved = await saveGoals();
    
    if (!saved) {
      // 保存失败，回滚操作
      goals.value.pop();
      console.error('创建目标失败');
      return null;
    }
    
    return newGoal;
  };
  
  // 更新目标信息
  const updateGoal = async (goalId: string, updateData: GoalUpdateData): Promise<boolean> => {
    const index = goals.value.findIndex(goal => goal.id === goalId);
    
    if (index === -1) {
      console.error('目标不存在');
      return false;
    }
    
    // 如果更新的字段包含关键信息，进行验证
    if (updateData.title || updateData.targetAmount || updateData.period || updateData.endDate) {
      const validationData: Partial<GoalCreateData> = {
        ...goals.value[index],
        ...updateData
      };
      
      if (!validateGoalData(validationData)) {
        console.error('无效的更新数据');
        return false;
      }
    }
    
    const updatedGoal = {
      ...goals.value[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // 更新字段处理
    if (updatedGoal.title) {
      updatedGoal.title = updatedGoal.title.trim();
    }
    if (updatedGoal.description) {
      updatedGoal.description = updatedGoal.description.trim();
    }
    
    goals.value[index] = updatedGoal;
    return await saveGoals();
  };
  
  // 更新目标金额（增加）
  const updateGoalAmount = async (goalId: string, amountToAdd: number): Promise<boolean> => {
    if (typeof amountToAdd !== 'number' || amountToAdd <= 0) {
      console.error('金额必须是正数');
      return false;
    }
    
    const index = goals.value.findIndex(goal => goal.id === goalId);
    
    if (index !== -1) {
      goals.value[index].currentAmount += amountToAdd;
      goals.value[index].updatedAt = new Date().toISOString();
      
      return await saveGoals();
    }
    
    console.error('目标不存在');
    return false;
  };
  
  // 删除目标
  const deleteGoal = async (goalId: string): Promise<boolean> => {
    const index = goals.value.findIndex(goal => goal.id === goalId);
    
    if (index !== -1) {
      const deletedGoal = goals.value.splice(index, 1);
      const saved = await saveGoals();
      
      if (!saved) {
        // 保存失败，回滚操作
        goals.value.splice(index, 0, ...deletedGoal);
        console.error('删除目标失败');
        return false;
      }
      
      return true;
    }
    
    console.error('目标不存在');
    return false;
  };
  
  // 获取单个目标
  const getGoal = (goalId: string): SavingsGoal | undefined => {
    return goals.value.find(goal => goal.id === goalId);
  };
  
  // 根据周期获取目标
  const getGoalsByPeriod = (period: GoalPeriod): SavingsGoal[] => {
    return goals.value.filter(goal => goal.period === period);
  };
  
  // 获取目标进度详情
  const getGoalProgressDetails = (goalId: string): GoalProgressDetails | null => {
    const goal = getGoal(goalId);
    if (!goal) {
      console.error('目标不存在');
      return null;
    }
    
    const progress = calculateProgress(goal);
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    const remainingDays = Math.ceil((new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...goal,
      progress,
      remainingAmount: Math.max(0, remainingAmount),
      remainingDays: Math.max(0, remainingDays),
      dailyContributionNeeded: remainingDays > 0 ? remainingAmount / remainingDays : 0
    };
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
    return await saveGoals();
  };
  
  // 清空已完成的目标
  const clearCompletedGoals = async (): Promise<boolean> => {
    const initialLength = goals.value.length;
    goals.value = goals.value.filter(goal => goal.currentAmount < goal.targetAmount);
    
    if (goals.value.length !== initialLength) {
      return await saveGoals();
    }
    return true;
  };
  
  // 初始化时加载数据
  loadGoals();
  
  // 暴露状态和方法
  return {
    // 状态
    goals,
    isLoaded,
    
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
    addGoal,
    updateGoal,
    updateGoalAmount,
    deleteGoal,
    getGoal,
    getGoalsByPeriod,
    getGoalProgressDetails,
    getSavingsStats,
    resetGoals,
    clearCompletedGoals
  };
});
