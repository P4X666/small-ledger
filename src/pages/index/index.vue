<template>
  <view class="index-page safe-area" :style="{ paddingTop: `${navigationBarHeight}px` }">
    <!-- 头部问候语 -->
    <view class="header">
      <text class="greeting">{{ greetingMessage }}</text>
      <text class="date">{{ formatDate }}</text>
    </view>
    
    <!-- 新建任务按钮 -->
    <view class="add-task-section">
      <button class="add-task-btn" @click="navigateTo('/pages/todolist/detail/index')">
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
      
      <!-- 任务列表和空状态 -->
      <view>
        <view class="tasks-list" v-if="importantInProgressTasks && importantInProgressTasks.length > 0">
          <view class="task-item" v-for="task in displayTasks" :key="task.id">
            <nut-swipe>
              <template #left>
                <nut-button shape="square" style="height: 100%" type="danger" @click="toggleTaskStatus(task.id, TaskStatus.Pending)">放弃</nut-button>
              </template>
              <nut-cell :title="task.title" center>
                <template #link>
                  <view class="task-desc" @click="navigateTo(`/pages/todolist/detail/index?id=${task.id}`)">
                    <text v-if="task.importance === 4 && task.urgency === 4" class="priority-badge important-urgent">重要紧急</text>
                    <text v-else-if="task.importance === 4" class="priority-badge important">重要</text>
                    <text v-else-if="task.urgency === 4" class="priority-badge urgent">紧急</text>
                    <view class="task-arrow">
                      <text>›</text>
                    </view>
                  </view>
                </template>
              </nut-cell>
              <template #right>
                <nut-button shape="square" style="height: 100%" type="success" @click="toggleTaskStatus(task.id, TaskStatus.Completed)">完成</nut-button>
              </template>
            </nut-swipe>
          </view>
          
          <!-- 显示更多任务 -->
          <view 
            v-if="importantInProgressTasks.length > 5" 
            class="show-more" 
            @click="navigateTo('/pages/todolist/index')"
          >
            <text class="show-more-text" >
              查看全部
            </text>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view v-else class="no-tasks">
          <text>暂无重要任务，点击上方按钮创建新任务吧</text>
        </view>
      </view>
    </view>
    
    <!-- 任务统计概览 -->
    <view class="task-stats">
      <view class="stat-box">
        <text class="stat-number">{{ statistics.inProgressTasksTotal }}</text>
        <text class="stat-label">待完成任务</text>
      </view>
      <view class="stat-box">
        <text class="stat-number">{{ statistics.highPriorityTasksTotal }}</text>
        <text class="stat-label">重要紧急任务</text>
      </view>
    </view>
    
    <!-- 快捷入口 -->
    <view class="quick-actions safe-area">
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
import { ref, computed } from 'vue';
import Taro, { useDidShow } from '@tarojs/taro';
import { getGreetingMessage } from '@/utils/common';
import { useNavigationBar } from '@/utils/navigation';
import { TAB_PAGE_REVERSE } from '@/constants/tab-page';
import { useTodoStore, type Task } from '@/store/todo';
import { TaskStatus } from '@/constants/common';
import { getTabBarInstance } from '@/utils/tab-bar';
import './index.scss'

// 使用顶部栏高度管理组合式函数
const { navigationBarHeight } = useNavigationBar();

const importantInProgressTasks = ref<Task[]>([]);
const statistics = ref({inProgressTasksTotal:0, highPriorityTasksTotal: 0})
const todoStore = useTodoStore();

// 获取问候语
const greetingMessage = computed(() => {
  return getGreetingMessage();
});

// 格式化日期
const formatDate = computed(() => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
});

// 显示的任务数量
// 增强displayTasks计算属性，添加防御性检查
const displayTasks = computed(() => {
  if (!importantInProgressTasks.value || !Array.isArray(importantInProgressTasks.value)) {
    return [];
  }

  return importantInProgressTasks.value.slice(0, 5);
});

// 加载任务数据
const loadTasks = async () => {
  todoStore.loadTasksForHome().then(res=>{
    importantInProgressTasks.value = res
  })
  todoStore.getTasksStatistics().then(res=>{
    const {inProgressTasksTotal = 0, highPriorityTasksTotal = 0} = res
    statistics.value = {inProgressTasksTotal, highPriorityTasksTotal}
  })
};

// 切换任务状态
const toggleTaskStatus = async (taskId: string, status: TaskStatus) => {
  
  try {
    await todoStore.toggleTaskStatus(taskId, status);
    
    // 重新加载任务数据
    await loadTasks();
    
    Taro.showToast({
      title: status === TaskStatus.Completed ? '任务已完成' : '任务已取消',
      icon: 'none'
    });
  } catch (error: any) {
    console.error('更新任务状态失败:', error);
  }
};

// 导航到指定页面
// 增强navigateTo函数，添加参数检查
const navigateTo = (url: string) => {
  if (!url) {
    console.error('导航URL不能为空');
    return;
  }
  console.log('导航到:', url);
  const handleTabClick = TAB_PAGE_REVERSE[url]?Taro.switchTab:Taro.navigateTo;
  handleTabClick({url});
};

// 页面显示时更新底部栏高亮状态并刷新数据
useDidShow(() => {
  const tabBar = getTabBarInstance();
  tabBar.updateTabbarSelectedIndex(0);
  loadTasks();
});
</script>