import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const STORAGE_KEY = 'ward19_pwa_installed';

// Module-level prompt capture to catch the event even before React mounts
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<
  (p: BeforeInstallPromptEvent | null) => void
>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent standard mini-infobar on mobile so our custom button triggers it cleanly
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((fn) => fn(globalDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore storage errors
    }
    promptListeners.forEach((fn) => fn(null));
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(() => globalDeferredPrompt);
  const [isRunningStandalone, setIsRunningStandalone] = useState(false);
  const [hasBeenInstalled, setHasBeenInstalled] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isIOS, setIsIOS] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Detect iframe environment (browsers block beforeinstallprompt inside iframes)
    try {
      const inIframe = window.self !== window.top;
      setIsInIframe(inIframe);
    } catch {
      setIsInIframe(true);
    }

    // Check standalone mode (already launched and running AS the app from phone homescreen)
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
          true;
      setIsRunningStandalone(isStandalone);
      if (isStandalone) {
        setHasBeenInstalled(true);
        try {
          localStorage.setItem(STORAGE_KEY, 'true');
        } catch {
          // ignore
        }
      }
    };

    checkStandalone();

    // Detect iOS (iPhone / iPad / iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' &&
        window.navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    const updatePrompt = (p: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(p);
    };

    promptListeners.add(updatePrompt);

    return () => {
      promptListeners.delete(updatePrompt);
    };
  }, []);

  const install = async (): Promise<{
    success: boolean;
    nativeTriggered: boolean;
    reason?: 'iframe' | 'ios' | 'no-prompt' | 'dismissed' | 'installed';
  }> => {
    if (isInIframe) {
      return { success: false, nativeTriggered: false, reason: 'iframe' };
    }

    if (isIOS) {
      return { success: false, nativeTriggered: false, reason: 'ios' };
    }

    let promptToUse = deferredPrompt || globalDeferredPrompt;

    // If prompt is not ready yet, wait briefly (up to 1500ms) for service worker & browser checks
    if (!promptToUse) {
      setIsChecking(true);
      const start = Date.now();
      while (Date.now() - start < 1500) {
        await new Promise((r) => setTimeout(r, 150));
        if (globalDeferredPrompt) {
          promptToUse = globalDeferredPrompt;
          setDeferredPrompt(globalDeferredPrompt);
          break;
        }
      }
      setIsChecking(false);
    }

    if (promptToUse) {
      try {
        await promptToUse.prompt();
        const { outcome } = await promptToUse.userChoice;
        if (outcome === 'accepted') {
          setHasBeenInstalled(true);
          try {
            localStorage.setItem(STORAGE_KEY, 'true');
          } catch {
            // ignore
          }
          setDeferredPrompt(null);
          globalDeferredPrompt = null;
          return { success: true, nativeTriggered: true, reason: 'installed' };
        }
        return { success: false, nativeTriggered: true, reason: 'dismissed' };
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    }

    return { success: false, nativeTriggered: false, reason: 'no-prompt' };
  };

  const markNotInstalled = () => {
    setHasBeenInstalled(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return {
    isInstallable: !!(deferredPrompt || globalDeferredPrompt),
    isRunningStandalone,
    hasBeenInstalled,
    isIOS,
    isInIframe,
    isChecking,
    install,
    markNotInstalled,
  };
}
