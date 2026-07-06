import type { SectionKey, NavItem } from "./accountData";

export default function NavButton({
  item,
  active,
  onSelect,
}: {
  item: NavItem;
  active: boolean;
  onSelect: (key: SectionKey) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      className={`acct-nav__item${active ? " is-active" : ""}`}
      onClick={() => onSelect(item.key)}
    >
      <Icon size={18} />
      <span>
        <strong>{item.label}</strong>
        <small>{item.helper}</small>
      </span>
    </button>
  );
}
