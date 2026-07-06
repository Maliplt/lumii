import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const MENU_EST = 320;

interface DropdownItem {
  id: string;
  label: string;
}

export default function CategoryDropdown({
  cats,
  active,
  onSelect,
}: {
  cats: DropdownItem[];
  active: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [dropLeft, setDropLeft] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeCat = cats.find((c) => c.id === active) ?? cats[0];

  const toggle = () => {
    setOpen((o) => {
      if (!o && ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const below = window.innerHeight - rect.bottom;
        setDropUp(below < MENU_EST && rect.top > below);
        const estW = Math.min(540, window.innerWidth * 0.92);
        const overflowsLeftIfRight = rect.right - estW < 8;
        const fitsRightIfLeft = rect.left + estW <= window.innerWidth - 8;
        setDropLeft(overflowsLeftIfRight && fitsRightIfLeft);
      }
      return !o;
    });
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div
      className={`cat-dd${open ? " open" : ""}${dropUp ? " cat-dd--up" : ""}${dropLeft ? " cat-dd--left" : ""}`}
      ref={ref}
    >
      <button
        type="button"
        className="cat-dd__toggle"
        onClick={toggle}
        aria-expanded={open}
      >
        <span>{activeCat.label}</span>
        <ChevronDown size={16} className="cat-dd__caret" />
      </button>
      {open && (
        <div className="cat-dd__menu">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`cat-dd__item${c.id === active ? " active" : ""}`}
              onClick={() => {
                onSelect(c.id);
                setOpen(false);
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
