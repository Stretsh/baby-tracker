<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">Feeding History</h2>
      <div class="flex items-center gap-2">
        <!-- View Toggle Button -->
        <button
          class="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2"
          @click="toggleView"
          :title="viewMode === 'list' ? 'Switch to time view' : 'Switch to list view'"
        >
          <svg v-if="viewMode === 'list'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M2.75 3.5a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0ZM2 3.5a1.75 1.75 0 1 1 3.5 0A1.75 1.75 0 0 1 2 3.5Zm1.75 4.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM2 7.75a1.75 1.75 0 1 1 3.5 0A1.75 1.75 0 0 1 2 7.75Zm1.75 4.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM2 12a1.75 1.75 0 1 1 3.5 0A1.75 1.75 0 0 1 2 12Zm4.25-8.25a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75Zm.75 3.5a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7Zm-.75 4.25a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd"/>
          </svg>
        </button>
        
        <!-- Sort Button (only in list view) -->
        <button
          v-if="viewMode === 'list'"
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
    </div>
    
    <!-- Search (only in list view) -->
    <input
      v-if="viewMode === 'list'"
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
    
    <!-- List View -->
    <div v-else-if="viewMode === 'list'">
      <!-- Feedings List -->
      <div v-if="filteredFeedings?.length" class="space-y-3">
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
    
    <!-- Time Button View -->
    <div v-else>
      <TimeButtonView
        @openDetails="openDetailsModal"
      />
    </div>
    
    <!-- Details Modal -->
    <FeedingDetailsModal
      :isOpen="detailsModalOpen"
      :feedingId="selectedFeeding?.id"
      @close="closeDetailsModal"
    />
  </div>
</template>

<script setup>
const sortOrder = ref('desc')
const searchQuery = ref('')
const { feedings, setFeedings, loadFeedings: offlineLoadFeedings } = useOfflineFeedings()
const pending = ref(false)

// View mode state
const viewMode = ref('time') // 'list' or 'time'

// Details modal state
const detailsModalOpen = ref(false)
const selectedFeeding = ref(null)

// Load initial feedings
const loadFeedings = async () => {
  pending.value = true
  try {
    await offlineLoadFeedings()
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

// Toggle between list and time view
const toggleView = () => {
  viewMode.value = viewMode.value === 'list' ? 'time' : 'list'
}

// Details modal methods
const openDetailsModal = (feeding) => {
  selectedFeeding.value = feeding
  detailsModalOpen.value = true
}

const closeDetailsModal = () => {
  detailsModalOpen.value = false
  selectedFeeding.value = null
}

// No longer needed - global state handles updates automatically

// Handle feeding updates
const handleUpdate = (updatedFeeding) => {
  const index = feedings.value.findIndex(f => f.id === updatedFeeding.id)
  if (index > -1) {
    feedings.value[index] = updatedFeeding
  }
}

// Handle feeding deletion
const handleDelete = (deletedFeeding) => {
  if (typeof deletedFeeding === 'object' && deletedFeeding.id) {
    // Handle deletion from details modal
    feedings.value = feedings.value.filter(f => f.id !== deletedFeeding.id)
  } else {
    // Handle deletion from FeedingEntry component (legacy)
    feedings.value = feedings.value.filter(f => f.id !== deletedFeeding)
  }
}

// Load feedings on mount
onMounted(() => {
  loadFeedings()
})
</script>
