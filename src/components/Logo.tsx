interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <span className={`lumii-logo ${className}`.trim()} aria-label="Lumii">
      <span className="lumii-logo__lead" aria-hidden="true">
        Lumi
      </span>
      <span className="lumii-logo__spark" aria-hidden="true">
        i
      </span>
    </span>
  );
}
