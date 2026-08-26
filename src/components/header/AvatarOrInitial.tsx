import { avatarFor } from "../../helpers";
import OptimizedImage from "../ui/OptimizedImage";

interface AvatarOrInitialProps {
  profile?: { avatar?: string } | null;
  fallbackName: string;
  priority?: boolean;
}

// avatar yedeği
export default function AvatarOrInitial({
  profile,
  fallbackName,
  priority = false,
}: AvatarOrInitialProps) {
  if (profile?.avatar) {
    return <OptimizedImage src={avatarFor(profile)} alt="" priority={priority} />;
  }
  return <>{fallbackName.charAt(0).toUpperCase()}</>;
}
