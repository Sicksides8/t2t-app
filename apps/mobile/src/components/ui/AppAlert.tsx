import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Button } from './Button';

export type AppAlertTone = 'success' | 'error' | 'info';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  tone?: AppAlertTone;
  confirmLabel?: string;
  onConfirm: () => void;
  onRequestClose?: () => void;
};

const TONE_ICON: Record<AppAlertTone, React.ComponentProps<typeof Ionicons>['name']> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const TONE_COLOR: Record<AppAlertTone, string> = {
  success: Colors.accentPrimary,
  error: Colors.error,
  info: Colors.textSecondary,
};

/** Modal in-app para reemplazar Alert.alert nativo. */
export function AppAlert({
  visible,
  title,
  message,
  tone = 'info',
  confirmLabel = 'Entendido',
  onConfirm,
  onRequestClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose ?? onConfirm}
    >
      <Pressable style={styles.backdrop} onPress={onRequestClose ?? onConfirm}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconWrap, { backgroundColor: `${TONE_COLOR[tone]}22` }]}>
            <Ionicons name={TONE_ICON[tone]} size={28} color={TONE_COLOR[tone]} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Button title={confirmLabel} onPress={onConfirm} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FFFFFF1A',
    gap: Spacing.md,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
});
