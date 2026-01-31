import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import {
  Text,
  Surface,
  FAB,
  Portal,
  Modal,
  TextInput,
  Button,
  SegmentedButtons,
  List,
  Switch,
} from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { getDatabase, generateId, IgnoreRuleRow } from '../../services/database';
import type { IgnoreRuleType } from '../../types';
import { EmptyState, LoadingScreen } from '../../components/common';

export default function IgnoreRulesScreen() {
  const [rules, setRules] = useState<IgnoreRuleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<IgnoreRuleRow | null>(null);
  const [ruleType, setRuleType] = useState<IgnoreRuleType>('sender');
  const [pattern, setPattern] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadRules = async () => {
    try {
      const db = getDatabase();
      const fetchedRules = db.getAllSync<IgnoreRuleRow>(
        'SELECT * FROM ignore_rules ORDER BY created_at DESC'
      );
      setRules(fetchedRules);
    } catch (error) {
      console.error('Failed to load ignore rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRules();
    }, [])
  );

  const resetForm = () => {
    setRuleType('sender');
    setPattern('');
    setSelectedRule(null);
  };

  const validatePattern = (): boolean => {
    if (!pattern.trim()) {
      Alert.alert('Error', 'Please enter a pattern');
      return false;
    }

    if (ruleType === 'regex') {
      try {
        new RegExp(pattern);
      } catch (e) {
        Alert.alert('Error', 'Invalid regex pattern');
        return false;
      }
    }

    return true;
  };

  const handleAddRule = async () => {
    if (!validatePattern()) return;

    setIsSaving(true);
    try {
      const db = getDatabase();
      const now = Date.now();
      const id = generateId();

      db.runSync(
        'INSERT INTO ignore_rules (id, type, pattern, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, ruleType, pattern.trim(), 1, now, now]
      );

      setShowAddModal(false);
      resetForm();
      await loadRules();
    } catch (error) {
      console.error('Failed to add rule:', error);
      Alert.alert('Error', 'Failed to add rule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRule = (rule: IgnoreRuleRow) => {
    setSelectedRule(rule);
    setRuleType(rule.type as IgnoreRuleType);
    setPattern(rule.pattern);
    setShowEditModal(true);
  };

  const handleUpdateRule = async () => {
    if (!selectedRule || !validatePattern()) return;

    setIsSaving(true);
    try {
      const db = getDatabase();
      const now = Date.now();

      db.runSync(
        'UPDATE ignore_rules SET type = ?, pattern = ?, updated_at = ? WHERE id = ?',
        [ruleType, pattern.trim(), now, selectedRule.id]
      );

      setShowEditModal(false);
      resetForm();
      await loadRules();
    } catch (error) {
      console.error('Failed to update rule:', error);
      Alert.alert('Error', 'Failed to update rule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRule = async (rule: IgnoreRuleRow) => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const newActive = rule.is_active === 1 ? 0 : 1;

      db.runSync(
        'UPDATE ignore_rules SET is_active = ?, updated_at = ? WHERE id = ?',
        [newActive, now, rule.id]
      );

      await loadRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDeleteRule = async () => {
    if (!selectedRule) return;

    Alert.alert(
      'Delete Rule',
      'Are you sure you want to delete this ignore rule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              const db = getDatabase();
              db.runSync('DELETE FROM ignore_rules WHERE id = ?', [selectedRule.id]);
              setShowEditModal(false);
              resetForm();
              await loadRules();
            } catch (error) {
              console.error('Failed to delete rule:', error);
              Alert.alert('Error', 'Failed to delete rule');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const getRuleIcon = (type: IgnoreRuleType) => {
    switch (type) {
      case 'sender':
        return 'account';
      case 'keyword':
        return 'text-search';
      case 'regex':
        return 'regex';
    }
  };

  const getRuleDescription = (type: IgnoreRuleType) => {
    switch (type) {
      case 'sender':
        return 'Match by sender ID';
      case 'keyword':
        return 'Match if SMS contains keyword';
      case 'regex':
        return 'Match using regex pattern';
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      {rules.length === 0 ? (
        <EmptyState
          icon="filter-off"
          title="No ignore rules"
          message="Add rules to automatically skip unwanted SMS like OTPs and promotional messages"
          actionLabel="Add Rule"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <ScrollView style={styles.scrollView}>
          <Text style={styles.description}>
            SMS matching these rules will be ignored during sync
          </Text>

          {rules.map((rule) => (
            <Surface key={rule.id} style={styles.ruleCard} elevation={1}>
              <List.Item
                title={rule.pattern}
                description={getRuleDescription(rule.type as IgnoreRuleType)}
                onPress={() => handleEditRule(rule)}
                left={() => (
                  <View
                    style={[
                      styles.ruleIcon,
                      { opacity: rule.is_active === 1 ? 1 : 0.5 },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getRuleIcon(rule.type as IgnoreRuleType)}
                      size={24}
                      color={Colors.primary}
                    />
                  </View>
                )}
                right={() => (
                  <Switch
                    value={rule.is_active === 1}
                    onValueChange={() => handleToggleRule(rule)}
                  />
                )}
                titleStyle={[
                  styles.ruleTitle,
                  rule.is_active !== 1 && styles.inactiveText,
                ]}
                descriptionStyle={rule.is_active !== 1 ? styles.inactiveText : undefined}
              />
            </Surface>
          ))}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        color="#fff"
      />

      {/* Add/Edit Modal */}
      <Portal>
        <Modal
          visible={showAddModal || showEditModal}
          onDismiss={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            resetForm();
          }}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>
            {showEditModal ? 'Edit Rule' : 'Add Ignore Rule'}
          </Text>

          <Text style={styles.label}>Rule Type</Text>
          <SegmentedButtons
            value={ruleType}
            onValueChange={(value) => setRuleType(value as IgnoreRuleType)}
            buttons={[
              { value: 'sender', label: 'Sender' },
              { value: 'keyword', label: 'Keyword' },
              { value: 'regex', label: 'Regex' },
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            mode="outlined"
            label={
              ruleType === 'sender'
                ? 'Sender ID (e.g., AD-PROMO)'
                : ruleType === 'keyword'
                ? 'Keyword (e.g., OTP)'
                : 'Regex Pattern'
            }
            value={pattern}
            onChangeText={setPattern}
            style={styles.input}
            autoCapitalize="none"
          />

          <Text style={styles.hint}>
            {ruleType === 'sender'
              ? 'Enter the sender ID to ignore (case insensitive)'
              : ruleType === 'keyword'
              ? 'SMS containing this keyword will be ignored'
              : 'Enter a valid JavaScript regex pattern'}
          </Text>

          <View style={styles.modalActions}>
            {showEditModal && (
              <Button
                mode="outlined"
                onPress={handleDeleteRule}
                textColor={Colors.error}
                loading={isSaving}
              >
                Delete
              </Button>
            )}
            <View style={styles.actionSpacer} />
            <Button
              mode="outlined"
              onPress={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={showEditModal ? handleUpdateRule : handleAddRule}
              loading={isSaving}
              disabled={!pattern.trim() || isSaving}
              style={styles.saveButton}
            >
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
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  ruleCard: {
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginBottom: 8,
    overflow: 'hidden',
  },
  ruleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginLeft: 8,
  },
  ruleTitle: {
    fontFamily: 'monospace',
  },
  inactiveText: {
    opacity: 0.5,
  },
  bottomSpacer: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: Colors.primary,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
    backgroundColor: Colors.surface,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionSpacer: {
    flex: 1,
  },
  saveButton: {
    marginLeft: 8,
  },
});
