import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import {
  Badge,
  Card,
  ChoiceList,
  IndexFilters,
  IndexTable,
  InlineStack,
  Page,
  Spinner,
  Text,
  useIndexResourceState,
  useSetIndexFiltersMode
} from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";
import { generatePDFs } from "../lib/pdfGenerator";
import Orders from "../models/Orders.server";
import { authenticate } from "../shopify.server";
import { signedWaiversResourceName, signedWaiversTableHeadings } from "../utils/data";

export async function loader({ request }) {
  const { session, admin } = await authenticate.admin(request);
  const order = new Orders(session.shop, admin.graphql);
  
  const locations = await order.getLocations();
  const response = await order.getSignedWaivers(null, "");

  return json({
    ...response,
    locations,
  });
}

export async function action({ request }) {
  const { session, admin } = await authenticate.admin(request);
  const order = new Orders(session.shop, admin.graphql);

  const { cursor, query, action, ticketIds } = await request.json();

  console.log("SW query in action", query);
  
  let response;
  if (action === LoadingState.SEARCHING || action === LoadingState.FETCHING) {
    response = await order.getSignedWaivers(null, query);
  } else {
    response = await order.markTicketsAsDownloaded(ticketIds);
  }

  return json({
    ...response
  });
}

const initialLoadingState = {
  state: false,
  type: "",
};

const LoadingState = {
  DOWNLOADING: "downloading-pdf",
  FETCHING: "fetch-tickets",
  SEARCHING: "search",
}

export default function SignedWaivers() {
  const [loading, setLoading] = useState({
    state: true,
    type: LoadingState.FETCHING
  });
  const submit = useSubmit();
  const { status, locations, data, hasNext, nextCursor } = useLoaderData();
  const [filteredWaivers, setFilteredWaivers] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [queryValue, setQueryValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [waivers, setWaivers] = useState([]);
  const [nextPageCursor, setNextPageCursor] = useState(null);
  const [searchedWaivers, setSearchedWaivers] = useState([]);
  const [fetchType, setFetchType] = useState("");
  const [hasNextPage, setHasNextPage] = useState(true);
  const actionData = useActionData();
  const startIndex = (currentPage - 1) * 100;
  const endIndex = startIndex + 100;

  useEffect(() => {
    if (status === 200) {
      console.log("SW is loader useEffect called?");

      setWaivers(data);
      setNextPageCursor(nextCursor);
      setHasNextPage(hasNext);
      setFilteredWaivers(data);
    }
    setLoading(initialLoadingState);
  }, [status]);

  useEffect(() => {
    if (actionData?.status === 200) {
      if (actionData?.type === "search") {
        setFetchType("search");
        setFilteredWaivers(actionData?.data);
        setSearchedWaivers((prev) => [...prev, ...actionData?.data]);
      } else if (actionData?.type === "pagination") {
        setFetchType("pagination");
        setNextPageCursor(actionData?.nextCursor);
        setHasNextPage(actionData?.hasNext);
        setWaivers((prev) => [...prev, ...actionData?.data]);
        setFilteredWaivers((prev) => [...prev, ...actionData?.data]);
      } else {
        setWaivers((prev) => {
          const updatedWaivers = prev.map((waiver) => {
            if (actionData?.data?.includes(waiver.id)) {
              return {
                ...waiver,
                ticketDownload: true,
              };
            }
            return waiver;
          });
          return updatedWaivers;
        });
        setFilteredWaivers((prev) => {
          const updatedWaivers = prev.map((waiver) => {
            if (actionData?.data.includes(waiver.id)) {
              return {
                ...waiver,
                ticketDownload: true,
              };
            }
            return waiver;
          });
          return updatedWaivers;
        });
      }
    }
    setLoading(initialLoadingState);
  }, [actionData]);

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(waivers);

  console.log("SW what is data for waivers?", waivers);
  
  const rowMarkup = filteredWaivers
    .slice(startIndex, endIndex)
    .map(({ id, order, location, waivers, ticketDownload }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>{id}</IndexTable.Cell>
        <IndexTable.Cell>{order?.orderNumber}</IndexTable.Cell>
        <IndexTable.Cell>{location?.name}</IndexTable.Cell>
        <IndexTable.Cell>{waivers[0]?.fullName || "N/A"}</IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={ticketDownload ? "success" : "attention"}>
            {ticketDownload ? "Yes" : "No"}
          </Badge>
        </IndexTable.Cell>
      </IndexTable.Row>
    ));

  const handleQueryChange = useCallback(
    (value) => {
      setQueryValue(value);

      const sourceData = fetchType === "search" ? actionData?.data : waivers;

      const filtered = sourceData?.filter(
        ({ location, order }) =>
          location?.name.toLowerCase().includes(value.toLowerCase()) ||
          order?.orderNumber.toLowerCase().includes(value.toLowerCase()),
      );

      setFilteredWaivers(filtered);
    },
    [waivers, fetchType, actionData],
  );

  // Reset Search
  const handleCancel = () => {
    setQueryValue("");
    setFetchType("");
    setFilteredWaivers(waivers);
  };

  useEffect(() => {
    if (selectedLocations.length > 0) {
      setFilteredWaivers(
        waivers.filter((waiver) =>
          selectedLocations.includes(String(waiver.location.id)),
        ),
      );
    } else {
      setFilteredWaivers(waivers);
    }
  }, [selectedLocations, waivers]);

  function handleLocationsChange(value) {
    setSelectedLocations(value);
  }

  const filters = [
    {
      key: "location",
      label: "Location",
      filter: (
        <ChoiceList
          title="Location"
          titleHidden
          choices={locations.map((loc) => ({
            label: loc.name,
            value: String(loc.id),
          }))}
          selected={selectedLocations || []}
          onChange={handleLocationsChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  function onNext() {
    console.log("SW next page called??");
    if (!hasNextPage) return;
    setFetchType("pagination");

    const newPage = currentPage + 1;
    setCurrentPage(newPage);

    if (currentPage < totalPages) { 
      // const startIdx = (currentPage - 1) * 100;

      const totalWaivers = waivers?.length;
      const nextDataSize = totalWaivers + 100;
      setFilteredWaivers(waivers.slice(0, nextDataSize));

      // setFilteredWaivers(waivers?.slice(startIdx, startIdx + 100));
    } else {
      setLoading({
        state: true,
        type: LoadingState.FETCHING,
      });
      setTotalPages((prev) => prev + 1);
      submit(
        { cursor: nextPageCursor, query: null, action: LoadingState.FETCHING },
        { method: "post", encType: "application/json", replace: true },
      );
    }
  }

  function onPrev() {
    if (currentPage === 1) return;
    setFetchType("pagination");

    setCurrentPage((prev) => prev - 1);

    const totalWaivers = waivers?.length;
    const prevDataSize = totalWaivers - 100; 
    setFilteredWaivers(waivers.slice(0, prevDataSize));
  }

  function searchQuery() {
    setLoading({
      state: true,
      type: LoadingState.SEARCHING,
    });
    setFetchType("search");
    submit(
      { cursor: null, query: queryValue, action: LoadingState.SEARCHING },
      { method: "post", encType: "application/json", replace: true },
    );
  }

  const { mode, setMode } = useSetIndexFiltersMode();

  async function downloadPDFs() {
    setLoading({
      state: true,
      type: LoadingState.DOWNLOADING,
    });

    // Merge and remove duplicates based on 'id'
    const combinedWaivers = [
      ...new Map(
        [...waivers, ...searchedWaivers].map((w) => [w.id, w]),
      ).values(),
    ];

    // Filter selected waivers
    const selectedWaivers = combinedWaivers.filter((waiver) =>
      selectedResources.includes(waiver.id),
    );

    // Extract ticket IDs where ticketDownload is null
    // const ticketIds = selectedWaivers
    //   .filter((waiver) => !waiver.ticketDownload)
    //   .map((waiver) => waiver.id);

    const ticketIds = selectedWaivers
      .map((waiver) => waiver.id);

    await generatePDFs(selectedWaivers);
    setLoading(initialLoadingState);

    if (ticketIds.length > 0) {
      submit(
        { ticketIds, action: LoadingState.DOWNLOADING },
        { method: "post", encType: "application/json", replace: true },
      );
    }
  }


  const { state, type } = loading
  const isFetching = state && type === LoadingState.FETCHING;
  const isSearching = state && type === LoadingState.SEARCHING;
  return (
    <Page
      title="Signed Waivers"
      primaryAction={{
        loading: isSearching,
        disabled: !queryValue || isSearching,
        content: "Search Ticket",
        onAction: () => searchQuery(),
      }}
      secondaryActions={[
        {
          loading: state && type === LoadingState.DOWNLOADING,
          content: "Download PDfs",
          disabled: !selectedResources.length,
          onAction: () => downloadPDFs(),
        },
      ]}
      fullWidth
    >
      <Card>
        {isFetching || isSearching ? (
          <InlineStack align="center">
            <Spinner />
          </InlineStack>
        ) : (
          <>
            <IndexFilters
              queryValue={queryValue}
              queryPlaceholder="Search by Order Number or Location"
              onQueryChange={handleQueryChange}
              onQueryClear={handleCancel}
              tabs={[]}
              filters={filters}
              cancelAction={{
                onAction: handleCancel,
                disabled: false,
                loading: false,
              }}
              mode={mode}
              setMode={setMode}
            />
            {filteredWaivers?.length ? (
              <IndexTable
                resourceName={signedWaiversResourceName}
                itemCount={filteredWaivers?.length}
                selectedItemsCount={
                  allResourcesSelected ? "All" : selectedResources?.length
                }
                onSelectionChange={handleSelectionChange}
                headings={signedWaiversTableHeadings}
                selectable={true}
                pagination={{
                  hasNext: fetchType === "search" ? false : hasNextPage,
                  onNext: () => onNext(),
                  hasPrevious: fetchType === "search" ? false : currentPage > 1,
                  onPrevious: onPrev,
                }}
              >
                {rowMarkup}
              </IndexTable>
            ) : (
              <Text>No signed waivers found</Text>
            )}
          </>
        )}
      </Card>
    </Page>
  );
}
