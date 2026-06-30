import tenetLogo from "../../assets/images/tenet-logo.svg";

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <span className={`tenet-logo ${className}`.trim()} aria-label="TENET">
      <img src={tenetLogo} alt="" aria-hidden="true" style={{ minHeight: "22px" }} />
    </span>
  );
}
