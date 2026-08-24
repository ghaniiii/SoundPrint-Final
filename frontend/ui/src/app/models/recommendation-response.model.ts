import { Track } from './track.model';
import { FrequencyProfile } from './frequency-profile.model';

export interface SimilarTrack extends Track {
  // Backwards-compatible: legacy `matchScore` may be present.
  matchScore?: number; // 0..1, we'll show as % (deprecated)

  // New metrics computed by backend
  matchScore_cosine?: number; // cosine similarity (0..1)
  euclidean?: number; // Euclidean distance (lower = closer)
  pearson?: number; // Pearson correlation (-1..1)
}

export interface AnalyzeTrackResponse {
  track: Track;
  frequencyProfile: FrequencyProfile;
  similarTracks: SimilarTrack[];
}
