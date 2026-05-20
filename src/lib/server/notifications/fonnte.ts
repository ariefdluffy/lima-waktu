import { env } from '$env/dynamic/private';

export type FonnteSendMessageInput = {
  target: string;
  message: string;
  delay?: number;
  countryCode?: string;
};

export type FonnteSendMessageResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

const DEFAULT_FONNTE_API_URL = 'https://api.fonnte.com/send';
const DEFAULT_COUNTRY_CODE = '62';

function isWhatsappEnabled() {
  return env.FONNTE_ENABLED === 'true';
}

function getFonnteToken() {
  return env.FONNTE_API_TOKEN?.trim();
}

function getFonnteApiUrl() {
  return env.FONNTE_API_URL?.trim() || DEFAULT_FONNTE_API_URL;
}

function getDefaultCountryCode() {
  return env.FONNTE_COUNTRY_CODE?.trim() || DEFAULT_COUNTRY_CODE;
}

export function normalizeIndonesianWhatsappNumber(value: string) {
  const number = value.replace(/[^0-9+]/g, '').trim();

  if (number.startsWith('+')) {
    return number.slice(1);
  }

  if (number.startsWith('0')) {
    return `${DEFAULT_COUNTRY_CODE}${number.slice(1)}`;
  }

  return number;
}

export async function sendFonnteWhatsappMessage(input: FonnteSendMessageInput): Promise<FonnteSendMessageResult> {
  if (!isWhatsappEnabled()) {
    return {
      ok: false,
      status: 503,
      data: {
        message: 'WhatsApp notification is disabled. Set FONNTE_ENABLED=true to enable it.'
      }
    };
  }

  const token = getFonnteToken();

  if (!token) {
    return {
      ok: false,
      status: 500,
      data: {
        message: 'FONNTE_API_TOKEN is not configured.'
      }
    };
  }

  const target = normalizeIndonesianWhatsappNumber(input.target);
  const countryCode = input.countryCode || getDefaultCountryCode();

  const formData = new FormData();
  formData.set('target', target);
  formData.set('message', input.message);
  formData.set('countryCode', countryCode);

  if (typeof input.delay === 'number' && input.delay > 0) {
    formData.set('delay', String(input.delay));
  }

  const response = await fetch(getFonnteApiUrl(), {
    method: 'POST',
    headers: {
      Authorization: token
    },
    body: formData
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  return {
    ok: response.ok,
    status: response.status,
    data
  };
}
