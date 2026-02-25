<template>
    <view class="list-loading" id="list-loading">
        <template v-if="!isEnd">
            <Loading />加载中...
        </template>
        <template v-else>
            已经到底了~
        </template>
    </view>
</template>

<script setup lang="ts">
import { Loading } from '@nutui/icons-vue-taro';
import Taro, { useLoad } from '@tarojs/taro';
import './index.scss';

defineOptions({
    name: 'ListLoading',
});

defineProps({
    isEnd: {
        type: Boolean,
        default: false
    }
});

const isComponentShow = ()=>{
    // task-list
    Taro.createIntersectionObserver(Taro.getCurrentInstance()).relativeToViewport().observe('#list-loading', (res) => {
        console.log('观察结果:', res);
        // if (res.intersectionRatio > 0) {
        //     console.log('组件可见');
        // } else {
        //     console.log('组件不可见');
        // }
    });
}

useLoad(()=>{
    console.log(`useLoad`);
    isComponentShow()
})

</script>
