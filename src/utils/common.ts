import Taro from "@tarojs/taro";

export const updateTabbarSelectedIndex = (index = 0) => {
    const page = Taro.getCurrentInstance().page
    const tabbar = Taro.getTabBar(page)
    // @ts-ignore
    tabbar.$.exposed.updateTabbarSelectedIndex(index)
}