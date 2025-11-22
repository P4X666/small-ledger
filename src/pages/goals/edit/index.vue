<template>
  <view class="container">
    <view class="header">
      <nut-button type="default" @tap="goBack" class="back-btn">
        <nut-icon name="arrow-left" size="18" color="#333" />
      </nut-button>
      <text class="title">编辑目标</text>
      <view class="placeholder"></view>
    </view>
    
    <view class="content">
      <!-- 目标名称 -->
      <view class="form-field">
        <text class="field-label">目标名称</text>
        <input 
          v-model="editingGoal.title" 
          class="input"
        />
      </view>
      
      <!-- 目标金额 -->
      <view class="form-field">
        <text class="field-label">目标金额</text>
        <view class="amount-input-container">
          <text class="currency-symbol">¥</text>
          <input 
            v-model.number="editingGoal.targetAmount" 
            type="digit"
            class="amount-input"
          />
        </view>
      </view>
      
      <!-- 目标期限 -->
      <view class="form-field">
        <text class="field-label">目标期限</text>
        <picker mode="selector" :range="periodOptions" :value="editingGoal.periodIndex" @change="handleEditingPeriodChange">
          <view class="period-picker">
            <nut-icon name="calendar" size="16" color="#666" class="picker-icon" />
            <text class="picker-text">{{ periodOptions[editingGoal.periodIndex] }}</text>
          </view>
        </picker>
      </view>
      
      <!-- 目标描述 -->
      <view class="form-field">
        <text class="field-label">目标描述</text>
        <textarea 
          v-model="editingGoal.description" 
          class="textarea"
          auto-height
        ></textarea>
      </view>
    </view>
    
    <view class="footer">
      <button @tap="deleteGoal" class="delete-btn">
        <nut-icon name="delete" size="16" color="#fff" />
        删除
      </button>
      <button @tap="goBack" class="cancel-btn">
        <nut-icon name="close" size="16" color="#666" />
        取消
      </button>
      <button @tap="saveEditedGoal" class="confirm-btn" :disabled="!canSaveEdit">
        <nut-icon name="check" size="16" color="#fff" />
        保存
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useGoalsStore } from '@/store/goals';
import type { SavingsGoal, GoalPeriod } from '@/store/goals';
import Taro from '@tarojs/taro';
import './index.scss'

// 使用目标状态管理
const goalsStore = useGoalsStore();

// 获取路由参数
const goalId = Taro.getCurrentInstance().router?.params?.goalId as string;

// 期限选项
const periodOptions = ['1个月', '3个月', '6个月', '1年'];

// 编辑目标表单数据
const editingGoal = ref({
  id: '',
  title: '',
  targetAmount: 0,
  periodIndex: 0,
  description: ''
});

// 计算属性
const canSaveEdit = computed(() => {
  return editingGoal.value.title.trim() && editingGoal.value.targetAmount > 0;
});

// 方法
const handleEditingPeriodChange = (event: any) => {
  editingGoal.value.periodIndex = event.detail.value;
};

const getPeriodFromString = (periodString: string): GoalPeriod => {
  switch (periodString) {
    case '1个月': return 'month';
    case '3个月': return 'quarter';
    case '6个月': return 'half_year';
    case '1年': return 'year';
    default: return 'month';
  }
};

const calculateEndDate = (period: GoalPeriod): string => {
  const endDate = new Date();
  switch (period) {
    case 'month':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'quarter':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case 'half_year':
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    case 'year':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
  }
  return endDate.toISOString();
};

const saveEditedGoal = () => {
  if (!canSaveEdit.value) return;
  
  const selectedPeriod = periodOptions[editingGoal.value.periodIndex];
  const periodType = getPeriodFromString(selectedPeriod);
  
  goalsStore.updateGoal(editingGoal.value.id, {
    title: editingGoal.value.title.trim(),
    targetAmount: editingGoal.value.targetAmount,
    description: editingGoal.value.description.trim(),
    period: periodType,
    endDate: calculateEndDate(periodType)
  });
  
  Taro.showToast({
    title: '保存成功',
    icon: 'success',
    duration: 1500
  });
  
  // 返回上一页
  setTimeout(() => {
    goBack();
  }, 1500);
};

const deleteGoal = () => {
  Taro.showModal({
    title: '确认删除',
    content: '确定要删除这个目标吗？',
    success: (res) => {
      if (res.confirm) {
        goalsStore.deleteGoal(editingGoal.value.id);
        
        Taro.showToast({
          title: '删除成功',
          icon: 'success',
          duration: 1500
        });
        
        // 返回上一页
        setTimeout(() => {
          goBack();
        }, 1500);
      }
    }
  });
};

const goBack = () => {
  Taro.navigateBack();
};

// 加载目标数据
const loadGoalData = () => {
  if (!goalId) {
    Taro.showToast({
      title: '参数错误',
      icon: 'none',
      duration: 1500,
      success: () => {
        setTimeout(() => {
          goBack();
        }, 1500);
      }
    });
    return;
  }
  
  // 查找目标数据
  const allGoals = [...goalsStore.activeGoals, ...goalsStore.completedGoals];
  const goal = allGoals.find(g => g.id === goalId);
  
  if (!goal) {
    Taro.showToast({
      title: '目标不存在',
      icon: 'none',
      duration: 1500,
      success: () => {
        setTimeout(() => {
          goBack();
        }, 1500);
      }
    });
    return;
  }
  
  // 填充表单数据
  editingGoal.value = {
    id: goal.id,
    title: goal.title,
    targetAmount: goal.targetAmount,
    periodIndex: periodOptions.findIndex(option => 
      (option === '1个月' && goal.period === 'month') ||
      (option === '3个月' && goal.period === 'quarter') ||
      (option === '6个月' && goal.period === 'half_year') ||
      (option === '1年' && goal.period === 'year')
    ) || 0,
    description: goal.description || ''
  };
};

// 生命周期钩子
onMounted(() => {
  loadGoalData();
});
</script>
