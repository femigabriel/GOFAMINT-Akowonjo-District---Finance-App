// src/types/jspreadsheet.d.ts
declare module "jspreadsheet-ce" {
  interface Column {
    type: string;
    title?: string;
    width?: number | string;
    source?: string[] | any; // For dropdown
    decimal?: number;
    readOnly?: boolean;
    options?: { format?: string };
    [key: string]: any; // Fallback for other properties
  }

  interface Worksheet {
    data?: any[][];
    columns?: Column[];
    allowInsertRow?: boolean;
    allowInsertColumn?: boolean;
    allowDeleteRow?: boolean;
    allowDeleteColumn?: boolean;
    tableOverflow?: boolean;
    tableHeight?: string;
    minDimensions?: [number, number];
    contextMenu?: boolean;
    [key: string]: any; // Fallback for other properties
  }

  interface SpreadsheetOptions {
    worksheets: Worksheet[]; // Required for v5+
    [key: string]: any; // Fallback for other properties
  }

  const jspreadsheet: (el: HTMLElement, options: SpreadsheetOptions) => any;
  export default jspreadsheet;
}6q q 