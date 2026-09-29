import "server-only";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";

/**
 * Outbound HTTP for URLs we don't control (project deployments).
 *
 * SSRF defences:
 * - http/https only, no credentials in URLs
 * - every resolved address is checked *inside the socket's lookup*, so the
 *   address we validate is the address we connect to (no DNS rebinding)
 * - private, loopback, link-local, CGNAT, multicast and documentation
 *   ranges are refused (IPv4, IPv6 and IPv4-mapped IPv6)
 * - redirects are followed manually and each hop is re-validated
 * - short timeouts, bodies are never read
 */

export class BlockedAddressError extends Error {}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

const V4_BLOCKED: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function isBlockedV4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  return V4_BLOCKED.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (value & mask) === (ipv4ToInt(base) & mask);
  });
}

function isBlockedV6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lower) ?? /^64:ff9b::(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
  if (mapped) return isBlockedV4(mapped[1]);
  const first = parseInt(lower.split(":")[0] || "0", 16);
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((first & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (lower.startsWith("2001:db8:") || lower.startsWith("2001:0db8:")) return true; // documentation
  return false;
}

export function isBlockedAddress(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isBlockedV4(ip);
  if (family === 6) return isBlockedV6(ip);
  return true;
}

type LookupCallback = (error: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void;

function guardedLookup(hostname: string, options: dns.LookupOptions, callback: LookupCallback): void {
  dns.lookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
    if (error) return callback(error, "");
    const list = addresses as dns.LookupAddress[];
    if (!list.length || list.some((entry) => isBlockedAddress(entry.address))) {
      return callback(new BlockedAddressError(`Refusing to connect to a non-public address for ${hostname}`), "");
    }
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

export type SafeResponse = {
  status: number;
  headers: http.IncomingHttpHeaders;
  finalUrl: URL;
  redirects: number;
};

function requestOnce(url: URL, method: "HEAD" | "GET", timeoutMs: number): Promise<{ status: number; headers: http.IncomingHttpHeaders }> {
  if (net.isIP(url.hostname.replace(/^\[|\]$/g, "")) && isBlockedAddress(url.hostname.replace(/^\[|\]$/g, ""))) {
    return Promise.reject(new BlockedAddressError("Refusing to connect to a non-public address"));
  }
  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        method,
        lookup: guardedLookup as unknown as typeof dns.lookup,
        timeout: timeoutMs,
        headers: {
          "User-Agent": "PortfolioPortal/1.0 (deployment status check)",
          Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        },
      },
      (res) => {
        res.destroy(); // headers are all we need
        resolve({ status: res.statusCode ?? 0, headers: res.headers });
      },
    );
    req.on("timeout", () => req.destroy(new Error("Request timed out")));
    req.on("error", reject);
    req.end();
  });
}

export async function safeRequest(input: string, { timeoutMs = 5000, maxRedirects = 4 } = {}): Promise<SafeResponse> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new BlockedAddressError("Invalid URL");
  }
  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new BlockedAddressError("Unsupported protocol");
    if (url.username || url.password) throw new BlockedAddressError("Credentials in URL are not allowed");

    let response = await requestOnce(url, "HEAD", timeoutMs);
    if (response.status === 405 || response.status === 501) response = await requestOnce(url, "GET", timeoutMs);

    const location = response.headers.location;
    if (response.status >= 300 && response.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }
    return { ...response, finalUrl: url, redirects: hop };
  }
  throw new Error("Too many redirects");
}
