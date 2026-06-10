import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

/** Oculta barra de navegacion Android; deslizar desde abajo la muestra temporalmente */
export function useImmersiveAndroidNav(enabled = true) {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android' || !enabled) return;

      void NavigationBar.setVisibilityAsync('hidden');
      void NavigationBar.setBehaviorAsync('overlay-swipe');
      void NavigationBar.setBackgroundColorAsync('#0B1F1700');

      return () => {
        void NavigationBar.setVisibilityAsync('visible');
      };
    }, [enabled]),
  );
}
