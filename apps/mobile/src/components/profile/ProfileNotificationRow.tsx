import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme';

type Props = {
  title: string;
  body: string;
  unread?: boolean;
};

export function ProfileNotificationRow({ title, body, unread }: Props) {
  return (
    <Pressable style={[styles.row, unread && styles.unread]}>
      {unread ? <View style={styles.dot} /> : null}
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.bodyText} numberOfLines={2}>
          {body}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 10,
  },
  unread: {
    borderColor: '#B73CEF66',
    backgroundColor: '#B73CEF22',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentHighlight,
    marginTop: 6,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
  },
});
