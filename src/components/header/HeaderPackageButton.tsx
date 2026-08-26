import { Button, Stack } from "rsuite";
import { MotionIcon } from "../ui/MotionIcon";

export default function HeaderPackageButton({
  onClick,
  block = false,
}: {
  onClick: () => void;
  block?: boolean;
}) {
  return (
    <Button
      appearance="primary"
      className="paket-btn"
      onClick={onClick}
      block={block}
    >
      <Stack spacing={8}>
        <span>Paket Al</span>
        <MotionIcon
          name="Crown"
          size={18}
          trigger="hover"
          animation="pop"
        />
      </Stack>
    </Button>
  );
}
