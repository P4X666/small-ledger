<template>
  <view class="custom-tab-bar safe-area" :style="{ height: tabBarHeight }">
    <view 
      class="tab-item" 
      v-for="(item, index) in tabList" 
      :key="item.pagePath"
      @click="switchTab(item.pagePath)"
    >
      <image 
        class="tab-icon" 
        :src="selected === index ? item.activeIcon : item.defaultIcon" 
        mode="aspectFit"
      />
      <text 
        class="tab-text" 
        :class="{ active: selected === index }"
      >
        {{ item.text }}
      </text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import Taro from '@tarojs/taro';
import type { TabBarExposed } from '@/utils/tab-bar';
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

// 当前选中的索引
const selected = ref(0);
const tabBarHeight = '100rpx';

// 更新选中的索引
const updateSelectedIndex = (index = 0) => {
  selected.value = index;
};

// 页面切换
const switchTab = (url: string) => {
  // 立即更新高亮状态，不需要等待switchTab完成
  Taro.switchTab({url})
  .catch((err) => {
    console.error('切换页面失败:', err);
  });
};

defineExpose({
  updateTabbarSelectedIndex: updateSelectedIndex,
  tabBarHeight,
} as TabBarExposed);

</script>