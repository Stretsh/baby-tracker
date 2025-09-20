<template>
  <div class="px-4 py-2">
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time (optional)</label>
      <input
        v-model="selectedTime"
        type="datetime-local"
        placeholder="Leave empty for current time"
        @input="onTimeChange"
        class="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedTime = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const onTimeChange = (event) => {
  selectedTime.value = event.target.value
}
</script>
