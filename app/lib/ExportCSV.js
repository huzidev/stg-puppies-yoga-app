import { mkdir, writeFile } from "fs/promises";
import Papa from "papaparse";
import path from "path";

// export async function exportOrdersAsCSV(orders) {
//   const csvData = [];

//   for (const order of orders) {
//     const waiver = order.waivers?.[0];
//     let signaturePath = "";

//     if (waiver && waiver.signUrl) {
//       const base64Data = waiver.signUrl.split(",")[1];
//       const signatureFilename = `signature_${order.id}.jpeg`;
//       const signatureFullPath = path.join(
//         "public",
//         "signatures",
//         signatureFilename,
//       );

//       await writeFile(signatureFullPath, Buffer.from(base64Data, "base64"));

//     //   signaturePath = `https://yourdomain.com/signatures/${signatureFilename}`;
//     }

//     csvData.push({
//       id: order.id,
//       bookedDay: order.bookedDay,
//       bookedTime: order.bookedTime,
//       location: order.location.name,
//       orderId: order.order.orderNumber,
//       customerName: order.order.customerName,
//       customerId: order.order.customerId,
//       oldStore: order.order.oldStore ? "True" : "False",
//       waiverSigned: waiver ? "True" : "False",
//       orderPlaced: order.order.createdAt,
//     //   signature: signaturePath,
//     });
//   }

//   const csv = Papa.unparse(csvData);

//   const csvFilePath = path.join("public", "exports", "orders.csv");
//   await writeFile(csvFilePath, csv);

//   return `https://yourdomain.com/exports/orders.csv`;
// }


export async function exportOrdersAsCSV(orders) {
  const csvData = orders.map((order) => ({
    id: order.id,
    bookedDay: order.bookedDay,
    bookedTime: order.bookedTime,
    location: order.location.name,
    orderId: order.order.orderNumber,
    customerName: order.order.customerName,
    customerId: order.order.customerId,
    oldStore: order.order.oldStore ? "True" : "False",
    waiverSigned: order.waivers?.length ? "True" : "False",
    orderPlaced: order.order.createdAt,
  }));

  const csv = Papa.unparse(csvData);

  // Define export directory and filename
  const exportDir = path.join("public", "exports");
  const filename = `orders_${Date.now()}.csv`;
  const filePath = path.join(exportDir, filename);

  try {
    await mkdir(exportDir, { recursive: true });

    await writeFile(filePath, csv);

    return filename;
  } catch (error) {
    console.error("Error writing CSV file:", error);
    throw new Error("Failed to export CSV");
  }
}
