<template>
  <nut-navbar 
    :title="pageTitle" 
    left-show 
    @click-back="goBack" 
    fixed 
    placeholder 
    safe-area-inset-top 
    z-index="999"
    class="custom-navbar"
    :style="{ '--status-bar-height': statusBarHeight + 'px' }"
  ></nut-navbar>
  <view class="container">
    <view class="form-content">
      <!-- 任务名称 -->
      <nut-form :model-value="formData" ref="formRef">
        
        <nut-form-item label="任务名称" prop="title" required
          :rules="[{ required: true, message: '请输入任务名称' }, { min: 1, max: 20, message: '任务名称长度为6-20个字符' }]">
          <nut-input v-model="formData.title" placeholder="请输入任务名称" clearable maxlength="20" />
        </nut-form-item>

        <!-- 时间周期 -->
        <nut-form-item label="时间周期" prop="timePeriod" required
          :rules="[{ required: true, message: '请选择时间周期' }]">

          <view class="time-period-select" @tap="showTimePeriodPopup = true">
            {{ timePeriodOptions.find(item => item.value === formData.timePeriod)?.text || '请选择时间周期' }}
          </view>
        </nut-form-item>

        <!-- 优先级选择 -->
        <view class="priority-section">
          <text class="priority-title">优先级</text>
          <view class="priority-options">
            <view class="priority-option" :class="{ active: isPriorityActive(4,4) }" @tap="setPriority(4,4)">
              <Star size="32" :color="isPriorityActive(4,4)?'var(--text-white)':'var(--error-color)'" />
              <text class="priority-label">重要紧急</text>
              <text class="priority-desc">第一象限</text>
            </view>
            <view class="priority-option" :class="{ active: isPriorityActive(4,3) }" @tap="setPriority(4,3)">
              <Star size="32" :color="isPriorityActive(4,3)?'var(--text-white)':'var(--warning-color)'" />
              <text class="priority-label">重要不紧急</text>
              <text class="priority-desc">第二象限</text>
            </view>
            <view class="priority-option" :class="{ active: isPriorityActive(3,4) }" @tap="setPriority(3,4)">
              <Star size="32" :color="isPriorityActive(3,4)?'var(--text-white)':'var(--success-color)'" />
              <text class="priority-label">不重要紧急</text>
              <text class="priority-desc">第三象限</text>
            </view>
            <view class="priority-option" :class="{ active: isPriorityActive(3,3) }" @tap="setPriority(3,3)">
              <Star size="32" :color="isPriorityActive(3,3)?'var(--text-white)':'var(--text-tertiary)'" />
              <text class="priority-label">不重要不紧急</text>
              <text class="priority-desc">第四象限</text>
            </view>
          </view>
        </view>
        <!-- 任务描述 -->
        <view class="form-field">
          <text class="field-label">任务描述（可选）</text>
          <textarea v-model="formData.description" placeholder="请输入任务描述" class="textarea" auto-height></textarea>
        </view>
      </nut-form>
    </view>

    <view class="footer safe-area">
      <button @tap="goBack" class="cancel-btn">
        取消
      </button>
      <button @tap="createTask" class="confirm-btn">
        保存
      </button>
    </view>
    <nut-popup v-model:visible="showTimePeriodPopup" position="bottom">
      <nut-picker v-model="timePeriodPopupValue" :columns="timePeriodOptions" title="时间周期" @cancel="showTimePeriodPopup = false" @confirm="handleTimePeriodChange" />
    </nut-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useTodoStore } from '@/store/todo';
import type { Task, TimePeriod } from '@/store/todo';
import Taro from '@tarojs/taro';
import { useNavigationBar } from '@/utils/navigation';
import { Star } from '@nutui/icons-vue-taro';
import './index.scss';

const { statusBarHeight } = useNavigationBar();
// 使用任务状态管理
const todoStore = useTodoStore();

// 时间周期选项
const timePeriodOptions: {text: string, value: TimePeriod}[] = [
  {text: '本周', value: 'week'},
  {text: '本月', value: 'month'},
  {text: '本年', value: 'year'}
];
const showTimePeriodPopup = ref(false);

// 表单数据
const formData: Omit<Task,  'id' | 'createdAt' | 'updatedAt' | 'status'> & Partial<Pick<Task, 'id'>> = reactive({
  title: '',
  description: '',
  timePeriod: timePeriodOptions[0].value,
  importance: 3,
  urgency: 3,
  dueDate: undefined as Date | undefined
});
const timePeriodPopupValue = computed(() => [timePeriodOptions[0].value]);

// 当前选择的时间周期索引
const timePeriodIndex = ref(0);

// 表单验证
const validateForm = () => {

  // 验证任务名称
  if (!formData.title.trim()) {
    showErrorToast('任务名称不能为空');
    return false;
  }

  return true;
};

// 表单是否有效
const isFormValid = computed(() => {
  return validateForm();
});

const showErrorToast = (title: string) => {
  Taro.showToast({
    title,
    icon: 'none',
    duration: 2000
  });
};

// 处理时间周期变化
const handleTimePeriodChange = ({ selectedValue, selectedOptions }: { selectedValue: string, selectedOptions: { text: string, value: TimePeriod }[] }) => {
  const index = selectedOptions.findIndex(option => option.value === selectedValue[0]);
  timePeriodIndex.value = index;
  formData.timePeriod = selectedOptions[index].value;

  showTimePeriodPopup.value = false;

  validateForm();
};

// 设置优先级
const setPriority = (importance: number, urgency: number) => {
  formData.importance = importance;
  formData.urgency = urgency;
};

// 检查优先级是否激活
const isPriorityActive = (importance: number, urgency: number) => {
  const { importance: activeImportance, urgency: activeUrgency } = formData;
  return importance === activeImportance && urgency === activeUrgency;
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
      title: formData.title,
      timePeriod: formData.timePeriod as TimePeriod,
      importance: formData.importance,
      urgency: formData.urgency,
      description: formData.description
    };

    if(formData.id){
      await todoStore.updateTask(formData.id, taskData);
    }else{
      await todoStore.addTask(taskData);
    }

    // 返回上一页
    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  } catch (error: any) {
    console.error('创建任务失败:', error);
  }
};

// 返回上一页
const goBack = () => {
  Taro.navigateBack();
};

const pageTitle = ref('');

Taro.useLoad((pageParams) => {
  const { id } = pageParams;
  pageTitle.value = '创建任务'
  if(id){
    pageTitle.value = '编辑任务'
    getTaskDetail(id);
  }
  Taro.setNavigationBarTitle({
    title: pageTitle.value
  });

});

const getTaskDetail = async (id: string) => {
  try {
    const task = await todoStore.getTaskDetail(id);
    if (task) {
      // 填充表单数据
      for (const key in formData) {
        if (key in task) {
          formData[key] = task[key];
        }
      }
      console.log(formData);
      
    }
  } catch (error) {
    goBack();
  }
};

</script>
