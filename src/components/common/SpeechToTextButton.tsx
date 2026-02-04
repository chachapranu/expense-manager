import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { IconButton } from 'react-native-paper';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useThemeColors } from '../../constants';

interface SpeechToTextButtonProps {
  onResult: (text: string) => void;
  size?: number;
}

export const SpeechToTextButton: React.FC<SpeechToTextButtonProps> = ({
  onResult,
  size = 24,
}) => {
  const colors = useThemeColors();
  const [isListening, setIsListening] = useState(false);
  const pulseScale = useSharedValue(1);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript && event.isFinal) {
      onResult(transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error);
    setIsListening(false);
  });

  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withTiming(1.3, { duration: 600 }),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = 1;
    }
  }, [isListening, pulseScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const toggleListening = useCallback(async () => {
    try {
      if (isListening) {
        ExpoSpeechRecognitionModule.stop();
        setIsListening(false);
        return;
      }

      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Microphone permission is needed for speech recognition'
        );
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang: 'en-IN',
        interimResults: false,
      });
      setIsListening(true);
    } catch (error) {
      console.error('Voice error:', error);
      setIsListening(false);
      Alert.alert('Error', 'Failed to start speech recognition');
    }
  }, [isListening]);

  return (
    <Animated.View style={animatedStyle}>
      <IconButton
        icon={isListening ? 'microphone' : 'microphone-outline'}
        size={size}
        iconColor={isListening ? colors.error : colors.textSecondary}
        onPress={toggleListening}
        style={isListening ? styles.listening : undefined}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  listening: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    borderRadius: 20,
  },
});
