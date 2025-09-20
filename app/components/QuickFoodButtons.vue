<template>
  <div class="px-4 py-4">
    <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Most Used Foods</h3>
    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="food in recentFoods"
        :key="food"
        @click="saveWithFood(food)"
        :disabled="isLoading"
        class="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 rounded-md transition-colors text-left"
      >
        {{ food }}
      </button>
    </div>
  </div>
</template>

<script setup>
const isLoading = ref(false)

// Fetch recent food types (top 6 most used)
const { data: recentFoodsData } = await useFetch('/api/food-types/recent', {
  query: { limit: 6 },
  default: () => ({ recent_foods: [] })
})
const recentFoods = computed(() => recentFoodsData.value?.recent_foods || [])

const saveWithFood = async (food) => {
  isLoading.value = true
  
  try {
    const _response = await $fetch('/api/feedings', {
      method: 'POST',
      body: {
        feeding_time: new Date().toISOString(),
        food_type: food,
        notes: ''
      }
    })
    
    // Show success feedback
    console.log(`Feeding saved! ${food} feeding recorded.`)
    
    // Refresh the page to show the new entry
    await navigateTo({ query: { ...useRoute().query } })
    
  } catch (error) {
    console.error('Quick food save failed:', error)
    console.error('Save failed. Please try again.')
  } finally {
    isLoading.value = false
  }
}
</script>
