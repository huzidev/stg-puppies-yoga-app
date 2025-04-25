import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import { loyaltyFetch } from "../lib/loyalty.js";

export async function loader({ request, params }) {
  const url = '/points/adjust';
  const options = {
    method: 'POST',
    headers: {accept: 'application/json', 'content-type': 'application/json'},
    body: JSON.stringify({
      visible_to_customer: true,
      customer_id: 'sdasda',
      point_adjustment_amount: 100,
      apply_adjustment_to_points_earned: false
    })
  };

  const data = await loyaltyFetch(url, {
    method: 'POST',
    body: JSON.stringify({
      visible_to_customer: true,
      customer_id: params.customer_id,
      point_adjustment_amount: 100,
      apply_adjustment_to_points_earned: false
    })
  })


  return cors(request,  json({
    loyalty: true,
    data
  }))


}
