<template>
  <div class="space-y-6">
    <!-- Daily Groups -->
    <div v-for="(dayGroup, date) in groupedFeedings" :key="date" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <!-- Date Header -->
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ formatDate(date) }}
        </h3>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ dayGroup.length }} feeding{{ dayGroup.length === 1 ? '' : 's' }}
        </span>
      </div>
      
      <!-- Time Buttons -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="feeding in dayGroup"
          :key="feeding.id"
          class="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm font-medium font-mono w-16 text-center"
          @click="openDetailsModal(feeding)"
        >
          {{ formatTime(feeding.feeding_time) }}
        </button>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="!Object.keys(groupedFeedings).length" class="text-center py-8">
      <svg class="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <p class="text-gray-500 dark:text-gray-400">No feedings recorded yet</p>
      <p class="text-sm text-gray-400 dark:text-gray-500">Start by using the Quick Save button!</p>
    </div>
  </div>
</template>

<script setup>
import { DateTime } from 'luxon'

const { feedings } = useFeedings()

// Group feedings by date (local time)
const groupedFeedings = computed(() => {
  const groups = {}
  
  feedings.value.forEach(feeding => {
    // Convert UTC to local time for grouping
    const localTime = DateTime.fromISO(feeding.feeding_time).toLocal()
    const dateKey = localTime.toFormat('yyyy-MM-dd')
    
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    
    groups[dateKey].push(feeding)
  })
  
  // Sort feedings within each day by time
  Object.keys(groups).forEach(date => {
    groups[date].sort((a, b) => {
      const timeA = DateTime.fromISO(a.feeding_time).toLocal()
      const timeB = DateTime.fromISO(b.feeding_time).toLocal()
      return timeA - timeB
    })
  })
  
  // Sort days by date (newest first)
  const sortedGroups = {}
  Object.keys(groups)
    .sort((a, b) => b.localeCompare(a))
    .forEach(date => {
      sortedGroups[date] = groups[date]
    })
  
  return sortedGroups
})

// Format date for display
const formatDate = (dateString) => {
  const date = DateTime.fromISO(dateString).toLocal()
  const today = DateTime.now().toLocal()
  const yesterday = today.minus({ days: 1 })
  
  if (date.hasSame(today, 'day')) {
    return 'Today'
  } else if (date.hasSame(yesterday, 'day')) {
    return 'Yesterday'
  } else {
    return date.toFormat('EEEE, MMMM d')
  }
}

// Format time for display
const formatTime = (timeString) => {
  return DateTime.fromISO(timeString).toLocal().toFormat('HH:mm')
}

// Emit events for modal handling
const emit = defineEmits(['openDetails'])

const openDetailsModal = (feeding) => {
  emit('openDetails', feeding)
}
</script>
