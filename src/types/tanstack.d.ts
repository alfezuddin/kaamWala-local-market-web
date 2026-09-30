import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: "left" | "center" | "right";
    className?: string;
    headerClassName?: string;
    width?: string;
    /** Hides the column from the column visibility menu. */
    pinned?: boolean;
  }
}
