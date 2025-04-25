import { json } from "@remix-run/node";
import { useSubmit } from "@remix-run/react";
import { Button, InlineStack } from "@shopify/polaris";
import React from "react";
import Orders from "../models/Orders.server";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  const { session, admin } = await authenticate.admin(request);
  const order = new Orders(session.shop, admin.graphql);

  const { action } = await request.json();

  const response = await order.fetchOrdersByChunks(action);

  return json({
    ...response,
  });
}

export default function fetchButtons() {
  const submit = useSubmit();

  function fetchOrders(type) {
    submit(
      {
        action: type,
      },
      { method: "post", encType: "application/json", replace: true },
    );
  }

  return (
    <Card>
      <InlineStack>
        <Button onClick={() => fetchOrders(39000)} primary>
          Fetch 39k onwards
        </Button>
        <Button onClick={() => fetchOrders(36000)} primary>
          Fetch 36k onwards
        </Button>
        <Button onClick={() => fetchOrders(33000)} primary>
          Fetch 33k onwards
        </Button>
        <Button onClick={() => fetchOrders(30000)} primary>
          Fetch 30k onwards
        </Button>
      </InlineStack>
    </Card>
  );
}
