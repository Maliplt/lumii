import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Button, Drawer, Nav } from "rsuite";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { company, navLinks } from "../data";
import "../styles/corporate-rsuite.css";
import "../styles/corporate.scss";

// marka yazisi
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`tn-wordmark ${className}`.trim()} aria-label={company.name}>
      TENET<span className="tn-wordmark__tail">T</span>
    </span>
  );
}

function activeKeyFor(pathname: string) {
  const match = [...navLinks]
    .sort((a, b) => b.to.length - a.to.length)
    .find((link) =>
      link.to === "/"
        ? pathname === "/"
        : pathname === link.to || pathname.startsWith(`${link.to}/`),
    );
  return match?.to ?? "/";
}

function CorporateHeader() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const activeKey = activeKeyFor(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = navLinks.map((link) => (
    <Nav.Item
      key={link.to}
      as={NavLink}
      to={link.to}
      end={link.end}
      eventKey={link.to}
      onClick={() => setOpen(false)}
    >
      {link.label}
    </Nav.Item>
  ));

  return (
    <header className={`tn-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="tn-wrap tn-header__row">
        <Link to="/" className="tn-header__brand">
          <Wordmark />
          <span className="tn-header__legal">Teknoloji A.Ş.</span>
        </Link>

        <Nav className="tn-nav" activeKey={activeKey} appearance="subtle">
          {links}
        </Nav>

        <div className="tn-header__actions">
          <Button as={Link} to="/app" className="tn-btn tn-btn--ghost tn-header__product">
            TENET'e git <ArrowUpRight size={15} />
          </Button>
          <button
            type="button"
            className="tn-header__burger"
            aria-label="Menüyü aç"
            onClick={() => setOpen(true)}
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement="right"
        size="xs"
        closeButton={false}
        className="tn-drawer"
      >
        <Drawer.Body>
          <div className="tn-drawer__top">
            <Wordmark />
            <button
              type="button"
              className="tn-header__burger is-visible"
              aria-label="Menüyü kapat"
              onClick={() => setOpen(false)}
            >
              <X size={22} />
            </button>
          </div>
          <Nav vertical className="tn-drawer__nav" activeKey={activeKey}>
            {links}
          </Nav>
          <Button as={Link} to="/app" block className="tn-btn tn-btn--solid">
            TENET platformuna git
          </Button>
        </Drawer.Body>
      </Drawer>
    </header>
  );
}

function CorporateFooter() {
  return (
    <footer className="tn-footer">
      <div className="tn-wrap">
        <div className="tn-footer__grid">
          <div className="tn-footer__intro">
            <Wordmark className="tn-wordmark--lg" />
            <p>
              {company.legalName}, {company.product} dijital eğlence platformunu geliştiren ve
              işleten İstanbul merkezli teknoloji şirketidir. {company.operatingSince} itibarıyla
              ticari faaliyettedir.
            </p>
          </div>

          <nav className="tn-footer__col" aria-label="Kurumsal">
            <h4>Kurumsal</h4>
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="tn-footer__col">
            <h4>İletişim</h4>
            <a href={`mailto:${company.email}`}>{company.email}</a>
            <a href={`mailto:${company.investorEmail}`}>{company.investorEmail}</a>
            <a href={`mailto:${company.pressEmail}`}>{company.pressEmail}</a>
            <span>{company.address}</span>
          </div>
        </div>

        <div className="tn-footer__bottom">
          <span>© 2026 {company.legalName}</span>
          <div>
            <Link to="/legal/gizlilik">Gizlilik</Link>
            <Link to="/legal/kosullar">Koşullar</Link>
            <Link to="/legal/cerezler">Çerezler</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function CorporateLayout() {
  const { pathname } = useLocation();
  return (
    <div className="tn-site">
      <CorporateHeader />
      <main key={pathname} className="tn-main">
        <Outlet />
      </main>
      <CorporateFooter />
    </div>
  );
}
