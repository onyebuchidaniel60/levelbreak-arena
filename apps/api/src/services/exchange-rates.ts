import { z } from "zod";
import type { LoggerLike } from "./sessions";

export type ExchangeRates = {
  usd: number;
  eur: number;
  ngn: number;
};

export const FALLBACK_EXCHANGE_RATES: ExchangeRates = {
  usd: 0.00025,
  eur: 0.00023,
  ngn: 0.65,
};

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=nimiq&vs_currencies=usd,eur,ngn";
const CACHE_TTL_MS = 5 * 60_000;
const REQUEST_TIMEOUT_MS = 5_000;

const CoinGeckoResponse = z.object({
  nimiq: z.object({
    usd: z.number().positive(),
    eur: z.number().positive(),
    ngn: z.number().positive(),
  }),
});

type CacheEntry = {
  rates: ExchangeRates;
  expiresAt: number;
};

let cache: CacheEntry | null = null;
let inFlight: Promise<ExchangeRates> | null = null;

/** Test hook. Production code never needs to clear the cache manually. */
export function clearExchangeRateCache(): void {
  cache = null;
  inFlight = null;
}

async function fetchExchangeRates(logger?: LoggerLike): Promise<ExchangeRates> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(COINGECKO_URL, {
      headers: {
        accept: "application/json",
        "user-agent": "LevelBreakArena/1.0",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`CoinGecko HTTP ${response.status}`);
    }

    const parsed = CoinGeckoResponse.safeParse(await response.json());
    if (!parsed.success) {
      throw new Error("CoinGecko response did not match the expected shape");
    }

    const rates = parsed.data.nimiq;
    cache = { rates, expiresAt: Date.now() + CACHE_TTL_MS };
    return rates;
  } catch (error) {
    logger?.warn(
      {
        event: "exchange_rate_fallback",
        reason:
          error instanceof Error && error.name === "AbortError"
            ? "timeout"
            : "provider_or_schema_error",
      },
      "CoinGecko exchange rate fetch failed; using fallback rates",
    );
    cache = {
      rates: FALLBACK_EXCHANGE_RATES,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    return FALLBACK_EXCHANGE_RATES;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getExchangeRates(
  logger?: LoggerLike,
): Promise<ExchangeRates> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.rates;
  }
  if (inFlight) {
    return inFlight;
  }

  inFlight = fetchExchangeRates(logger).finally(() => {
    inFlight = null;
  });
  return inFlight;
}
