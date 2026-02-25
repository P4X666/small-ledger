<template>
  <nut-navbar 
    title="任务管理" 
    fixed 
    placeholder 
    safe-area-inset-top 
    z-index="999"
    class="custom-navbar"
    :style="{ '--status-bar-height': statusBarHeight + 'px' }"
  ></nut-navbar>
  <view class="container">
    <!-- 筛选栏：时间周期 + 重要/紧急按钮 -->
    <view class="filter-bar" :style="{ '--status-bar-height': statusBarHeight + 'px' }">
      <!-- 时间周期切换标签 -->
      <view class="period-filters" @tap="showPeriodHandle">
        <view>时间周期：</view>
        <view>{{ getPeriodLabel(currentPeriod) }}</view>
      </view>
      
      <!-- 重要/紧急筛选按钮 -->
      <view class="priority-filters">
        <view :class="['filter-btn', { active: filterState.important }]" @tap="toggleFilter('important')">
          <view style="color: var(--error-color-critical);">
            <Star size="16" color="currentColor" />
          </view>
          <text>重要</text>
        </view>
        <view :class="['filter-btn', { active: filterState.urgent }]" @tap="toggleFilter('urgent')">
          <view style="color: var(--error-color-critical);">
            <Clock size="16" color="var(--error-color-critical)" />
          </view>
          <text>紧急</text>
        </view>
      </view>
    </view>
    <view class="filter-control-panel">
      <!-- 列表视图内容 -->
      <view class="list-container">
        <!-- 任务搜索表单 -->
        <!-- <view class="search-task-card">
          <input v-model="newTaskTitle" placeholder="输入任务名称" class="task-input" />
        </view> -->

        <!-- 任务列表 -->
        <view class="task-list-section">
          <view id="task-list" class="task-list" :style="{ paddingBottom: tabBarHeight }">
            <view v-if="filteredTasks.length === 0 && !loading" class="empty-state">
              <text class="empty-title">暂无任务</text>
              <text class="empty-subtitle">快来创建第一个任务吧！</text>
            </view>
            <view v-for="task in filteredTasks" :key="task.id" class="task-item-card">
              <view class="task-content">
                <view class="task-main">
                  <text :class="{ 'completed': task.status === TaskStatus.Completed }" class="task-title">{{ task.title }}</text>
                  <view class="task-meta">
                    <view class="period-tag" :class="`period-${task.timePeriod}`">
                      <Calendar size="12" color="#fff" />
                      <text>{{ getPeriodLabel(task.timePeriod) }}</text>
                    </view>
                    <view class="priority-tags">
                      <view v-if="task.importance===4" class="important-tag">
                        <Star size="12" color="#fff" />
                        <text>重要</text>
                      </view>
                      <view v-if="task.urgency===4" class="urgent-tag">
                        <Clock size="12" color="#fff" />
                        <text>紧急</text>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
              <view class="task-actions">
                <nut-button @tap="editTask(task.id)" class="edit-btn">
                  <Edit size="16" color="var(--primary-color)" />
                </nut-button>
                <nut-button @tap="deleteTask(task.id)" class="delete-btn">
                  <Del size="16" color="var(--danger-color)" />
                </nut-button>
              </view>
            </view>
            <ListLoading v-if="filteredTasks.length !== 0" :isEnd="isEnd"  />
          </view>
        </view>
      </view>
    </view>
    <nut-action-sheet 
      title="时间周期"
      v-model:visible="showPeriods" 
      :menu-items="timePeriods" 
      @choose="onChangePeriod" 
      z-index="99999"
      class="action-sheet"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, Ref } from 'vue';
import { useTodoStore, type TimePeriod } from '@/store/todo';
import Taro, { useDidShow, useLoad, usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { Edit, Del, Star, Clock } from '@nutui/icons-vue-taro';
import { TaskStatus } from '@/constants/common';
import { getTabBarInstance } from '@/utils/tab-bar';
import { useNavigationBar } from '@/utils/navigation';
import ListLoading from '@/components/list-loading/index.vue';
import './index.scss'

const { statusBarHeight } = useNavigationBar();

// 初始化store
const todoStore = useTodoStore();

type TimePeriodItem = { name: string; value: TimePeriod }

// 时间周期定义
const timePeriods: Ref<TimePeriodItem[]> = ref([
  { name: '全部', value: 'none' },
  { name: '本周', value: 'week' },
  { name: '本月', value: 'month' },
  { name: '本年', value: 'year' }
]);

// 响应式数据
const currentPeriod = ref<TimePeriod>('none');
const showPeriods = ref(false);
// 筛选状态
const filterState = ref({
  important: false,
  urgent: false
});
// 列表加载状态
const isEnd = computed(()=>todoStore.isEnd);
const loading = computed(()=>todoStore.isLoading);

useReachBottom(()=>{
  loadTasks()
})

const filteredTasks = computed(() => {
  return todoStore.tasks;
});

// 加载任务数据
const loadTasks = async (reset = false) => {
  try {
    await todoStore.loadTasks(reset, {
      timePeriod: currentPeriod.value==='none'?undefined:currentPeriod.value,
      importance: filterState.value.important ? 4 : undefined,
      urgency: filterState.value.urgent ? 4 : undefined,
    });
  } catch (error) {
    console.error('加载任务失败:', error);
  }
};

const tabBarHeight = ref('60rpx');

useLoad(()=>{
  loadTasks()
})
// 页面显示时更新底部栏高亮状态
useDidShow(() => {
  const tabBar = getTabBarInstance();
  tabBar.updateTabbarSelectedIndex(1);
  tabBarHeight.value = tabBar.tabBarHeight;
}); 

usePullDownRefresh(async () => {
  await loadTasks(true)
  Taro.stopPullDownRefresh();
})

// 切换筛选条件（重要/紧急）
const toggleFilter = (filterType: 'important' | 'urgent') => {
  filterState.value[filterType] = !filterState.value[filterType];
  loadTasks(true)
};

// 获取时间周期标签
const getPeriodLabel = (period: TimePeriod): string => {
  const periodConfig = timePeriods.value.find(p => p.value === period);
  return periodConfig ? periodConfig.name : '';
};
const onChangePeriod=(item: TimePeriodItem)=>{
  currentPeriod.value = item.value
  showPeriods.value = false
  loadTasks(true)
}
const showPeriodHandle = ()=>{
  showPeriods.value = true
}
// 编辑任务
const editTask = (id: string) => {
  Taro.navigateTo({
    url: '/pages/todolist/detail/index?id=' + id
  })
};

// 删除任务
const deleteTask = async (id: string) => {
  try {
    // 显示确认对话框
    const confirmResult = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个任务吗？',
      cancelText: '取消',
      confirmText: '删除',
      confirmColor: '#ff4d4f'
    });

    if (confirmResult.confirm) {
      await todoStore.deleteTask(id);
      Taro.showToast({
        title: '任务删除成功',
        icon: 'success',
        duration: 1500
      });
    }
  } catch (error: any) {
    Taro.showToast({
      title: error.message || '任务删除失败',
      icon: 'none',
      duration: 2000
    });
  }
};
</script>
