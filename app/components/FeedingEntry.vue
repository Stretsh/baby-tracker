<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
    <!-- First Row: Time (left) and Food (right) -->
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-bold text-gray-900 dark:text-white">
        {{ formatTime(feeding.feeding_time) }}
      </span>
      <span class="text-sm text-gray-900 dark:text-white">
        {{ feeding.food_type || 'No food specified' }}
      </span>
    </div>
    
    <!-- Second Row: Notes (if present) -->
    <div v-if="feeding.notes" class="mb-3">
      <span class="text-sm text-gray-600 dark:text-gray-400">
        {{ feeding.notes }}
      </span>
    </div>
    
    <!-- Third Row: Action Buttons (left-aligned) -->
    <div class="flex gap-2 -ml-3">
      <button
        class="px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center gap-1"
        @click="showEditModal = true"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </button>
      <button
        class="px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex items-center gap-1"
        @click="showDeleteModal = true"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>
    </div>

    <!-- Modal -->
    <FeedingModal
      v-if="showEditModal || showDeleteModal"
      :feeding-data="preparedFeedingData"
      :is-delete="showDeleteModal"
      :is-updating="isUpdating"
      :is-deleting="isDeleting"
      @close="closeModal"
      @submit="updateFeeding"
      @delete="confirmDelete"
    />
  </div>
</template>

<script setup>
import { DateTime } from 'luxon'
import FeedingModal from './FeedingModal.vue'

const props = defineProps({
  feeding: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['updated', 'deleted'])

// Modal states
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const isUpdating = ref(false)
const isDeleting = ref(false)

// Composables
const { updateFeeding: updateFeedingInStore, removeFeeding } = useFeedings()
const { showSuccess, showError } = useToast()

const formatTime = (dateString) => {
  // Convert UTC from database to local time for display
  const dt = DateTime.fromISO(dateString).toLocal()
  
  // Format: dd.mm, HH:mm (24-hour format)
  return dt.toFormat('d.M, HH:mm')
}

// Prepare feeding data for the form (convert UTC back to datetime-local format)
const preparedFeedingData = computed(() => {
  if (!props.feeding) return null
  
  // Convert UTC time to local time for datetime-local input
  const localTimeString = DateTime.fromISO(props.feeding.feeding_time).toLocal().toFormat('yyyy-MM-dd\'T\'HH:mm')
  
  return {
    ...props.feeding,
    feeding_time: localTimeString
  }
})

const closeModal = () => {
  showEditModal.value = false
  showDeleteModal.value = false
}

const updateFeeding = async (formData) => {
  isUpdating.value = true
  
  try {
    const response = await $fetch(`/api/feedings/${props.feeding.id}`, {
      method: 'PUT',
      body: {
        feeding_time: formData.feeding_time,
        food_type: formData.food_type,
        notes: formData.notes
      }
    })
    
    if (response.success) {
      updateFeedingInStore(response.feeding)
      closeModal()
      emit('updated', response.feeding)
    } else {
      showError(response.message)
    }
  } catch (error) {
    console.error('Update failed:', error)
    showError('Update failed. Please try again.')
  } finally {
    isUpdating.value = false
  }
}

const confirmDelete = async () => {
  isDeleting.value = true
  
  try {
    const response = await $fetch(`/api/feedings/${props.feeding.id}`, {
      method: 'DELETE'
    })
    
    if (response.success) {
      removeFeeding(response.feedingId)
      showSuccess(response.message)
      closeModal()
      emit('deleted', response.feedingId)
    } else {
      showError(response.message)
    }
  } catch (error) {
    console.error('Delete failed:', error)
    showError('Delete failed. Please try again.')
  } finally {
    isDeleting.value = false
  }
}
</script>
