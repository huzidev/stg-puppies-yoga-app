import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import {
  BlockStack,
  Button,
  Icon,
  InlineStack,
  Page,
  Spinner
} from "@shopify/polaris";
import { ArrowLeftIcon } from "@shopify/polaris-icons";
import { useEffect, useState } from "react";
import Agreement from "../components/Agreement";
import Home from "../components/Home";
import OrderInfoCards from "../components/OrderInfoCards";
import SelectCard from "../components/SelectCard";
import Orders from "../models/Orders.server";
import { authenticate } from "../shopify.server";
import modalStyles from "../styles/modal.css?url";

export const links = () => [{ rel: "stylesheet", href: modalStyles }];

const initialLoadingState = {
  state: false,
  type: "",
};

export async function loader({ request }) {
  const { session, admin } = await authenticate.admin(request);
  const order = new Orders(session.shop, admin.graphql);

  const response = await order.getOrdersData();

  const { locations, studios, bookedTime, bookedDate } = response;

  return json({
    shopUrl: session.shop,
    tickets: [],
    locations,
    bookedDate,
    bookedTime,
    studios,
  });
}

export async function action({ request }) {
  const { session, admin } = await authenticate.admin(request);
  const order = new Orders(session.shop, admin.graphql);
  const contentType = request.headers.get("Content-Type");

  let response;
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const fullName = formData.get("fullName");
    const phone = formData.get("phone");
    const ticketId = formData.get("ticketId");
    const signUrl = formData.get("signUrl");

    response = await order.signWaiver(fullName, phone, ticketId, signUrl);
  } else if (contentType.includes("application")) {
    const {
      action,
      selectedLocation,
      selectedTime,
      selectedDate,
      selectedStudio,
    } = await request.json();

    console.log("SW what is action type??", action);

    if (action === "get-orders") {
      console.log("SW is GET ORDERS CALLED???");

      response = await order.getOrders(
        selectedLocation,
        selectedTime,
        selectedDate,
        selectedStudio,
      );
    } else if (action === "back") {
      return {
        status: 400,
        message: "Back to locations",
        type: "back",
        data: []
      }
    }
  }

  const { status, message, data, type } = response;

  return json({
    status,
    message,
    type,
    data,
  });
}

export default function Index() {
  const [loading, setLoading] = useState({
    state: true,
    type: "fetch-orders",
  });
  const [isWaiver, setIsWaiver] = useState(false);
  const [ticketsOrders, setTicketsOrders] = useState([]);
  const [waiverTickets, setWaiverTickets] = useState([]);
  const [waiverRows, setWaiverRows] = useState([]);
  const { status, locations } = useLoaderData();
  // const [selectedLocation, setSelectedLocation] = useState("");
  const [initialTickets, setInitialTickets] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  // const [selectedStudio, setSelectedStudio] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedStudio, setSelectedStudio] = useState(null);
  const [step, setStep] = useState(0);

  const submit = useSubmit();
  const actionData = useActionData();

  useEffect(() => {
    if (actionData?.type === "export-data" && actionData?.filename) {
      const fileUrl = `/exports/${actionData.filename}`;
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = actionData.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }, [actionData]);

  // function fetchOrders() {
  //   setLoading({
  //     state: true,
  //     type: "fetch-orders",
  //   });
  //   submit(
  //     { action: "fetch-orders" },
  //     { method: "post", encType: "application/json", replace: true },
  //   );
  // }

  useEffect(() => {
    setLoading(initialLoadingState);
  }, [status]);

  useEffect(() => {
    if (actionData?.status && actionData?.type === "tickets-fetched") {
      setLoading(initialLoadingState);
    }
  }, [actionData]);

  function handleWaiverTickets(id, tickets) {
    setLoading({
      state: true,
      type: "waivers",
    });

    new Promise((resolve) => {
      const selectedTickets = tickets.filter((ticket) => ticket.id === id);
      setWaiverTickets(selectedTickets);
      resolve();
    }).then(() => {
      setLoading(initialLoadingState);
      setIsWaiver(true);
    });
  }

  const { state, type } = loading;
  const isOrdersFetching = state && type === "fetch-orders";

  const waivers = ticketsOrders.reduce(
    (acc, order) => {
      acc.totalWaivers += order.qty;
      acc.signedWaivers += order.waivers.length;
      return acc;
    },
    { totalWaivers: 0, signedWaivers: 0 },
  );

  const remainingWaivers = waivers?.totalWaivers - waivers?.signedWaivers;

  function onBack() {
    submit(
      { action: 'back' },
      { method: 'post', encType: 'application/json', replace: true }
    )
  }

  return (
    <Page
      title={
        step === 0 && !selectedLocation ? (
          "Select Location"
        ) : step === 0 && selectedStudio ? (
          <>
            <InlineStack blockAlign="center" gap={100}>
              <Button
                variant="monochromePlain"
                onClick={() => setSelectedLocation(null)}
              >
                <Icon source={ArrowLeftIcon} />
              </Button>
              Select Studio for {selectedLocation?.name}
            </InlineStack>
          </>
        ) : (
          <>
            <InlineStack blockAlign="center" gap={100}>
              <Button
                variant="monochromePlain"
                onClick={() => {
                  setStep(0);
                  setTicketsOrders([]);
                  onBack();
                }}
              >
                <Icon source={ArrowLeftIcon} />
              </Button>
              {selectedLocation?.name}{" "}
              {selectedStudio?.title !== "" ? `- ${selectedStudio?.title}` : ""}
            </InlineStack>
          </>
        )
      }
      fullWidth
    >
      {step !== 0 && selectedStudio && actionData?.status === 200 && (
        <OrderInfoCards
          waiverRows={waiverRows}
          isWaiver={isWaiver}
          ticketsOrders={ticketsOrders}
          waivers={waivers}
        />
      )}
      {isOrdersFetching ? (
        <InlineStack blockAlign="center" align="center">
          <Spinner size="large" />
        </InlineStack>
      ) : (
        <BlockStack gap="200">
          {isWaiver ? (
            <Agreement
              setIsWaiverCallback={setIsWaiver}
              setWaiverTickets={setWaiverTickets}
              waiverTickets={waiverTickets}
              setWaiverRows={setWaiverRows}
              waiverRows={waiverRows}
              setLoading={setLoading}
              loading={loading}
            />
          ) : step === 0 ? (
            <SelectCard
              locations={locations}
              setStep={setStep}
              setSelectedLocation={setSelectedLocation}
              selectedLocation={selectedLocation}
              selectedStudio={selectedStudio}
              setSelectedStudio={setSelectedStudio}
            />
          ) : (
            <Home
              selectedLocation={selectedLocation}
              selectedTime={selectedTime}
              ticketsOrders={ticketsOrders}
              setTicketsOrders={setTicketsOrders}
              selectedStudio={selectedStudio}
              selectedDate={selectedDate}
              setSelectedTime={setSelectedTime}
              setSelectedStudio={setSelectedStudio}
              setSelectedDate={setSelectedDate}
              setSelectedLocation={setSelectedLocation}
              handleWaiverTickets={handleWaiverTickets}
              loading={loading}
              initialTickets={initialTickets}
              setInitialTickets={setInitialTickets}
              setLoading={setLoading}
            />
          )}
        </BlockStack>
      )}
    </Page>
  );
}
