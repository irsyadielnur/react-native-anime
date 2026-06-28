import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Colors from '../constants/Colors';
import { useColorScheme } from './useColorScheme';

interface SectionHeaderProps {
  title: string;
  onPressSeeAll?: () => void;
  showSeeAll?: boolean;
}

export default function SectionHeader({ title, onPressSeeAll, showSeeAll = false }: SectionHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {showSeeAll && onPressSeeAll && (
        <Pressable onPress={onPressSeeAll} hitSlop={15}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '700',
  },
});
