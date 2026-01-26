<template>
  <!-- <view class="header" :style="{ height: navigationBarHeight + 'px' }"></view> -->
  <view class="container">
    <view class="date-selector" :style="{ paddingTop: navigationBarHeight + 'px' }">

      <view class="date-view">{{ getDateFilterMessage() }}</view>
      <nut-radio-group v-model="calendarType" direction="horizontal">
        <template v-for="option in transactionViewOptions">
          <nut-radio :label="option.value">{{ option.label }}</nut-radio>
        </template>
      </nut-radio-group>
    </view>
    <view class="date-detail" @tap="showCalendar = true">
        <DateIcon size="16" />
        <text class="date-text">{{ currentDate }}</text>
        <RectDown size="14" />
      </view>
    <!-- 收支概览 -->
    <view class="overview-card">
      <view class="overview-header">
        <text class="overview-title">收支概览</text>
      </view>
      <view class="overview-content">
        <view class="overview-item">
          <view class="item-icon income-icon">
            <Plus size="20" color="var(--income-color)" />
          </view>
          <text class="label">{{ dateStatisticDes }}收入</text>
          <text class="amount income">{{ statistics.totalIncome }}</text>
        </view>
        <view class="overview-divider"></view>
        <view class="overview-item">
          <view class="item-icon expense-icon">
            <Minus size="20" color="var(--expense-color)" />
          </view>
          <text class="label">{{ dateStatisticDes }}支出</text>
          <text class="amount expense">{{ statistics.totalExpense }}</text>
        </view>
        <view class="overview-divider"></view>
        <view class="overview-item">
          <view class="item-icon balance-icon" :class="{ positive: statistics.balance >= 0, negative: statistics.balance < 0 }">
            <TriangleUp v-if="statistics.balance >= 0" size="12" color="var(--income-color)" />
            <TriangleDown v-else size="12" color="var(--expense-color)" />
          </view>
          <text class="label">{{ dateStatisticDes }}结余</text>
          <text class="amount balance" :class="{ positive: statistics.balance >= 0, negative: statistics.balance < 0 }">
            {{ statistics.balance }}
          </text>
        </view>
      </view>
    </view>
    
    <!-- 添加记录按钮 -->
    <!-- <button @tap="navigateToAddRecord" class="add-record-btn">
      <text class="btn-text">添加记录</text>
    </button> -->
    
    <!-- 记账记录列表 -->
    <view class="records-section">
      <view class="section-header">
        <text class="section-title">本月记录</text>
        <text class="record-count">{{ filteredRecords.length }}条记录</text>
      </view>
      <view class="records-list">
        <!-- 加载状态 -->
        <view v-if="accountingStore.isLoading" class="loading-state">
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 空状态 -->
        <view v-else-if="filteredRecords.length === 0" class="empty-state">
          <text class="empty-text">本月暂无记账记录</text>
          <button @tap="navigateToAddRecord" class="empty-add-btn">
            <Plus size="16" color="currentColor" />
            <text>添加第一条记录</text>
          </button>
        </view>
        
        <!-- 记录列表 -->
        <view 
          v-else
          v-for="record in filteredRecords" 
          :key="record.id" 
          class="record-item"
          :class="record.type"
          @tap="navigateToRecordDetail(record.id)"
        >
          <!-- <view class="record-icon">
            <Add v-if="record.type === 'income'" size="16" color="var(--income-color)" />
            <Minus v-else size="16" color="var(--expense-color)" />
          </view> -->
          <view class="record-info">
            <view class="record-header">
              <view class="record-product">
                <nut-ellipsis direction="end" :content="record.product || record.shop"></nut-ellipsis>
              </view>
              <view :class="['record-amount', record.type]">
                {{ record.type === 'income' ? '+' : '-' }}¥{{ record.amount }}
              </view>
            </view>
            <view class="record-meta">
              <text class="record-date">{{ formatRecordDate(record) }}</text>
              <!-- <text v-if="record.description" class="record-remark">{{ record.description }}</text> -->
            </view>
          </view>
          <view class="record-actions">
            <ArrowRight size="16" color="var(--text-tertiary)" />
          </view>
        </view>
        <view :style="{ height: tabBarHeight }"></view>
      </view>
    </view>
    
  </view>
  <nut-calendar
    v-model:visible="showCalendar"
    :type="calendarType"
    :default-value="currentWeek"
    :start-date="calendarStartDate"
    :end-date="calendarEndDate"
    @close="showCalendar = false"
    @choose="chooseDate"
    class="custom-calendar"
    z-index="99999"
    :first-day-of-week="1"
  >
  </nut-calendar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Date as DateIcon, RectDown, Plus, Minus, ArrowRight, TriangleUp, TriangleDown } from '@nutui/icons-vue-taro';
import { useAccountingStore } from '@/store/accounting';
import Taro, { useDidShow, useLoad } from '@tarojs/taro';
import { useNavigationBar } from '@/utils/navigation';
import { getTabBarInstance } from '@/utils/tab-bar';
import { getToday, getWeekStart, getWeekEnd, getLastYearStart } from '@/utils/date';
import { CALENDAR_TYPE } from '@/constants/common';
import dayjs from 'dayjs';
import type { AccountingRecord } from '@/store/accounting'
import './index.scss'

const { navigationBarHeight } = useNavigationBar();
// 使用记账状态管理
const accountingStore = useAccountingStore();

const statistics = computed(() => accountingStore.statistics);
// 响应式数据
const currentYearMonth = ref('');
const currentDate = ref('');
const showCalendar = ref(false);

const today = getToday();
const currentWeek = ref([getWeekStart(today), getWeekEnd(today)]);

// 日历范围：上一年开始到当前周结束
const calendarStartDate = ref(getLastYearStart(today));
const calendarEndDate = ref(getWeekEnd(today));

// 日历类型：默认周视图
const calendarType = ref<CALENDAR_TYPE>(CALENDAR_TYPE.WEEK);
const getDateFilterMessage=()=>{
  if(calendarType.value === CALENDAR_TYPE.DAY){
    return '天视图'
  }
  if(calendarType.value === CALENDAR_TYPE.MONTH){
    return '月视图'
  }
  if(calendarType.value === CALENDAR_TYPE.YEAR){
    return '年视图'
  }
  return '周视图'
}

const transactionViewOptions = [
  {
    value: CALENDAR_TYPE.WEEK,
    label: '周'
  },
  {
    value: CALENDAR_TYPE.MONTH,
    label: '月'
  },
  {
    value: CALENDAR_TYPE.YEAR,
    label: '年'
  },
]
const dateStatisticDes = computed(()=>{
  const selected = transactionViewOptions.find(item => item.value === calendarType.value)

  return selected?.label
})
// 日期选择处理
const chooseDate = (e: any) => {
  console.log('chooseDate', e);

  // currentDate.value = e.detail.value;
  // showCalendar.value = false;
  // setCurrentMonth(new Date(e.detail.value));
};

// 计算属性
const filteredRecords = computed(() => {
  return accountingStore.records;
});

// 方法
const formatRecordDate = (item: AccountingRecord) => {
  if(item.transactionDate) {
    return dayjs(item.transactionDate).format('YYYY年MM月DD日 HH:mm:ss')
  }
  return ''
};

const setCurrentMonth = (date?: Date) => {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  currentYearMonth.value = `${year}年${month}月`;
  currentDate.value = `${year}-${String(month).padStart(2, '0')}`;
};

// 月份选择器变化处理
const onMonthChange = (e: any) => {
  const date = new Date(e.detail.value);
  setCurrentMonth(date);
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
useLoad(async () => {
  setCurrentMonth();
});

const tabBarHeight = ref('60rpx');
// 页面显示时更新底部栏高亮状态并刷新数据
useDidShow(async () => {
  const tabBar = getTabBarInstance();
  tabBar.updateTabbarSelectedIndex(2);
  tabBarHeight.value = tabBar.tabBarHeight;
  console.log('accounting page did show');
  
  // 刷新数据
  accountingStore.loadRecords();
  accountingStore.loadStatistics();
});
</script>
