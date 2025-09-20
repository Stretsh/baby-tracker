// Composable for managing toast notifications
export const useToast = () => {
  // Use global state to ensure all components share the same toasts array
  const toasts = useState('toasts', () => [])
  
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type })
    
    return id
  }
  
  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  const showSuccess = (message) => showToast(message, 'success')
  const showError = (message) => showToast(message, 'error')
  const showInfo = (message) => showToast(message, 'info')
  
  return {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showInfo
  }
}
