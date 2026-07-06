import { Button } from "rsuite";
import { SectionIntro, SummaryBlock, SummaryRow } from "../AccountUI";
import { formatPlan } from "../accountData";
import { MAX_PROFILES } from "../../../store/store";
import type { BasicUser, Plan } from "./types";

export default function OverviewTab({
  user,
  plan,
  shownProfileName,
  profileCount,
  onChangeEmail,
  onManagePlan,
}: {
  user: BasicUser;
  plan: Plan;
  shownProfileName: string;
  profileCount: number;
  onChangeEmail: () => void;
  onManagePlan: () => void;
}) {
  return (
    <section className="acct-section">
      <SectionIntro>Hesap bilgileri ve üyelik durumu.</SectionIntro>
      <div className="acct-overview-grid">
        <SummaryBlock>
          <SummaryRow label="Hesap sahibi" value={user.name} />
          <SummaryRow
            label="E-posta"
            value={user.email}
            action={
              <Button appearance="ghost" size="sm" onClick={onChangeEmail}>
                Değiştir
              </Button>
            }
          />
          <SummaryRow label="Üyelik başlangıcı" value={user.createdAt ?? "Bugün"} />
        </SummaryBlock>

        <SummaryBlock>
          <SummaryRow
            label="Plan"
            value={formatPlan(plan)}
            action={
              <Button appearance="ghost" size="sm" onClick={onManagePlan}>
                Yönet
              </Button>
            }
          />
          <SummaryRow label="Aktif profil" value={shownProfileName} />
          <SummaryRow
            label="Profil sayısı"
            value={`${profileCount}/${MAX_PROFILES}`}
          />
        </SummaryBlock>
      </div>
    </section>
  );
}
