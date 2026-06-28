import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Anime } from '../services/jikanApi';
import Colors from '../constants/Colors';
import { useColorScheme } from './useColorScheme';

interface AnimeGridItemProps {
  anime: Anime;
  fullWidth?: boolean;
}

export default function AnimeGridItem(props: AnimeGridItemProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const anime = props?.anime;
  if (!anime) return null;

  const imageUrl = anime.images?.webp?.image_url || anime.images?.jpg?.image_url || '';
  const score = typeof anime.score === 'number' ? anime.score.toFixed(1) : 'N/A';

  return (
    <Pressable 
      onPress={() => anime.mal_id && router.push(`/anime/${anime.mal_id}` as any)}
      style={[styles.container, props.fullWidth && styles.fullWidthContainer]}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, { backgroundColor: colors.border }]} />
        )}
        
        {/* Overlay Score Badge */}
        <View style={[styles.badge, { backgroundColor: colors.card }]}>
          <Ionicons name="star" size={10} color={colors.rating} style={styles.star} />
          <Text style={[styles.badgeText, { color: colors.text }]}>{score}</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {anime.title || 'Unknown Title'}
      </Text>
      
      <View style={styles.metaRow}>
        <Text style={[styles.typeText, { color: colors.primary }]}>
          {anime.type || 'TV'}
        </Text>
        {anime.episodes && (
          <Text style={[styles.epsText, { color: colors.mutedText }]}>
            • {anime.episodes} eps
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '47%',
    marginBottom: 16,
  },
  fullWidthContainer: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 11 / 16,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EAECEF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  star: {
    marginRight: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  epsText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
  },
});
