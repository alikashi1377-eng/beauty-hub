import { BusinessItem, ServiceAddonItem, ServiceItem } from '../types';
import { AuthenticatedSessionUser } from '../services/apiClient';

const GENERIC_PLACEHOLDER_DESCRIPTIONS = new Set([
  'خدمت تخصصی سالن زیبایی',
  'خدمت تخصصی زیبایی',
  'خدمات تخصصی سالن زیبایی',
  'خدمات زیبایی',
]);

/**
 * Normalizes a business owner's Instagram handle or URL into a direct Instagram profile URL.
 * Returns null if no valid handle was configured by the business.
 */
export function normalizeInstagramProfileUrl(
  rawHandle?: string | null
): { handle: string; url: string } | null {
  const raw = (rawHandle ?? '').trim();
  if (!raw) return null;

  let extracted = raw;
  const urlMatch = raw.match(
    /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/([^/?#]+)/i
  );
  if (urlMatch?.[1]) {
    extracted = urlMatch[1];
  }

  const handle = extracted.replace(/^@+/, '').replace(/\/+$/, '').trim();
  if (!handle || handle.includes(' ')) return null;

  return {
    handle,
    url: `https://www.instagram.com/${encodeURIComponent(handle)}/`,
  };
}

/**
 * Returns the cleaned custom description if the owner actually provided meaningful details,
 * ignoring empty values or legacy generic system filler text.
 */
export function getMeaningfulServiceDescription(
  service: Pick<ServiceItem, 'description'>
): string {
  const clean = (service.description ?? '').trim();
  if (!clean) return '';
  if (GENERIC_PLACEHOLDER_DESCRIPTIONS.has(clean)) return '';
  return clean;
}

/**
 * Determines whether a service card should render the expandable details ("توضیحات") button.
 * Only true when the owner wrote a real description or defined package stages.
 */
export function shouldShowServiceDetailsTrigger(
  service: Pick<ServiceItem, 'description' | 'packageIncludes'>
): boolean {
  const hasRealDescription = Boolean(getMeaningfulServiceDescription(service));
  const hasPackageItems =
    Array.isArray(service.packageIncludes) &&
    service.packageIncludes.some((item) => Boolean(item && item.trim()));
  return hasRealDescription || hasPackageItems;
}

export function makeServiceAddonKey(serviceId: string, addonId: string): string {
  return `${serviceId}::${addonId}`;
}

export function sanitizeServiceAddons(
  rawAddons: unknown
): ServiceAddonItem[] | undefined {
  if (!Array.isArray(rawAddons)) return undefined;
  const cleaned: ServiceAddonItem[] = [];
  for (let idx = 0; idx < rawAddons.length; idx++) {
    const entry = rawAddons[idx] as Partial<ServiceAddonItem> | null | undefined;
    if (!entry || typeof entry !== 'object') continue;
    const title = String(entry.title ?? '').trim();
    const priceToman = Math.max(0, Math.round(Number(entry.priceToman) || 0));
    const durationMinutes =
      entry.durationMinutes !== undefined && Number(entry.durationMinutes) > 0
        ? Math.min(240, Math.round(Number(entry.durationMinutes)))
        : undefined;
    if (!title) continue;
    cleaned.push({
      id: String(entry.id || `addon-${idx + 1}`).trim(),
      title,
      priceToman,
      ...(durationMinutes ? { durationMinutes } : {}),
    });
  }
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Strips any selected add-on keys whose parent service is no longer selected.
 */
export function pruneOrphanAddonKeys(
  selectedServiceIds: string[],
  selectedAddonKeys: string[]
): string[] {
  if (!selectedAddonKeys.length || !selectedServiceIds.length) return [];
  const validServiceSet = new Set(selectedServiceIds);
  return selectedAddonKeys.filter((key) => {
    const [serviceId] = key.split('::');
    return Boolean(serviceId && validServiceSet.has(serviceId));
  });
}

export interface SelectedAddonDetail {
  key: string;
  serviceId: string;
  addon: ServiceAddonItem;
}

export function resolveSelectedAddonsForServices(
  selectedServices: ServiceItem[],
  selectedAddonKeys?: string[]
): SelectedAddonDetail[] {
  if (!selectedAddonKeys || selectedAddonKeys.length === 0) return [];
  const keySet = new Set(selectedAddonKeys);
  const resolved: SelectedAddonDetail[] = [];

  for (const srv of selectedServices) {
    for (const addon of srv.addons ?? []) {
      const key = makeServiceAddonKey(srv.id, addon.id);
      if (keySet.has(key)) {
        resolved.push({ key, serviceId: srv.id, addon });
      }
    }
  }
  return resolved;
}

function normalizePhoneDigits(phone?: string | null): string {
  if (!phone) return '';
  const eng = phone.replace(/[۰-۹]/g, (d) =>
    String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  );
  const digits = eng.replace(/\D/g, '');
  if (digits.startsWith('98') && digits.length === 12) return `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith('9')) return `0${digits}`;
  return digits;
}

/**
 * Returns true ONLY if the currently authenticated user owns/manages this business
 * (or is platform admin). Regular customers and guests must NOT see the poster download.
 */
export function canDownloadBusinessPoster(params: {
  authUser: AuthenticatedSessionUser | null;
  ownedBusinessId?: string | null;
  business: Pick<BusinessItem, 'id' | 'slug' | 'ownerPhone'>;
}): boolean {
  const { authUser, ownedBusinessId, business } = params;
  if (!authUser) return false;
  if (
    authUser.isPlatformAdmin ||
    authUser.roles?.includes('PLATFORM_ADMIN')
  ) {
    return true;
  }
  if (
    ownedBusinessId &&
    (ownedBusinessId === business.id || ownedBusinessId === business.slug)
  ) {
    return true;
  }
  if (
    Array.isArray(authUser.businessMemberships) &&
    authUser.businessMemberships.some(
      (m) =>
        m.businessId === business.id ||
        m.businessUuid === business.id ||
        m.businessSlug === business.slug
    )
  ) {
    return true;
  }
  const userPhone = normalizePhoneDigits(authUser.phone);
  const ownerPhone = normalizePhoneDigits(business.ownerPhone);
  return Boolean(userPhone && ownerPhone && userPhone === ownerPhone);
}
