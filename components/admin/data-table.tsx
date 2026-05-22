import Link from "next/link";
import { DeleteButton } from "./delete-button";
import { VisibleToggle } from "./visible-toggle";

type Column<T> = {
  key: keyof T & string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

type DataTableProps<T extends { id: string; visible?: boolean }> = {
  rows: T[];
  columns: Column<T>[];
  editHref: (row: T) => string;
  /** Server Action bound (id) -> Promise<void>; renders inside <form action={...}> */
  deleteAction: (id: string) => Promise<unknown>;
  /** Server Action that takes FormData with id + visible */
  toggleVisibleAction?: (formData: FormData) => Promise<unknown>;
  emptyMessage?: string;
};

export function DataTable<T extends { id: string; visible?: boolean }>({
  rows,
  columns,
  editHref,
  deleteAction,
  toggleVisibleAction,
  emptyMessage = "No rows yet.",
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-card/50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="text-left px-3 py-2 font-medium">
                {c.label}
              </th>
            ))}
            {toggleVisibleAction && <th className="px-3 py-2 font-medium">Visible</th>}
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2">
                  {c.render ? c.render(row) : String(row[c.key] ?? "")}
                </td>
              ))}
              {toggleVisibleAction && (
                <td className="px-3 py-2">
                  <VisibleToggle
                    id={row.id}
                    visible={row.visible ?? true}
                    action={toggleVisibleAction}
                  />
                </td>
              )}
              <td className="px-3 py-2 text-right">
                <Link
                  href={editHref(row)}
                  className="text-accent-purple hover:underline mr-3"
                >
                  Edit
                </Link>
                <DeleteButton id={row.id} action={deleteAction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
