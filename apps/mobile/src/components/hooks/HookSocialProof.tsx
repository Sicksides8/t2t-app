import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../../theme';
import type { HookTestimonial } from '../../data/hooksFlow';

type Props = {
  title: string;
  tasks: string[];
  statHeadline: string;
  testimonial: HookTestimonial;
};

export function HookSocialProof({ title, tasks, statHeadline, testimonial }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.tasks}>
        {tasks.map((task) => (
          <View key={task} style={styles.taskRow}>
            <View style={styles.taskHead}>
              <Text style={styles.taskLabel}>{task}</Text>
              <Text style={styles.taskPct}>100%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: '100%' }]} />
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.statHeadline}>{statHeadline}</Text>

      <View style={styles.polaroidShadow}>
        <View style={styles.ribbon} />
        <View style={styles.polaroid}>
          <View style={styles.testimonialRow}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: testimonial.avatarColor || Colors.accentPrimary },
              ]}
            >
              <Text style={styles.avatarText}>{testimonial.initials || '·'}</Text>
            </View>
            <View style={styles.testimonialCol}>
              <Text style={styles.testimonialName}>{testimonial.name}</Text>
              {testimonial.role ? (
                <Text style={styles.testimonialRole}>{testimonial.role}</Text>
              ) : null}
            </View>
          </View>
          <Text style={styles.quote}>"{testimonial.quote}"</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 20,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  tasks: {
    gap: 14,
  },
  taskRow: {
    gap: 8,
  },
  taskHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  taskPct: {
    color: Colors.accentHighlight,
    fontWeight: '700',
    fontSize: 13,
  },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF14',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.accentHighlight,
  },
  statHeadline: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 28,
  },
  polaroidShadow: {
    marginTop: 6,
    alignItems: 'center',
    position: 'relative',
  },
  ribbon: {
    position: 'absolute',
    top: -6,
    left: '30%',
    width: 90,
    height: 14,
    backgroundColor: '#4CC35B99',
    borderRadius: 4,
    transform: [{ rotate: '-1deg' }],
  },
  polaroid: {
    width: '100%',
    backgroundColor: Colors.cream,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    transform: [{ rotate: '-1.5deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  testimonialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 14,
  },
  testimonialCol: {
    flex: 1,
  },
  testimonialName: {
    color: Colors.textOnCream,
    fontWeight: '800',
    fontSize: 15,
  },
  testimonialRole: {
    color: '#666666',
    fontSize: 12,
    marginTop: 2,
  },
  quote: {
    color: '#666666',
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 20,
  },
});
