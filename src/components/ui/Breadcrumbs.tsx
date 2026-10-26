import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  if (!items.length) return null;

  return (
    <nav aria-label="مسیر صفحه" className="mb-2.5">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-[#6B6480]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={`${item.label}-${index}`}
              className="inline-flex items-center gap-1.5"
            >
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="hover:text-[#8B5CF6] transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? 'font-semibold text-[#1E1B2E] whitespace-nowrap'
                      : 'whitespace-nowrap'
                  }
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronLeft
                  className="w-3.5 h-3.5 text-[#6B6480]/70 shrink-0"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
