import { useState, type ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useReducedMotion,
  type CSSTransitionProperties,
} from 'react-native-reanimated';
import { motion } from '@/theme';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  /** Applied to the visual layer that scales. */
  style?: StyleProp<ViewStyle>;
}

const pressTransition: CSSTransitionProperties = {
  transitionProperty: ['transform', 'opacity'],
  transitionDuration: motion.duration.press,
  transitionTimingFunction: motion.css.easeOut,
};

/**
 * Feedback on press-in, commit on release. A 3% scale in 120 ms reads as
 * physical without slowing down something people tap dozens of times a day.
 * With Reduce Motion on, the scale becomes a brief opacity dip.
 */
export function PressableScale({
  children,
  style,
  disabled,
  onPressIn,
  onPressOut,
  hitSlop = 4,
  ...props
}: Props) {
  const [pressed, setPressed] = useState(false);
  const reduceMotion = useReducedMotion();
  const active = pressed && !disabled;
  return (
    <Pressable
      {...props}
      disabled={disabled}
      hitSlop={hitSlop}
      pressRetentionOffset={16}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
    >
      <Animated.View
        style={[
          style,
          pressTransition,
          {
            transform: [
              { scale: active && !reduceMotion ? motion.pressScale : 1 },
            ],
            opacity: active && reduceMotion ? 0.7 : 1,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
