import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, X, CornerDownLeft } from "lucide-react";

// debounce
function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

interface SearchBarProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchBar({ open, onClose }: SearchBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const initial =
    location.pathname === "/search"
      ? (new URLSearchParams(location.search).get("q") ?? "")
      : "";
  const [query, setQuery] = useState(initial);
  const [closing, setClosing] = useState(false);
  const debounced = useDebouncedValue(query.trim(), 400);

  // arama
  const lastSent = useRef(initial);
  useEffect(() => {
    if (debounced === lastSent.current) return;
    lastSent.current = debounced;
    if (debounced) {
      navigate(`/search?q=${encodeURIComponent(debounced)}`, {
        replace: location.pathname === "/search",
      });
    } else if (location.pathname === "/search") {
      navigate("/search", { replace: true });
    }
  }, [debounced, location.pathname, navigate]);

  // odak
  useEffect(() => {
    if (open && !closing) inputRef.current?.focus();
  }, [open, closing]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setQuery("");
      onClose();
    }, 220);
  };

  const handleSubmit = () => {
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  if (!open) return null;

  return (
    <div className={`search-box${closing ? " is-closing" : ""}`}>
      <span className="search-box__ring" />

      <span className="search-box__glyph">
        <Search size={18} />
      </span>

      <input
        ref={inputRef}
        type="text"
        className="search-box__input"
        placeholder="Film veya dizi ara"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") handleClose();
        }}
      />

      {query && (
        <button
          type="button"
          className="search-box__clear"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          aria-label="Temizle"
        >
          <X size={15} />
        </button>
      )}

      <span className="search-box__enter">
        <CornerDownLeft size={12} />
      </span>

      <button
        type="button"
        className="search-box__close"
        onClick={handleClose}
        aria-label="Aramayı kapat"
      >
        <X size={16} />
      </button>
    </div>
  );
}
