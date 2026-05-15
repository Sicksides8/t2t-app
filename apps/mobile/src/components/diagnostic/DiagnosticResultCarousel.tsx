import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { DiagnosticResultPanel } from '../DiagnosticResultPanel';
import type { DiagnosticResult } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import { DiagnosticOrbs } from './DiagnosticOrbs';
import { DiagnosticRadarView } from './DiagnosticRadarView';

type Page = { key: 'profile' | 'radar' };

const PAGES: Page[] = [{ key: 'profile' }, { key: 'radar' }];

type Props = {
  diagnostic: DiagnosticResult;
  title?: string;
  subtitle?: string;
};

export function DiagnosticResultCarousel({ diagnostic, title, subtitle }: Props) {
  const [page, setPage] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const listRef = useRef<FlatList<Page>>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth <= 0) return;
    const idx = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    const clamped = Math.max(0, Math.min(idx, PAGES.length - 1));
    if (clamped !== page) setPage(clamped);
  };

  const getItemLayout = useCallback(
    (_: ArrayLike<Page> | null | undefined, index: number) => ({
      length: pageWidth,
      offset: pageWidth * index,
      index,
    }),
    [pageWidth],
  );

  const renderItem: ListRenderItem<Page> = ({ item }) => (
    <View style={[styles.page, pageWidth > 0 && { width: pageWidth }]}>
      {item.key === 'profile' ? (
        <DiagnosticResultPanel diagnostic={diagnostic} embedded />
      ) : (
        <DiagnosticRadarView diagnostic={diagnostic} />
      )}
    </View>
  );

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - pageWidth) > 1) setPageWidth(w);
      }}
    >
      <DiagnosticOrbs />
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.tabs}>
        <Text
          style={[styles.tab, page === 0 && styles.tabActive]}
          onPress={() => listRef.current?.scrollToIndex({ index: 0, animated: true })}
        >
          Tu perfil
        </Text>
        <Text
          style={[styles.tab, page === 1 && styles.tabActive]}
          onPress={() => listRef.current?.scrollToIndex({ index: 1, animated: true })}
        >
          Tu radar
        </Text>
      </View>

      {pageWidth > 0 ? (
        <FlatList
          ref={listRef}
          data={PAGES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          onScroll={onScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          getItemLayout={getItemLayout}
          overScrollMode="never"
          bounces={false}
        />
      ) : null}

      <View style={styles.dots}>
        {PAGES.map((p, i) => (
          <View key={p.key} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    marginHorizontal: -Spacing.xl,
    overflow: 'hidden',
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  tab: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  tabActive: {
    color: Colors.accentPrimary,
  },
  page: {
    overflow: 'hidden',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.divider,
  },
  dotActive: {
    backgroundColor: Colors.accentPrimary,
    width: 20,
  },
});
