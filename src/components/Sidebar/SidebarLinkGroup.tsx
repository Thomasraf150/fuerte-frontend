"use client";
import { ReactNode, useState, useLayoutEffect, useContext, useRef } from "react";
import { NavCurrentContext } from "./currentNav";

interface SidebarLinkGroupProps {
  children: (handleClick: () => void, open: boolean) => ReactNode;
  activeCondition: boolean;
}

const SidebarLinkGroup = ({
  children,
  activeCondition,
}: SidebarLinkGroupProps) => {
  const [open, setOpen] = useState<boolean>(activeCondition);
  const itemRef = useRef<HTMLLIElement>(null);
  const current = useContext(NavCurrentContext);

  // Inside a sidebar the group is open exactly when it holds the current link (the sidebar
  // marks that link once it has read the nav). Elsewhere, `activeCondition` decides.
  useLayoutEffect(() => {
    if (current === undefined) {
      setOpen(activeCondition);
      return;
    }
    setOpen(!!itemRef.current?.querySelector('a[aria-current="page"]'));
  }, [activeCondition, current]);

  const handleClick = () => {
    setOpen(!open);
  };

  // `group/nav` lets the heading restyle itself when the current page is inside (NAV_GROUP_HAS).
  return (
    <li ref={itemRef} className="group/nav">
      {children(handleClick, open)}
    </li>
  );
};

export default SidebarLinkGroup;
