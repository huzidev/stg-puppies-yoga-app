import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import JSZip from "jszip";

// import html2canvas from "html2canvas";
// export function generatePDFs(selectedWaivers) {
//     selectedWaivers.forEach(async (waiver, index) => {
//         const { order, bookedDay, bookedTime, waivers } = waiver;
//         const createdAtFormatted = new Date(order.createdAt)
//             .toLocaleDateString("en-GB")
//             .replace(/\//g, "-");

//         const waiverSigned = waivers.length > 0;
//         const signUrl = waivers[0]?.signUrl || null;

//         // Create a hidden div for HTML content
//         const pdfContent = document.createElement("div");
//         pdfContent.style.width = "600px";
//         pdfContent.style.padding = "20px";
//         pdfContent.style.fontFamily = "Arial, sans-serif";
//         pdfContent.innerHTML = `
//       <div style="border: 2px solid #000; padding: 20px; text-align: center; background-color: #f9f9f9;">
//         <h2 style="color: #0073e6;">Booking Details</h2>
//         <p><strong>Customer ID:</strong> ${order.customerId}</p>
//         <p><strong>Customer Name:</strong> ${order.customerName}</p>
//         <p><strong>Customer Email:</strong> ${order.email}</p>
//         <p><strong>Order ID:</strong> ${order.orderId}</p>
//         <p><strong>Order Number:</strong> ${order.orderNumber}</p>
//         <p><strong>Created At:</strong> ${createdAtFormatted}</p>
//         <p><strong>Booked Day:</strong> ${bookedDay}</p>
//         <p><strong>Booked Time:</strong> ${bookedTime}</p>
//         <p><strong>Waiver Signed:</strong> ${waiverSigned ? "Yes" : "No"}</p>
//         ${signUrl ? `<img src="${signUrl}" alt="Signature" style="max-width: 100px; margin-top: 10px;">` : ""}
//       </div>
//     `;

//         document.body.appendChild(pdfContent);

//         // Convert HTML to Canvas
//         html2canvas(pdfContent, { scale: 2 }).then((canvas) => {
//             const imgData = canvas.toDataURL("image/png");
//             const pdf = new jsPDF("p", "mm", "a4");

//             pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
//             pdf.save(`styled-booking-${index + 1}.pdf`);

//             document.body.removeChild(pdfContent);
//         });
//     });
// }

// export function generatePDFs(selectedWaivers) {
//     selectedWaivers.forEach((waiver, index) => {
//         const doc = new jsPDF();

//         // Extract data
//         const { order, bookedDay, bookedTime, waivers } = waiver;
//         const createdAtFormatted = new Date(order.createdAt)
//             .toLocaleDateString("en-GB")
//             .replace(/\//g, "-");

//         const waiverSigned = waivers.length > 0;
//         const signUrl = waivers[0]?.signUrl || null;

//         doc.setFont("helvetica", "bold");
//         doc.setFontSize(16);
//         doc.text("Booking Details", 20, 20);

//         doc.setFont("helvetica", "normal");
//         doc.setFontSize(12);
//         doc.text(`Customer ID: ${order.customerId}`, 20, 40);
//         doc.text(`Customer Name: ${order.customerName}`, 20, 50);
//         doc.text(`Customer Email: ${order.email}`, 20, 60);
//         doc.text(`Order ID: ${order.orderId}`, 20, 70);
//         doc.text(`Order Number: ${order.orderNumber}`, 20, 80);
//         doc.text(`Created At: ${createdAtFormatted}`, 20, 90);
//         doc.text(`Booked Day: ${bookedDay}`, 20, 100);
//         doc.text(`Booked Time: ${bookedTime}`, 20, 110);
//         doc.text(`Waiver Signed: ${waiverSigned ? "Yes" : "No"}`, 20, 120);

//         // Add signature if available
//         if (signUrl) {
//             doc.text("Signature:", 20, 140);
//             doc.addImage(signUrl, "PNG", 20, 150, 50, 30);
//         }

//         doc.save(`booking-${index + 1}.pdf`);
//     });
// }

export async function generatePDFs(selectedWaivers) {
  const zip = new JSZip();

const hiddenContainer = document.createElement("div");
hiddenContainer.style.position = "absolute";
hiddenContainer.style.left = "-9999px";
document.body.appendChild(hiddenContainer);

  for (let i = 0; i < selectedWaivers.length; i++) {
    const waiver = selectedWaivers[i];
    const { order, bookedDay, bookedTime, waivers, location } = waiver;
    const createdAtFormatted = new Date(order.createdAt)
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-");

    const signUrl = waivers[0]?.signUrl || null;

    const pdfContent = document.createElement("div");
    pdfContent.style.width = "600px";
    pdfContent.style.padding = "20px";
    pdfContent.style.fontFamily = "Arial, sans-serif";
    pdfContent.innerHTML = `
    <div style="border: 2px solid #000; padding: 20px; background-color: #f9f9f9;">
        <h1 style="margin-bottom: 20px; font-size: 19px; text-align: center;">Puppies&Yoga</h1>
        <div style="text-align: left; padding-left: 20px;">
            <p><strong>Order ID:</strong> ${order.orderId}</p>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Placed:</strong> ${createdAtFormatted}</p>
            <p><strong>Booked Day:</strong> ${bookedDay}</p>
            <p><strong>Booked Time:</strong> ${bookedTime}</p>
            <p><strong>Location:</strong> ${location.name}</p>
        </div>

        <div style="margin-top: 20px; padding: 20px; border-top: 2px solid #000;">
            <h2 style="font-weight: bold; font-size: 18px; text-align: center; margin-bottom: 10px;">Waiver and Release of Liability</h2>

            <h3 style="font-weight: bold;">1. Assumption of Risk:</h3>
            <p>
                I acknowledge that participation in the Puppies & Yoga event organized 
                by AEY PHV (Puppies & Yoga) involves inherent risks, including but not 
                limited to physical injury from yoga practice, interactions with 
                live animals (dogs), potential allergic reactions, and other hazards. 
                I voluntarily assume full responsibility for any risks, injuries, or damages 
                that may occur, whether related to the animals, other participants, or the 
                environment. This assumption of risk extends to any minors I am supervising at this event.
                If I am accompanying a minor, I understand that I am required to sign a separate 
                waiver on behalf of that minor, acknowledging and accepting the same terms and 
                conditions as outlined herein.
            </p>

            <h3 style="font-weight: bold;">2. Indemnification and Release:</h3>
            <p>
                In consideration of being allowed to participate in this event, I
                agree to waive, release, and discharge AEY PHV (Puppies & Yoga), its
                organizers, event facilities, employees, and agents from any and all
                liability, claims, demands, actions, or causes of action whatsoever
                arising out of or related to any loss, damage, or injury, including
                death, that may be sustained by me or any property belonging to me,
                whether caused by the negligence of the releasees or otherwise. This
                release applies to me, my heirs, executors, and administrators. I
                agree not to sue AEY PHV (Puppies & Yoga) or any of the
                aforementioned parties for any losses, damages, expenses, or fees
                that arise out of or result from my attendance at the event.
            </p>

            <h3 style="font-weight: bold;">3. Safety Risks Involving Live Animals:</h3>
            <p>
                I understand and accept the risks associated with the presence of
                live animals (dogs) at the event, including but not limited to the
                possibility of scratching, biting, or other injuries. I agree to
                interact with the animals in a gentle and responsible manner and to
                follow any instructions provided by the organizers or staff. I
                acknowledge that AEY PHV (Puppies & Yoga) cannot control the
                behavior of the animals and that I am responsible for my own safety
                and the safety of any minors I am supervising.
            </p>

            <h3 style="font-weight: bold;">4. Health and Medical Conditions:</h3>
            <p>
                I confirm that I am physically fit and have no medical condition
                that would prevent my participation in this event. I understand that
                yoga and interaction with animals may require physical exertion and
                may not be suitable for everyone. I have consulted with a physician
                if necessary before participating.
            </p>

            <h3 style="font-weight: bold;">5. Photo/Video Release:</h3>
            <p>
                I hereby consent to and authorize AEY PHV (Puppies & Yoga) to use
                any photographs and/or videos taken of me during the event for
                promotional purposes, without compensation. I waive any claims for
                invasion of privacy, defamation, or any other claims based on the
                use of my likeness. All images and digital files are owned by AEY
                PHV (Puppies & Yoga).
            </p>

            <h3 style="font-weight: bold;">6. Governing Law:</h3>
            <p>
                 This waiver and release of liability shall be governed by and
                construed in accordance with the laws of the state/province of the
                studio in which you are attending the class, without regard to its
                conflict of laws principles.
            </p>

            <h3 style="font-weight: bold;">7. Acknowledgment of Understanding:</h3>
            <p>
                I have read this waiver and release of liability, fully understand
                its terms, and understand that I am giving up substantial rights,
                including my right to sue. I acknowledge that I am signing this
                agreement freely and voluntarily, and intend by my signature to be a
                complete and unconditional release of all liability to the greatest
                extent allowed by law.
            </p>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; margin-top: 30px; border-top: 1px solid #000;">
            <div>
                <p>${waivers[0]?.fullName}</p>
                <p><strong>Name:</strong></p>
            </div>
            <div style="text-align: right;">
                ${signUrl ? `<img src="${signUrl}" alt="Signature" style="max-width: 120px; max-height: 50px;">` : "<p>No Signature</p>"}
                <p><strong>Signature:</strong></p>
            </div>
        </div>
    </div>
`;


    hiddenContainer.appendChild(pdfContent);

    const canvas = await html2canvas(pdfContent, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", [210, 470]); 

    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);

    const pdfBlob = pdf.output("blob");

    zip.file(`${order.orderNumber}.pdf`, pdfBlob);
    hiddenContainer.removeChild(pdfContent);
  }

document.body.removeChild(hiddenContainer);

  zip.generateAsync({ type: "blob" }).then((zipBlob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = "Bookings.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}
