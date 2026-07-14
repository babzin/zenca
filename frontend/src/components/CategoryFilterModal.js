import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getSelectedCategories, setSelectedCategories } from '../services/categoryFilter';

const CATEGORIES = [
  { id: 'kidnapping', label: 'Kidnapping' },
  { id: 'banditry', label: 'Banditry' },
  { id: 'terrorism', label: 'Terrorism' },
  { id: 'accident', label: 'Accident' },
  { id: 'other', label: 'Other' },
];

export const CategoryFilterModal = ({ visible, onClose, onApply }) => {
  const { theme } = useTheme();
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (visible) {
      const load = async () => {
        const saved = await getSelectedCategories();
        setSelected(saved);
      };
      load();
    }
  }, [visible]);

  const toggleCategory = (categoryId) => {
    setSelected((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleApply = async () => {
    await setSelectedCategories(selected);
    if (onApply) onApply(selected);
    onClose();
  };

  const handleReset = async () => {
    const all = CATEGORIES.map((c) => c.id);
    setSelected(all);
    await setSelectedCategories(all);
    if (onApply) onApply(all);
    onClose();
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    container: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 340,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    categoryLabel: {
      fontSize: 16,
      color: theme.text,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.primary,
    },
    checkboxInner: {
      width: 12,
      height: 12,
      borderRadius: 3,
      backgroundColor: '#fff',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    applyButton: {
      backgroundColor: theme.primary,
    },
    resetButton: {
      backgroundColor: theme.inputBackground,
    },
    cancelButton: {
      backgroundColor: theme.inputBackground,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    applyButtonText: {
      color: '#fff',
    },
    resetButtonText: {
      color: theme.text,
    },
    cancelButtonText: {
      color: theme.text,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Filter Alerts</Text>
          <ScrollView>
            {CATEGORIES.map((category) => {
              const isSelected = selected.includes(category.id);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => toggleCategory(category.id)}
                >
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                    {isSelected && <View style={styles.checkboxInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Show All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.applyButton]} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};