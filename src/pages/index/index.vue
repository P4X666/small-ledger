<template>
  <view class="index-page">
    <!-- 欢迎卡片 -->
    <view class="welcome-card">
      <view class="welcome-header">
        <view>
          <text class="welcome-title">欢迎回来！</text>
          <text class="welcome-subtitle">{{ greetingMessage }}</text>
        </view>
        <!-- <nut-avatar shape="square" size="48" bg-color="#07c160" text="用户" /> -->
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-actions">
      <view class="action-item" @click="navigateTo('/pages/todolist/index')">
        <view class="action-icon blue">
          <nut-icon name="task-list" size="24" color="#fff" />
        </view>
        <text class="action-text">任务管理</text>
      </view>
      <view class="action-item" @click="navigateTo('/pages/accounting/index')">
        <view class="action-icon green">
          <nut-icon name="account-book" size="24" color="#fff" />
        </view>
        <text class="action-text">记账</text>
      </view>
      <view class="action-item" @click="navigateTo('/pages/goals/index')">
        <view class="action-icon orange">
          <nut-icon name="target" size="24" color="#fff" />
        </view>
        <text class="action-text">目标</text>
      </view>
    </view>

    <!-- 今日概览 -->
    <view class="today-overview">
      <view class="section-header">
        <text class="section-title">今日概览</text>
      </view>
      <view class="overview-stats">
        <view class="stat-item">
          <text class="stat-value">{{ todayTasks }}</text>
          <text class="stat-label">待办任务</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">¥{{ todayIncome }}</text>
          <text class="stat-label">今日收入</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">¥{{ todayExpense }}</text>
          <text class="stat-label">今日支出</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Taro from '@tarojs/taro';
import { useCounterStore } from '@/store/counter';
import './index.scss'

// 获取问候语
const greetingMessage = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了，注意休息';
  if (hour < 9) return '早上好，开始新的一天';
  if (hour < 12) return '上午好，效率满满';
  if (hour < 14) return '中午好，记得午休';
  if (hour < 18) return '下午好，继续加油';
  if (hour < 22) return '晚上好，放松一下';
  return '夜深了，准备休息';
});

// 最近活动数据
const recentActivities = ref([
  {
    type: 'task',
    icon: 'task-add',
    text: '创建了新任务：完成项目规划',
    time: '10分钟前'
  },
  {
    type: 'account',
    icon: 'account-book',
    text: '记录了一笔收入：工资入账',
    time: '今天 10:30'
  },
  {
    type: 'goal',
    icon: 'target',
    text: '更新了目标：本月储蓄计划',
    time: '昨天 18:45'
  }
]);

// 今日概览数据
const todayTasks = ref(5);
const todayIncome = ref('1000.00');
const todayExpense = ref('235.50');

// 导航到指定页面
const navigateTo = (url) => {
  Taro.navigateTo({
    url
  });
};

// 查看全部活动
const viewAllActivities = () => {
  // 这里可以导航到活动历史页面
  Taro.showToast({
    title: '功能开发中',
    icon: 'none'
  });
};

// 页面加载时的初始化
onMounted(() => {
  // 这里可以从store获取真实数据
});
</script>