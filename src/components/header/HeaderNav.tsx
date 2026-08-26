import { useState, useRef, useEffect } from "react";
import { Nav, Stack } from "rsuite";
import { Film, Tv } from "lucide-react";
import { MotionIcon } from "../ui/MotionIcon";
import { Link } from "react-router-dom";
import { NAV_LINKS } from "./headerLinks";

interface HeaderNavProps {
  pathname: string;
}

export default function HeaderNav({ pathname }: HeaderNavProps) {
  const [selectOpen, setSelectOpen] = useState(false);
  const selectCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSelectMenu = () => {
    if (selectCloseTimer.current) clearTimeout(selectCloseTimer.current);
    setSelectOpen(true);
  };
  const scheduleCloseSelectMenu = () => {
    if (selectCloseTimer.current) clearTimeout(selectCloseTimer.current);
    selectCloseTimer.current = setTimeout(() => setSelectOpen(false), 220);
  };

  useEffect(
    () => () => {
      if (selectCloseTimer.current) clearTimeout(selectCloseTimer.current);
    },
    [],
  );

  return (
    <Nav activeKey={pathname} className="header-main-nav">
      {NAV_LINKS.map(({ to, label, icon }) => {
        const active =
          to === "/"
            ? pathname === "/"
            : pathname.startsWith(to);
        const item = (
          <Nav.Item
            key={to}
            as={Link}
            to={to}
            eventKey={to}
            active={active}
            className="nav-link"
          >
            <Stack spacing={8}>
              <span className="nav-icon-wrapper">
                <MotionIcon
                  name={icon}
                  size={18}
                  trigger="hover"
                  animation="nudge"
                />
              </span>
              <span className="nav-text-label">{label}</span>
            </Stack>
          </Nav.Item>
        );

        if (to !== "/explore") return item;
        return (
          <div
            key={to}
            className="nav-select"
            onMouseEnter={openSelectMenu}
            onMouseLeave={scheduleCloseSelectMenu}
          >
            <button
              type="button"
              className={`nav-link nav-select__trigger${active ? " is-active" : ""}`}
              aria-haspopup="true"
              aria-expanded={selectOpen}
            >
              <Stack spacing={8}>
                <span className="nav-icon-wrapper">
                  <MotionIcon
                    name={icon}
                    size={18}
                    trigger="hover"
                    animation="nudge"
                  />
                </span>
                <span className="nav-text-label">{label}</span>
              </Stack>
            </button>
            {selectOpen && (
              <div className="nav-select__panel">
                <Link
                  to="/explore?type=movie"
                  className="nav-select__btn"
                  onClick={() => setSelectOpen(false)}
                >
                  <Film size={20} />
                  <span>Film İzle</span>
                </Link>
                <Link
                  to="/explore?type=tv"
                  className="nav-select__btn"
                  onClick={() => setSelectOpen(false)}
                >
                  <Tv size={20} />
                  <span>Dizi İzle</span>
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </Nav>
  );
}
