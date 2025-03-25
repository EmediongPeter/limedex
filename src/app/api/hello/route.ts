export async function GET(request: Request) {
  const _ = [
    "https://ultra-api.jup.ag/order?inputMint=So11111111111111111111111111111111111111112&outputMint=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB&amount=1000000000",
    "https://fe-api.jup.ag/api/v1/tokens/search?query=",
    
  ]
  return new Response('Hello, from API!')
}
