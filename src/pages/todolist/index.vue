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
    <!-- <view class="header">
      <text class="title">任务管理</text>
    </view> -->

    <!-- 视图切换器 -->
    <view class="view-switcher">
      <view :class="['switch-btn', { active: viewMode === 'list' }]" @tap="switchViewMode('list')">
        <nut-icon :name="viewMode === 'list' ? 'list-active' : 'list'" size="16" color="currentColor" />
        <text>列表视图</text>
      </view>
      <view :class="['switch-btn', { active: viewMode === 'quadrant' }]" @tap="switchViewMode('quadrant')">
        <nut-icon :name="viewMode === 'quadrant' ? 'grid-active' : 'grid'" size="16" color="currentColor" />
        <text>四象限视图</text>
      </view>
    </view>

    <!-- 列表视图内容 -->
    <view v-if="viewMode === 'list'">
      <!-- 时间周期切换标签 -->
      <view class="period-tabs">
        <view v-for="period in timePeriods" :key="period.value"
          :class="['tab-item', { active: currentPeriod === period.value }]" @tap="switchPeriod(period.value)">
          <text>{{ period.label }}</text>
        </view>
      </view>

      <!-- 任务创建表单 -->
      <view class="create-task">
        <view class="task-input-wrapper">
          <input v-model="newTaskTitle" placeholder="输入新任务" class="input" />
          <view class="task-options">
            <picker mode="selector" range="{{ timePeriodOptions }}" :value="newTaskPeriodIndex"
              @change="handleTaskPeriodChange">
              <view class="period-picker">
                <nut-icon name="calendar" size="14" color="#999" />
                <text>{{ timePeriods[newTaskPeriodIndex].label }}</text>
              </view>
            </picker>
            <view class="priority-options">
              <view :class="['priority-tag', { active: newTaskImportant }]"
                @click="handleImportantChange({ detail: { value: !newTaskImportant } })">
                <nut-icon name="star" size="14" color="currentColor" />
                <text>重要</text>
              </view>
              <view :class="['priority-tag', { active: newTaskUrgent }]"
                @click="handleUrgentChange({ detail: { value: !newTaskUrgent } })">
                <nut-icon name="clock" size="14" color="currentColor" />
                <text>紧急</text>
              </view>
            </view>
            <nut-button @tap="addTask" class="add-btn">
              <nut-icon name="plus" size="16" color="#fff" />
              <text>添加任务</text>
            </nut-button>
          </view>
        </view>
      </view>

      <!-- 任务列表 -->
      <view class="task-list" :style="{ paddingBottom: tabBarHeight }">
        <view v-if="filteredTasks.length === 0" class="empty-state">
          <nut-icon name="task-list" size="48" color="#e0e0e0" />
          <text>暂无任务，快来创建第一个任务吧！</text>
        </view>
        <view v-for="task in filteredTasks" :key="task.id" class="task-item">
          <view class="task-content">
            <view :class="['checkbox-container', { completed: task.status === TaskStatus.Completed }]" @click="toggleTaskStatus(task.id, task.status === TaskStatus.Completed ? TaskStatus.Pending : TaskStatus.Completed)">
              <CheckChecked v-if="task.status === TaskStatus.Completed" :size="24" color="var(--primary-color)" />
              <Check v-else :size="24" color="#d9d9d9" />
            </view>
            <view class="task-main">
              <text :class="{ 'completed': task.status === TaskStatus.Completed }" class="task-title">{{ task.title }}</text>
              <view class="task-meta">
                <view class="period-tag" :class="`period-${task.timePeriod}`">
                  <nut-icon name="calendar" size="12" color="#fff" />
                  <text>{{ getPeriodLabel(task.timePeriod) }}</text>
                </view>
                <view class="priority-tags">
                  <view v-if="task.importance===4" class="important-tag">
                    <nut-icon name="star" size="12" color="#fff" />
                    <text>重要</text>
                  </view>
                  <view v-if="task.urgency===4" class="urgent-tag">
                    <nut-icon name="clock" size="12" color="#fff" />
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

    <!-- 编辑任务弹窗 -->
    <view v-if="editingTask" class="modal">
      <view class="modal-content">
        <text class="modal-title">编辑任务</text>
        <input v-model="editingTask.title" class="input" />
        <view class="modal-field">
          <text class="field-label">时间周期：</text>
          <picker mode="selector" range="{{ timePeriodOptions }}" :value="editingTaskPeriodIndex"
            @change="handleEditingTaskPeriodChange">
            <view class="period-picker modal-picker">
              {{ timePeriods[editingTaskPeriodIndex].label }}
            </view>
          </picker>
        </view>
        <view class="modal-field">
          <text class="field-label">优先级：</text>
          <!-- <view class="priority-checkboxes">
            <checkbox :checked="editingTaskImportant" @change="handleEditingImportantChange" class="priority-checkbox">
              重要</checkbox>
            <checkbox :checked="editingTaskUrgent" @change="handleEditingUrgentChange" class="priority-checkbox">紧急
            </checkbox>
          </view> -->
        </view>
        <view class="modal-actions">
          <nut-button @tap="saveEditedTask" class="save-btn">保存</nut-button>
          <nut-button @tap="cancelEdit" class="cancel-btn">取消</nut-button>
        </view>
      </view>
    </view>
    <!-- 四象限视图 -->
    <view v-if="viewMode === 'quadrant'" class="quadrant-container">
      <view class="quadrant-title">四象限任务管理</view>

      <!-- 四象限网格 -->
      <view class="quadrant-grid">
        <!-- 第一象限：重要且紧急 -->
        <view class="quadrant quadrant-1">
          <view class="quadrant-header">
            <text class="quadrant-title">重要且紧急</text>
            <text class="task-count">{{ quadrantTasks.first.length }}</text>
          </view>
          <!-- <view class="quadrant-content">
            <view v-for="task in quadrantTasks.first" :key="task.id" class="quadrant-task">
              <checkbox :checked="task.completed" @change="toggleTaskStatus(task.id)" class="checkbox" />
              <text :class="{ 'completed': task.completed }" class="task-text">{{ task.title }}</text>
            </view>
          </view> -->
        </view>

        <!-- 第二象限：重要不紧急 -->
        <view class="quadrant quadrant-2">
          <view class="quadrant-header">
            <text class="quadrant-title">重要不紧急</text>
            <text class="task-count">{{ quadrantTasks.second.length }}</text>
          </view>
          <!-- <view class="quadrant-content">
            <view v-for="task in quadrantTasks.second" :key="task.id" class="quadrant-task">
              <checkbox :checked="task.completed" @change="toggleTaskStatus(task.id)" class="checkbox" />
              <text :class="{ 'completed': task.completed }" class="task-text">{{ task.title }}</text>
            </view>
          </view> -->
        </view>

        <!-- 第三象限：不重要但紧急 -->
        <view class="quadrant quadrant-3">
          <view class="quadrant-header">
            <text class="quadrant-title">不重要但紧急</text>
            <text class="task-count">{{ quadrantTasks.third.length }}</text>
          </view>
          <!-- <view class="quadrant-content">
            <view v-for="task in quadrantTasks.third" :key="task.id" class="quadrant-task">
              <checkbox :checked="task.completed" @change="toggleTaskStatus(task.id)" class="checkbox" />
              <text :class="{ 'completed': task.completed }" class="task-text">{{ task.title }}</text>
            </view>
          </view> -->
        </view>

        <!-- 第四象限：不重要不紧急 -->
        <view class="quadrant quadrant-4">
          <view class="quadrant-header">
            <text class="quadrant-title">不重要不紧急</text>
            <text class="task-count">{{ quadrantTasks.fourth.length }}</text>
          </view>
          <!-- <view class="quadrant-content">
            <view v-for="task in quadrantTasks.fourth" :key="task.id" class="quadrant-task">
              <checkbox :checked="task.completed" @change="toggleTaskStatus(task.id)" class="checkbox" />
              <text :class="{ 'completed': task.completed }" class="task-text">{{ task.title }}</text>
            </view>
          </view> -->
        </view>
      </view>
    </view>
    
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, Ref } from 'vue';
import { useTodoStore, type TimePeriod } from '@/store/todo';
import Taro, { useDidShow } from '@tarojs/taro';
import { Edit, Del, Check, CheckChecked } from '@nutui/icons-vue-taro';
import { TaskStatus } from '@/constants/common';
import { getTabBarInstance } from '@/utils/tab-bar';
import { useNavigationBar } from '@/utils/navigation';
import ListLoading from '@/components/list-loading/index.vue';
import './index.scss'

const { statusBarHeight } = useNavigationBar();

// 初始化store
const todoStore = useTodoStore();

// 时间周期定义
const timePeriods: Ref<{ label: string; value: TimePeriod }[]> = ref([
  { label: '全部', value: 'none' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本年', value: 'year' }
]);

// 响应式数据
const viewMode = ref<'list' | 'quadrant'>('list');
const newTaskTitle = ref('');
const newTaskPeriodIndex = ref(0);
const newTaskImportant = ref(false);
const newTaskUrgent = ref(false);
const currentPeriod = ref<TimePeriod>('none');
const editingTask = ref<any>(null);
const editingTaskPeriodIndex = ref(0);
const editingTaskImportant = ref(false);
const editingTaskUrgent = ref(false);
// 列表加载状态
const isEnd = ref(false);

// 计算属性：根据当前选择的时间周期过滤任务
const filteredTasks = computed(() => {
  if (currentPeriod.value === 'none') {
    return todoStore.tasks;
  }
  return todoStore.getTasksByTimePeriod(currentPeriod.value);
});

// 计算属性：获取四象限任务数据
const quadrantTasks = computed(() => {
  return todoStore.getAllQuadrantTasks();
});

// 生命周期钩子，加载任务数据
onMounted(() => {
  loadTasks();
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
}); 
// 切换视图模式
const switchViewMode = (mode: 'list' | 'quadrant') => {
  viewMode.value = mode;
};

// 切换时间周期
const switchPeriod = (period: TimePeriod) => {
  currentPeriod.value = period;
};

// 获取时间周期标签
const getPeriodLabel = (period: TimePeriod): string => {
  const periodConfig = timePeriods.value.find(p => p.value === period);
  return periodConfig ? periodConfig.label : '无';
};

// 处理任务时间周期变更
const handleTaskPeriodChange = (event: any) => {
  newTaskPeriodIndex.value = event.detail.value;
};

const handleEditingTaskPeriodChange = (event: any) => {
  editingTaskPeriodIndex.value = event.detail.value;
};

const handleImportantChange = (event: any) => {
  newTaskImportant.value = event.detail.value;
};

const handleUrgentChange = (event: any) => {
  newTaskUrgent.value = event.detail.value;
};

// 添加新任务
const addTask = () => {
  Taro.navigateTo({
    url: '/pages/todolist/create/index'
  });
};

// 切换任务状态
const toggleTaskStatus = async (id: string, status: TaskStatus) => {
  try {
    await todoStore.toggleTaskStatus(id, status);
  } catch (error) {
    console.error('切换任务状态失败:', error);
  }
};

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
