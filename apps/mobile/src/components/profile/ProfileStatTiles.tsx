import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme';

type Tile = { value: string | number; label: string };

type Props = {
  tiles: Tile[];
};

export function ProfileStatTiles({ tiles }: Props) {
  return (
    <View style={styles.row}>
      {tiles.map((tile) => (
        <View key={tile.label} style={styles.tile}>
          <Text style={styles.value}>{tile.value}</Text>
          <Text style={styles.label}>{tile.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  label: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
