import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";

export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, ngrok-skip-browser-warning",
      },
    });
  }
  throw new Response("Method Not Allowed", { status: 405 });
};

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return cors(request, json(null, { status: 204 }));
  }

  const hostUrl = `https://loyalty.yotpo.com/api/v2/actions`;
  const { action_name, customer_id } = await request.json();

  const presetOptions = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-api-key": "uRm0ChKy83E9Nv8vpyfSVwtt",
      "x-guid": "BzF8sjGngCKD1Vo4HiQPEQ",
    },
    body: JSON.stringify({
      action_name,
      customer_id,
      type: "CustomAction",
    }),
  };

  try {
    const loyaltyData = await fetch(hostUrl, presetOptions).then((res) =>
      res.json(),
    );

    if (loyaltyData) {
      return cors(request, json(loyaltyData));
    }
  } catch (err) {
    console.error("Error fetching loyalty data (Remix):", err);
    return cors(
      request,
      json(
        {
          error: "Failed to fetch loyalty data",
        },
        {
          status: 500,
        },
      ),
    );
  }
  return cors(
    request,
    json({
      loyalty: true,
    }),
  );
}
