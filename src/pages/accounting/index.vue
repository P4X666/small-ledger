<template>
  <nut-navbar 
    title="账单管理" 
    fixed 
    placeholder 
    safe-area-inset-top 
    z-index="999"
    class="custom-navbar"
    :style="{ '--status-bar-height': statusBarHeight + 'px' }"
  ></nut-navbar>
  <view class="container">
    <view class="date-selector">

      <view class="date-view">{{ getDateFilterMessage() }}</view>
      <nut-radio-group v-model="calendarType" direction="horizontal">
        <template v-for="option in transactionViewOptions" :key="option.value">
          <nut-radio :label="option.value">{{ option.label }}</nut-radio>
        </template>
      </nut-radio-group>
    </view>
    <!-- <view class="date-detail" @tap="showCalendar = true">
      <DateIcon size="16" />
      <text class="date-text">{{ currentDate }}</text>
      <RectDown size="14" />
    </view> -->
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
        <text class="section-title">本{{ dateStatisticDes }}记录</text>
        <text class="record-count">{{ total }}条记录</text>
      </view>
      <view class="records-list">
        <!-- 加载状态 -->
        <!-- <view v-if="accountingStore.isLoading" class="loading-state">
          <text class="loading-text">加载中...</text>
        </view> -->
        
        <!-- 空状态 -->
        <view v-if="filteredRecords.length === 0" class="empty-state">
          <text class="empty-text">本{{ dateStatisticDes }}暂无记账记录</text>
          <!-- <button @tap="navigateToAddRecord" class="empty-add-btn">
            <Plus size="16" color="currentColor" />
            <text>添加第一条记录</text>
          </button> -->
          <view>
            <view>导入账单excel：</view>
            <view @tap="copyImportBillUrl" class="import-bill-url">
              请点击我复制账单地址并到浏览器中打开
            </view>
          </view>
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
                {{ record.product || record.shop }}
                <!-- <nut-ellipsis direction="end" :content="record.product || record.shop"></nut-ellipsis> -->
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
        <ListLoading v-if="filteredRecords.length !== 0" :isEnd="isEnd"  />
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
import { ref, computed, watch } from 'vue';
import Taro, { useDidShow, useLoad, usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { Plus, Minus, ArrowRight, TriangleUp, TriangleDown } from '@nutui/icons-vue-taro';
import { useAccountingStore } from '@/store/accounting';
import { useNavigationBar } from '@/utils/navigation';
import { getTabBarInstance } from '@/utils/tab-bar';
import { getToday, getWeekStart, getWeekEnd, getLastYearStart, getMonthStart, getMonthEnd, getYearStart, getYearEnd } from '@/utils/date';
import { CALENDAR_TYPE, IMPORT_BILL_URL } from '@/constants/common';
import dayjs from 'dayjs';
import type { AccountingRecord } from '@/store/accounting'
import { getBaseUrl } from '@/utils/base-url';
import { getToken } from '@/utils/token';
import './index.scss'

const { statusBarHeight } = useNavigationBar();
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


// 导航到记录详情页面
const navigateToRecordDetail = (recordId: string) => {
  Taro.navigateTo({
    url: `/pages/accounting/detail/index?id=${recordId}`
  });
};

const loadData = async (reset = false, getStatistics = false) => {
  const params = {
    startDate: '',
    endDate: ''
  } 
  if(calendarType.value === CALENDAR_TYPE.WEEK){
    params.startDate = currentWeek.value[0];
    params.endDate = currentWeek.value[1];
  }
  if(calendarType.value === CALENDAR_TYPE.MONTH){
    params.startDate = getMonthStart(getToday());
    params.endDate = getMonthEnd(getToday());
  }
  if(calendarType.value === CALENDAR_TYPE.YEAR){
    params.startDate = getYearStart(getToday());
    params.endDate = getYearEnd(getToday());
  }
  accountingStore.loadRecords(params, reset);
  if(getStatistics){
    accountingStore.loadStatistics(params, reset);
  }
}

watch(() => calendarType.value, (newValue, oldValue) => {
  console.log('watch', newValue, oldValue);
  loadData(true, true)
})

const isEnd = computed(() => accountingStore.isEnd);
const total = computed(() => accountingStore.total);

useReachBottom(()=>{
  console.log('isEnd', isEnd.value);
  if(!isEnd.value){
    console.log('reach bottom');
    loadData()
  }
})

useLoad(() => {
  setCurrentMonth();
  loadData(true, true)
})

usePullDownRefresh(async () => {
  await loadData(true, true)
  Taro.stopPullDownRefresh();
})

const importBillUrl = getBaseUrl() + IMPORT_BILL_URL+'?token='+getToken()

const copyImportBillUrl = () => {
  Taro.setClipboardData({
    data: importBillUrl,
    success: () => {
      Taro.showToast({
        title: '已复制',
        icon: 'success'
      });
    }
  });
}

const tabBarHeight = ref('60rpx');
// 页面显示时更新底部栏高亮状态并刷新数据
useDidShow(async () => {
  const tabBar = getTabBarInstance();
  tabBar.updateTabbarSelectedIndex(2);
  tabBarHeight.value = tabBar.tabBarHeight;
  console.log('accounting page did show');
});
</script>
