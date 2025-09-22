declare module "jspreadsheet-ce" {
  interface WorksheetInstance {
    getData: () => (string | number)[][];
    setData: (data: (string | number)[][]) => void;
    getValueFromCoords: (col: number, row: number) => string | number;
    setValueFromCoords: (col: number, row: number, value: string | number) => void;
    destroy: () => void;
  }

  interface SpreadsheetOptions {
    data?: (string | number)[][];
    columns?: Array<{
      type: string;
      title: string;
      width?: number;
      decimal?: number;
      readOnly?: boolean;
      options?: { format?: string };
    }>;
    minDimensions?: [number, number];
    tableOverflow?: boolean;
    tableWidth?: string;
    columnDrag?: boolean;
    search?: boolean;
    onchange?: (
      instance: WorksheetInstance,
      cell: HTMLTableCellElement,
      colIndex: string | number,
      rowIndex: string | number,
      newValue: any,
      oldValue: any
    ) => void;
  }

  function jspreadsheet(el: HTMLElement, options: SpreadsheetOptions): WorksheetInstance[];

  export default jspreadsheet;
}