// https://pinia.esm.dev/introduction.html
import { defineStore } from 'pinia'
import { ref } from 'vue'


// You can even use a function (similar to a component setup()) to define a Store for more advanced use cases:
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)

  function increment() {
    count.value++
  }
  function decrement() {
    count.value--
  }

  return {count, increment, decrement}
})