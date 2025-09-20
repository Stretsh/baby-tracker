<template>
  <div :class="isModal ? '' : 'px-4 py-4'">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
        <input
          v-model="formData.feeding_time"
          type="datetime-local"
          class="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
      </div>
      
      <FoodInput v-model="formData.food_type" />
      
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
        <textarea
          ref="notesTextarea"
          v-model="formData.notes"
          placeholder="Any additional notes..."
          :rows="1"
          class="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden"
          @input="autoResize"
        />
      </div>
      
      <button
        type="submit"
        :disabled="isLoading"
        :class="[
          isModal ? 'px-4 py-2 text-sm' : 'w-full px-4 py-3 text-base mt-6',
          'bg-blue-700 hover:bg-blue-800 disabled:bg-blue-500 text-white font-semibold rounded-md transition-colors flex items-center justify-center gap-2'
        ]"
      >
        <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        {{ isLoading ? 'SAVING...' : (isEditing ? 'UPDATE' : 'SAVE FEEDING') }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { DateTime } from 'luxon'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      feeding_time: '',
      food_type: '',
      notes: ''
    })
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  isModal: {
    type: Boolean,
    default: false
  },
  feedingId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['submit', 'success'])

const isLoading = ref(false)
const { addFeeding, updateFeeding } = useFeedings()
const { showSuccess, showError } = useToast()
const notesTextarea = ref(null)

const formData = ref({ ...props.initialData })

// Auto-resize textarea function
const autoResize = () => {
  if (notesTextarea.value) {
    notesTextarea.value.style.height = 'auto'
    notesTextarea.value.style.height = notesTextarea.value.scrollHeight + 'px'
  }
}

// Watch for changes in initialData (for editing)
watch(() => props.initialData, (newData) => {
  if (newData) {
    // Convert ISO string to datetime-local format for editing
    if (newData.feeding_time && props.isEditing) {
      const date = new Date(newData.feeding_time)
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      formData.value = {
        ...newData,
        feeding_time: localDateTime
      }
    } else {
      formData.value = { ...newData }
    }
    // Auto-resize textarea after data changes
    nextTick(() => autoResize())
  }
}, { immediate: true })

// Auto-resize on mount
onMounted(() => {
  nextTick(() => autoResize())
})

const handleSubmit = async () => {
  isLoading.value = true
  
  try {
    if (props.isEditing) {
      // Update existing feeding
      const response = await $fetch(`/api/feedings/${props.feedingId}`, {
        method: 'PUT',
        body: {
          feeding_time: formData.value.feeding_time + ':00',
          food_type: formData.value.food_type,
          notes: formData.value.notes
        }
      })
      
      if (response.success) {
        updateFeeding(response.feeding)
        showSuccess(response.message)
        emit('submit', formData.value)
        emit('success')
      } else {
        showError(response.message)
      }
    } else {
      // Create new feeding
      const response = await $fetch('/api/feedings', {
        method: 'POST',
        body: {
          feeding_time: formData.value.feeding_time ? formData.value.feeding_time + ':00' : DateTime.now().toISO(),
          food_type: formData.value.food_type,
          notes: formData.value.notes
        }
      })
      
      if (response.success) {
        addFeeding(response.feeding)
        showSuccess(response.message)
        
        // Reset form
        formData.value = {
          feeding_time: '',
          food_type: '',
          notes: ''
        }
        
        emit('success')
      } else {
        showError(response.message)
        // Keep form data for retry
      }
    }
    
  } catch (error) {
    console.error('Save failed:', error)
    showError('Save failed. Please try again.')
  } finally {
    isLoading.value = false
  }
}
</script>
