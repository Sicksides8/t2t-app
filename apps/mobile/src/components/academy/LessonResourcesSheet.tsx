import React from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '../../theme';
import type { ModuleLink } from '../../types';
import { LessonLinkRow } from './LessonLinkRow';
import { openExternalLink } from '../../utils/openExternalLink';

const SCREEN_H = Dimensions.get('window').height;

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  links?: ModuleLink[];
  pdfUrl?: string;
};

export function LessonResourcesSheet({
  visible,
  onClose,
  title = 'Recursos del módulo',
  links,
  pdfUrl,
}: Props) {
  const insets = useSafeAreaInsets();
  const safeLinks = Array.isArray(links) ? links : [];
  const count = safeLinks.length + (pdfUrl ? 1 : 0);

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

          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            {count > 0 ? (
              <View style={styles.countPill}>
                <Text style={styles.countText}>{count}</Text>
              </View>
            ) : null}
          </View>

          {count === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="attach-outline" size={28} color={Colors.accentPrimary} />
              </View>
              <Text style={styles.emptyTitle}>Sin recursos adjuntos</Text>
              <Text style={styles.emptyBody}>
                Este módulo aún no tiene enlaces o materiales descargables.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {pdfUrl ? (
                <LessonLinkRow
                  url={pdfUrl}
                  label="Material en PDF"
                  kind="pdf"
                  onPress={() => void openExternalLink(pdfUrl)}
                />
              ) : null}

              {safeLinks.map((link, idx) => (
                <LessonLinkRow
                  key={`${link.url}-${idx}`}
                  url={link.url}
                  label={link.label}
                  onPress={() => void openExternalLink(link.url)}
                />
              ))}
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
    backgroundColor: Colors.bgPrimary,
    borderTopLeftRadius: Radius.cardLg,
    borderTopRightRadius: Radius.cardLg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF33',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  countPill: {
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#B73CEF33',
    borderWidth: 1,
    borderColor: '#B73CEF66',
    alignItems: 'center',
  },
  countText: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 12,
  },
  scroll: {
    maxHeight: SCREEN_H * 0.6,
  },
  scrollContent: {
    gap: 8,
    paddingBottom: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 12,
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#B73CEF22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'center',
  },
  emptyBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
});
