<template>
    <view class="list-loading">
        <template v-if="!isEnd">
            <Loading />加载中...
        </template>
        <template v-else>
            没有更多数据了~
        </template>
    </view>
</template>

<script setup lang="ts">
import { Loading } from '@nutui/icons-vue-taro';
import './index.scss';

defineOptions({
    name: 'ListLoading',
});

const props = defineProps({
    isEnd: {
        type: Boolean,
        default: false
    }
});

</script>
