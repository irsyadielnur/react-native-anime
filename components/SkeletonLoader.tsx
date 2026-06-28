import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Colors from '../constants/Colors';
import { useColorScheme } from './useColorScheme';

interface SkeletonLoaderProps {
  variant?: 'card' | 'grid' | 'detail' | 'genres';
  count?: number;
}

export default function SkeletonLoader({ variant = 'card', count = 3 }: SkeletonLoaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  const skeletonBg = colorScheme === 'dark' ? '#2C2C2C' : '#EAECEF';

  const renderCard = (key: number) => (
    <View key={key} style={[styles.card, { borderColor: colors.border }]}>
      <Animated.View style={[styles.thumbnailPlaceholder, { backgroundColor: skeletonBg, opacity }]} />
      <View style={styles.cardDetails}>
        <Animated.View style={[styles.titlePlaceholder, { backgroundColor: skeletonBg, opacity }]} />
        <Animated.View style={[styles.subtitlePlaceholder, { backgroundColor: skeletonBg, opacity }]} />
        <View style={styles.metaRow}>
          <Animated.View style={[styles.pillPlaceholder, { backgroundColor: skeletonBg, opacity }]} />
          <Animated.View style={[styles.pillPlaceholder, { backgroundColor: skeletonBg, opacity }]} />
        </View>
      </View>
    </View>
  );

  const renderGrid = (key: number) => (
    <View key={key} style={styles.gridItem}>
      <Animated.View style={[styles.gridImagePlaceholder, { backgroundColor: skeletonBg, opacity }]} />
      <Animated.View style={[styles.gridTextPlaceholder1, { backgroundColor: skeletonBg, opacity }]} />
      <Animated.View style={[styles.gridTextPlaceholder2, { backgroundColor: skeletonBg, opacity }]} />
    </View>
  );

  const renderGenres = () => (
    <View style={styles.genresContainer}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Animated.View key={i} style={[styles.genrePillPlaceholder, { backgroundColor: skeletonBg, opacity }]} />
      ))}
    </View>
  );

  const renderDetail = () => (
    <View style={styles.detailContainer}>
      <Animated.View style={[styles.heroPlaceholder, { backgroundColor: skeletonBg, opacity }]} />
      <View style={styles.detailContent}>
        <Animated.View style={[styles.detailTitle, { backgroundColor: skeletonBg, opacity }]} />
        <Animated.View style={[styles.detailSubtitle, { backgroundColor: skeletonBg, opacity }]} />
        
        <View style={styles.specsRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Animated.View key={i} style={[styles.specItemPlaceholder, { backgroundColor: skeletonBg, opacity }]} />
          ))}
        </View>

        <Animated.View style={[styles.synopsisPlaceholder, { backgroundColor: skeletonBg, opacity }]} />
        <Animated.View style={[styles.synopsisPlaceholder, { backgroundColor: skeletonBg, opacity, width: '80%' }]} />
        <Animated.View style={[styles.synopsisPlaceholder, { backgroundColor: skeletonBg, opacity, width: '90%' }]} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {variant === 'card' && Array.from({ length: count }).map((_, i) => renderCard(i))}
      {variant === 'grid' && (
        <View style={styles.gridContainer}>
          {Array.from({ length: count }).map((_, i) => renderGrid(i))}
        </View>
      )}
      {variant === 'genres' && renderGenres()}
      {variant === 'detail' && renderDetail()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    height: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  thumbnailPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  titlePlaceholder: {
    height: 18,
    width: '75%',
    borderRadius: 4,
  },
  subtitlePlaceholder: {
    height: 12,
    width: '45%',
    borderRadius: 4,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  pillPlaceholder: {
    height: 20,
    width: 60,
    borderRadius: 10,
    marginRight: 6,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  gridItem: {
    width: '47%',
    marginBottom: 16,
  },
  gridImagePlaceholder: {
    aspectRatio: 11 / 16,
    borderRadius: 14,
    width: '100%',
  },
  gridTextPlaceholder1: {
    height: 14,
    width: '80%',
    borderRadius: 4,
    marginTop: 8,
  },
  gridTextPlaceholder2: {
    height: 10,
    width: '50%',
    borderRadius: 4,
    marginTop: 4,
  },
  genresContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  genrePillPlaceholder: {
    height: 32,
    width: 80,
    borderRadius: 16,
    marginRight: 8,
  },
  detailContainer: {
    flex: 1,
  },
  heroPlaceholder: {
    height: 250,
    width: '100%',
  },
  detailContent: {
    padding: 20,
  },
  detailTitle: {
    height: 28,
    width: '80%',
    borderRadius: 6,
    marginBottom: 8,
  },
  detailSubtitle: {
    height: 16,
    width: '50%',
    borderRadius: 4,
    marginBottom: 20,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  specItemPlaceholder: {
    width: '22%',
    height: 60,
    borderRadius: 12,
  },
  synopsisPlaceholder: {
    height: 14,
    borderRadius: 4,
    marginBottom: 10,
  },
});
