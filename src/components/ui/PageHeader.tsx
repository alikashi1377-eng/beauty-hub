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
    <div className="pb-2 sm:pb-3 mb-2.5 sm:mb-4 border-b border-[#E2E8F0]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[15px] sm:text-lg lg:text-xl font-extrabold text-[#061138] tracking-tight leading-snug">
          {title}
        </h1>
        {actions ? (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-full min-w-0">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
};
