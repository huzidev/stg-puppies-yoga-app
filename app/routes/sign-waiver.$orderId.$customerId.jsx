import { redirect } from "@remix-run/node";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import Orders from "../models/Orders.server";
import { authenticate } from "../shopify.server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loader({ request, params }) {
  const { liquid, session, admin } =
    await authenticate.public.appProxy(request);
  const order = new Orders(session.shop, admin.graphql);
  const { orderId, customerId } = params;

  const response = await order.getTicketsByOrderAndCustomerId(
    orderId,
    customerId,
  );
  const tickets = response?.tickets || [];

  const ticketDataJson = JSON.stringify(tickets);

  // const template = readFileSync(
  //   join(__dirname, "../views/sign-waiver-template.liquid"),
  //   "utf8",
  // );

  const template = readFileSync(
    join(process.cwd(), "app/views/sign-waiver-template.liquid"),
    "utf8",
  );

  return liquid(
    `
  <div class="waiver-container">
    <button id="sign-waiver-btn" class="waiver-button">Sign Waiver</button>
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">
            Puppies & Yoga
          </h2>
        </div>

        <div class="waiver-content">
          <h2 class="waiver-heading">Waiver and Release of Liability adasds</h3>
          <h3>
            1. Assumption of Risk:
          </h3>
          <p>
            I acknowledge that participation in the Puppies & Yoga event
            organized by AEY PHV (Puppies & Yoga) involves inherent risks,
            including but not limited to physical injury from yoga practice,
            interactions with live animals (dogs), potential allergic reactions,
            and other hazards. I voluntarily assume full responsibility for any
            risks, injuries, or damages that may occur, whether related to the
            animals, other participants, or the environment. This assumption of
            risk extends to any minors I am supervising at this event. If I am
            accompanying a minor, I understand that I am required to sign a
            separate waiver on behalf of that minor, acknowledging and accepting
            the same terms and conditions as outlined herein.
          </p>
          <h3>
            2. Indemnification and Release:
          </h3>
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

          <h3>
            3. Safety Risks Involving Live Animals:
          </h3>
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

          <h3>
            4. Health and Medical Conditions:
          </h3>
          <p>
            I confirm that I am physically fit and have no medical condition
            that would prevent my participation in this event. I understand that
            yoga and interaction with animals may require physical exertion and
            may not be suitable for everyone. I have consulted with a physician
            if necessary before participating.
          </p>

          <h3>
            5. Photo/Video Release:
          </h3>
          <p>
            I hereby consent to and authorize AEY PHV (Puppies & Yoga) to use
            any photographs and/or videos taken of me during the event for
            promotional purposes, without compensation. I waive any claims for
            invasion of privacy, defamation, or any other claims based on the
            use of my likeness. All images and digital files are owned by AEY
            PHV (Puppies & Yoga).
          </p>

          <h3>
            6. Governing Law:
          </h3>
          <p>
            This waiver and release of liability shall be governed by and
            construed in accordance with the laws of the state/province of the
            studio in which you are attending the class, without regard to its
            conflict of laws principles.
          </p>
          <h3>
            7. Acknowledgment of Understanding:
          </h3>
          <p>
            I have read this waiver and release of liability, fully understand
            its terms, and understand that I am giving up substantial rights,
            including my right to sue. I acknowledge that I am signing this
            agreement freely and voluntarily, and intend by my signature to be a
            complete and unconditional release of all liability to the greatest
            extent allowed by law.
          </p>

          <div class="line-break">
          </div>

          <div id="waiver-details">
          </div>

          <form method="post" action="/apps/sign-waiver/${orderId}/${customerId}" id="signatureForm">
            <input type="hidden" name="orderId" value="${orderId}">
            <input type="hidden" name="customerId" value="${customerId}">
            <input type="hidden" name="ticketId" id="ticketId" />

            <label for="fullName" class="form-label">Full Name</label>
            <input id="fullName" name="fullName" placeholder="Full Name" class="form-input" required />

            <label for="phone" class="form-label">Phone Number</label>
            <input id="phone" name="phone" type="tel" placeholder="Phone Number" class="form-input" required />

            <p class="section-text">Please sign the agreement below:</p>

            <div class="signature-container">
              <div class="date-text-container">
                <span class="date-text">${new Date().toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  },
                )}</span>
              </div>
              <canvas id="signatureCanvas" class="signature-canvas"></canvas>
              <div class="signature-controls">
                <button type="button" class="clear-signature" onclick="clearSignature()">Clear Signature</button>
              </div>
            </div>

            <input type="hidden" name="signature" id="signature" />

            <div class="modal-footer">
              <button type="submit" class="submit-button" disabled>Submit Waiver</button>
            </div>
          </form>

          <div class="navigation-buttons">
            <button id="prevBtn" type="button">Previous</button>
            <button id="nextBtn" type="button">Next</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const tickets = ${ticketDataJson};

    // Flatten tickets by qty into one array of waivers
    const waivers = [];
    tickets.forEach(ticket => {
      for (let i = 0; i < ticket.qty; i++) {
        waivers.push({
          ticketId: ticket.id,
          bookedDay: ticket.bookedDay,
          bookedTime: ticket.bookedTime,
          index: i + 1,
          total: ticket.qty,
          bookedLocation: ticket.studio.title,
        });
      }
    });

    let currentIndex = 0;

    function renderWaiver(index) {
      const waiver = waivers[index];
      document.getElementById('waiver-details').innerHTML = \`
        <p><strong>Booked Location:</strong> \${waiver.bookedLocation}</p>
        <p><strong>Booked Day:</strong> \${waiver.bookedDay}</p>
        <p><strong>Booked Time:</strong> \${waiver.bookedTime}</p>
        <p><strong>Waiver:</strong> \${waiver.index} of \${waiver.total}</p>
      \`;

      document.getElementById('ticketId').value = waiver.ticketId;

      // Update button states
      document.getElementById('prevBtn').disabled = index === 0;
      document.getElementById('nextBtn').disabled = index === waivers.length - 1;

      // Check if waiver already exists
      const existingWaiver = tickets.find(ticket => ticket.id === waiver.ticketId).waivers?.[waiver.index - 1];
      
      if (existingWaiver) {
        // If waiver exists, hide the form and display waiver details
          document.getElementById('signatureForm').style.display = "none";

          document.getElementById('waiver-details').innerHTML += \`
            <div class="waiver-display">
              <div class="waiver-col">
                <span class="value">\${existingWaiver.fullName}</span>
                <span class="label">Full Name</span>
              </div>
              <div class="waiver-col">
                <span class="value">\${existingWaiver.phone}</span>
                <span class="label">Phone</span>
              </div>
              <div class="waiver-col">
                <img src="\${existingWaiver.signUrl}" alt="Signed Waiver" class="signature-img" />
                <span class="label">Signature</span>
              </div>
            </div>
          \`;
      } else {
        // Otherwise, show the signature form
        document.getElementById('signatureForm').style.display = "block";
      }
    }

    document.getElementById('nextBtn').addEventListener('click', () => {
      if (currentIndex < waivers.length - 1) {
        currentIndex++;
        renderWaiver(currentIndex);
      }
    });

    document.getElementById('prevBtn').addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        renderWaiver(currentIndex);
      }
    });

    window.onload = () => {
      renderWaiver(currentIndex);
    };
  </script>
` + template,
  );
}


export async function action({ request, params }) {
  console.log("SW is ACTION PROXY even called");
 const { session, admin } = await authenticate.public.appProxy(request);
 const order = new Orders(session.shop, admin.graphql);

  const { orderId, customerId } = params;
  console.log("SW action methis is called");

  console.log("orderId", orderId);
  console.log("customerId", customerId);

    const formData = await request.formData();

    const fullName = formData.get("fullName")?.toString();
    const phone = formData.get("phone")?.toString();
    const signUrl = formData.get("signature")?.toString();
    const ticketId = formData.get("ticketId")?.toString();

    console.log("Received waiver submission:", {
      orderId,
      customerId,
      fullName,
      phone,
      ticketId,
      signUrl,
    });

    const response = await order.signWaiver(fullName, phone, ticketId, signUrl);

    return redirect(`/apps/sign-waiver/${orderId}/${customerId}`);
}