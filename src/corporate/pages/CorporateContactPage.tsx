import { useState, type FormEvent } from "react";
import { Button, Input, Message, SelectPicker, Textarea } from "rsuite";
import { ArrowRight } from "lucide-react";
import { PageHero } from "../components/Section";
import { company, contactTopics } from "../data";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CorporateContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string | null>("genel");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim() || !topic) {
      setError("Lütfen tüm alanları doldurun.");
      setStatus("error");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("Geçerli bir e-posta adresi girin.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    // backend baglanana kadar simulasyon
    await new Promise((r) => setTimeout(r, 700));
    setStatus("sent");
    setName("");
    setEmail("");
    setMessage("");
  };

  const busy = status === "sending";

  return (
    <>
      <PageHero
        crumb="İletişim"
        title={<>Bize ulaşın.</>}
        lead="Yatırımcı ilişkileri, içerik ortaklığı, basın ve kariyer talepleri için formu kullanabilir ya da ilgili adrese doğrudan yazabilirsiniz."
      />

      <section className="tn-section">
        <div className="tn-wrap tn-contact">
          <dl className="tn-contact__info">
            <div>
              <dt>Genel merkez</dt>
              <dd>{company.address}</dd>
            </div>
            <div>
              <dt>Genel</dt>
              <dd><a href={`mailto:${company.email}`}>{company.email}</a></dd>
            </div>
            <div>
              <dt>Yatırımcı ilişkileri</dt>
              <dd><a href={`mailto:${company.investorEmail}`}>{company.investorEmail}</a></dd>
            </div>
            <div>
              <dt>Basın</dt>
              <dd><a href={`mailto:${company.pressEmail}`}>{company.pressEmail}</a></dd>
            </div>
            <div>
              <dt>Telefon</dt>
              <dd>{company.phone}</dd>
            </div>
          </dl>

          <form className="tn-form" onSubmit={handleSubmit} noValidate>
            {status === "sent" && (
              <Message type="success" showIcon className="tn-message">
                Mesajınız alındı. İlgili ekip en geç iki iş günü içinde dönüş yapacak.
              </Message>
            )}
            {status === "error" && (
              <Message type="error" showIcon className="tn-message">
                {error}
              </Message>
            )}

            <div className="tn-form__row">
              <label className="tn-field">
                <span>Ad Soyad</span>
                <Input value={name} onChange={setName} disabled={busy} />
              </label>
              <label className="tn-field">
                <span>E-posta</span>
                <Input type="email" value={email} onChange={setEmail} disabled={busy} />
              </label>
            </div>

            <div className="tn-field">
              <span>Konu</span>
              <SelectPicker
                data={contactTopics}
                value={topic}
                onChange={setTopic}
                searchable={false}
                cleanable={false}
                block
                disabled={busy}
                menuClassName="tn-picker-menu"
              />
            </div>

            <label className="tn-field">
              <span>Mesaj</span>
              <Textarea rows={6} value={message} onChange={setMessage} disabled={busy} />
            </label>

            <Button type="submit" className="tn-btn tn-btn--solid" loading={busy}>
              Gönder <ArrowRight size={16} />
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
