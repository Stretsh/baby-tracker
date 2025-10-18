<template>
  <div class="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50" @click="handleClose">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 relative" @click.stop>
      <!-- Close button for edit form -->
      <button
        v-if="!isDelete"
        @click="handleClose"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <h3 class="text-lg font-semibold mb-4" :class="isDelete ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'">
        {{ isDelete ? 'Delete Feeding' : 'Edit Feeding' }}
      </h3>

      <!-- Edit Form -->
      <FeedingForm
        v-if="!isDelete"
        :initial-data="feedingData"
        :is-editing="true"
        :is-modal="true"
        :feeding-id="feedingData.id"
        @submit="handleSubmit"
        @success="handleSuccess"
      />

      <!-- Delete Confirmation -->
      <div v-else class="space-y-4">
        <p class="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete this feeding record? This action cannot be undone.
        </p>
        
        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <div><strong>Time:</strong> {{ formatTime(feedingData.feeding_time) }}</div>
            <div><strong>Food:</strong> {{ feedingData.food_type || 'No food specified' }}</div>
            <div v-if="feedingData.notes"><strong>Notes:</strong> {{ feedingData.notes }}</div>
          </div>
        </div>

        <div class="flex gap-2 justify-end">
          <button
            @click="handleClose"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleDelete"
            :disabled="isDeleting"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md transition-colors flex items-center gap-2"
          >
            <svg v-if="isDeleting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { DateTime } from 'luxon'

const props = defineProps({
  feedingData: {
    type: Object,
    required: true
  },
  isDelete: {
    type: Boolean,
    default: false
  },
  isUpdating: {
    type: Boolean,
    default: false
  },
  isDeleting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit', 'delete'])

const formatTime = (dateString) => {
  // Convert UTC from database to local time for display
  const dt = DateTime.fromISO(dateString).toLocal()
  
  // Format: dd.mm, HH:mm (24-hour format)
  return dt.toFormat('d.M, HH:mm')
}

const handleSubmit = (formData) => {
  emit('submit', formData)
}

const handleSuccess = () => {
  emit('close', false)
}

const handleDelete = () => {
  emit('delete')
}

// Handle close events
const handleClose = () => {
  emit('close', false)
}
</script>
