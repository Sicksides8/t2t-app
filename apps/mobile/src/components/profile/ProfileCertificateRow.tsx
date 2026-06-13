import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

type Props = {
  title: string;
  subtitle: string;
  onPress: () => void;
  onDownload?: () => void;
  downloading?: boolean;
};

export function ProfileCertificateRow({
  title,
  subtitle,
  onPress,
  onDownload,
  downloading = false,
}: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.thumb}>
        <Ionicons name="ribbon" size={30} color={Colors.accentPrimary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.btnRow}>
          <Pressable
            onPress={onDownload}
            disabled={downloading}
            style={[styles.btn, styles.btnPrimary, downloading && styles.btnDisabled]}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="download-outline" size={14} color="#FFFFFF" />
            )}
            <Text style={styles.btnPrimaryText}>{downloading ? 'Generando…' : 'PDF'}</Text>
          </Pressable>
          <Pressable
            onPress={onDownload}
            disabled={downloading}
            style={[styles.btn, styles.btnGhost, downloading && styles.btnDisabled]}
          >
            <Ionicons name="share-social-outline" size={14} color="#FFFFFF" />
            <Text style={styles.btnGhostText}>Compartir</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#2A1052',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    marginBottom: 12,
    alignItems: 'center',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    height: 36,
  },
  btnPrimary: {
    backgroundColor: Colors.accentPrimary,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  btnGhost: {
    backgroundColor: '#FFFFFF12',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
  },
  btnGhostText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
