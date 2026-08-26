import tenetLogo from "../../assets/images/tenet-logo.svg";
import OptimizedImage from "../ui/OptimizedImage";

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <span className={`tenet-logo ${className}`.trim()} aria-label="TENET">
      <OptimizedImage
        src={tenetLogo}
        alt=""
        aria-hidden="true"
        priority
        style={{ minHeight: "22px" }}
      />
    </span>
  );
}
