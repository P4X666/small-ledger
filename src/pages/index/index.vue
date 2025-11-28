<template>
  <view class="index-page">
    <!-- 头部问候语 -->
    <view class="header">
      <text class="greeting">{{ greetingMessage }}</text>
      <text class="date">{{ formatDate }}</text>
    </view>
    
    <!-- 新建任务按钮 -->
    <view class="add-task-section">
      <button class="add-task-btn" @click="navigateTo('/pages/todolist/index?action=add')">
        <text class="add-icon">+</text>
        <text class="add-text">新建任务</text>
      </button>
    </view>
    
    <!-- 未完成任务展示 -->
    <view class="pending-tasks-section">
      <view class="section-header">
        <text class="section-title">重要任务</text>
        <text class="view-all" @click="navigateTo('/pages/todolist/index')">查看全部</text>
      </view>
      
      <view class="tasks-list" v-if="importantPendingTasks && importantPendingTasks.length > 0">
        <view class="task-item" v-for="task in displayTasks" :key="task?.id || Math.random()">
          <view class="task-checkbox" @click="toggleTaskStatus(task.id)">
            <view class="checkbox" :class="{ checked: task.completed }">
              <text v-if="task.completed" class="check-icon">✓</text>
            </view>
          </view>
          <view class="task-content">
            <text class="task-title">{{ task.title || '未命名任务' }}</text>
            <text v-if="task.priority?.important && task.priority?.urgent" class="priority-badge important-urgent">重要紧急</text>
            <text v-else-if="task.priority?.important" class="priority-badge important">重要</text>
            <text v-else-if="task.priority?.urgent" class="priority-badge urgent">紧急</text>
          </view>
          <view class="task-arrow" @click="navigateTo(`/pages/todolist/index?action=edit&id=${task.id}`)">
            <text>›</text>
          </view>
        </view>
        
        <!-- 显示更多任务 -->
        <view v-if="importantPendingTasks.length > 5" class="show-more">
          <text class="show-more-text" @click="showAllTasks = !showAllTasks">
            {{ showAllTasks ? '收起' : `还有 ${importantPendingTasks.length - 5} 个任务` }}
          </text>
        </view>
      </view>
      
      <view v-else class="no-tasks">
        <text>暂无重要任务，点击上方按钮创建新任务吧</text>
      </view>
    </view>
    
    <!-- 任务统计概览 -->
    <view class="task-stats">
      <view class="stat-box">
        <text class="stat-number">{{ importantPendingTasks.filter(task => !task.completed).length }}</text>
        <text class="stat-label">待完成任务</text>
      </view>
      <view class="stat-box">
        <text class="stat-number">{{ firstQuadrantTasksCount }}</text>
        <text class="stat-label">重要紧急任务</text>
      </view>
    </view>
    
    <!-- 快捷入口 -->
    <view class="quick-actions">
      <view class="quick-action" @click="navigateTo('/pages/todolist/index')">
        <view class="quick-action-icon task">
          <text class="icon-text">任务</text>
        </view>
        <text class="action-text">任务管理</text>
      </view>
      
      <view class="quick-action" @click="navigateTo('/pages/account/index')">
        <view class="quick-action-icon account">
          <text class="icon-text">记账</text>
        </view>
        <text class="action-text">日常记账</text>
      </view>
      
      <view class="quick-action" @click="navigateTo('/pages/goal/index')">
        <view class="quick-action-icon goal">
          <text class="icon-text">目标</text>
        </view>
        <text class="action-text">目标管理</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Taro, { useDidShow } from '@tarojs/taro';
import { updateTabbarSelectedIndex } from '@/utils/common';
import './index.scss'

// 状态管理
const showAllTasks = ref(false);

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

// 格式化日期
const formatDate = computed(() => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
});

// 模拟重要待办任务数据
const importantPendingTasks = ref([
  {
    id: '1',
    title: '完成项目规划报告',
    priority: { important: true, urgent: true },
    completed: false
  },
  {
    id: '2',
    title: '准备团队会议演示文稿',
    priority: { important: true, urgent: false },
    completed: false
  },
  {
    id: '3',
    title: '回复重要客户邮件',
    priority: { important: false, urgent: true },
    completed: false
  },
  {
    id: '4',
    title: '整理月度工作报告',
    priority: { important: true, urgent: true },
    completed: false
  },
  {
    id: '5',
    title: '与设计团队讨论界面原型',
    priority: { important: true, urgent: false },
    completed: false
  },
  {
    id: '6',
    title: '更新项目进度表',
    priority: { important: true, urgent: true },
    completed: false
  }
]);

// 显示的任务数量
// 增强displayTasks计算属性，添加防御性检查
const displayTasks = computed(() => {
  if (!importantPendingTasks.value || !Array.isArray(importantPendingTasks.value)) {
    return [];
  }
  
  if (showAllTasks.value) {
    return importantPendingTasks.value;
  }
  return importantPendingTasks.value.slice(0, 5);
});

// 增强firstQuadrantTasksCount计算属性，添加防御性检查
const firstQuadrantTasksCount = computed(() => {
  if (!importantPendingTasks.value || !Array.isArray(importantPendingTasks.value)) {
    return 0;
  }
  
  return importantPendingTasks.value.filter(task => 
    task && task.priority?.important && task.priority?.urgent && !task.completed
  ).length;
});

// 增强toggleTaskStatus函数，添加参数检查
const toggleTaskStatus = (taskId) => {
  if (!taskId) {
    console.error('任务ID不能为空');
    return;
  }
  
  if (!importantPendingTasks.value || !Array.isArray(importantPendingTasks.value)) {
    console.error('任务列表未初始化');
    return;
  }
  
  const task = importantPendingTasks.value.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    Taro.showToast({
      title: task.completed ? '任务已完成' : '任务已恢复',
      icon: 'none'
    });
  } else {
    console.error('未找到指定任务');
  }
};

// 导航到指定页面
// 增强navigateTo函数，添加参数检查
const navigateTo = (url) => {
  if (!url) {
    console.error('导航URL不能为空');
    return;
  }
  
  Taro.switchTab({
    url,
    fail: (err) => {
      console.error('导航失败:', err);
      Taro.showToast({
        title: '页面跳转失败',
        icon: 'error'
      });
    }
  });
};

// 页面加载时的初始化
onMounted(() => {
  // 这里可以从store获取真实数据
});

// 页面显示时更新底部栏高亮状态
useDidShow(() => {
  updateTabbarSelectedIndex(0);
});
</script>