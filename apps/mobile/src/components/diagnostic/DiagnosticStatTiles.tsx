import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme';

type TileProps = {
  count: number;
  label: string;
  valueColor: string;
  bg: string;
  border: string;
};

function Tile({ count, label, valueColor, bg, border }: TileProps) {
  return (
    <View style={[styles.tile, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.count, { color: valueColor }]}>{count}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

type Props = {
  strengths: number;
  developing: number;
  train: number;
};

export function DiagnosticStatTiles({ strengths, developing, train }: Props) {
  return (
    <View style={styles.row}>
      <Tile
        count={strengths}
        label="Fortalezas"
        valueColor={Colors.accentHighlight}
        bg="#4CC35B26"
        border="#4CC35B59"
      />
      <Tile
        count={developing}
        label="En desarrollo"
        valueColor={Colors.accentPrimary}
        bg="#B73CEF26"
        border="#B73CEF59"
      />
      <Tile
        count={train}
        label="A entrenar"
        valueColor={Colors.warning}
        bg="#FFB54726"
        border="#FFB54759"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tile: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  count: {
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
