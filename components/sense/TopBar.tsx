import { Fragment, type ReactNode } from "react";

type TopBarProps = {
  crumbs?: string[];
  right?: ReactNode;
};

export function TopBar({ crumbs = [], right }: TopBarProps) {
  return (
    <div className="topbar">
      <div className="breadcrumb">
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span
              style={{
                color: i === crumbs.length - 1 ? "var(--ink)" : "var(--muted)",
                fontWeight: i === crumbs.length - 1 ? 600 : 400,
              }}
            >
              {c}
            </span>
          </Fragment>
        ))}
      </div>
      <div className="topbar-actions">{right}</div>
    </div>
  );
}
