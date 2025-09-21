// PWA Install Prompt Composable
export const usePWA = () => {
  const deferredPrompt = ref(null);
  const isInstallable = ref(false);
  const isInstalled = ref(false);

  const checkIfInstalled = () => {
    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      isInstalled.value = true;
    }
  };

  const handleBeforeInstallPrompt = (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt.value = e;
    isInstallable.value = true;
  };

  const installApp = async () => {
    if (deferredPrompt.value) {
      // Show the install prompt
      deferredPrompt.value.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.value.userChoice;
      
      if (outcome === 'accepted') {
        isInstalled.value = true;
      }
      
      // Clear the deferredPrompt
      deferredPrompt.value = null;
      isInstallable.value = false;
      
      return outcome === 'accepted';
    } else {
      // Fallback: Show manual install instructions
      alert('To install this app:\n\n1. Click the menu button (⋮) in your browser\n2. Select "Install Baby Tracker" or "Add to Home Screen"\n3. Follow the prompts to install');
      return false;
    }
  };

  const handleAppInstalled = () => {
    isInstalled.value = true;
    isInstallable.value = false;
    deferredPrompt.value = null;
  };

  onMounted(() => {
    if (process.client) {
      checkIfInstalled();
      
      // Listen for the beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      
      // Listen for the appinstalled event
      window.addEventListener('appinstalled', handleAppInstalled);
      
      // Fallback: Show install button after 3 seconds if not already shown
      setTimeout(() => {
        if (!isInstallable.value && !isInstalled.value) {
          isInstallable.value = true;
        }
      }, 3000);
    }
  });

  onUnmounted(() => {
    if (process.client) {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    }
  });

  return {
    isInstallable: readonly(isInstallable),
    isInstalled: readonly(isInstalled),
    installApp
  };
};
