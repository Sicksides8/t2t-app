import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExploreScreen } from '../screens/academy/ExploreScreen';
import { HomeScreen } from '../screens/academy/HomeScreen';
import { MyCoursesScreen } from '../screens/academy/MyCoursesScreen';
import ProfileStack from './ProfileStack';
import { TAB_BAR_CONTENT_MIN, TAB_BAR_OVERLAY_PADDING } from './tabBarConstants';
import { Colors, Spacing } from '../theme';
import type { MainTabParamList } from '../types';

export { TAB_BAR_OVERLAY_PADDING };

const Tabs = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  HomeTab: ['home-outline', 'home'],
  ExploreTab: ['compass-outline', 'compass'],
  MyCoursesTab: ['book-outline', 'book'],
  ProfileTab: ['person-outline', 'person'],
};

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Spacing.sm);
  const tabBarHeight = TAB_BAR_CONTENT_MIN + bottomPad;

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          borderTopColor: '#FFFFFF1A',
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: bottomPad,
          minHeight: tabBarHeight,
          elevation: 0,
        },
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 5, 36, 0.55)',
            }}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarActiveTintColor: Colors.accentHighlight,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarIcon: ({ color, size, focused }) => {
          const [outline, filled] = ICONS[route.name] || ['ellipse-outline', 'ellipse'];
          return <Ionicons name={focused ? filled : outline} color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tabs.Screen name="ExploreTab" component={ExploreScreen} options={{ title: 'Explorar' }} />
      <Tabs.Screen name="MyCoursesTab" component={MyCoursesScreen} options={{ title: 'Mis cursos' }} />
      <Tabs.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Perfil' }} />
    </Tabs.Navigator>
  );
}
