import { BlockStack, Box, Card, InlineStack, Text } from "@shopify/polaris";
import React from "react";

export default function OrderInfoCards({ isWaiver, waivers, waiverRows ,ticketsOrders }) {
  const { totalWaivers, signedWaivers } = waivers;
  const remainingWaivers = totalWaivers - signedWaivers;

  return (
    <Box paddingBlockEnd="200">
      <InlineStack gap="200">
        <Card>
          <BlockStack inlineAlign="center" gap="100">
            <Text as="h3" variant="headingSm">
              Order Placed
            </Text>
            <Text as="h3" variant="headingSm">
              {isWaiver
                ? `${waiverRows.length} Waivers`
                : `${totalWaivers} Tickets`}
            </Text>
          </BlockStack>
        </Card>

        <Card>
          <Text as="h3" variant="headingSm">
            Signed Waivers: {signedWaivers}
          </Text>
        </Card>

        <Card>
          <Text as="h3" variant="headingSm">
            Remaining Waivers : {remainingWaivers}
          </Text>
        </Card>
      </InlineStack>
    </Box>
  );
}
