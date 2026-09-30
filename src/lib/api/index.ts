import { IStorefrontApi } from "./contract";
import { SeniorApiAdapter } from "./adapters/senior/SeniorApiAdapter";
import { OriginalApiAdapter } from "./adapters/original/OriginalApiAdapter";

export * from "./contract";
export * from "./types";
export { SeniorApiAdapter } from "./adapters/senior/SeniorApiAdapter";
export { OriginalApiAdapter } from "./adapters/original/OriginalApiAdapter";

// Singleton instances for client/runtime
let activeStorefrontApi: IStorefrontApi | null = null;

export function getStorefrontApi(providerOverride?: "senior" | "original"): IStorefrontApi {
  const provider =
    providerOverride ||
    (process.env.NEXT_PUBLIC_BACKEND_PROVIDER as "senior" | "original") ||
    "senior";

  if (activeStorefrontApi && activeStorefrontApi.provider === provider && !providerOverride) {
    return activeStorefrontApi;
  }

  const instance =
    provider === "original"
      ? new OriginalApiAdapter()
      : new SeniorApiAdapter();

  if (!providerOverride) {
    activeStorefrontApi = instance;
  }

  return instance;
}

export const storefrontApi = getStorefrontApi();
