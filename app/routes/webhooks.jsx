import { default as db, default as prisma } from "../db.server";
import Orders from "../models/Orders.server";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);
  const order = new Orders(session.shop, admin.graphql);

  const customerData = {
    customerId: payload?.customer?.id.toString(),
    firstName: payload?.customer?.first_name,
    lastName: payload?.customer?.last_name,
    email: payload?.customer?.email,
  };
  
  const updateOrderData = {
    orderId: payload?.id.toString(),
    status: payload?.cancelled_at ? "Cancelled" : "Active",
  }

  const orderData = {
    ...updateOrderData,
    orderNumber: payload?.name,
    createdAt: payload?.created_at,
  };

  const lineItems =
    payload?.line_items?.map((item) => {
      const variantTitle = item?.variant_title || "";
      const titleParts = variantTitle.split("/").map((str) => str.trim());

      let studioStr;
      let dateStr;
      let timeStr;
      if (titleParts.length === 3) {
        studioStr = titleParts[0];
        dateStr = titleParts[1];
        timeStr = titleParts[2];
      } else if (titleParts.length === 2) {
        studioStr = "";
        dateStr = titleParts[0];
        timeStr = titleParts[1];
      }

      return {
        id: item?.id.toString(),
        title: item?.title,
        variantId: item?.variant_id,
        productId: item?.product_id,
        studioStr,
        dateStr,
        timeStr,
        quantity: item?.quantity
      };
    }) || [];

  if (!admin && topic !== "SHOP_REDACT") {
    // The admin context isn't returned if the webhook fired after a shop was uninstalled.
    // The SHOP_REDACT webhook will be fired up to 48 hours after a shop uninstalls the app.
    // Because of this, no admin context is available.
    throw new Response();
  }

  // The topics handled here should be declared in the shopify.app.toml.
  // More info: https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration
  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }

      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
      break;

    case "ORDERS_PAID":
      console.log("SW Order Paid is called");
      const data = {
        ...customerData,
        ...orderData,
        lineItems,
      };

      const tags = await order.getProductTags(data?.lineItems[0]?.productId);

      await order.createOrder({...data, tags});
      break;

    case "ORDERS_UPDATED":
      const orderId = payload?.id.toString();

      const orderFromDB = await prisma.order.findFirst({
        where: {
          orderId: `gid://shopify/Order/${orderId}`,
        },
      });

      if (orderFromDB) {
        // Perform any necessary operations with the order from the database
        await prisma.order.update({
          where: {
            id: orderFromDB.id,
          },
          data: {
            status: updateOrderData.status,
          },
        });
      } else {
        throw new Error("Order not found in the database");
      }

      break;

    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
