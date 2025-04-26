// This file is intentionally empty
// We're not using a route handler for the auth callback
// Instead, we're using a client-side page component

export async function GET() {
  // This is a no-op route handler
  // The client-side page component will handle the auth callback
  return new Response(null, { status: 204 });
}
