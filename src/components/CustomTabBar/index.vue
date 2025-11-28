<template>
  <view class="custom-tab-bar safe-area">
    <view 
      class="tab-item" 
      v-for="(item, index) in tabList" 
      :key="index"
      @click="switchTab(item.pagePath)"
    >
      <!-- <component 
        :is="item.icon" 
        :size="24" 
        :color="activeIndex === index ? activeColor : inactiveColor" 
      /> -->
      <image 
        class="tab-icon" 
        :src="activeIndex === index ? item.activeIcon : item.defaultIcon" 
        :size="24"
      />
      <text 
        class="tab-text" 
        :class="{ active: activeIndex === index }"
      >
        {{ item.text }}
      </text>
    </view>
  </view>
  <!-- <nut-tabbar v-model="activeName" @tab-switch="switchTab">
    <nut-tabbar-item v-for="item in tabList" :key="item.name" :name="item.name" :tab-title="item.title" :icon="item.icon">
    </nut-tabbar-item>
  </nut-tabbar> -->
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import Taro from '@tarojs/taro';
import './index.scss';

// 定义底部栏项接口
interface TabItem {
  pagePath: string;
  text: string;
  defaultIcon: string;
  activeIcon: string;
}

// 底部栏数据
const tabList: TabItem[] = [
  { 
    pagePath: '/pages/index/index', 
    text: '首页', 
    defaultIcon: '/assets/images/home.svg', 
    activeIcon: '/assets/images/home-active.svg' 
  },
  { 
    pagePath: '/pages/todolist/index', 
    text: '任务', 
    defaultIcon: '/assets/images/todolist.svg', 
    activeIcon: '/assets/images/todolist-active.svg' 
  },
  { 
    pagePath: '/pages/accounting/index', 
    text: '记账', 
    defaultIcon: '/assets/images/record.svg', 
    activeIcon: '/assets/images/record-active.svg' 
  },
  { 
    pagePath: '/pages/goals/index', 
    text: '目标', 
    defaultIcon: '/assets/images/target.svg', 
    activeIcon: '/assets/images/target-active.svg' 
  } 
];

// 颜色配置
const activeColor: string = '#ff7d00';
const inactiveColor: string = '#999';

// 当前激活的索引
const activeIndex = ref<number>(0);

// 获取当前页面路径
const getCurrentPagePath = (): string | undefined => {
  const pages = Taro.getCurrentPages();
  if (pages.length > 0) {
    return pages[pages.length - 1].route;
  }
  return '';
};

// 计算当前激活的索引
const updateActiveIndex = (): void => {
  const currentPath = getCurrentPagePath();
  const index = tabList.findIndex(item => item.pagePath === `/${currentPath}`);
  if (index !== -1) {
    activeIndex.value = index;
  }
};

// 页面切换
const switchTab = (url: string): void => {
  Taro.switchTab({
    url,
    fail: (err) => {
      console.error('切换页面失败:', err);
    }
  });
};

// 页面加载时初始化
onMounted(() => {
  updateActiveIndex();
  
  // 监听页面显示事件，确保切换页面后激活状态正确
  Taro.onAppShow(() => {
    updateActiveIndex();
  });
});
</script>