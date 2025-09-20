<template>
  <div class="fixed bottom-24 right-6 z-50 flex flex-col items-center gap-5">
    <!-- Foods Button -->
    <button
      class="w-12 h-12 bg-blue-700 hover:bg-blue-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200"
      @click="toggleFoodButtons"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 2v4m8-4v4M6 6h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 10h4v6h-4v-6z" />
      </svg>
    </button>

    <!-- Food Buttons Container -->
    <div
      v-if="showFoodButtons"
      class="absolute bottom-14 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[120px] z-50"
    >
      <div class="space-y-1">
        <button
          v-for="food in top3Foods"
          :key="food"
          class="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 rounded-md transition-colors text-left"
          :disabled="isLoading"
          @click="saveWithFood(food)"
        >
          {{ food }}
        </button>
      </div>
    </div>

    <!-- Quick Save Button -->
    <button
      class="w-14 h-14 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200"
      :disabled="isLoading"
      @click="quickSave"
    >
      <svg v-if="isLoading" class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { DateTime } from 'luxon'

const isLoading = ref(false)
const showFoodButtons = ref(false)
const { addFeeding } = useFeedings()
const { showSuccess, showError } = useToast()

// Fetch recent food types (top 3 most used)
const { data: recentFoodsData } = await useFetch('/api/food-types/recent', {
  query: { limit: 3 },
  default: () => ({ recent_foods: [] })
})

// Sort bottom to top (most used at bottom)
const top3Foods = computed(() => {
  const foods = recentFoodsData.value?.recent_foods || []
  return [...foods].reverse() // Reverse to show most used at bottom
})

const toggleFoodButtons = () => {
  showFoodButtons.value = !showFoodButtons.value
}

const saveWithFood = async (food) => {
  isLoading.value = true
  
  try {
    const response = await $fetch('/api/feedings', {
      method: 'POST',
      body: {
        feeding_time: DateTime.now().toISO(),
        food_type: food,
        notes: ''
      }
    })
    
    if (response.success) {
      addFeeding(response.feeding)
      showSuccess(response.message)
      showFoodButtons.value = false
    } else {
      showError(response.message)
    }
    
  } catch (error) {
    console.error('Quick food save failed:', error)
    showError('Save failed. Please try again.')
  } finally {
    isLoading.value = false
  }
}

const quickSave = async () => {
  isLoading.value = true
  
  try {
    const response = await $fetch('/api/feedings', {
      method: 'POST',
      body: {
        feeding_time: DateTime.now().toISO(),
        food_type: '',
        notes: ''
      }
    })
    
    if (response.success) {
      addFeeding(response.feeding)
      showSuccess(response.message)
    } else {
      showError(response.message)
    }
    
  } catch (error) {
    console.error('Quick save failed:', error)
    showError('Save failed. Please try again.')
  } finally {
    isLoading.value = false
  }
}

// Close food buttons when clicking outside
onMounted(() => {
  const handleClickOutside = (event) => {
    if (!event.target.closest('.fixed.bottom-24.right-6')) {
      showFoodButtons.value = false
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>
