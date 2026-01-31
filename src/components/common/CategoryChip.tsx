import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CategoryChipProps {
  name: string;
  icon: string;
  color: string;
  onPress?: () => void;
  selected?: boolean;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  name,
  icon,
  color,
  onPress,
  selected = false,
}) => {
  return (
    <Chip
      icon={() => (
        <MaterialCommunityIcons
          name={icon as any}
          size={16}
          color={selected ? '#fff' : color}
        />
      )}
      onPress={onPress}
      selected={selected}
      style={[
        styles.chip,
        selected && { backgroundColor: color },
      ]}
      textStyle={selected ? styles.selectedText : undefined}
    >
      {name}
    </Chip>
  );
};

const styles = StyleSheet.create({
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  selectedText: {
    color: '#fff',
  },
});
