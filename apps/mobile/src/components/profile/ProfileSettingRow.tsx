import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Colors } from '../../theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IoniconName;
  label: string;
  value?: string;
  onPress?: () => void;
};

export function ProfileSettingRow({ icon, label, value, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={Colors.accentPrimary} />
      </View>
      <Text style={styles.label}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#B73CEF26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  value: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
});
