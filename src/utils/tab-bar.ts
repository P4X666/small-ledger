import Taro from "@tarojs/taro";

export type TabBarExposed = {
    updateTabbarSelectedIndex: (index: number) => void
    tabBarHeight: string
}

export const getTabBarInstance = (): TabBarExposed => {
    const page = Taro.getCurrentInstance().page
    const tabbar = Taro.getTabBar(page)
    // @ts-ignore
    return tabbar.$.exposed
}