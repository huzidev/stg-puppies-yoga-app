import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import {
  Badge,
  Box,
  Button,
  Card,
  IndexFilters,
  IndexTable,
  InlineStack,
  Link,
  Spinner,
  Text,
  useIndexResourceState,
  useSetIndexFiltersMode
} from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";
import { tableHeadings, tableResourceName } from "../utils/data";

const initialLoadingState = {
  state: false,
  type: "",
};

export default function Shadow({
  ticketsOrders,
  setTicketsOrders,
  handleWaiverTickets,
  selectedLocation,
  selectedTime,
  selectedDate,
  setSelectedTime,
  selectedStudio,
  setSelectedDate,
  initialTickets,
  setInitialTickets,
  setLoading,
  loading,
}) {
  const [queryValue, setQueryValue] = useState("");
  const { mode, setMode } = useSetIndexFiltersMode();
  const submit = useSubmit();
  const { locations } =
    useLoaderData();
  const actionData = useActionData();

  console.log("SW selected location", selectedLocation);
  console.log("SW selected studio", selectedStudio);

  console.log("SW actionData total", actionData?.length);

  useEffect(() => {
    if (actionData?.type === "tickets-fetched") {
      if (!!actionData?.status) {
        shopify.toast.show(actionData?.message);
        setLoading(initialLoadingState);
      }
      setTicketsOrders(actionData?.data);
      setInitialTickets(actionData?.data);
    } else {
      if (actionData?.status === 404) {
        shopify.toast.show(actionData?.message);
        setTicketsOrders([]);
        setLoading(false);
      }
    }
  }, [actionData]);

  const handleQueryChange = useCallback(
    (value) => {
      setQueryValue(value);

      const filteredTickets = initialTickets?.filter((val) =>
        val.order.customerName.toLowerCase().includes(value.toLowerCase()),
      );

      setTicketsOrders(filteredTickets);
    },
    [setQueryValue, ticketsOrders],
  );

  function handleCancel() {
    setQueryValue("");
    setTicketsOrders(initialTickets);
  }

  const locationOptions = [
    { label: "All Locations", value: "" },
    ...locations?.map((location) => ({
      label: location.name,
      value: location.id.toString(),
    })),
  ];

   const { selectedResources, allResourcesSelected, handleSelectionChange } =
     useIndexResourceState(ticketsOrders);

  const rowMarkup = ticketsOrders?.map((ticket, index) => {
    const { id, bookedDay, bookedTime, qty, order } = ticket;

    const orderDate = new Date(order.createdAt).toDateString();
    const location = locationOptions.find(
      (val) => val.value === ticket.locationId.toString(),
    )?.label;

    const orderIdStr = order.orderId.replace("gid://shopify/Order/", "");

    return (
      <IndexTable.Row
        selected={selectedResources.includes(id)}
        id={id}
        key={id}
        position={index}
      >
        <IndexTable.Cell>
          <Text as="p">{order.customerName}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="p">{location}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="p">{qty}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="p">{bookedDay}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="p">{bookedTime}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={order.status === "Active" ? "success" : "critical"}>
            {order.status}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="p">
            {order.oldStore ? (
              order.orderNumber
            ) : (
              <Link
                url={`https://puppies-yoga.com/admin/orders/${orderIdStr}`}
                target="_top"
              >
                {order.orderNumber}
              </Link>
            )}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="p">{orderDate}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={order.oldStore ? "critical" : "success"}>
            {order.oldStore ? "Yes" : "No"}
          </Badge>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  const isQuerySelected = !!selectedTime && !!selectedDate;

  console.log("SW selected location", selectedLocation);
  console.log("SW selected studio", selectedStudio);

  function getOrders() {
    setLoading({
      state: true,
      type: "get-orders-shadow",
    });

    const selectedDateIds = [496, 529];
    const selectedTimeIds = [1, 2, 3, 4, 5, 6, 7, 8, 34, 67, 68];

    submit(
      {
        selectedLocation: selectedLocation?.id,
        selectedTime: selectedTimeIds,
        selectedDate: selectedDateIds,
        selectedStudio: selectedStudio?.id,
        action: "get-orders-shadow",
      },
      { method: "post", encType: "application/json", replace: true },
    );
  }
  const { state, type } = loading;
  const isLoading = state && type === "get-orders-shadow";

  return (
    <>
      <Card>
        <InlineStack blockAlign="center" align="space-between">
          <InlineStack blockAlign="center" gap="400">
            <Text as="h2" variant="headingMd">
              This is shadow orders page to get only Weekend orders
            </Text>
          </InlineStack>
          <Box>
            <Button
              onClick={getOrders}
              // disabled={!isQuerySelected || isLoading}
              size="large"
              variant="primary"
            >
              Search
            </Button>
          </Box>
        </InlineStack>
      </Card>
      <IndexFilters
        queryValue={queryValue}
        queryPlaceholder="Search by order"
        onQueryChange={handleQueryChange}
        onQueryClear={() => setQueryValue("")}
        tabs={[]}
        cancelAction={{
          onAction: () => handleCancel(),
          disabled: false,
          loading: false,
        }}
        mode={mode}
        setMode={setMode}
        filters={[]}
      />
      {isLoading ? (
        <InlineStack align="center">
          <Spinner />
        </InlineStack>
      ) : (
        <IndexTable
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          selectable={true}
          resourceName={tableResourceName}
          itemCount={ticketsOrders?.length || 0}
          headings={tableHeadings}
        >
          {rowMarkup}
        </IndexTable>
      )}
    </>
  );
}
