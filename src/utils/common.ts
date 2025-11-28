import Taro from "@tarojs/taro";

export const updateTabbarSelectedIndex = (index = 0) => {
    // @ts-ignore
    Taro.getCurrentInstance().page?.getTabBar().$taroInstances.$.exposed.updateTabbarSelectedIndex(index)
}