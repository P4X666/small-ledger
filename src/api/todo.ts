import type { TaskStatus } from '@/constants/common';
import { get, post, put, del } from '../utils/request';
import type { CommonListResponseData } from '../utils/request';
import type { Task, TimePeriod } from '@/store/todo';

// 创建任务请求参数
interface CreateTaskParams {
  title: string;
  timePeriod: TimePeriod;
  importance: number;
  urgency: number;
  dueDate?: Date;
  description?: string;
}

// 更新任务请求参数
type UpdateTaskParams = Partial<CreateTaskParams>;

interface TaskListParams {
  limit?: number;
  page?: number;
  timePeriod?: TimePeriod;
  importance?: number;
  urgency?: number;
}

interface TaskListResponse extends CommonListResponseData {
  data: Task[];
}
/**
 * 获取所有任务
 * @returns 任务列表
 */
export const getAllTasks = async (params={} as TaskListParams): Promise<TaskListResponse | undefined> => {
  try {
    const response = await get('/api/tasks', params, {
      showLoading: true,
      loadingTitle: '数据加载中...'
    });
    return response.data.data;
  } catch (error: any) {
    if(error.code !== 401){
      throw new Error(error.message || '获取任务列表失败');
    }
    return undefined;
  }
};

interface TasksStatistics {
  allTasksTotal: number;
  inProgressTasksTotal: number;
  highPriorityTasksTotal: number;
}
/**
 * 获取所有任务统计
 * @returns {}
 */
export const getTasksNum = async (): Promise<TasksStatistics | undefined> => {
  try {
    const response = await get('/api/tasks/getTasksNum', {}, {
      showLoading: true,
      loadingTitle: '数据加载中...'
    });
    return response.data.data;
  } catch (error: any) {
    if(error.code !== 401){
      throw new Error(error.message || '获取任务统计失败');
    }
    return undefined;
  }
};

/**
 * 根据ID获取任务详情
 * @param id 任务ID
 * @returns 任务详情
 */
export const getTaskById = async (id: string): Promise<Task> => {
  try {
    const response = await get(`/api/tasks/${id}`, {}, {
      showLoading: true,
      loadingTitle: '加载任务详情中...'
    });
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.message || '获取任务详情失败');
  }
};

/**
 * 创建新任务
 * @param params 任务创建参数
 * @returns 创建的任务
 */
export const createTask = async (params: CreateTaskParams): Promise<Task> => {
  try {
    const response = await post('/api/tasks', params, {
      showLoading: true,
      loadingTitle: '创建任务中...'
    });
    return response.data.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * 更新任务
 * @param id 任务ID
 * @param params 任务更新参数
 * @returns 更新后的任务
 */
export const updateTask = async (id: string, params: UpdateTaskParams): Promise<Task> => {
  try {
    const response = await put(`/api/tasks/${id}`, params, {
      showLoading: true,
      loadingTitle: '更新任务中...'
    });
    return response.data.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * 更新任务状态
 * @param id 任务ID
 * @param status 任务状态
 * @returns 更新后的任务
 */
export const updateTaskStatus = async (id: string, status: TaskStatus): Promise<Task> => {
  try {
    const response = await put(`/api/tasks/${id}/status`, { status }, {
      showLoading: true,
      loadingTitle: '更新任务状态中...'
    });
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.message || '更新任务状态失败');
  }
};

/**
 * 删除任务
 * @param id 任务ID
 * @returns 删除结果
 */
export const deleteTask = async (id: string): Promise<void> => {
  try {
    await del(`/api/tasks/${id}`, {}, {
      showLoading: true,
      loadingTitle: '删除任务中...'
    });
  } catch (error: any) {
    throw new Error(error.message || '删除任务失败');
  }
};

/**
 * 根据时间周期获取任务
 * @param period 时间周期
 * @returns 任务列表
 */
export const getTasksByTimePeriod = async (period: TimePeriod): Promise<Task[]> => {
  try {
    const response = await get(`/api/tasks/by-time/${period}`, {}, {
      showLoading: true,
      loadingTitle: '数据加载中...'
    });
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.message || '获取任务列表失败');
  }
};

/**
 * 获取四象限任务
 * @returns 四象限任务列表
 */
export const getTasksByQuadrant = async (): Promise<{
  first: Task[];
  second: Task[];
  third: Task[];
  fourth: Task[];
}> => {
  try {
    const response = await get('/api/tasks/by-quadrant', {}, {
      showLoading: true,
      loadingTitle: '加载四象限任务中...'
    });
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.message || '获取四象限任务失败');
  }
};
