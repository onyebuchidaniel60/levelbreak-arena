import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearExchangeRateCache,
  FALLBACK_EXCHANGE_RATES,
  getExchangeRates,
} from "./exchange-rates";

const logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=nimiq&vs_currencies=usd,eur,ngn";

beforeEach(() => {
  clearExchangeRateCache();
  logger.info.mockReset();
  logger.warn.mockReset();
  logger.error.mockReset();
});

afterEach(() => {
  clearExchangeRateCache();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("exchange rates", () => {
  it("fetches and caches CoinGecko rates for five minutes", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        nimiq: { usd: 0.00025, eur: 0.00023, ngn: 0.65 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = await getExchangeRates(logger);
    const second = await getExchangeRates(logger);

    expect(first).toEqual({ usd: 0.00025, eur: 0.00023, ngn: 0.65 });
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      COINGECKO_URL,
      expect.objectContaining({
        headers: expect.objectContaining({
          accept: "application/json",
          "user-agent": "LevelBreakArena/1.0",
        }),
      }),
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("falls back to realistic defaults and warns when CoinGecko fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = await getExchangeRates(logger);
    const second = await getExchangeRates(logger);

    expect(first).toEqual(FALLBACK_EXCHANGE_RATES);
    expect(second).toEqual(FALLBACK_EXCHANGE_RATES);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "exchange_rate_fallback",
        reason: "provider_or_schema_error",
      }),
      expect.any(String),
    );
  });

  it("falls back when the provider returns an invalid shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ nimiq: { usd: "not-a-number" } }),
      }),
    );

    const rates = await getExchangeRates(logger);

    expect(rates).toEqual(FALLBACK_EXCHANGE_RATES);
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it("refreshes after the five-minute cache window", async () => {
    let now = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          nimiq: { usd: 0.1, eur: 0.2, ngn: 0.3 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          nimiq: { usd: 0.4, eur: 0.5, ngn: 0.6 },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    expect((await getExchangeRates(logger)).usd).toBe(0.1);
    now += 5 * 60_000 - 1;
    expect((await getExchangeRates(logger)).usd).toBe(0.1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    now += 2;
    expect((await getExchangeRates(logger)).usd).toBe(0.4);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
