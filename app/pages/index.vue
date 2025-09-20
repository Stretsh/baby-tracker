<template>
  <div class="pb-20">
    <!-- Full Form -->
    <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
      <FeedingForm />
    </div>
    
    <!-- History View -->
    <div class="pt-4">
      <HistoryView />
    </div>
    
    <!-- Floating Components -->
    <FloatingButtons />
  </div>
</template>

<script setup>
// Use the default layout
definePageMeta({
  layout: 'default'
})
</script>
