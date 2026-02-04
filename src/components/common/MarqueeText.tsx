import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TextStyle, StyleProp, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

interface MarqueeTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  speed?: number;
  delay?: number;
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({
  children,
  style,
  speed = 30,
  delay = 1500,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const translateX = useSharedValue(0);

  const overflow = textWidth > containerWidth ? textWidth - containerWidth : 0;

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const onTextLayout = useCallback((e: LayoutChangeEvent) => {
    setTextWidth(e.nativeEvent.layout.width);
  }, []);

  useEffect(() => {
    if (overflow > 0) {
      const duration = (overflow / speed) * 1000;
      translateX.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(-overflow, { duration, easing: Easing.linear }),
            withDelay(delay, withTiming(0, { duration: 0 }))
          ),
          -1
        )
      );
    } else {
      cancelAnimation(translateX);
      translateX.value = 0;
    }

    return () => {
      cancelAnimation(translateX);
    };
  }, [overflow, speed, delay, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View onLayout={onContainerLayout} style={styles.container}>
      <Animated.View style={animatedStyle}>
        <Text
          style={style}
          onLayout={onTextLayout}
          numberOfLines={1}
          ellipsizeMode={overflow > 0 ? undefined : 'tail'}
        >
          {children}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
