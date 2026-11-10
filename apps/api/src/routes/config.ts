import type { FastifyInstance } from "fastify";
import { getExchangeRates } from "../services/exchange-rates";

export async function registerConfigRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    "/api/config/exchange-rates",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (request) => {
      const rates = await getExchangeRates(request.log);
      return { usd: rates.usd, eur: rates.eur, ngn: rates.ngn };
    },
  );
}
