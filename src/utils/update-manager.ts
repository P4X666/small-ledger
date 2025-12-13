import Taro from "@tarojs/taro"

export const updateManager = () => {
    //小程序版本更新提示
    if (Taro.canIUse('getUpdateManager')) {
        const updateManager = Taro.getUpdateManager()
        updateManager.onCheckForUpdate(function (res) { //检测是否有版本更新
            if (res.hasUpdate)
                Taro.showLoading({ title: '检测到新版本' })
        })
        updateManager.onUpdateReady(function () {
            Taro.hideLoading()
            Taro.showModal({
                title: '更新提示',
                content: '新版本已经准备好，是否重启应用？',
                confirmText: '好的',
                showCancel: false,
                success: function (res) {
                    if (res.confirm) {
                        try {
                            Taro.clearStorageSync() //清楚本地缓存
                        } catch (error) {
                            console.log(error)
                        }
                        updateManager.applyUpdate()
                    }
                }
            })
        })

        // 新的版本下载失败
        updateManager.onUpdateFailed(function () {
            Taro.hideLoading()
            Taro.showToast({
                title: '下载失败',
                icon: 'none',
                duration: 1500
            })
        })
    }
}