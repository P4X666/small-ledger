<template>
  <view class="container" :style="{ paddingTop: navigationBarHeight + 'px' }">
    <view class="header">
      <text class="title">攒钱目标</text>
    </view>
    
    <!-- 目标概览卡片 -->
    <view v-if="activeGoals.length > 0" class="overview-cards">
      <view 
        v-for="goal in activeGoals" 
        :key="goal.id" 
        class="goal-card"
        :class="getProgressColorClass(goal.progress)"
      >
        <view class="goal-header">
          <view class="goal-title-container">
            <nut-icon name="target" size="18" color="#667eea" class="goal-icon" />
            <text class="goal-title">{{ goal.title }}</text>
          </view>
          <text class="goal-amount">¥{{ goal.currentAmount.toFixed(2) }} / ¥{{ goal.targetAmount.toFixed(2) }}</text>
        </view>
        
        <view class="progress-container">
          <view class="progress-bar" :style="{ width: `${goal.progress}%` }"></view>
        </view>
        
        <view class="goal-info">
          <text class="progress-text">{{ goal.progress }}%</text>
          <view class="time-info">
            <nut-icon name="clock" size="12" color="#999" class="time-icon" />
            <text>{{ goal.period === 'month' ? '1个月' : goal.period === 'quarter' ? '3个月' : goal.period === 'half_year' ? '6个月' : '1年' }} · 
            {{ formatDate(goal.endDate) }}</text>
          </view>
        </view>
        
        <view class="goal-actions">
          <button @tap="updateGoalAmount(goal)" class="add-btn">
            <nut-icon name="plus-circle" size="16" color="#fff" />
            <text class="btn-text">添加金额</text>
          </button>
          <button @tap="navigateToEditGoal(goal)" class="edit-btn">
            <nut-icon name="edit" size="16" color="#667eea" />
            <text class="btn-text">编辑</text>
          </button>
        </view>
      </view>
    </view>
    
    <!-- 无目标提示 -->
    <view v-else class="no-goals">
      <div class="no-goals-icon">
        <nut-icon name="goal" size="64" color="#e1e8ed" />
      </div>
      <text class="no-goals-text">您还没有设置任何攒钱目标</text>
      <text class="no-goals-hint">点击下方按钮创建您的第一个攒钱目标吧！</text>
    </view>
    
    <!-- 创建目标按钮 -->
    <view class="create-section">
      <button @tap="navigateToCreateGoal" class="create-btn">
        <nut-icon name="plus-circle" size="20" color="#fff" />
        <text class="btn-text">创建新目标</text>
      </button>
    </view>
    
    <!-- 历史目标 -->
    <view v-if="completedGoals.length > 0" class="history-section">
      <view class="section-header">
        <text class="section-title">
          <nut-icon name="history" size="16" color="#667eea" class="section-icon" />
          历史目标
        </text>
        <text class="goal-count">{{ completedGoals.length }}</text>
      </view>
      <view class="history-list">
        <view 
          v-for="goal in completedGoals" 
          :key="goal.id" 
          class="history-goal"
        >
          <view class="history-header">
            <text class="history-title">{{ goal.title }}</text>
            <text class="history-status" :class="goal.isCompleted ? 'achieved' : 'failed'">
              <nut-icon 
                :name="goal.isCompleted ? 'check-circle' : 'close-circle'" 
                size="14" 
                :color="goal.isCompleted ? '#52c41a' : '#f5222d'" 
              />
              {{ goal.isCompleted ? '已完成' : '未达成' }}
            </text>
          </view>
          <view class="history-meta">
            <text class="history-amount">¥{{ goal.currentAmount.toFixed(2) }} / ¥{{ goal.targetAmount.toFixed(2) }}</text>
            <text class="history-date">{{ formatDate(goal.endDate) }}</text>
          </view>
          <view class="history-progress">
            <view class="mini-progress-container">
              <view 
                class="mini-progress-bar" 
                :style="{ width: `${goal.progress}%` }"
                :class="goal.isCompleted ? 'completed' : 'failed'"
              ></view>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 更新金额弹窗 -->
    <view v-if="showUpdateModal" class="modal-overlay" @tap="closeUpdateModal">
      <view class="modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">更新金额</text>
          <button @tap="closeUpdateModal" class="close-btn">
            <nut-icon name="close" size="18" color="#666" />
          </button>
        </view>
        
        <view class="modal-content">
          <view class="goal-info-preview">
          <view class="preview-header">
            <nut-icon name="target" size="20" color="#667eea" />
            <text class="goal-name">{{ updatingGoal?.title }}</text>
          </view>
          <text class="current-amount">当前金额：¥{{ updatingGoal?.currentAmount.toFixed(2) }}</text>
        </view>
          
          <view class="form-field">
            <text class="field-label">增加金额</text>
            <view class="amount-input-container">
              <text class="currency-symbol">¥</text>
              <input 
                v-model.number="amountToAdd" 
                type="digit" 
                placeholder="0.00"
                class="amount-input"
              />
            </view>
          </view>
          
          <view class="modal-actions">
            <button @tap="closeUpdateModal" class="cancel-btn">
              <nut-icon name="close" size="16" color="#666" />
              取消
            </button>
            <button @tap="confirmAddAmount" class="confirm-btn" :disabled="!amountToAdd || amountToAdd <= 0">
              <nut-icon name="check" size="16" color="#fff" />
              确认
            </button>
          </view>
        </view>
      </view>
    </view>
    
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useGoalsStore } from '@/store/goals';
import type { SavingsGoal } from '@/store/goals';
import Taro, { useDidShow } from '@tarojs/taro';
import { updateTabbarSelectedIndex } from '@/utils/common';
import { useNavigationBar } from '@/utils/navigation';
import './index.scss'

const { navigationBarHeight } = useNavigationBar();
// 使用目标状态管理
const goalsStore = useGoalsStore();

// 响应式数据
const showUpdateModal = ref(false);
const updatingGoal = ref<SavingsGoal | null>(null);
const amountToAdd = ref<number>(0);

// 计算属性
const activeGoals = computed(() => {
  return goalsStore.activeGoals;
});

const completedGoals = computed(() => {
  return goalsStore.completedGoals;
});

// 方法
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getProgressColorClass = (progress: number) => {
  if (progress >= 90) return 'almost-complete';
  if (progress >= 60) return 'well-progressed';
  if (progress >= 30) return 'moderate';
  return 'early-stage';
};

// 页面跳转函数
const navigateToCreateGoal = () => {
  Taro.navigateTo({
    url: '/pages/goals/create/index'
  });
};

const navigateToEditGoal = (goal: SavingsGoal) => {
  Taro.navigateTo({
    url: `/pages/goals/edit/index?goalId=${goal.id}`
  });
};

const updateGoalAmount = (goal: SavingsGoal) => {
  updatingGoal.value = goal;
  amountToAdd.value = 0;
  showUpdateModal.value = true;
};

const confirmAddAmount = () => {
  if (!updatingGoal.value || !amountToAdd.value || amountToAdd.value <= 0) return;
  
  goalsStore.updateGoalAmount(updatingGoal.value.id, amountToAdd.value);
  
  // 显示成功提示
  Taro.showToast({
    title: '更新成功',
    icon: 'success',
    duration: 1500
  });
  
  closeUpdateModal();
};

const closeUpdateModal = () => {
  showUpdateModal.value = false;
  updatingGoal.value = null;
  amountToAdd.value = 0;
};

// 生命周期钩子
onMounted(() => {
  goalsStore.loadGoals();
});

// 页面显示时更新底部栏高亮状态
useDidShow(() => {
  // 调用自定义tabBar的update方法
  updateTabbarSelectedIndex(3);
});
</script>