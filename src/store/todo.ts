import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Taro from '@tarojs/taro';
import { 
  getAllTasks, 
  getTaskById,
  createTask, 
  updateTask as apiUpdateTask, 
  updateTaskStatus, 
  deleteTask as apiDeleteTask,
  getTasksByTimePeriod as apiGetTasksByTimePeriod,
  getTasksByQuadrant as apiGetTasksByQuadrant
} from '@/api/todo';
import { TaskStatus } from '@/constants/common';
import dayjs from 'dayjs';

// 时间周期类型
export type TimePeriod = 'week' | 'month' | 'year' | 'none';

// 四象限分类（重要性和紧急程度）
export type TaskPriority = 'high' | 'medium' | 'low';

// 任务类型定义
export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  timePeriod: TimePeriod;
  // priority: TaskPriority;
  // 后端返回的重要性和紧急性数值
  importance?: number;
  urgency?: number;
  createdAt: string;
  updatedAt?: string;
  description?: string;
}

export const getPriority = ({importance=1, urgency=1}): TaskPriority => {
  if (importance >= 3 && urgency >= 3) {
    return 'high';
  } else if (importance <= 2 && urgency <= 2) {
    return 'low';
  } else {
    return 'medium';
  }
}

// 创建并导出任务状态管理store
export const useTodoStore = defineStore('todo', () => {
  // 任务列表状态
  const tasks = ref<Task[]>([]);
  // 任务ID映射表 （用于快速查找任务和去重）
  const tasksMap = ref<Record<string, Task>>({});
  // 加载状态
  const isLoading = ref(false);
  // 错误信息
  const error = ref<string | null>(null);
  
  const resetTasksHandle = () => {
    tasks.value = [];
    tasksMap.value = {};
  }
  const addTaskHandle = (task: Task) => {
    if (!tasksMap.value[task.id]) {
      const newTask = {
        ...task,
        createdAt: dayjs(task.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs(task.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
      };
      tasksMap.value[task.id] = newTask;
      tasks.value.push(newTask);
    }
  }

  // 从API加载任务数据
  const loadTasks = async (reset=false) => {
    isLoading.value = true;
    error.value = null;
    if (reset) {
      resetTasksHandle();
    }
    
    try {
      const fetchedTasks = await getAllTasks();
      fetchedTasks.data.forEach(task => {
        addTaskHandle(task);
      });
      return tasks.value;
    } catch (err: any) {
      error.value = err.message || '加载任务失败';
      Taro.showToast({
        title: error.value || '加载任务失败',
        icon: 'none',
        duration: 2000
      });
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  const getTaskDetail = async (id: string) => {
    try {
      const task = await getTaskById(id);
      if (task) {
        return task
      }
      throw new Error('任务不存在');
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '获取任务详情失败',
        icon: 'none',
        duration: 2000
      });
    }
  };
  
  // 添加新任务
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    // 输入验证
    if (!taskData.title || taskData.title.trim().length === 0) {
      const errorMsg = '任务标题不能为空';
      Taro.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
      throw new Error(errorMsg);
    }
    
    try {
      const importance = taskData.importance || 1;
      const urgency = taskData.urgency || 1;
      const priority = getPriority({importance, urgency});
      const newTask = await createTask({
        title: taskData.title.trim(),
        // completed: Boolean(taskData.completed),
        timePeriod: taskData.timePeriod || 'none',
        // priority,
        importance,
        urgency,
        description: taskData.description
      });
      
      
      // 转换日期格式
      const formattedTask = {
        ...newTask,
        // 转换优先级为四象限格式
        priority,
        importance,
        urgency,
        createdAt: dayjs(newTask.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs(newTask.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
      };
      
      // tasks.value.push(formattedTask);

      Taro.showToast({
        title: '任务创建成功',
        icon: 'success',
        duration: 1500
      });

      return formattedTask;
    } catch (err: any) {
      let errorMsg = err.message || '创建任务失败';
      if (err.code === 409) {
        errorMsg = '任务标题已存在，请选择其他标题';
      }
      Taro.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
      throw new Error(errorMsg);
    }
  };
  
  // 更新任务状态
  const toggleTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!taskId) return;
    
    try {
      const updatedTask = await updateTaskStatus(taskId, status);
      
      // 更新本地状态
      const taskIndex = tasks.value.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks.value[taskIndex] = {
          ...updatedTask,
        };
      }
    } catch (err: any) {
      const errorMsg = err.message || '更新任务状态失败';
      Taro.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
    }
  };
  
  // 更新任务信息
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!taskId || !updates) return;
    
    try {
      // 不允许更新id和createdAt
      const safeUpdates = { ...updates };
      delete (safeUpdates as any).id;
      delete (safeUpdates as any).createdAt;
      delete (safeUpdates as any).updatedAt;
      
      // 如果更新title，进行trim处理
      if (safeUpdates.title && typeof safeUpdates.title === 'string') {
        safeUpdates.title = safeUpdates.title.trim();
      }
      
      const updatedTask = await apiUpdateTask(taskId, safeUpdates);
      
      // 更新本地状态
      const taskIndex = tasks.value.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks.value[taskIndex] = {
          ...updatedTask,
          createdAt: dayjs(updatedTask.createdAt).format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs(updatedTask.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
        };
      }
    } catch (err: any) {
      const errorMsg = err.message || '更新任务失败';
      Taro.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
      throw new Error(errorMsg);
    }
  };
  
  // 删除任务
  const deleteTask = async (taskId: string) => {
    if (!taskId) return;
    
    try {
      await apiDeleteTask(taskId);
      
      // 更新本地状态
      const taskIndex = tasks.value.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks.value.splice(taskIndex, 1);
      }
    } catch (err: any) {
      const errorMsg = err.message || '删除任务失败';
      Taro.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
      throw new Error(errorMsg);
    }
  };
  
  // 清空所有已完成任务
  const clearCompletedTasks = async () => {
    try {
      // 获取所有已完成任务的ID
      const completedTaskIds = tasks.value.filter(task => task.status === TaskStatus.Completed).map(task => task.id);
      
      // 批量删除已完成任务
      await Promise.all(completedTaskIds.map(id => apiDeleteTask(id)));
      
      // 更新本地状态
      tasks.value = tasks.value.filter(task => task.status !== TaskStatus.Completed);
    } catch (err: any) {
      const errorMsg = err.message || '清空已完成任务失败';
      Taro.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
    }
  };
  
  // 计算属性：获取已完成任务数
  const completedTasksCount = computed(() => {
    return tasks.value.filter(task => task.status === TaskStatus.Completed).length;
  });
  
  // 计算属性：获取待办任务数
  const pendingTasksCount = computed(() => {
    return tasks.value.filter(task => task.status === TaskStatus.Pending).length;
  });
  
  // 计算属性：任务总数
  const totalTasksCount = computed(() => {
    return tasks.value.length;
  });
  
  // 按时间周期筛选任务（本地筛选）
  const getTasksByTimePeriod = (period: TimePeriod): Task[] => {
    if (!period || period === 'none') {
      return [...tasks.value];
    }
    
    return tasks.value.filter(task => task.timePeriod === period);
  };
  
  // 从API按时间周期获取任务
  const fetchTasksByTimePeriod = async (period: TimePeriod): Promise<Task[]> => {
    resetTasksHandle();
    try {
      const fetchedTasks = await apiGetTasksByTimePeriod(period);
      fetchedTasks.forEach(task => {
        addTaskHandle(task);
        return {
          ...task,
          createdAt: dayjs(task.createdAt).format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs(task.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
        };
      });
      return tasks.value;
    } catch (err: any) {
      const errorMsg = err.message || '获取任务列表失败';
      Taro.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
      throw new Error(errorMsg);
    }
  };
  
  // 从API获取四象限任务
  const fetchTasksByQuadrant = async () => {
    resetTasksHandle();
    try {
      const quadrantTasks = await apiGetTasksByQuadrant();
      
      // 转换日期和优先级格式
      const formatTasks = (taskList: any[]) => {
        return taskList.map(task => {
          addTaskHandle(task);
          return {
            ...task,
            createdAt: dayjs(task.createdAt).format('YYYY-MM-DD HH:mm:ss'),
            updatedAt: dayjs(task.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
          };
        });
      };
      
      return {
        first: formatTasks(quadrantTasks.first),
        second: formatTasks(quadrantTasks.second),
        third: formatTasks(quadrantTasks.third),
        fourth: formatTasks(quadrantTasks.fourth)
      };
    } catch (err: any) {
      const errorMsg = err.message || '获取四象限任务失败';
      Taro.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
      throw new Error(errorMsg);
    }
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
  
  // 按四象限获取任务（本地筛选）
  // 第一象限：重要且紧急
  const getFirstQuadrantTasks = (): Task[] => {
    return tasks.value.filter(task => task.importance && task.urgency);
  };
  
  // 第二象限：重要不紧急
  const getSecondQuadrantTasks = (): Task[] => {
    return tasks.value.filter(task => task.importance && !task.urgency);
  };
  
  // 第三象限：不重要但紧急
  const getThirdQuadrantTasks = (): Task[] => {
    return tasks.value.filter(task => !task.importance && task.urgency);
  };
  
  // 第四象限：不重要不紧急
  const getFourthQuadrantTasks = (): Task[] => {
    return tasks.value.filter(task => !task.importance && !task.urgency);
  };
  
  // 获取所有四象限任务（本地筛选）
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
    isLoading,
    error,
    loadTasks,
    getTaskDetail,
    addTask,
    toggleTaskStatus,
    updateTask,
    deleteTask,
    clearCompletedTasks,
    completedTasksCount,
    pendingTasksCount,
    totalTasksCount,
    getTasksByTimePeriod,
    fetchTasksByTimePeriod,
    fetchTasksByQuadrant,
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