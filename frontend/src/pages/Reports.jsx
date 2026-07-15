import { useState } from "react";
import Layout from "../components/Layout";
import { downloadSalesReportExcel, downloadProfitReportPdf } from "../api/reports";
import { downloadFile } from "../utils/downloadFile";

function ReportCard({ title, description, children }) {
  return (
    <div className="bg-white border border-ink/10 rounded-sm p-6 animate-ticket-in">
      <h2 className="font-display text-lg mb-1">{title}</h2>
      <p className="text-sm text-ink/60 mb-5">{description}</p>
      {children}
    </div>
  );
}

export default function Reports() {
  const [period, setPeriod] = useState("monthly");
  const [salesLoading, setSalesLoading] = useState(false);
  const [profitLoading, setProfitLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSalesDownload() {
    setError("");
    setSalesLoading(true);
    try {
      const response = await downloadSalesReportExcel(period);
      downloadFile(response.data, `sales_report_${period}.xlsx`);
    } catch (err) {
      setError("Failed to generate sales report. Please try again.");
    } finally {
      setSalesLoading(false);
    }
  }

  async function handleProfitDownload() {
    setError("");
    setProfitLoading(true);
    try {
      const response = await downloadProfitReportPdf();
      downloadFile(response.data, "profit_report.pdf");
    } catch (err) {
      setError("Failed to generate profit report. Please try again.");
    } finally {
      setProfitLoading(false);
    }
  }

  return (
    <Layout>
      <h1 className="font-display text-3xl mb-1">Reports</h1>
      <p className="text-ink/60 mb-8">Download data for accounting and record-keeping</p>

      {error && (
        <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm px-4 py-3 animate-ticket-in">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCard
          title="Sales Report"
          description="Revenue and order counts, grouped by period. Exports as Excel (.xlsx)."
        >
          <div className="flex gap-3 items-center">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-ink/20 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-lavender focus:ring-1 focus:ring-lavender"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button
              onClick={handleSalesDownload}
              disabled={salesLoading}
              className="px-4 py-2 text-sm bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors disabled:opacity-60"
            >
              {salesLoading ? "Generating..." : "Download Excel"}
            </button>
          </div>
        </ReportCard>

        <ReportCard
          title="Profit Report"
          description="Revenue vs. expenses summary with a visual chart. Exports as PDF."
        >
          <button
            onClick={handleProfitDownload}
            disabled={profitLoading}
            className="px-4 py-2 text-sm bg-navy text-paper rounded-sm hover:bg-blossom hover:text-navy transition-colors disabled:opacity-60"
          >
            {profitLoading ? "Generating..." : "Download PDF"}
          </button>
        </ReportCard>
      </div>
    </Layout>
  );
}