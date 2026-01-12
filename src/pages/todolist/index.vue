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
    <!-- 筛选控制面板 -->
    <view class="filter-control-panel">
      <!-- 列表视图内容 -->
      <view class="list-container">
        <!-- 任务搜索表单 -->
        <view class="search-task-card">
          <input v-model="newTaskTitle" placeholder="输入任务名称" class="task-input" />
        </view>

        <!-- 筛选栏：时间周期 + 重要/紧急按钮 -->
        <view class="filter-bar">
          <!-- 时间周期切换标签 -->
          <view class="period-filters" @tap="showPeriodHandle">
            <view>时间周期：</view>
            <view>{{ getPeriodLabel(currentPeriod) }}</view>
          </view>
          
          <!-- 重要/紧急筛选按钮 -->
          <view class="priority-filters">
            <view :class="['filter-btn', { active: filterState.important }]" @tap="toggleFilter('important')">
              <Star size="16" color="currentColor" />
              <text>重要</text>
            </view>
            <view :class="['filter-btn', { active: filterState.urgent }]" @tap="toggleFilter('urgent')">
              <Clock size="16" color="currentColor" />
              <text>紧急</text>
            </view>
          </view>
        </view>

        <!-- 任务列表 -->
        <view class="task-list-section">
          <!-- <view class="section-header">
            <text class="section-title">任务列表</text>
            <text class="section-count">{{ totalTasksCount }} 个任务</text>
          </view> -->
          <view class="task-list" :style="{ paddingBottom: tabBarHeight }">
            <view v-if="filteredTasks.length === 0" class="empty-state">
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
                <nut-button @tap="editTask(task)" class="edit-btn">
                  <Edit size="16" color="var(--primary-color)" />
                </nut-button>
                <nut-button @tap="deleteTask(task.id)" class="delete-btn">
                  <Del size="16" color="var(--danger-color)" />
                </nut-button>
              </view>
            </view>
            <ListLoading :isEnd="isEnd" />
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
import Taro, { useDidShow } from '@tarojs/taro';
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
const newTaskTitle = ref('');
const currentPeriod = ref<TimePeriod>('none');
const showPeriods = ref(false);
const editingTask = ref<any>(null);
const editingTaskPeriodIndex = ref(0);
const editingTaskImportant = ref(false);
const editingTaskUrgent = ref(false);
// 筛选状态
const filterState = ref({
  important: false,
  urgent: false
});
// 列表加载状态
const isEnd = ref(false);

// 计算属性：根据当前选择的时间周期和筛选条件过滤任务
const filteredTasks = computed(() => {
  let tasks = todoStore.tasks;
  
  // 按时间周期过滤
  if (currentPeriod.value !== 'none') {
    tasks = todoStore.getTasksByTimePeriod(currentPeriod.value);
  }
  
  // 按重要性过滤
  if (filterState.value.important) {
    tasks = tasks.filter(task => task.importance === 4);
  }
  
  // 按紧急性过滤
  if (filterState.value.urgent) {
    tasks = tasks.filter(task => task.urgency === 4);
  }
  
  return tasks;
});

const totalTasksCount = computed(() => {
  return todoStore.totalTasksCount;
});

// 加载任务数据
const loadTasks = async () => {
  try {
    await todoStore.loadTasks();
  } catch (error) {
    console.error('加载任务失败:', error);
  }
};

const tabBarHeight = ref('60rpx');

// 页面显示时更新底部栏高亮状态
useDidShow(() => {
  const tabBar = getTabBarInstance();
  tabBar.updateTabbarSelectedIndex(1);
  tabBarHeight.value = tabBar.tabBarHeight;
  loadTasks();
}); 

// 切换筛选条件（重要/紧急）
const toggleFilter = (filterType: 'important' | 'urgent') => {
  filterState.value[filterType] = !filterState.value[filterType];
};

// 获取时间周期标签
const getPeriodLabel = (period: TimePeriod): string => {
  const periodConfig = timePeriods.value.find(p => p.value === period);
  return periodConfig ? periodConfig.name : '';
};
const onChangePeriod=(item: TimePeriodItem)=>{
  currentPeriod.value = item.value
  showPeriods.value = false
  setTimeout(() => {
    console.log(showPeriods.value);
    
  }, 1000);
}
const showPeriodHandle = ()=>{
  showPeriods.value = true
}
// 编辑任务
const editTask = (task: any) => {
  editingTask.value = { ...task };
  // 找到当前任务的时间周期索引
  const periodIndex = timePeriods.value.findIndex(p => p.value === task.timePeriod);
  editingTaskPeriodIndex.value = periodIndex !== -1 ? periodIndex : 0;

  // 设置优先级状态
  editingTaskImportant.value = task.priority?.important || false;
  editingTaskUrgent.value = task.priority?.urgent || false;
};

// 保存编辑后的任务
const saveEditedTask = async () => {
  if (editingTask.value && editingTask.value.title.trim()) {
    const selectedPeriod = timePeriods.value[editingTaskPeriodIndex.value].value;

    try {
      await todoStore.updateTask(editingTask.value.id, {
        title: editingTask.value.title.trim(),
        timePeriod: selectedPeriod,
        importance: editingTask.value.importance,
        urgency: editingTask.value.urgency,
      });

      editingTask.value = null;
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '任务更新失败',
        icon: 'none',
        duration: 2000
      });
    }
  }
};

// 取消编辑
const cancelEdit = () => {
  editingTask.value = null;
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
