<template>
  <view class="index">
    <nut-button type="primary" @click="onClick">按钮</nut-button>
    <nut-toast v-model:visible="show" msg="你成功了" />
    <nut-button type="primary" @click="incrementhandle">增加</nut-button>
    <nut-button type="primary" @click="decrementhandle">减少</nut-button>
    <view>当前计数: {{ counter.count }}</view>
  </view>
</template>

<script setup>
import { useCounterStore } from '@/store/counter';
import { ref } from 'vue'
const show = ref(false)
const onClick = () => {
  show.value = true
}

const counter = useCounterStore()

const incrementhandle = () => {
  counter.increment()
}
const decrementhandle = () => {
  counter.decrement()
}

</script>
