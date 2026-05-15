import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CertificatesScreen,
  CertificateDetailScreen,
  CoinsHistoryScreen,
  DiagnosticAppScreen,
  EditProfileScreen,
  RedeemCodeScreen,
  PaymentDetailScreen,
  ProfileMainScreen,
  ProgressScreen,
  SubscriptionScreen,
  WeeklyChallengeScreen,
  AppNotificationsScreen,
  SystemStatesScreen,
} from '../screens/profile/ProfileScreens';
import { EmptyBoardScreen, ErrorScreen, MaintenanceScreen, OfflineScreen } from '../screens/system/SystemScreens';
import type { ProfileStackParamList } from '../types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileMainScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="RedeemCode" component={RedeemCodeScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
      <Stack.Screen name="DiagnosticApp" component={DiagnosticAppScreen} />
      <Stack.Screen name="Certificates" component={CertificatesScreen} />
      <Stack.Screen name="CertificateDetail" component={CertificateDetailScreen} />
      <Stack.Screen name="Progress" component={ProgressScreen} />
      <Stack.Screen name="CoinsHistory" component={CoinsHistoryScreen} />
      <Stack.Screen name="WeeklyChallenge" component={WeeklyChallengeScreen} />
      <Stack.Screen name="NotificationsList" component={AppNotificationsScreen} />
      <Stack.Screen name="SystemStates" component={SystemStatesScreen} />
      <Stack.Screen name="Offline" component={OfflineScreen} />
      <Stack.Screen name="ErrorState" component={ErrorScreen} />
      <Stack.Screen name="Maintenance" component={MaintenanceScreen} />
      <Stack.Screen name="EmptyBoard" component={EmptyBoardScreen} />
    </Stack.Navigator>
  );
}
