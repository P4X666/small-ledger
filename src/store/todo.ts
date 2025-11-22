import Taro from '@tarojs/taro';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 时间周期类型
export type TimePeriod = 'week' | 'month' | 'year' | 'none';

// 四象限分类（重要性和紧急程度）
export interface TaskPriority {
  important: boolean; // 重要性
  urgent: boolean;    // 紧急程度
}

// 任务类型定义
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  timePeriod: TimePeriod;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt?: Date;
  // 时间周期相关属性
  dueDate?: Date;
}

// 任务数据持久化键名
const STORAGE_KEY = 'todolist_tasks';

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// 创建并导出任务状态管理store
export const useTodoStore = defineStore('todo', () => {
  // 任务列表状态
  const tasks = ref<Task[]>([]);
  
  // 从本地存储加载任务数据
  const loadTasks = () => {
    try {
      const storedTasks = Taro.getStorageSync(STORAGE_KEY);
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        // 确保数据是数组格式
        if (Array.isArray(parsedTasks)) {
          tasks.value = parsedTasks.map(task => {
            return {
              ...task,
              // 安全地转换日期字符串为Date对象
              createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
              updatedAt: task.updatedAt ? new Date(task.updatedAt) : undefined,
              dueDate: task.dueDate ? new Date(task.dueDate) : undefined
            };
          });
        } else {
          console.error('任务数据格式错误');
          tasks.value = [];
        }
      }
    } catch (error) {
      console.error('加载任务数据失败:', error);
      tasks.value = [];
    }
  };
  
  // 保存任务数据到本地存储
  const saveTasks = () => {
    try {
      Taro.setStorageSync(STORAGE_KEY, JSON.stringify(tasks.value));
    } catch (error) {
      console.error('保存任务数据失败:', error);
    }
  };
  
  // 添加新任务
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    // 输入验证
    if (!taskData.title || taskData.title.trim().length === 0) {
      console.error('任务标题不能为空');
      return;
    }
    
    const newTask: Task = {
      id: generateId(),
      title: taskData.title.trim(),
      completed: Boolean(taskData.completed),
      timePeriod: taskData.timePeriod || 'none',
      priority: taskData.priority || { important: false, urgent: false },
      createdAt: new Date(),
      dueDate: taskData.dueDate,
    };
    
    tasks.value.push(newTask);
    saveTasks();
    
    return newTask;
  };
  
  // 更新任务状态
  const toggleTaskStatus = (taskId: string) => {
    if (!taskId) return;
    
    const taskIndex = tasks.value.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      tasks.value[taskIndex].completed = !tasks.value[taskIndex].completed;
      tasks.value[taskIndex].updatedAt = new Date();
      saveTasks();
    }
  };
  
  // 更新任务信息
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    if (!taskId || !updates) return;
    
    const taskIndex = tasks.value.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      // 不允许更新id和createdAt
      const safeUpdates = { ...updates };
      delete (safeUpdates as any).id;
      delete (safeUpdates as any).createdAt;
      
      // 如果更新title，进行trim处理
      if (safeUpdates.title && typeof safeUpdates.title === 'string') {
        safeUpdates.title = safeUpdates.title.trim();
      }
      
      tasks.value[taskIndex] = {
        ...tasks.value[taskIndex],
        ...safeUpdates,
        updatedAt: new Date(),
      };
      saveTasks();
    }
  };
  
  // 删除任务
  const deleteTask = (taskId: string) => {
    if (!taskId) return;
    
    const taskIndex = tasks.value.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      tasks.value.splice(taskIndex, 1);
      saveTasks();
    }
  };
  
  // 清空所有已完成任务
  const clearCompletedTasks = () => {
    tasks.value = tasks.value.filter(task => !task.completed);
    saveTasks();
  };
  
  // 计算属性：获取已完成任务数
  const completedTasksCount = computed(() => {
    return tasks.value.filter(task => task.completed).length;
  });
  
  // 计算属性：获取待办任务数
  const pendingTasksCount = computed(() => {
    return tasks.value.filter(task => !task.completed).length;
  });
  
  // 计算属性：任务总数
  const totalTasksCount = computed(() => {
    return tasks.value.length;
  });
  
  // 按时间周期筛选任务
  const getTasksByTimePeriod = (period: TimePeriod): Task[] => {
    if (!period || period === 'none') {
      return [...tasks.value];
    }
    
    return tasks.value.filter(task => task.timePeriod === period);
  };
  
  // 获取本周任务
  const getWeeklyTasks = (): Task[] => {
    return getTasksByTimePeriod('week');
  };
  
  // 获取本月任务
  const getMonthlyTasks = (): Task[] => {
    return getTasksByTimePeriod('month');
  };
  
  // 获取本年任务
  const getYearlyTasks = (): Task[] => {
    return getTasksByTimePeriod('year');
  };
  
  // 获取无时间限制任务
  const getNoTimeLimitTasks = (): Task[] => {
    return getTasksByTimePeriod('none');
  };
  
  // 按四象限获取任务
  // 第一象限：重要且紧急
  const getFirstQuadrantTasks = (): Task[] => {
    return tasks.value.filter(task => task.priority.important && task.priority.urgent);
  };
  
  // 第二象限：重要不紧急
  const getSecondQuadrantTasks = (): Task[] => {
    return tasks.value.filter(task => task.priority.important && !task.priority.urgent);
  };
  
  // 第三象限：不重要但紧急
  const getThirdQuadrantTasks = (): Task[] => {
    return tasks.value.filter(task => !task.priority.important && task.priority.urgent);
  };
  
  // 第四象限：不重要不紧急
  const getFourthQuadrantTasks = (): Task[] => {
    return tasks.value.filter(task => !task.priority.important && !task.priority.urgent);
  };
  
  // 获取所有四象限任务
  const getAllQuadrantTasks = () => {
    return {
      first: getFirstQuadrantTasks(),
      second: getSecondQuadrantTasks(),
      third: getThirdQuadrantTasks(),
      fourth: getFourthQuadrantTasks()
    };
  };
  
  // 导出状态和方法
  return {
    tasks,
    loadTasks,
    addTask,
    toggleTaskStatus,
    updateTask,
    deleteTask,
    clearCompletedTasks,
    completedTasksCount,
    pendingTasksCount,
    totalTasksCount,
    getTasksByTimePeriod,
    getWeeklyTasks,
    getMonthlyTasks,
    getYearlyTasks,
    getNoTimeLimitTasks,
    getFirstQuadrantTasks,
    getSecondQuadrantTasks,
    getThirdQuadrantTasks,
    getFourthQuadrantTasks,
    getAllQuadrantTasks
  };
});