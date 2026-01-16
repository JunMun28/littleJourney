import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type {
  GrowthMeasurement,
  MeasurementType,
  PercentileResult,
  PercentileStandard,
} from "@/contexts/growth-tracking-context";

export interface GrowthReportData {
  child: {
    id?: string;
    name: string;
    dateOfBirth: string;
    sex?: "male" | "female";
  };
  measurements: GrowthMeasurement[];
  percentileData: Record<string, PercentileResult>;
  standard: PercentileStandard;
  startDate: string;
  endDate: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMeasurementType(type: MeasurementType): string {
  switch (type) {
    case "height":
      return "Height";
    case "weight":
      return "Weight";
    case "head_circumference":
      return "Head Circumference";
  }
}

function getUnit(type: MeasurementType): string {
  switch (type) {
    case "height":
    case "head_circumference":
      return "cm";
    case "weight":
      return "kg";
  }
}

function calculateAgeInMonths(birthDate: string, measurementDate: string): number {
  const birth = new Date(birthDate);
  const measurement = new Date(measurementDate);
  const months =
    (measurement.getFullYear() - birth.getFullYear()) * 12 +
    (measurement.getMonth() - birth.getMonth());
  return Math.max(0, months);
}

function formatStandard(standard: PercentileStandard): string {
  return standard === "who" ? "WHO" : "Singapore";
}

export function generateGrowthReportHtml(data: GrowthReportData): string {
  const { child, measurements, percentileData, standard, startDate, endDate } = data;

  // Filter measurements by date range
  const filteredMeasurements = measurements.filter((m) => {
    const date = new Date(m.date);
    return date >= new Date(startDate) && date <= new Date(endDate);
  });

  // Group measurements by type
  const heightMeasurements = filteredMeasurements.filter((m) => m.type === "height");
  const weightMeasurements = filteredMeasurements.filter((m) => m.type === "weight");
  const headMeasurements = filteredMeasurements.filter((m) => m.type === "head_circumference");

  const hasData = filteredMeasurements.length > 0;

  const generateMeasurementTable = (
    type: MeasurementType,
    items: GrowthMeasurement[]
  ): string => {
    if (items.length === 0) {
      return `
        <div class="section">
          <h2>${formatMeasurementType(type)}</h2>
          <p class="no-data">No measurements recorded</p>
        </div>
      `;
    }

    const rows = items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((m) => {
        const ageMonths = calculateAgeInMonths(child.dateOfBirth, m.date);
        const percentile = percentileData[m.id];
        return `
          <tr>
            <td>${formatDate(m.date)}</td>
            <td>${ageMonths} months</td>
            <td>${m.value} ${getUnit(type)}</td>
            <td class="${percentile?.isWithinNormalRange ? "normal" : "warning"}">
              ${percentile?.rangeDescription || "N/A"}
            </td>
          </tr>
        `;
      })
      .join("");

    return `
      <div class="section">
        <h2>${formatMeasurementType(type)}</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Age</th>
              <th>Value</th>
              <th>Percentile</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Growth Report - ${child.name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          padding: 40px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #E8B4D9;
        }
        .header h1 {
          color: #E8B4D9;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .header .subtitle {
          color: #666;
          font-size: 14px;
        }
        .child-info {
          background: #FDF5F9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .child-info h2 {
          color: #E8B4D9;
          font-size: 20px;
          margin-bottom: 15px;
        }
        .child-info .info-row {
          display: flex;
          margin-bottom: 8px;
        }
        .child-info .label {
          font-weight: 600;
          width: 150px;
          color: #555;
        }
        .child-info .value {
          color: #333;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          color: #E8B4D9;
          font-size: 18px;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        th {
          background: #FDF5F9;
          font-weight: 600;
          color: #555;
        }
        tr:hover {
          background: #FAFAFA;
        }
        .normal {
          color: #22C55E;
        }
        .warning {
          color: #EAB308;
        }
        .no-data {
          color: #999;
          font-style: italic;
          padding: 20px 0;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
        .standard-badge {
          display: inline-block;
          background: #E8B4D9;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          margin-left: 8px;
        }
        @media print {
          body {
            padding: 20px;
          }
          .section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Growth Report</h1>
        <div class="subtitle">
          ${formatDate(startDate)} - ${formatDate(endDate)}
          <span class="standard-badge">${formatStandard(standard)} Standard</span>
        </div>
      </div>

      <div class="child-info">
        <h2>${child.name}</h2>
        <div class="info-row">
          <span class="label">Date of Birth:</span>
          <span class="value">${formatDate(child.dateOfBirth)}</span>
        </div>
        <div class="info-row">
          <span class="label">Sex:</span>
          <span class="value">${child.sex === "male" ? "Male" : child.sex === "female" ? "Female" : "Not specified"}</span>
        </div>
        <div class="info-row">
          <span class="label">Report Period:</span>
          <span class="value">${formatDate(startDate)} - ${formatDate(endDate)}</span>
        </div>
      </div>

      ${hasData ? "" : '<p class="no-data">No measurements recorded in the selected date range.</p>'}

      ${generateMeasurementTable("height", heightMeasurements)}
      ${generateMeasurementTable("weight", weightMeasurements)}
      ${generateMeasurementTable("head_circumference", headMeasurements)}

      <div class="footer">
        <p>Generated by Little Journey - Baby Milestone Journal</p>
        <p>This report is for informational purposes only. Consult your pediatrician for medical advice.</p>
      </div>
    </body>
    </html>
  `;
}

export async function generateAndShareGrowthReport(
  data: GrowthReportData
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = generateGrowthReportHtml(data);

    // Generate PDF from HTML
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, error: "Sharing is not available on this device" };
    }

    // Share the PDF
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Growth Report - ${data.child.name}`,
      UTI: "com.adobe.pdf",
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate report";
    return { success: false, error: message };
  }
}
