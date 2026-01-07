import Taro from "@tarojs/taro";
import { ref, onMounted } from "vue";

/**
 * 顶部栏高度管理组合式函数
 * @returns 包含顶部栏相关高度信息的对象
 */
export const useNavigationBar = () => {
  // 状态栏高度
  const statusBarHeight = ref(0);
  // 导航栏高度（含状态栏）
  const navigationBarHeight = ref(0);
  // 胶囊按钮位置信息
  const menuButtonInfo = ref<Taro.getMenuButtonBoundingClientRect.Rect>({
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  // 获取导航栏高度信息
  const getNavigationBarInfo = () => {
    try {
      // 获取胶囊按钮位置信息
      const menuButton = Taro.getMenuButtonBoundingClientRect();
      
      // 状态栏高度
      statusBarHeight.value = Taro.getWindowInfo().statusBarHeight!;
      // 胶囊按钮信息
      menuButtonInfo.value = menuButton;
      
      navigationBarHeight.value = menuButton.bottom;
    } catch (error) {
      console.error("获取导航栏信息失败：", error);
    }
  };

  // 在组件挂载时获取导航栏信息
  onMounted(() => {
    getNavigationBarInfo();
  });

  return {
    statusBarHeight,
    navigationBarHeight,
    menuButtonInfo,
    getNavigationBarInfo
  };
};
