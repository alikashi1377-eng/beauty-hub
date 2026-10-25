import React from 'react';
import { BreadcrumbItem, Breadcrumbs } from './Breadcrumbs';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  routePattern?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  kicker,
  breadcrumbs,
  actions,
  routePattern,
}) => {
  return (
    <div className="pb-5 mb-7 border-b border-[#E6E3EE]">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs items={breadcrumbs} />
      ) : null}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1.5">
          {kicker ? (
            <p className="text-xs font-semibold text-[#9D174D]">{kicker}</p>
          ) : null}
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#120F1D] tracking-tight">
              {title}
            </h1>
            {routePattern ? (
              <span
                dir="ltr"
                className="text-xs font-mono text-[#756F86] select-all"
              >
                {routePattern}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="text-xs sm:text-sm font-normal text-[#4A4458] max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
};
