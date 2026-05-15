import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExploreScreen } from '../screens/academy/ExploreScreen';
import { HomeScreen } from '../screens/academy/HomeScreen';
import { MyCoursesScreen } from '../screens/academy/MyCoursesScreen';
import ProfileStack from './ProfileStack';
import { Colors, Spacing, Typography } from '../theme';
import type { MainTabParamList } from '../types';

const Tabs = createBottomTabNavigator<MainTabParamList>();

const TAB_BAR_CONTENT_MIN = 56;

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Spacing.sm);
  const tabBarHeight = TAB_BAR_CONTENT_MIN + bottomPad;

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgElevated,
          borderTopColor: Colors.divider,
          paddingTop: Spacing.sm,
          paddingBottom: bottomPad,
          minHeight: tabBarHeight,
        },
        tabBarLabelStyle: {
          ...Typography.caption,
          fontSize: 11,
        },
        tabBarActiveTintColor: Colors.accentPrimary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarIcon: ({ color, size }) => {
          const icon = route.name === 'HomeTab' ? 'home' : route.name === 'ExploreTab' ? 'search' : route.name === 'MyCoursesTab' ? 'play-circle' : 'person';
          return <Ionicons name={icon as any} color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tabs.Screen name="ExploreTab" component={ExploreScreen} options={{ title: 'Explorar' }} />
      <Tabs.Screen name="MyCoursesTab" component={MyCoursesScreen} options={{ title: 'Mis cursos' }} />
      <Tabs.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Perfil' }} />
    </Tabs.Navigator>
  );
}
