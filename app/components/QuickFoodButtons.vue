<template>
  <div class="px-4 py-4">
    <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Most Used Foods</h3>
    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="food in recentFoods"
        :key="food"
        class="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 rounded-md transition-colors text-left"
        :disabled="isLoading"
        @click="saveWithFood(food)"
      >
        {{ food }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { DateTime } from 'luxon'
import { useOfflineData } from '~/composables/useOfflineData'

const isLoading = ref(false)
const { createFeedingRecord } = useOfflineData()

// Get recent food types from offline data
const { getFeedingRecords } = useOfflineData()
const recentFoods = ref([])

// Load recent foods from offline data
const loadRecentFoods = async () => {
  try {
    const records = await getFeedingRecords({ limit: 50 })
    const foodCounts = {}
    
    // Count food types
    records.forEach(record => {
      if (record.food_type && record.food_type.trim()) {
        foodCounts[record.food_type] = (foodCounts[record.food_type] || 0) + 1
      }
    })
    
    // Sort by count and get top 6
    const sortedFoods = Object.entries(foodCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([food]) => food)
    
    recentFoods.value = sortedFoods
  } catch (error) {
    console.error('Failed to load recent foods:', error)
    recentFoods.value = []
  }
}

const saveWithFood = async (food) => {
  isLoading.value = true
  
  try {
    await createFeedingRecord({
      feeding_time: DateTime.now().toISO(),
      food_type: food,
      notes: ''
    })
    
    // Service Worker will handle sync automatically
    
    // Refresh the page to show the new entry
    await navigateTo({ query: { ...useRoute().query } })
    
  } catch (error) {
    console.error('Quick food save failed:', error)
    console.error('Save failed. Please try again.')
  } finally {
    isLoading.value = false
  }
}

// Load recent foods on mount
onMounted(() => {
  loadRecentFoods()
})
</script>
