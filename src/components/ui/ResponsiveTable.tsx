import React from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: 'right' | 'left' | 'center';
  render: (row: T, index: number) => React.ReactNode;
}

export interface ResponsiveTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  caption?: string;
  emptyMessage?: string;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  caption,
  emptyMessage,
}: ResponsiveTableProps<T>) {
  if (data.length === 0 && emptyMessage) {
    return (
      <div className="w-full rounded-3xl border border-[#E6E0F5] bg-white p-6 text-center text-xs font-bold text-[#64748B]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="hidden md:block overflow-x-auto rounded-3xl border border-[#E6E0F5] bg-white shadow-[0_4px_20px_-4px_rgba(139,92,246,0.06)]">
        <table className="w-full text-sm text-right border-collapse">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-[#E6E0F5] bg-[#FAF8FF] text-[#6B6480] text-xs font-semibold">
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
          <tbody className="divide-y divide-[#E6E0F5]">
            {data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row)}
                className="hover:bg-[#F3EEFF]/60 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-3.5 px-4 text-[#1E1B2E] align-middle ${
                      col.align === 'left'
                        ? 'text-left tabular-nums'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-right'
                    }`}
                  >
                    {col.render(row, rowIndex)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {data.map((row, rowIndex) => (
          <div
            key={keyExtractor(row)}
            className="rounded-3xl border border-[#E6E0F5] bg-white p-4 space-y-2.5 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.06)]"
          >
            {columns.map((col) => (
              <div
                key={col.key}
                className="flex items-center justify-between gap-3 text-xs border-b border-[#F3EEFF] last:border-b-0 pb-2 last:pb-0"
              >
                <span className="font-medium text-[#6B6480]">{col.header}</span>
                <div className="text-[#1E1B2E] font-medium">
                  {col.render(row, rowIndex)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

