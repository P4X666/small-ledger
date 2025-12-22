<template>
  <view class="container" :style="{ paddingTop: navigationBarHeight + 'px' }">

    <view class="form-content">
      <!-- 任务名称 -->
      <view class="form-field">
        <text class="field-label">任务名称</text>
        <nut-input 
          v-model="taskForm.title" 
          placeholder="请输入任务名称" 
          class="input" 
        />
        <text v-if="errors.title" class="error-message">{{ errors.title }}</text>
      </view>

      <!-- 时间周期 -->
      <view class="form-field">
        <text class="field-label">时间周期</text>
        <view class="picker-container">
          <picker 
            mode="selector" 
            :range="timePeriodOptions" 
            :value="timePeriodIndex" 
            @change="handleTimePeriodChange"
            class="picker"
          >
            <view class="picker-content">{{ timePeriodOptions[timePeriodIndex] }}</view>
          </picker>
          <nut-icon name="arrow-down" size="16" color="#999" class="picker-arrow" />
        </view>
      </view>

      <!-- 截止日期 -->
      <!-- <view class="form-field" v-if="taskForm.timePeriod !== 'none'">
        <text class="field-label">截止日期</text>
        <view class="picker-container">
          <picker 
            mode="date" 
            :value="dueDateValue" 
            :start="minDate" 
            @change="handleDueDateChange"
            class="picker"
          >
            <view>
              <text>{{ dueDateValue || '请选择截止日期' }}</text>
            </view>
          </picker>
          <nut-icon name="calendar" size="16" color="#999" class="picker-arrow" />
        </view>
        <text v-if="errors.dueDate" class="error-message">{{ errors.dueDate }}</text>
      </view> -->

      <!-- 优先级选择 -->
      <view class="priority-section">
        <text class="priority-title">优先级</text>
        <view class="priority-options">
          <view 
            class="priority-option" 
            :class="{ active: isPriorityActive(1) }" 
            @tap="setPriority(1)"
          >
            <nut-icon name="alert-circle" size="32" color="var(--error-color)" />
            <text class="priority-label">重要紧急</text>
            <text class="priority-desc">第一象限</text>
          </view>
          <view 
            class="priority-option" 
            :class="{ active: isPriorityActive(2) }" 
            @tap="setPriority(2)"
          >
            <nut-icon name="clock" size="32" color="var(--warning-color)" />
            <text class="priority-label">重要不紧急</text>
            <text class="priority-desc">第二象限</text>
          </view>
          <view 
            class="priority-option" 
            :class="{ active: isPriorityActive(3) }" 
            @tap="setPriority(3)"
          >
            <nut-icon name="star" size="32" color="var(--success-color)" />
            <text class="priority-label">不重要紧急</text>
            <text class="priority-desc">第三象限</text>
          </view>
          <view 
            class="priority-option" 
            :class="{ active: isPriorityActive(4) }" 
            @tap="setPriority(4)"
          >
            <nut-icon name="circle" size="32" color="var(--text-tertiary)" />
            <text class="priority-label">不重要不紧急</text>
            <text class="priority-desc">第四象限</text>
          </view>
        </view>
      </view>
      <!-- 任务描述 -->
      <view class="form-field">
        <text class="field-label">任务描述（可选）</text>
        <textarea 
          v-model="taskForm.description" 
          placeholder="请输入任务描述" 
          class="textarea" 
          auto-height
        ></textarea>
      </view>
    </view>

    <view class="footer safe-area">
      <button @tap="goBack" class="cancel-btn">
        <nut-icon name="close" size="16" color="#666" />
        取消
      </button>
      <button @tap="createTask" class="confirm-btn" :disabled="!isFormValid">
        <nut-icon name="check" size="16" color="#fff" />
        保存
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useTodoStore } from '@/store/todo';
import type { TimePeriod, TaskPriority } from '@/store/todo';
import Taro from '@tarojs/taro';
import { useNavigationBar } from '@/utils/navigation';
import './index.scss';

const { navigationBarHeight } = useNavigationBar();
// 使用任务状态管理
const todoStore = useTodoStore();

// 时间周期选项
const timePeriodOptions = ['无时间限制', '本周', '本月', '本年'];
const timePeriodValues: TimePeriod[] = ['none', 'week', 'month', 'year'];

// 表单数据
const taskForm = reactive({
  title: '',
  description: '',
  timePeriod: timePeriodValues[0] as TimePeriod,
  priority: { important: false, urgent: false } as TaskPriority,
  dueDate: undefined as Date | undefined
});

// 表单验证错误
const errors = reactive({
  title: '',
  dueDate: ''
});

// 当前选择的时间周期索引
const timePeriodIndex = ref(0);

// 截止日期值
const dueDateValue = ref('');

// 最小日期（今天）
const minDate = new Date().toISOString().split('T')[0];

// 表单验证
const validateForm = () => {
  let isValid = true;
  
  // 验证任务名称
  if (!taskForm.title.trim()) {
    errors.title = '任务名称不能为空';
    isValid = false;
  } else {
    errors.title = '';
  }
  
  // 验证截止日期
  if (taskForm.timePeriod !== 'none' && !taskForm.dueDate) {
    errors.dueDate = '请选择截止日期';
    isValid = false;
  } else {
    errors.dueDate = '';
  }
  
  return isValid;
};

// 表单是否有效
const isFormValid = computed(() => {
  return validateForm();
});

// 处理时间周期变化
const handleTimePeriodChange = (event: any) => {
  const index = event.detail.value;
  timePeriodIndex.value = index;
  taskForm.timePeriod = timePeriodValues[index];
  
  // 如果切换到无时间限制，清空截止日期
  if (taskForm.timePeriod === 'none') {
    taskForm.dueDate = undefined;
    dueDateValue.value = '';
  }
  
  validateForm();
};

// 处理截止日期变化
const handleDueDateChange = (event: any) => {
  const dateStr = event.detail.value;
  dueDateValue.value = dateStr;
  taskForm.dueDate = new Date(dateStr);
  validateForm();
};

// 设置优先级
const setPriority = (quadrant: number) => {
  switch (quadrant) {
    case 1: // 重要紧急
      taskForm.priority = { important: true, urgent: true };
      break;
    case 2: // 重要不紧急
      taskForm.priority = { important: true, urgent: false };
      break;
    case 3: // 不重要紧急
      taskForm.priority = { important: false, urgent: true };
      break;
    case 4: // 不重要不紧急
      taskForm.priority = { important: false, urgent: false };
      break;
  }
};

// 检查优先级是否激活
const isPriorityActive = (quadrant: number): boolean => {
  const { important, urgent } = taskForm.priority;
  
  switch (quadrant) {
    case 1:
      return important && urgent;
    case 2:
      return important && !urgent;
    case 3:
      return !important && urgent;
    case 4:
      return !important && !urgent;
    default:
      return false;
  }
};

// 创建任务
const createTask = async () => {
  if (!isFormValid.value) {
    validateForm();
    return;
  }
  
  try {
    // 准备任务数据
    const taskData = {
      title: taskForm.title,
      completed: false,
      timePeriod: taskForm.timePeriod,
      priority: taskForm.priority,
      dueDate: taskForm.dueDate,
      description: taskForm.description
    };
    
    // 添加任务（异步调用API）
    await todoStore.addTask(taskData);
    
    // 显示成功提示
    Taro.showToast({
      title: '任务创建成功',
      icon: 'success',
      duration: 1500
    });
    
    // 返回上一页
    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  } catch (error: any) {
    // 显示错误提示
    Taro.showToast({
      title: error.message || '任务创建失败',
      icon: 'none',
      duration: 2000
    });
  }
};

// 返回上一页
const goBack = () => {
  Taro.navigateBack();
};
</script>
