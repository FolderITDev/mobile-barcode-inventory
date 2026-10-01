import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { haptics } from '@/lib/haptics';
import { createStyles, motion, radius, space } from '@/theme';
import { Text } from './text';

export interface Segment<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface Props<T extends string> {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

const INSET = 3;

/**
 * Equal-width segments with a sliding indicator. The indicator is absolutely
 * positioned and childless, so its transform transition never re-lays-out text.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  accessibilityLabel,
}: Props<T>) {
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    segments.findIndex((segment) => segment.value === value),
  );
  const segmentWidth = (width - INSET * 2) / segments.length;
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={styles.track}
    >
      {width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: segmentWidth,
              transform: [{ translateX: index * segmentWidth }],
              transitionProperty: 'transform',
              transitionDuration: reduceMotion ? 0 : motion.duration.base,
              transitionTimingFunction: motion.css.easeInOut,
            },
          ]}
        />
      )}
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={
              segment.count === undefined
                ? segment.label
                : `${segment.label}, ${segment.count}`
            }
            onPress={() => {
              if (selected) return;
              haptics.selection();
              onChange(segment.value);
            }}
            style={styles.segment}
          >
            <Text variant="label" tone={selected ? 'ink' : 'muted'}>
              {segment.label}
            </Text>
            {segment.count !== undefined && (
              <Text
                variant="eyebrow"
                tone={selected ? 'accent' : 'tertiary'}
                tabular
              >
                {segment.count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles(({ colors, scheme }) => ({
  track: {
    flexDirection: 'row',
    padding: INSET,
    borderRadius: radius.md + INSET,
    backgroundColor: colors.fill,
  },
  indicator: {
    position: 'absolute',
    top: INSET,
    bottom: INSET,
    left: INSET,
    borderRadius: radius.md,
    backgroundColor: colors.raised,
    boxShadow:
      scheme === 'dark'
        ? '0 0 0 1px rgba(255, 255, 255, 0.08)'
        : '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  segment: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingHorizontal: space.sm,
  },
}));
