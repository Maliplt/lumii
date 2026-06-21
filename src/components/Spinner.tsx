import Logo from "./Logo";

interface SpinnerProps {
  inline?: boolean;
}

export default function Spinner({ inline = false }: SpinnerProps) {
  return (
    <div className={`spinner-overlay${inline ? " spinner-overlay--inline" : ""}`}>
      <div className="spinner-stage">
        <span className="spinner-ring" />
        <span className="spinner-orbit" />
        <span className="spinner-spark" />
      </div>
      <Logo className="spinner-logo" />
      <span className="spinner-label">Yükleniyor</span>
    </div>
  );
}
