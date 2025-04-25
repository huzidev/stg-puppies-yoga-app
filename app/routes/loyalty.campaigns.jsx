import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import { loyaltyFetch } from "../lib/loyalty.js";

export async function loader({ request }) {
  console.log("SW is request called??");
  
  const loyaltyData = await loyaltyFetch(
    `/campaigns`,
  )
    .then((res) => res.json())
    .catch((err) => console.error(err));

  if(loyaltyData) {
    return cors(request, json(loyaltyData))
  }

  return cors(request,  json({
    loyalty: true
  }))
}
