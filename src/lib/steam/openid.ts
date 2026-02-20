const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";

export function getSteamOpenIdRedirectUrl(args: {
  returnTo: string;
  realm: string;
}) {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": args.returnTo,
    "openid.realm": args.realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select"
  });
  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

export async function verifySteamOpenIdCallback(searchParams: URLSearchParams) {
  const claimedId = searchParams.get("openid.claimed_id") ?? "";
  const match = claimedId.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/);
  if (!match) {
    return { ok: false as const, error: "Missing/invalid openid.claimed_id" };
  }

  const verificationParams = new URLSearchParams(searchParams);
  verificationParams.set("openid.mode", "check_authentication");

  const res = await fetch(STEAM_OPENID_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: verificationParams.toString()
  });

  if (!res.ok) {
    return { ok: false as const, error: `Steam verification failed: ${res.status}` };
  }

  const body = await res.text();
  const isValid = body.split("\n").some((line) => line.trim() === "is_valid:true");
  if (!isValid) {
    return { ok: false as const, error: "Steam verification returned is_valid:false" };
  }

  return { ok: true as const, steamId: match[1] };
}

