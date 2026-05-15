import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenWrapper, TAB_SCREEN_EDGES } from '../ui';
import { ProfileOrbs } from './ProfileOrbs';
import { ProfileSubScreenHeader } from './ProfileSubScreenHeader';

type Props = {
  title: string;
  onBack: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
  children: React.ReactNode;
};

export function ProfileScreenShell({ title, onBack, rightLabel, onRightPress, children }: Props) {
  return (
    <ScreenWrapper scroll edges={TAB_SCREEN_EDGES} contentStyle={styles.screen}>
      <ProfileOrbs />
      <ProfileSubScreenHeader
        title={title}
        onBack={onBack}
        rightLabel={rightLabel}
        onRightPress={onRightPress}
      />
      <View style={styles.body}>{children}</View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: 'relative',
  },
  body: {
    gap: 12,
    paddingBottom: 24,
  },
});
