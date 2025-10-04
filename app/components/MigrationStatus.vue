<template>
  <div v-if="showStatus" class="fixed top-16 left-4 right-4 z-50">
    <div 
      class="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3 shadow-sm"
      :class="{
        'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700': status.isComplete,
        'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700': status.hasError,
        'bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700': status.isMigrating
      }"
    >
      <div class="flex items-center space-x-2">
        <!-- Status Icon -->
        <div class="flex-shrink-0">
          <svg v-if="status.isComplete" class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else-if="status.hasError" class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <svg v-else-if="status.isMigrating" class="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <svg v-else class="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <!-- Status Text -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ statusMessage }}
          </p>
          <p v-if="status.progress > 0 && status.progress < 100" class="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {{ status.progress }}% complete
          </p>
        </div>
        
        <!-- Close Button -->
        <button 
          @click="hideStatus"
          class="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Progress Bar -->
      <div v-if="status.isMigrating && status.progress > 0" class="mt-2">
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div 
            class="bg-blue-600 dark:bg-blue-400 h-1 rounded-full transition-all duration-300"
            :style="{ width: status.progress + '%' }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  status: {
    type: Object,
    required: true
  },
  autoHide: {
    type: Boolean,
    default: true
  },
  hideDelay: {
    type: Number,
    default: 3000
  }
})

const showStatus = ref(false)
let hideTimeout = null

const statusMessage = computed(() => {
  if (props.status.isComplete) {
    return 'Database updated successfully'
  } else if (props.status.hasError) {
    return `Migration failed: ${props.status.error || 'Unknown error'}`
  } else if (props.status.isMigrating) {
    return 'Updating database...'
  } else if (props.status.isChecking) {
    return 'Checking database...'
  } else {
    return props.status.message || 'Preparing...'
  }
})

// Show status when migration starts
watch(() => props.status.isMigrating, (isMigrating) => {
  if (isMigrating) {
    showStatus.value = true
    clearTimeout(hideTimeout)
  }
})

// Show status when there's an error
watch(() => props.status.hasError, (hasError) => {
  if (hasError) {
    showStatus.value = true
    clearTimeout(hideTimeout)
  }
})

// Auto-hide when migration completes
watch(() => props.status.isComplete, (isComplete) => {
  if (isComplete && props.autoHide) {
    hideTimeout = setTimeout(() => {
      showStatus.value = false
    }, props.hideDelay)
  }
})

// Show status when checking starts
watch(() => props.status.isChecking, (isChecking) => {
  if (isChecking) {
    showStatus.value = true
    clearTimeout(hideTimeout)
  }
})

function hideStatus() {
  showStatus.value = false
  clearTimeout(hideTimeout)
}

// Cleanup timeout on unmount
onUnmounted(() => {
  clearTimeout(hideTimeout)
})
</script>
