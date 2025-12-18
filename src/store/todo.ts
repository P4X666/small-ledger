import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Taro from '@tarojs/taro';
import { 
  getAllTasks, 
  createTask, 
  updateTask as apiUpdateTask, 
  updateTaskStatus, 
  deleteTask as apiDeleteTask,
  getTasksByTimePeriod as apiGetTasksByTimePeriod,
  getTasksByQuadrant as apiGetTasksByQuadrant
} from '@/api/todo';

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
  description?: string;
}

// 创建并导出任务状态管理store
export const useTodoStore = defineStore('todo', () => {
  // 任务列表状态
  const tasks = ref<Task[]>([]);
  // 加载状态
  const isLoading = ref(false);
  // 错误信息
  const error = ref<string | null>(null);
  
  // 从API加载任务数据
  const loadTasks = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const fetchedTasks = await getAllTasks();
      tasks.value = fetchedTasks.map(task => {
        return {
          ...task,
          // 安全地转换日期字符串为Date对象
          createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
          updatedAt: task.updatedAt ? new Date(task.updatedAt) : undefined,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined
        };
      });
    } catch (err: any) {
      error.value = err.message || '加载任务失败';
      Taro.showToast({
        title: error.value || '加载任务失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      isLoading.value = false;
    }
  };
  
  // 添加新任务
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
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
      const newTask = await createTask({
        title: taskData.title.trim(),
        completed: Boolean(taskData.completed),
        timePeriod: taskData.timePeriod || 'none',
        priority: taskData.priority || { important: false, urgent: false },
        dueDate: taskData.dueDate,
        description: taskData.description
      });
      
      // 转换日期格式
      const formattedTask = {
        ...newTask,
        createdAt: new Date(newTask.createdAt),
        updatedAt: newTask.updatedAt ? new Date(newTask.updatedAt) : undefined,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined
      };
      
      tasks.value.push(formattedTask);
      return formattedTask;
    } catch (err: any) {
      const errorMsg = err.message || '创建任务失败';
      Taro.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
      throw new Error(errorMsg);
    }
  };
  
  // 更新任务状态
  const toggleTaskStatus = async (taskId: string) => {
    if (!taskId) return;
    
    try {
      const task = tasks.value.find(t => t.id === taskId);
      if (!task) {
        throw new Error('任务不存在');
      }
      
      const updatedTask = await updateTaskStatus(taskId, !task.completed);
      
      // 更新本地状态
      const taskIndex = tasks.value.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks.value[taskIndex] = {
          ...updatedTask,
          createdAt: new Date(updatedTask.createdAt),
          updatedAt: updatedTask.updatedAt ? new Date(updatedTask.updatedAt) : undefined,
          dueDate: updatedTask.dueDate ? new Date(updatedTask.dueDate) : undefined
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
          createdAt: new Date(updatedTask.createdAt),
          updatedAt: updatedTask.updatedAt ? new Date(updatedTask.updatedAt) : undefined,
          dueDate: updatedTask.dueDate ? new Date(updatedTask.dueDate) : undefined
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
      const completedTaskIds = tasks.value.filter(task => task.completed).map(task => task.id);
      
      // 批量删除已完成任务
      await Promise.all(completedTaskIds.map(id => apiDeleteTask(id)));
      
      // 更新本地状态
      tasks.value = tasks.value.filter(task => !task.completed);
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
  
  // 按时间周期筛选任务（本地筛选）
  const getTasksByTimePeriod = (period: TimePeriod): Task[] => {
    if (!period || period === 'none') {
      return [...tasks.value];
    }
    
    return tasks.value.filter(task => task.timePeriod === period);
  };
  
  // 从API按时间周期获取任务
  const fetchTasksByTimePeriod = async (period: TimePeriod): Promise<Task[]> => {
    try {
      const fetchedTasks = await apiGetTasksByTimePeriod(period);
      return fetchedTasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: task.updatedAt ? new Date(task.updatedAt) : undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined
      }));
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
    try {
      const quadrantTasks = await apiGetTasksByQuadrant();
      
      // 转换日期格式
      const formatTasks = (taskList: any[]) => {
        return taskList.map(task => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: task.updatedAt ? new Date(task.updatedAt) : undefined,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined
        }));
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