import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import Logo from './Logo'

const SOCIALS = [
  { label: 'Facebook', href: 'https://facebook.com', path: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.99 3.657 9.128 8.438 9.878v-6.988H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.99 22 12z' },
  { label: 'X', href: 'https://x.com', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
  { label: 'Instagram', href: 'https://instagram.com', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
  { label: 'Youtube', href: 'https://youtube.com', path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
] as const

function BrandIcon({ path }: { path: string }) {
  return (
    <svg width={16} height={16}  viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <span className="site-footer__logo"><Logo /></span>
            <p className="site-footer__tagline">Film, dizi ve oyun; hepsi tek bir akıllı platformda.</p>
            <div className="site-footer__socials">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  className="site-footer__social"
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                >
                  <BrandIcon path={s.path} />
                </a>
              ))}
            </div>
          </div>
          <nav className="site-footer__cols">
            <div className="site-footer__col">
              <h4 className="site-footer__col-title">Keşfet</h4>
              <ul className="site-footer__links">
                <li><Link className="site-footer__link" to="/">Anasayfa</Link></li>
                <li><Link className="site-footer__link" to="/explore">Filmler</Link></li>
                <li><Link className="site-footer__link" to="/tv">Diziler</Link></li>
                <li><Link className="site-footer__link" to="/play/2048">Oyunlar</Link></li>
              </ul>
            </div>
            <div className="site-footer__col">
              <h4 className="site-footer__col-title">Hesap</h4>
              <ul className="site-footer__links">
                <li><Link className="site-footer__link" to="/packages">Paketler</Link></li>
                <li><Link className="site-footer__link" to="/login">Hesabım</Link></li>
              </ul>
            </div>
            <div className="site-footer__col">
              <h4 className="site-footer__col-title">Yardım</h4>
              <ul className="site-footer__links">
                <li><a className="site-footer__link" href="mailto:destek@lumii.com">Destek</a></li>
                <li>
                  <a className="site-footer__link" href="mailto:iletisim@lumii.com">
                    <Mail className="site-footer__link-icon" size={14} /> İletişim
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>
        <div className="site-footer__bottom">
          <span className="site-footer__copyright">© 2026 Lumii. Tüm hakları saklıdır.</span>
          <div className="site-footer__legal">
            <Link className="site-footer__legal-link" to="/legal/gizlilik">Gizlilik Politikası</Link>
            <Link className="site-footer__legal-link" to="/legal/kosullar">Kullanım Koşulları</Link>
            <Link className="site-footer__legal-link" to="/legal/cerezler">Çerezler</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
