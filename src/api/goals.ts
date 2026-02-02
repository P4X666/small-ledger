import { get, post, put, del } from '../utils/request';
import type { CommonListResponseData } from '../utils/request';
import type { SavingsGoal, GoalCreateData, GoalUpdateData, GoalProgressDetails } from '@/store/goals';

/**
 * 储蓄目标API请求模块
 * 所有与储蓄目标相关的API请求都在此模块中定义
 */

interface GoalsListResponse extends CommonListResponseData {
  data: SavingsGoal[];
}

/**
 * 获取所有储蓄目标
 * @param page 页码
 * @param limit 每页数量
 * @param sortBy 排序字段
 * @param order 排序方向
 * @returns 储蓄目标列表和分页信息
 */
export const getAllSavingsGoals = async (params: {
  page?: number,
  limit?: number,
  sortBy?: string,
  order?: string
}): Promise<GoalsListResponse> => {
  const response = await get('/api/savings-goals', params, {
      showLoading: true,
      loadingTitle: '加载攒钱目标中...'
    });
  return response.data;
};

/**
 * 获取单个储蓄目标
 * @param id 储蓄目标ID
 * @returns 储蓄目标详情
 */
export const getSavingsGoal = async (id: string | number): Promise<SavingsGoal> => {
  const response = await get(`/api/savings-goals/${id}`);
  return response.data.data;
};

/**
 * 创建储蓄目标
 * @param data 储蓄目标创建数据
 * @returns 创建的储蓄目标
 */
export const createSavingsGoal = async (data: GoalCreateData): Promise<SavingsGoal> => {
  const response = await post('/api/savings-goals', data);
  return response.data.data;
};

/**
 * 更新储蓄目标
 * @param id 储蓄目标ID
 * @param data 储蓄目标更新数据
 * @returns 更新后的储蓄目标
 */
export const updateSavingsGoal = async (id: string | number, data: GoalUpdateData): Promise<SavingsGoal> => {

  const response = await put(`/api/savings-goals/${id}`, data);
  return response.data.data;
};

/**
 * 删除储蓄目标
 * @param id 储蓄目标ID
 */
export const deleteSavingsGoal = async (id: string | number): Promise<void> => {
  await del(`/api/savings-goals/${id}`);
};

/**
 * 更新储蓄目标金额
 * @param id 储蓄目标ID
 * @param amount 更新后的金额
 * @returns 更新后的储蓄目标
 */
export const updateSavingsGoalAmount = async (id: string | number, amount: number): Promise<SavingsGoal> => {
  const response = await put(`/api/savings-goals/${id}/amount`, { amount });
  return response.data.data;
};

/**
 * 获取储蓄目标进度
 * @param id 储蓄目标ID
 * @returns 储蓄目标进度详情
 */
export const getSavingsGoalProgress = async (id: string | number): Promise<GoalProgressDetails> => {
  const response = await get(`/api/savings-goals/${id}/progress`);
  return response.data.data;
};


