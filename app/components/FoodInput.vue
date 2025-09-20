<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Food Type <span class="text-red-500">*</span></label>
      <div class="relative">
        <input
          v-model="inputValue"
          type="text"
          placeholder="What did she eat?"
          class="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          @input="onInput"
          @focus="showSuggestions = true"
          @blur="hideSuggestions"
          @keydown="handleKeydown"
        >
        
        <!-- Suggestions Dropdown -->
        <div
          v-if="showSuggestions && (filteredOptions.length > 0 || inputValue)"
          class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          <div
            v-for="(option, index) in filteredOptions"
            :key="option"
            :class="[
              'px-3 py-2 cursor-pointer text-sm text-gray-900 dark:text-white',
              index === selectedIndex 
                ? 'bg-blue-100 dark:bg-blue-900' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            ]"
            @mousedown="selectOption(option)"
          >
            {{ option }}
          </div>
          
          <!-- Add new food option -->
          <div
            v-if="inputValue && filteredOptions.length === 0"
            class="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm italic border-t border-gray-200 dark:border-gray-700"
          >
            Add new food: "{{ inputValue }}"
          </div>
        </div>
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

const inputValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const showSuggestions = ref(false)
const allFoodOptions = ref([])
const selectedIndex = ref(-1)

// Fetch food types from API
const { data: foodTypes } = await useFetch('/api/food-types', {
  default: () => ({ food_types: [] })
})

// Initialize food options
watchEffect(() => {
  if (foodTypes.value?.food_types) {
    allFoodOptions.value = foodTypes.value.food_types
  }
})

const filteredOptions = computed(() => {
  if (!inputValue.value) return allFoodOptions.value
  return allFoodOptions.value.filter(option =>
    option.toLowerCase().includes(inputValue.value.toLowerCase())
  )
})

const onInput = () => {
  showSuggestions.value = true
}

const selectOption = (option) => {
  inputValue.value = option
  showSuggestions.value = false
}

const hideSuggestions = () => {
  // Delay hiding to allow click events to fire
  setTimeout(() => {
    showSuggestions.value = false
    selectedIndex.value = -1
  }, 150)
}

const handleKeydown = (event) => {
  if (!showSuggestions.value) return
  
  const options = filteredOptions.value
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, options.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0 && selectedIndex.value < options.length) {
        selectOption(options[selectedIndex.value])
      }
      break
    case 'Escape':
      showSuggestions.value = false
      selectedIndex.value = -1
      break
  }
}
</script>
