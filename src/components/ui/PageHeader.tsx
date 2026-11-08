import React from 'react';
import { BreadcrumbItem } from './Breadcrumbs';

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
  actions,
}) => {
  return (
    <div className="pb-3 mb-4 border-b border-[#E2E8F0]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <h1 className="text-lg sm:text-xl font-extrabold text-[#061138] tracking-tight">
          {title}
        </h1>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
};
