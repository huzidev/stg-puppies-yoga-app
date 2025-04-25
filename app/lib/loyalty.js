const presetOptions = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    'x-api-key': "uRm0ChKy83E9Nv8vpyfSVwtt",
    'x-guid' : "BzF8sjGngCKD1Vo4HiQPEQ"
  }
};
  
export function loyaltyFetch(url, options={}) {
  const hostUrl = `https://loyalty.yotpo.com/api/v2${url}`;

  return fetch(hostUrl, {
    ...presetOptions,
    ...options
  })
}
