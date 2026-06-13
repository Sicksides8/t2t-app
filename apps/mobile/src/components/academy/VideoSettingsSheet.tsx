import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme';

export type VideoSettingsOption = {
  id: string;
  label: string;
  sublabel?: string;
};

type Props = {
  visible: boolean;
  title: string;
  options: VideoSettingsOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  /** Mensaje a mostrar si `options` está vacío. */
  emptyLabel?: string;
};

/**
 * Bottom sheet reusable para selectores del reproductor (subtítulos,
 * velocidad, etc). Mantiene el mismo lenguaje visual que el sheet de
 * "Módulos del curso" del VideoPlayerScreen.
 */
export function VideoSettingsSheet({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
  emptyLabel,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 20 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {options.length === 0 ? (
            <Text style={styles.emptyText}>{emptyLabel || 'No hay opciones disponibles.'}</Text>
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const selected = option.id === selectedId;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.row, selected && styles.rowActive]}
                    onPress={() => onSelect(option.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <View style={styles.rowText}>
                      <Text style={styles.rowLabel} numberOfLines={1}>
                        {option.label}
                      </Text>
                      {option.sublabel ? (
                        <Text style={styles.rowSublabel} numberOfLines={1}>
                          {option.sublabel}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={selected ? Colors.accentHighlight : Colors.textTertiary}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    paddingHorizontal: 20,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#FFFFFF33',
    marginBottom: 6,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  scroll: {
    maxHeight: 360,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#1F0A40',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
  },
  rowActive: {
    borderColor: Colors.accentPrimary,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  rowSublabel: {
    color: Colors.textTertiary,
    fontSize: 12.5,
    marginTop: 2,
  },
  emptyText: {
    color: Colors.textTertiary,
    fontSize: 14,
    paddingVertical: 16,
    textAlign: 'center',
  },
});
