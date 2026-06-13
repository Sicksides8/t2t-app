import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '../../theme';
import { getLinkHostLabel, openExternalLink } from '../../utils/openExternalLink';

type Kind = 'link' | 'pdf';

type Props = {
  url: string;
  label?: string;
  kind?: Kind;
  onPress?: () => void;
};

export function LessonLinkRow({ url, label, kind = 'link', onPress }: Props) {
  const displayLabel = (label?.trim() || getLinkHostLabel(url)).slice(0, 80);
  const isPdf = kind === 'pdf';

  const handlePress = () => {
    if (onPress) onPress();
    else void openExternalLink(url);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel={`Abrir ${displayLabel}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, isPdf && styles.iconWrapPdf]}>
        <Ionicons
          name={isPdf ? 'document-text-outline' : 'link-outline'}
          size={18}
          color={isPdf ? Colors.accentHighlight : Colors.accentPrimary}
        />
      </View>

      <View style={styles.textCol}>
        <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
          {displayLabel}
        </Text>
        <Text style={styles.url} numberOfLines={1} ellipsizeMode="middle">
          {url}
        </Text>
      </View>

      <Ionicons name="open-outline" size={18} color={Colors.textTertiary} />
    </Pressable>
  );
}

type ChipProps = {
  url: string;
  label?: string;
  onPress?: () => void;
};

export function LessonLinkChip({ url, label, onPress }: ChipProps) {
  const displayLabel = (label?.trim() || getLinkHostLabel(url)).slice(0, 16);

  const handlePress = () => {
    if (onPress) onPress();
    else void openExternalLink(url);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel={`Abrir ${displayLabel}`}
      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
    >
      <Ionicons name="link-outline" size={13} color={Colors.accentPrimary} />
      <Text style={styles.chipText} numberOfLines={1} ellipsizeMode="tail">
        {displayLabel}
      </Text>
    </Pressable>
  );
}

type MoreChipProps = {
  count: number;
  onPress: () => void;
};

export function LessonLinkMoreChip({ count, onPress }: MoreChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver ${count} recursos más`}
      style={({ pressed }) => [styles.chip, styles.chipMore, pressed && styles.chipPressed]}
    >
      <Text style={[styles.chipText, styles.chipTextMore]}>+ {count} más</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.card,
    backgroundColor: '#1F0A40CC',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B73CEF22',
  },
  iconWrapPdf: {
    backgroundColor: '#4CC35B22',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  url: {
    color: Colors.textTertiary,
    fontSize: 11,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#B73CEF1F',
    borderWidth: 1,
    borderColor: '#B73CEF33',
    maxWidth: 160,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipMore: {
    backgroundColor: '#FFFFFF14',
    borderColor: '#FFFFFF26',
  },
  chipText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextMore: {
    color: Colors.textSecondary,
  },
});
