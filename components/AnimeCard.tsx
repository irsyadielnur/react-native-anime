import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Anime } from '../services/jikanApi';
import Colors from '../constants/Colors';
import { useColorScheme } from './useColorScheme';

interface AnimeCardProps {
  anime: Anime;
}

export default function AnimeCard(props: AnimeCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const anime = props?.anime;
  if (!anime) return null;

  // Get image URL
  const imageUrl = anime.images?.webp?.image_url || anime.images?.jpg?.image_url || '';
  
  // Format score
  const score = typeof anime.score === 'number' ? anime.score.toFixed(1) : 'N/A';
  
  // Genre string limit
  const genreTags = anime.genres?.slice(0, 2).map((g) => g.name) || [];

  return (
    <Pressable 
      onPress={() => anime.mal_id && router.push(`/anime/${anime.mal_id}` as any)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, { backgroundColor: colors.border }]} />
      )}
      
      <View style={styles.content}>
        <View>
          <View style={styles.row}>
            <Text style={[styles.typeText, { color: colors.primary }]}>
              {anime.type || 'TV'}
            </Text>
            {anime.episodes && (
              <Text style={[styles.metaDivider, { color: colors.mutedText }]}>
                • {anime.episodes} eps
              </Text>
            )}
          </View>
          
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {anime.title}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          {/* Score */}
          <View style={styles.scoreBadge}>
            <Ionicons name="star" size={12} color={colors.rating} style={styles.starIcon} />
            <Text style={[styles.scoreText, { color: colors.text }]}>{score}</Text>
          </View>

          {/* Genres */}
          <View style={styles.genreContainer}>
            {genreTags.map((genre, idx) => (
              <View key={idx} style={[styles.genreBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.genreText, { color: colors.mutedText }]} numberOfLines={1}>
                  {genre}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    height: 110,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    marginLeft: 14,
    height: '100%',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaDivider: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 4,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  genreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
    marginLeft: 6,
    maxWidth: 80,
  },
  genreText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
