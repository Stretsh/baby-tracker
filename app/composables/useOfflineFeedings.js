// Bridge composable between offline data and existing useFeedings interface
export const useOfflineFeedings = () => {
  const { 
    createFeedingRecord, 
    getFeedingRecords, 
    updateFeedingRecord, 
    deleteFeedingRecord,
    validateFeedingRecord 
  } = useOfflineData()
  
  // Use global state to ensure all components share the same feedings array
  const feedings = useState('feedings', () => [])
  const isLoading = ref(false)
  const error = ref(null)
  
  // Load feedings from local database
  const loadFeedings = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const records = await getFeedingRecords()
      
      // Convert Dexie records to the format expected by existing components
      const formattedFeedings = records.map(record => ({
        id: record.client_id, // Use client_id as the primary identifier
        client_id: record.client_id,
        feeding_time: record.feeding_time,
        food_type: record.food_type,
        notes: record.notes,
        created_at: record.updated_at, // Use updated_at as created_at for compatibility
        updated_at: record.updated_at
      }))
      
      feedings.value = formattedFeedings
      return formattedFeedings
    } catch (err) {
      error.value = err.message
      console.error('Failed to load feedings:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Add new feeding record
  const addFeeding = async (feedingData) => {
    try {
      // Validate the data
      const validation = validateFeedingRecord(feedingData)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }
      
      // Create the record in local database
      const record = await createFeedingRecord(feedingData)
      
      // Convert to the format expected by existing components
      const formattedFeeding = {
        id: record.client_id,
        client_id: record.client_id,
        feeding_time: record.feeding_time,
        food_type: record.food_type,
        notes: record.notes,
        created_at: record.updated_at,
        updated_at: record.updated_at
      }
      
      // Add to local state (newest first)
      feedings.value.unshift(formattedFeeding)
      
      return formattedFeeding
    } catch (err) {
      error.value = err.message
      console.error('Failed to add feeding:', err)
      throw err
    }
  }
  
  // Update existing feeding record
  const updateFeeding = async (feedingId, feedingData) => {
    try {
      // Validate the data
      const validation = validateFeedingRecord(feedingData)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }
      
      // Update the record in local database
      const updatedRecord = await updateFeedingRecord(feedingId, feedingData)
      
      // Convert to the format expected by existing components
      const formattedFeeding = {
        id: updatedRecord.client_id,
        client_id: updatedRecord.client_id,
        feeding_time: updatedRecord.feeding_time,
        food_type: updatedRecord.food_type,
        notes: updatedRecord.notes,
        created_at: updatedRecord.updated_at,
        updated_at: updatedRecord.updated_at
      }
      
      // Update in local state
      const index = feedings.value.findIndex(f => f.id === feedingId)
      if (index > -1) {
        feedings.value[index] = formattedFeeding
        
        // Re-sort the array to maintain proper order based on feeding_time
        feedings.value.sort((a, b) => {
          const dateA = new Date(a.feeding_time)
          const dateB = new Date(b.feeding_time)
          return dateB - dateA // Always sort newest first
        })
      }
      
      return formattedFeeding
    } catch (err) {
      error.value = err.message
      console.error('Failed to update feeding:', err)
      throw err
    }
  }
  
  // Remove feeding record
  const removeFeeding = async (feedingId) => {
    try {
      // Delete from local database
      await deleteFeedingRecord(feedingId)
      
      // Remove from local state
      feedings.value = feedings.value.filter(f => f.id !== feedingId)
      
      return true
    } catch (err) {
      error.value = err.message
      console.error('Failed to remove feeding:', err)
      throw err
    }
  }
  
  // Set feedings (for compatibility with existing code)
  const setFeedings = (newFeedings) => {
    feedings.value = newFeedings
  }
  
  // Quick save with current time
  const quickSave = async (foodType = '', notes = '') => {
    const now = new Date().toISOString()
    return await addFeeding({
      feeding_time: now,
      food_type: foodType,
      notes: notes
    })
  }
  
  // Save with specific food type
  const saveWithFood = async (foodType, notes = '') => {
    return await quickSave(foodType, notes)
  }
  
  return {
    // Core state
    feedings,
    isLoading,
    error,
    
    // CRUD operations
    loadFeedings,
    addFeeding,
    updateFeeding,
    removeFeeding,
    setFeedings,
    
    // Quick operations
    quickSave,
    saveWithFood
  }
}