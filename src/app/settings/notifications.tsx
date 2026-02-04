import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { List, Switch, Text, FAB, Portal, Modal, TextInput, Button, Divider, IconButton } from 'react-native-paper';
import { useThemeColors } from '../../constants';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { NotificationTier } from '../../store/useSettingsStore';

export default function NotificationsSettingsScreen() {
  const colors = useThemeColors();
  const {
    notificationTiers,
    updateNotificationTier,
    addNotificationTier,
    removeNotificationTier,
  } = useSettingsStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTier, setEditingTier] = useState<NotificationTier | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formAmount, setFormAmount] = useState('');

  const openAddModal = () => {
    setFormLabel('');
    setFormAmount('');
    setEditingTier(null);
    setShowAddModal(true);
  };

  const openEditModal = (tier: NotificationTier) => {
    setFormLabel(tier.label);
    setFormAmount(tier.minAmount.toString());
    setEditingTier(tier);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formLabel.trim() || !formAmount.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (editingTier) {
      await updateNotificationTier(editingTier.id, {
        label: formLabel.trim(),
        minAmount: amount,
      });
    } else {
      const id = `tier_${Date.now()}`;
      await addNotificationTier({
        id,
        label: formLabel.trim(),
        minAmount: amount,
        enabled: true,
        sound: true,
      });
    }

    setShowAddModal(false);
  };

  const handleDelete = (tier: NotificationTier) => {
    Alert.alert(
      'Remove Tier',
      `Remove "${tier.label}" notification tier?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeNotificationTier(tier.id),
        },
      ]
    );
  };

  const sortedTiers = [...notificationTiers].sort((a, b) => a.minAmount - b.minAmount);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <List.Section>
          <List.Subheader>Amount-Based Alerts</List.Subheader>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Get notified when a transaction exceeds these amounts.
          </Text>

          {sortedTiers.map((tier) => (
            <List.Item
              key={tier.id}
              title={tier.label}
              description={`Transactions above ₹${tier.minAmount.toLocaleString('en-IN')}`}
              left={(props) => <List.Icon {...props} icon="bell-ring" />}
              right={() => (
                <View style={styles.tierActions}>
                  <Switch
                    value={tier.enabled}
                    onValueChange={(enabled) => updateNotificationTier(tier.id, { enabled })}
                  />
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => openEditModal(tier)}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor={colors.error}
                    onPress={() => handleDelete(tier)}
                  />
                </View>
              )}
              onPress={() => openEditModal(tier)}
            />
          ))}

          {sortedTiers.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No notification tiers configured. Tap + to add one.
            </Text>
          )}
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Sound Settings</List.Subheader>
          {sortedTiers.map((tier) => (
            <List.Item
              key={tier.id}
              title={`${tier.label} sound`}
              description={tier.sound ? 'On' : 'Off'}
              left={(props) => <List.Icon {...props} icon="volume-high" />}
              right={() => (
                <Switch
                  value={tier.sound}
                  onValueChange={(sound) => updateNotificationTier(tier.id, { sound })}
                />
              )}
            />
          ))}
        </List.Section>
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={openAddModal}
        color={colors.background}
      />

      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {editingTier ? 'Edit Tier' : 'Add Notification Tier'}
          </Text>

          <TextInput
            mode="outlined"
            label="Label"
            value={formLabel}
            onChangeText={setFormLabel}
            placeholder="e.g., High Value"
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Minimum Amount"
            value={formAmount}
            onChangeText={setFormAmount}
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="₹" />}
            style={styles.input}
          />

          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setShowAddModal(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} style={styles.modalButton}>
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 14,
  },
  tierActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    padding: 24,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalButton: {
    marginLeft: 8,
  },
});
