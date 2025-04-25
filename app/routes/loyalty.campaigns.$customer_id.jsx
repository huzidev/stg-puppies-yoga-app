import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import { loyaltyFetch } from "../lib/loyalty.js";

export async function loader({ request, params }) {
  const loyaltyData = await loyaltyFetch(
    `/campaigns?customer_id=${params.customer_id}&country_iso_code=null&with_referral_code=false&with_history=true&with_status=true`,
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
