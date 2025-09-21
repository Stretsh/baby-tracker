<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
          Baby Tracker
        </h1>
        <div class="flex items-center space-x-2">
          <!-- PWA Install Button -->
          <button
            v-if="isInstallable && !isInstalled"
            class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-md transition-colors"
            @click="installApp"
            title="Install App"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          
          <!-- Dark Mode Toggle -->
          <button
            class="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            @click="toggleDarkMode"
          >
            <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-md mx-auto bg-white dark:bg-gray-800 min-h-[calc(100vh-140px)] pt-16 pb-20">
      <slot />
    </main>

    <!-- Bottom Navigation -->
    <BottomTabs :model-value="activeTab" @update:model-value="onTabChange" />
    
    <!-- Toast Container -->
    <div class="fixed bottom-4 left-4 z-50 space-y-2">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :message="toast.message"
        :type="toast.type"
        @close="removeToast(toast.id)"
      />
    </div>
  </div>
</template>

<script setup>
const isDark = ref(false)
const { toasts, removeToast } = useToast()
const { isInstallable, isInstalled, installApp } = usePWA()

// Initialize dark mode from localStorage or system preference
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  }
})

// Toggle dark mode
const toggleDarkMode = () => {
  isDark.value = !isDark.value
  
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

const route = useRoute()
const activeTab = computed(() => route.query.tab || 'entry')

const onTabChange = (tab) => {
  // Update URL query parameter
  const route = useRoute()
  const router = useRouter()
  router.push({ query: { ...route.query, tab } })
}
</script>
