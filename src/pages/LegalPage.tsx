import { useParams, Link } from "react-router-dom";
import { Nav } from "rsuite";
import { MotionIcon } from "motion-icons-react";
import PageLayout from "../components/PageLayout";

const SECTIONS = {
  gizlilik: {
    label: "Gizlilik",
    title: "Gizlilik Politikası",
    icon: "Shield",
    paragraphs: [
      "Lumii olarak gizliliğine önem veriyoruz. Bu sayfada hangi verileri topladığımızı ve nasıl kullandığımızı kısaca anlatıyoruz.",
      "Hesap bilgilerin, izleme geçmişin ve cihaz bilgilerin yalnızca hizmeti sunmak ve deneyimini iyileştirmek için kullanılır.",
      "Verilerini üçüncü taraflarla pazarlama amacıyla paylaşmıyoruz. İstediğin zaman hesabını ve verilerini silebilirsin.",
    ],
  },
  kosullar: {
    label: "Kullanım Koşulları",
    title: "Kullanım Koşulları",
    icon: "FileText",
    paragraphs: [
      "Lumii’yi kullanarak bu koşulları kabul etmiş olursun.",
      "İçerikler kişisel ve ticari olmayan kullanım içindir. Hesabını tanımadığın kişilerle paylaşmaman önerilir.",
      "Platformu kötüye kullanmak, içerikleri izinsiz kopyalamak veya dağıtmak yasaktır.",
    ],
  },
  cerezler: {
    label: "Çerezler",
    title: "Çerez Politikası",
    icon: "Cookie",
    paragraphs: [
      "Lumii, oturumunu açık tutmak ve tercihlerini hatırlamak için çerez kullanır.",
      "Zorunlu çerezler sitenin çalışması için gereklidir; tercih çerezleri ise deneyimini kişiselleştirir.",
      "Çerezleri tarayıcı ayarlarından istediğin zaman temizleyebilir veya engelleyebilirsin.",
    ],
  },
} as const;

type SectionKey = keyof typeof SECTIONS;
const ORDER: SectionKey[] = ["gizlilik", "kosullar", "cerezler"];

export default function LegalPage() {
  const { section } = useParams<{ section: string }>();
  const active: SectionKey =
    section && section in SECTIONS ? (section as SectionKey) : "gizlilik";
  const data = SECTIONS[active];

  return (
    <PageLayout className="legal-page" mainClassName="legal-main">
      <div className="legal-container">
        <h1 className="legal-title">Yasal</h1>

        <Nav className="legal-tabs" activeKey={active}>
          {ORDER.map((key) => {
            const { icon, label } = SECTIONS[key];
            return (
              <Nav.Item
                key={key}
                eventKey={key}
                as={Link}
                to={`/legal/${key}`}
                className="legal-tab"
              >
                <MotionIcon
                  name={icon}
                  size={16}
                  trigger="hover"
                  animation="pop"
                />
                <span>{label}</span>
              </Nav.Item>
            );
          })}
        </Nav>

        <article className="legal-content">
          <h2>{data.title}</h2>
          {data.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <p className="legal-updated">Son güncelleme: Haziran 2026</p>
        </article>
      </div>
    </PageLayout>
  );
}
