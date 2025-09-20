// Composable to handle feeding data refresh across components
export const useFeedingRefresh = () => {
  const refreshTrigger = ref(0)
  
  const triggerRefresh = () => {
    refreshTrigger.value++
  }
  
  return {
    refreshTrigger: readonly(refreshTrigger),
    triggerRefresh
  }
}
