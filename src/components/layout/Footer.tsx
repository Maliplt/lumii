import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, MessageSquare, Send, CheckCircle } from "lucide-react";
import { Input, Button } from "rsuite";
import Logo from "../header/Logo";
import { useServiceErrorToast, useToast } from "../../lib/toast";
import { useAppSelector } from "../../store/store";

export default function Footer() {
  const isLoggedIn = useAppSelector((state) => Boolean(state.auth.currentUser));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const toast = useToast();
  const serviceErrorToast = useServiceErrorToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast("Lütfen tüm alanları doldurun.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      toast("Mesajınız başarıyla iletildi!", "success");
      setName("");
      setEmail("");
      setMessage("");

      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (error) {
      serviceErrorToast(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <span className="site-footer__logo">
              <Logo />
            </span>
            <p className="site-footer__tagline">
              Film, dizi ve oyun; hepsi tek bir akıllı platformda.
            </p>
          </div>

          <nav className="site-footer__cols">
            <div className="site-footer__col">
              <h4 className="site-footer__col-title">Keşfet</h4>
              <ul className="site-footer__links">
                <li>
                  <Link className="site-footer__link" to="/">
                    Anasayfa
                  </Link>
                </li>
                <li>
                  <Link className="site-footer__link" to="/explore?type=movie">
                    Filmler
                  </Link>
                </li>
                <li>
                  <Link className="site-footer__link" to="/explore?type=tv">
                    Diziler
                  </Link>
                </li>
                <li>
                  <Link className="site-footer__link" to="/play/2048">
                    Oyunlar
                  </Link>
                </li>
              </ul>
            </div>
            <div className="site-footer__col">
              <h4 className="site-footer__col-title">Hesap</h4>
              <ul className="site-footer__links">
                <li>
                  <Link className="site-footer__link" to="/packages">
                    Paketler
                  </Link>
                </li>
                <li>
                  <Link className="site-footer__link" to={isLoggedIn ? "/account" : "/login"}>
                    Hesabım
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          <div className="site-footer__contact">
            <h4 className="site-footer__contact-title">Bize Ulaşın</h4>
            <p className="site-footer__contact-desc">
              Sorularınız, önerileriniz veya destek talepleriniz için bize yazın.
            </p>
            {isSubmitted ? (
              <div className="site-footer__contact-success">
                <CheckCircle className="site-footer__success-icon" size={28} />
                <span className="site-footer__success-text">
                  Mesajınız başarıyla gönderildi. En kısa sürede döneceğiz!
                </span>
              </div>
            ) : (
              <form className="site-footer__contact-form" onSubmit={handleSubmit}>
                <div className="site-footer__form-group">
                  <User size={14} className="site-footer__form-icon" />
                  <Input
                    placeholder="Adınız"
                    className="site-footer__input"
                    value={name}
                    onChange={(val) => setName(val)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="site-footer__form-group">
                  <Mail size={14} className="site-footer__form-icon" />
                  <Input
                    type="email"
                    placeholder="E-posta Adresiniz"
                    className="site-footer__input"
                    value={email}
                    onChange={(val) => setEmail(val)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="site-footer__form-group">
                  <MessageSquare size={14} className="site-footer__form-icon site-footer__form-icon--textarea" />
                  <Input
                    as="textarea"
                    placeholder="Mesajınız..."
                    className="site-footer__input site-footer__input--textarea"
                    value={message}
                    onChange={(val) => setMessage(val)}
                    disabled={isSubmitting}
                    rows={3}
                    required
                  />
                </div>
                <Button type="submit" className="site-footer__submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="site-footer__btn-spinner" />
                  ) : (
                    <>
                      <span>Gönder</span>
                      <Send size={14} className="site-footer__send-icon" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="site-footer__bottom">
          <span className="site-footer__copyright">
            © 2026 TENET. Tüm hakları saklıdır.
          </span>
          <div className="site-footer__legal">
            <Link className="site-footer__legal-link" to="/legal/gizlilik">
              Gizlilik Politikası
            </Link>
            <Link className="site-footer__legal-link" to="/legal/kosullar">
              Kullanım Koşulları
            </Link>
            <Link className="site-footer__legal-link" to="/legal/cerezler">
              Çerezler
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
