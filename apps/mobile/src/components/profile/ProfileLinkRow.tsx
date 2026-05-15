import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Colors } from '../../theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IoniconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

export function ProfileLinkRow({ icon, title, subtitle, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <Ionicons name={icon} size={22} color={Colors.accentHighlight} />
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 10,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
