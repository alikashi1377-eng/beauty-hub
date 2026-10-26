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
}) => {
  return (
    <div className="pb-4 mb-5 border-b border-[#CBD5E1]">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs items={breadcrumbs} />
      ) : null}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1">
          {kicker ? (
            <p className="text-xs font-extrabold text-[#0057FF]">{kicker}</p>
          ) : null}
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#061138] tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs sm:text-sm font-medium text-[#334155] max-w-3xl leading-relaxed">
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
