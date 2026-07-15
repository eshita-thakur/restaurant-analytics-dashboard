import api from "./axios";

export const downloadSalesReportExcel = (period) =>
  api.get("/reports/sales/excel", { params: { period }, responseType: "blob" });

export const downloadProfitReportPdf = () =>
  api.get("/reports/profit/pdf", { responseType: "blob" });