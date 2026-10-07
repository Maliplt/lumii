export interface ProfilePreferences {
  autoplay: boolean;
  previews: boolean;
  showContinueWatching: boolean;
  emailNotifications: boolean;
  realDebridApiKey?: string;
  preferredStreamProvider?: "auto" | "torrentio" | "vidfast";
}

export const DEFAULT_PROFILE_PREFERENCES: Readonly<ProfilePreferences> = {
  autoplay: true,
  previews: true,
  showContinueWatching: true,
  emailNotifications: true,
};
