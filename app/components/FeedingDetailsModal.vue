<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black bg-opacity-50"
      @click="closeModal"
    ></div>
    
    <!-- Modal Content -->
    <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Feeding Details
        </h3>
        <button
          class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          @click="closeModal"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-4 space-y-4">
        <!-- Time -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Time
          </label>
          <p class="text-lg text-gray-900 dark:text-white">
            {{ formatDateTime(feeding?.feeding_time) }}
          </p>
        </div>
        
        <!-- Food Type -->
        <div v-if="feeding?.food_type">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Food Type
          </label>
          <p class="text-gray-900 dark:text-white">
            {{ feeding.food_type }}
          </p>
        </div>
        
        <!-- Notes -->
        <div v-if="feeding?.notes">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <p class="text-gray-900 dark:text-white whitespace-pre-wrap">
            {{ feeding.notes }}
          </p>
        </div>
        
        <!-- No additional info message -->
        <div v-if="!feeding?.food_type && !feeding?.notes" class="text-center py-4">
          <p class="text-gray-500 dark:text-gray-400 text-sm">
            No additional information recorded
          </p>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          @click="closeModal"
        >
          Close
        </button>
        <button
          class="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
          @click="editFeeding"
        >
          Edit
        </button>
        <button
          class="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
          @click="deleteFeeding"
        >
          Delete
        </button>
      </div>
    </div>
    
    <!-- Edit/Delete Modal (using existing FeedingModal) -->
    <FeedingModal
      v-if="showEditModal || showDeleteModal"
      :feeding-data="preparedFeedingData"
      :is-delete="showDeleteModal"
      :is-updating="isUpdating"
      :is-deleting="isDeleting"
      @close="closeEditModal"
      @submit="handleSubmit"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup>
import { DateTime } from 'luxon'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  feedingId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['close'])

// Use global state instead of props
const { feedings } = useFeedings()

// Get the current feeding from global state
const feeding = computed(() => {
  if (!props.feedingId) return null
  return feedings.value.find(f => f.id === props.feedingId)
})

// Edit/Delete modal state
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const isUpdating = ref(false)
const isDeleting = ref(false)

const closeModal = () => {
  emit('close')
}

const editFeeding = () => {
  showEditModal.value = true
}

const deleteFeeding = () => {
  showDeleteModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  showDeleteModal.value = false
}

// Prepare feeding data for the modal
const preparedFeedingData = computed(() => {
  if (!feeding.value) return null
  
  return {
    id: feeding.value.id,
    feeding_time: DateTime.fromISO(feeding.value.feeding_time).toLocal().toFormat('yyyy-MM-dd\'T\'HH:mm'),
    food_type: feeding.value.food_type || '',
    notes: feeding.value.notes || ''
  }
})

const handleSubmit = async (formData) => {
  if (!feeding.value) return
  
  isUpdating.value = true
  try {
    const updatedFeeding = await $fetch(`/api/feedings/${feeding.value.id}`, {
      method: 'PUT',
      body: formData
    })
    // No need to emit - global state will be updated by the API response
    closeEditModal()
    // Keep details modal open to show updated information
  } catch (error) {
    console.error('Update failed:', error)
  } finally {
    isUpdating.value = false
  }
}

const handleDelete = async () => {
  if (!feeding.value) return
  
  isDeleting.value = true
  try {
    await $fetch(`/api/feedings/${feeding.value.id}`, {
      method: 'DELETE'
    })
    
    // Update global state - remove the deleted feeding
    const { setFeedings } = useFeedings()
    const currentFeedings = feedings.value.filter(f => f.id !== feeding.value.id)
    setFeedings(currentFeedings)
    
    closeEditModal()
    closeModal() // Close the details modal too
  } catch (error) {
    console.error('Delete failed:', error)
  } finally {
    isDeleting.value = false
  }
}

// Format date and time for display
const formatDateTime = (timeString) => {
  return DateTime.fromISO(timeString).toLocal().toFormat('EEEE, MMMM d, yyyy \'at\' HH:mm')
}
</script>
