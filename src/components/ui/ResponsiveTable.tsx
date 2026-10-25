import React from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: 'right' | 'left' | 'center';
  render: (row: T) => React.ReactNode;
}

export interface ResponsiveTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  caption?: string;
}

/**
 * جدول واکنش‌گرا با تراکم بهینه برای دسکتاپ و کارت‌های ساختاریافته برای موبایل
 */
export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  caption,
}: ResponsiveTableProps<T>) {
  return (
    <div className="w-full">
      {/* نمای جدول در تبلت و دسکتاپ */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#E6E3EE] bg-white">
        <table className="w-full text-sm text-right border-collapse">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-[#E6E3EE] bg-[#F4F3F8]/80 text-[#4A4458] text-xs font-semibold">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`py-3.5 px-4 whitespace-nowrap ${
                    col.align === 'left'
                      ? 'text-left'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-right'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E3EE]">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="hover:bg-[#FAF9FC] transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-3.5 px-4 text-[#120F1D] align-middle ${
                      col.align === 'left'
                        ? 'text-left tabular-nums'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-right'
                    }`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* نمای کارتی در موبایل برای جلوگیری از اسکرول افقی */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            className="rounded-2xl border border-[#E6E3EE] bg-white p-4 space-y-2.5"
          >
            {columns.map((col) => (
              <div
                key={col.key}
                className="flex items-center justify-between gap-3 text-xs border-b border-[#F4F3F8] last:border-b-0 pb-2 last:pb-0"
              >
                <span className="font-medium text-[#756F86]">{col.header}</span>
                <div className="text-[#120F1D] font-medium">
                  {col.render(row)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
