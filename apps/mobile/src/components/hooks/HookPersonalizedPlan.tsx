import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography } from '../../theme';
import type { HookPersonalizedPack, HookRouteItem } from '../../data/hooksFlow';

type Props = {
  coachName: string;
  coachInitials: string;
  scriptLine: string;
  bodyLine: string;
  packsTitle: string;
  packs: HookPersonalizedPack[];
  routeTitle: string;
  route: HookRouteItem[];
};

const PACK_GRADIENTS: Record<HookPersonalizedPack['variant'], readonly [string, string]> = {
  lider: ['#6E1AAE', '#C040EE'] as const,
  startup: ['#0E5A52', '#34D6C2'] as const,
  productividad: ['#FFB547', '#FF7A1A'] as const,
};

const ROUTE_COLORS: Record<HookRouteItem['variant'], string> = {
  green: Colors.accentHighlight,
  magenta: Colors.accentPrimary,
  teal: Colors.accentTeal,
};

export function HookPersonalizedPlan({
  coachName,
  coachInitials,
  scriptLine,
  bodyLine,
  packsTitle,
  packs,
  routeTitle,
  route,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.coachBanner}>
        <LinearGradient
          colors={['#B73CEF', '#34D6C2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{coachInitials}</Text>
        </LinearGradient>
        <View style={styles.coachCol}>
          <Text style={styles.coachScript}>{scriptLine}</Text>
          <Text style={styles.coachBody} numberOfLines={2}>
            {bodyLine}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{packsTitle}</Text>
      <View style={styles.packsRow}>
        {packs.map((pack) => (
          <LinearGradient
            key={pack.id}
            colors={PACK_GRADIENTS[pack.variant]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.packCard}
          >
            <Ionicons name={pack.icon} size={28} color={Colors.textPrimary} />
            <Text style={styles.packTitle} numberOfLines={2}>
              {pack.title}
            </Text>
            <Text style={styles.packDays}>{pack.daysLabel}</Text>
          </LinearGradient>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{routeTitle}</Text>
      <View style={styles.timeline}>
        {route.map((item) => {
          const color = ROUTE_COLORS[item.variant];
          const isSolid = item.solid === true;
          return (
            <View key={item.id} style={styles.timelineRow}>
              <View
                style={[
                  styles.routeCircle,
                  isSolid
                    ? { backgroundColor: color }
                    : { borderWidth: 2, borderColor: color, backgroundColor: 'transparent' },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={isSolid ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>
              <View style={styles.timelineBody}>
                <Text style={[styles.dayLabel, { color }]}>DÍA {item.day}</Text>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemCaption}>{item.caption}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 18,
  },
  coachBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1F0A40CC',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    borderRadius: 18,
    padding: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textPrimary,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  coachCol: {
    flex: 1,
  },
  coachScript: {
    fontFamily: 'DreamingOutloud',
    color: Colors.accentHighlight,
    fontSize: 20,
  },
  coachBody: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  packsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  packCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    gap: 10,
    minHeight: 120,
  },
  packTitle: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 18,
  },
  packDays: {
    color: '#FFFFFFCC',
    fontSize: 11,
    fontWeight: '600',
  },
  timeline: {
    gap: 18,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  routeCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineBody: {
    flex: 1,
    gap: 2,
  },
  dayLabel: {
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1,
  },
  itemTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  itemCaption: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
});
