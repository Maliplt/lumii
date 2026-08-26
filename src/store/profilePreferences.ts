export interface ProfilePreferences {
  autoplay: boolean;
  previews: boolean;
  showContinueWatching: boolean;
  emailNotifications: boolean;
}

export const DEFAULT_PROFILE_PREFERENCES: Readonly<ProfilePreferences> = {
  autoplay: true,
  previews: true,
  showContinueWatching: true,
  emailNotifications: true,
};
