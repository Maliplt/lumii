import { avatarFor } from "../../helpers";

interface AvatarOrInitialProps {
  profile?: { avatar?: string } | null;
  fallbackName: string;
}

// avatar fallback
export default function AvatarOrInitial({ profile, fallbackName }: AvatarOrInitialProps) {
  if (profile?.avatar) return <img src={avatarFor(profile)} alt="" />;
  return <>{fallbackName.charAt(0).toUpperCase()}</>;
}
