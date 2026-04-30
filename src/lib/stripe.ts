import Stripe from "stripe";
import { getStoreApiKeys } from "./store-settings";

const cache = new Map<string, Stripe>();

/**
 * Retourne un client Stripe si une clé secrète est configurée (DB en priorité,
 * sinon env STRIPE_SECRET_KEY). Renvoie null sinon — permet au reste du code
 * de basculer en mode démo sans crash.
 */
export async function getStripe(): Promise<Stripe | null> {
  const keys = await getStoreApiKeys();
  const secret = keys.stripeSecretKey;
  if (!secret) return null;
  let client = cache.get(secret);
  if (!client) {
    client = new Stripe(secret, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    });
    cache.set(secret, client);
  }
  return client;
}

/** Synchrone : vérifie uniquement l'env (utilisé par les badges UI). */
export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Renvoie le webhook secret côté DB en priorité — utilisé par le handler webhook.
 */
export async function getStripeWebhookSecret(): Promise<string> {
  const keys = await getStoreApiKeys();
  return keys.stripeWebhookSecret;
}
