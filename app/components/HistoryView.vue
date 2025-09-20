<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">Feeding History</h2>
      <button
        class="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2"
        @click="toggleSort"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="sortOrder === 'desc'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
        {{ sortOrder === 'desc' ? 'Newest' : 'Oldest' }}
      </button>
    </div>
    
    <!-- Search -->
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search food or notes..."
      class="w-full px-3 py-2 mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
    
    <!-- Loading State -->
    <div v-if="pending" class="text-center py-8">
      <svg class="w-6 h-6 animate-spin mx-auto mb-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <p class="text-gray-500 dark:text-gray-400">Loading...</p>
    </div>
    
    <!-- Feedings List -->
    <div v-else-if="filteredFeedings?.length" class="space-y-3">
      <FeedingEntry
        v-for="feeding in filteredFeedings"
        :key="feeding.id"
        :feeding="feeding"
        @updated="handleUpdate"
        @deleted="handleDelete"
      />
    </div>
    
    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <svg class="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <p class="text-gray-500 dark:text-gray-400">No feedings recorded yet</p>
      <p class="text-sm text-gray-400 dark:text-gray-500">Start by using the Quick Save button!</p>
    </div>
  </div>
</template>

<script setup>
const sortOrder = ref('desc')
const searchQuery = ref('')
const { feedings, setFeedings } = useFeedings()
const pending = ref(false)

// Load initial feedings
const loadFeedings = async () => {
  pending.value = true
  try {
    const response = await $fetch('/api/feedings')
    setFeedings(response.feedings || [])
  } catch (error) {
    console.error('Failed to load feedings:', error)
  } finally {
    pending.value = false
  }
}

// Filtered feedings for search
const filteredFeedings = computed(() => {
  let filtered = feedings.value
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(feeding => 
      feeding.food_type?.toLowerCase().includes(query) ||
      feeding.notes?.toLowerCase().includes(query)
    )
  }
  
  // Apply sorting
  return filtered.sort((a, b) => {
    const dateA = new Date(a.feeding_time)
    const dateB = new Date(b.feeding_time)
    return sortOrder.value === 'desc' ? dateB - dateA : dateA - dateB
  })
})

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}

// Handle feeding updates
const handleUpdate = (updatedFeeding) => {
  const index = feedings.value.findIndex(f => f.id === updatedFeeding.id)
  if (index > -1) {
    feedings.value[index] = updatedFeeding
  }
}

// Handle feeding deletion
const handleDelete = (deletedFeedingId) => {
  feedings.value = feedings.value.filter(f => f.id !== deletedFeedingId)
}

// Load feedings on mount
onMounted(() => {
  loadFeedings()
})
</script>
