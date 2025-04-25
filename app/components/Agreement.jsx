import { useActionData } from "@remix-run/react";
import {
  Box,
  Button,
  DataTable,
  Icon,
  InlineStack,
  Text,
} from "@shopify/polaris";
import { ArrowLeftIcon } from "@shopify/polaris-icons";
import { useEffect, useState } from "react";
import { MyModal } from "./Modal";

export default function Agreement({
  setIsWaiverCallback,
  waiverTickets,
  setWaiverTickets,
  waiverRows,
  setWaiverRows,
  setLoading,
  loading,
}) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [signUrl, setSignUrl] = useState("");
  const [isShowAgreement, setShowAgreement] = useState(false);
  let actionData = useActionData();
  const [waiverSigned, setWaiverSigned] = useState(false);

  console.log("SW what is waiverTickets", waiverTickets);
  

  const updateWaiverRows = (tickets) => {
    return tickets.flatMap((ticket) => {
      const signedWaivers = ticket.waivers?.filter(
        (w) => w.ticketId === ticket.id,
      );

      const signedCount = signedWaivers.length;
      const remainingQty = ticket.qty - signedCount;
      
      const rows = [];

      signedWaivers.forEach((waiver) => {
        rows.push([
          waiver.fullName,
          ticket.bookedDay,
          ticket.bookedTime,
          <Button
            variant="plain"
            onClick={() => {
              setModalOpen(true);
              setTicketId(ticket.id);
              setFullName(waiver.fullName);
              setPhone(waiver.phone);
              setSignUrl(waiver.signUrl);
              setShowAgreement(true);
            }}
          >
            Show Agreement
          </Button>,
        ]);
      });

      for (let i = 0; i < remainingQty; i++) {
        rows.push([
          "",
          ticket.bookedDay,
          ticket.bookedTime,
          <Button
            variant="plain"
            onClick={() => {
              setModalOpen(true);
              setTicketId(ticket.id);
              setFullName(ticket?.order?.customerName);
              setPhone("")
              setSignUrl("");
              setShowAgreement(false);
            }}
          >
            Sign Agreement
          </Button>,
        ]);
      }
      return rows;
    });
  };

  useEffect(() => {
    if (!loading.state) {
      if (!!waiverTickets.length) {
        setWaiverRows(updateWaiverRows(waiverTickets));
      }

      if (actionData && actionData.status === 200 && !!waiverSigned) {
        const waiverId = actionData.data.ticketId;

        const isWaiverSigned = waiverTickets[0].waivers.find(
          (waiver) => waiver.id === actionData?.data?.id,
        );

        const ticketIndex = waiverTickets.findIndex(
          (ticket) => ticket.id === waiverId,
        );

        if (!isWaiverSigned) {
          const updatedWaiver = {
            id: actionData.data.id,
            fullName: actionData.data.fullName,
            signUrl: actionData.data.signUrl,
            ticketId: waiverId,
          };

          waiverTickets[ticketIndex].waivers = [
            ...(waiverTickets[ticketIndex].waivers || []),
            updatedWaiver,
          ];

          setWaiverRows(updateWaiverRows(waiverTickets));
        }
      }
    }
  }, [waiverTickets, actionData, waiverSigned, loading]);

  function handleBack() {
    setWaiverTickets([]); 
    actionData = null;
    setWaiverSigned(false);
    setIsWaiverCallback(false);
  }

  return (
    <>
      <InlineStack gap="100" blockAlign="center">
        <Box style={{ cursor: "pointer" }} onClick={handleBack}>
          <Icon source={ArrowLeftIcon} tone="base" />
        </Box>
        <Text variant="headingLg" as="h2">
          Agreements
        </Text>
      </InlineStack>
      <DataTable
        columnContentTypes={["text", "text", "text", "text", "text"]}
        headings={["Full Name", "Booked Day", "Booked Time", "Action"]}
        rows={waiverRows}
      />
      {isModalOpen && (
        <MyModal
          setLoading={setLoading}
          setWaiverSigned={setWaiverSigned}
          loading={loading}
          isModalOpen={isModalOpen}
          fullName={fullName}
          setFullName={setFullName}
          signUrl={signUrl}
          setPhone={setPhone}
          phone={phone}
          setSignUrl={setSignUrl}
          ticketId={ticketId}
          isShowAgreement={isShowAgreement}
          setModalOpen={setModalOpen}
        />
      )}
    </>
  );
}
