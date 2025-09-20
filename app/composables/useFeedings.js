// Composable for managing feedings array across components
export const useFeedings = () => {
  // Use global state to ensure all components share the same feedings array
  const feedings = useState('feedings', () => [])
  
  const addFeeding = (feeding) => {
    // Add to top of array (newest first)
    feedings.value.unshift(feeding)
  }
  
  const updateFeeding = (updatedFeeding) => {
    const index = feedings.value.findIndex(f => f.id === updatedFeeding.id)
    if (index > -1) {
      feedings.value[index] = updatedFeeding
      // Re-sort the array to maintain proper order based on feeding_time
      feedings.value.sort((a, b) => {
        const dateA = new Date(a.feeding_time)
        const dateB = new Date(b.feeding_time)
        return dateB - dateA // Always sort newest first
      })
    }
  }
  
  const removeFeeding = (feedingId) => {
    feedings.value = feedings.value.filter(f => f.id !== feedingId)
  }
  
  const setFeedings = (newFeedings) => {
    feedings.value = newFeedings
  }
  
  return {
    feedings,
    addFeeding,
    updateFeeding,
    removeFeeding,
    setFeedings
  }
}
