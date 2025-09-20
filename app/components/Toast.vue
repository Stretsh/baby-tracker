<template>
  <div class="relative">
    <Transition
      name="toast-slide"
      appear
      @after-enter="onToastEntered"
    >
      <div
        v-if="show"
        :class="[
          'max-w-sm rounded-lg shadow-xl p-4 border-l-4 relative overflow-hidden',
          type === 'success' 
            ? 'bg-green-50 dark:bg-green-900 border-green-500 text-green-800 dark:text-green-200' 
            : type === 'error'
            ? 'bg-red-50 dark:bg-red-900 border-red-500 text-red-800 dark:text-red-200'
            : 'bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-800 dark:text-blue-200'
        ]"
      >
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <svg
            v-if="type === 'success'"
            class="w-5 h-5 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg
            v-else-if="type === 'error'"
            class="w-5 h-5 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <svg
            v-else
            class="w-5 h-5 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium">
            {{ message }}
          </p>
        </div>
        <button
          @click="close"
          :class="[
            'flex-shrink-0',
            type === 'success' 
              ? 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200' 
              : type === 'error'
              ? 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
              : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200'
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      </div>
    </Transition>
    
    <!-- Progress Bar - Only show after toast is fully visible -->
    <Transition
      name="progress-fade"
      appear
    >
      <div 
        v-if="showProgress && show"
        class="absolute bottom-0 left-0 right-0 h-1 bg-gray-300 dark:bg-gray-600 rounded-b-lg"
      >
        <div 
          class="h-full transition-all ease-linear"
          :class="[
            type === 'success' 
              ? 'bg-green-500' 
              : type === 'error'
              ? 'bg-red-500'
              : 'bg-blue-500'
          ]"
          :style="{ width: progressWidth + '%' }"
        ></div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'info'].includes(value)
  }
})

const emit = defineEmits(['close'])

const show = ref(true)
const showProgress = ref(false)
const progressWidth = ref(100)

// Start progress bar animation after toast is fully visible
const onToastEntered = () => {
  showProgress.value = true
  startProgressAnimation()
}

const startProgressAnimation = () => {
  const startTime = Date.now()
  const updateProgress = () => {
    const elapsed = Date.now() - startTime
    const remaining = Math.max(0, 3000 - elapsed) // 3 seconds for testing
    progressWidth.value = (remaining / 3000) * 100
    
    if (remaining > 0) {
      requestAnimationFrame(updateProgress)
    } else {
      // Progress bar reached 0, now trigger the close
      close()
    }
  }
  requestAnimationFrame(updateProgress)
}

const close = () => {
  show.value = false
  showProgress.value = false
  // Delay the emit to allow transition to complete
  setTimeout(() => {
    emit('close')
  }, 500) // Match the transition duration
}
</script>

<style scoped>
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.5s ease;
}

.toast-slide-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.toast-slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.progress-fade-enter-active,
.progress-fade-leave-active {
  transition: opacity 0.3s ease;
}

.progress-fade-enter-from,
.progress-fade-leave-to {
  opacity: 0;
}
</style>
