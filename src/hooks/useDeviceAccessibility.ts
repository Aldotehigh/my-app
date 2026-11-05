import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useDeviceAccessibility() {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    let readerChanged = false;
    let motionChanged = false;

    const readerSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => {
        readerChanged = true;
        setScreenReaderEnabled(enabled);
      },
    );
    const motionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        motionChanged = true;
        setReduceMotion(enabled);
      },
    );

    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (active && !readerChanged) setScreenReaderEnabled(enabled);
    }).catch(() => {});
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active && !motionChanged) setReduceMotion(enabled);
    }).catch(() => {});

    return () => {
      active = false;
      readerSubscription.remove();
      motionSubscription.remove();
    };
  }, []);

  return { screenReaderEnabled, reduceMotion };
}
