import { MediaGrid } from "../AccountUI";
import type { SavedItem } from "../../../store/store";

export default function LibraryTab({
  items,
  empty,
}: {
  items: SavedItem[];
  empty: string;
}) {
  return (
    <section className="acct-section">
      <MediaGrid items={items} empty={empty} />
    </section>
  );
}
