<template>
  <!-- <view class="header" :style="{ height: navigationBarHeight + 'px' }"></view> -->
  <view class="container" :style="{ paddingTop: navigationBarHeight + 'px' }">
    <!-- 月份选择器 -->
    <view class="month-selector" :style="{ top: navigationBarHeight + 'px' }">
      <picker mode="date" fields="month" bindchange="onMonthChange" value="{{ currentDate }}">
        <view class="picker">
          <DateIcon size="16" />
          <text class="picker-text">{{ currentYearMonth }}</text>
          <RectDown size="14" />
        </view>
      </picker>
    </view>
    <!-- 收支概览 -->
    <view class="overview-card">
      <view class="overview-header">
        <text class="overview-title">收支概览</text>
      </view>
      <view class="overview-content">
        <view class="overview-item">
          <view class="item-icon income-icon">
            <Plus size="20" color="#52c41a" />
          </view>
          <text class="label">本月收入</text>
          <text class="amount income">¥{{ monthlyIncome.toFixed(2) }}</text>
        </view>
        <view class="overview-divider"></view>
        <view class="overview-item">
          <view class="item-icon expense-icon">
            <Minus size="20" color="#f5222d" />
          </view>
          <text class="label">本月支出</text>
          <text class="amount expense">¥{{ monthlyExpense.toFixed(2) }}</text>
        </view>
        <view class="overview-divider"></view>
        <view class="overview-item">
          <view class="item-icon balance-icon" :class="{ positive: monthlyBalance >= 0, negative: monthlyBalance < 0 }">
            <TriangleUp v-if="monthlyBalance >= 0" size="12" color="#52c41a" />
            <TriangleDown v-else size="12" color="#f5222d" />
          </view>
          <text class="label">本月结余</text>
          <text class="amount balance" :class="{ positive: monthlyBalance >= 0, negative: monthlyBalance < 0 }">
            ¥{{ Math.abs(monthlyBalance).toFixed(2) }}
          </text>
        </view>
      </view>
    </view>
    
    <!-- 添加记录按钮 -->
    <button @tap="navigateToAddRecord" class="add-record-btn">
      <text class="btn-text">添加记录</text>
    </button>
    
    <!-- 记账记录列表 -->
    <view class="records-section">
      <view class="section-header">
        <text class="section-title">本月记录</text>
        <text class="record-count">{{ filteredRecords.length }}条记录</text>
      </view>
      <view class="records-list">
        <view v-if="filteredRecords.length === 0" class="empty-state">
          <text class="empty-text">本月暂无记账记录</text>
          <button @tap="navigateToAddRecord" class="empty-add-btn">
            <Plus size="16" color="currentColor" />
            <text>添加第一条记录</text>
          </button>
        </view>
        <view 
          v-for="record in filteredRecords" 
          :key="record.id" 
          class="record-item"
          :class="record.type"
          @tap="navigateToRecordDetail(record.id)"
        >
          <view class="record-icon">
            <Add v-if="record.type === 'income'" size="16" color="#52c41a" />
            <Minus v-else size="16" color="#f5222d" />
          </view>
          <view class="record-info">
            <view class="record-header">
              <text class="record-category">{{ record.category }}</text>
              <text :class="['record-amount', record.type]">
                {{ record.type === 'income' ? '+' : '-' }}¥{{ record.amount.toFixed(2) }}
              </text>
            </view>
            <view class="record-meta">
              <text class="record-date">{{ formatRecordDate(record.date) }}</text>
              <text v-if="record.remark" class="record-remark">{{ record.remark }}</text>
            </view>
          </view>
          <view class="record-actions">
            <ArrowRight size="16" color="#999" />
          </view>
        </view>
      </view>
    </view>
    
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Date as DateIcon, RectDown, Add, Plus, Minus, ArrowRight, TriangleUp, TriangleDown } from '@nutui/icons-vue-taro';
import { useAccountingStore } from '@/store/accounting';
import Taro, { useDidShow } from '@tarojs/taro';
import { useNavigationBar } from '@/utils/navigation';
import { getTabBarInstance } from '@/utils/tab-bar';
import './index.scss'

const { navigationBarHeight } = useNavigationBar();
// 使用记账状态管理
const accountingStore = useAccountingStore();

// 响应式数据
const currentYearMonth = ref('');
const currentDate = ref('');

// 计算属性
const filteredRecords = computed(() => {
  return accountingStore.getMonthlyRecords(currentYearMonth.value);
});

const monthlyIncome = computed(() => {
  return accountingStore.getMonthlyIncome(currentYearMonth.value);
});

const monthlyExpense = computed(() => {
  return accountingStore.getMonthlyExpense(currentYearMonth.value);
});

const monthlyBalance = computed(() => {
  return monthlyIncome.value - monthlyExpense.value;
});

// 方法
const formatRecordDate = (date: string) => {
  const d = new Date(date);
  return `${d.getDate()}日`;
};

const setCurrentMonth = (date?: Date) => {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  currentYearMonth.value = `${year}年${month}月`;
  currentDate.value = `${year}-${String(month).padStart(2, '0')}`;
};

// 导航到添加记录页面
const navigateToAddRecord = () => {
  Taro.navigateTo({
    url: '/pages/accounting/detail/index'
  });
};

// 导航到记录详情页面
const navigateToRecordDetail = (recordId: string) => {
  Taro.navigateTo({
    url: `/pages/accounting/detail/index?id=${recordId}`
  });
};

// 生命周期钩子
onMounted(() => {
  setCurrentMonth();
  accountingStore.loadRecords();
});

// 页面显示时更新底部栏高亮状态并刷新数据
useDidShow(() => {
  const tabBar = getTabBarInstance();
  tabBar.updateTabbarSelectedIndex(2);
});
</script>
