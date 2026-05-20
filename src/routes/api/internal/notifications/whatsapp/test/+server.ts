import { env } from '$env/dynamic/private';
import { json, type RequestHandler } from '@sveltejs/kit';
import { sendFonnteWhatsappMessage } from '$lib/server/notifications/fonnte';

type TestWhatsappBody = {
  target?: string;
  message?: string;
};

function isAuthorized(request: Request) {
  const expectedSecret = env.WHATSAPP_INTERNAL_SECRET?.trim();

  if (!expectedSecret) {
    return false;
  }

  return request.headers.get('x-internal-secret') === expectedSecret;
}

export const POST: RequestHandler = async ({ request }) => {
  if (!isAuthorized(request)) {
    return json(
      {
        ok: false,
        message: 'Unauthorized.'
      },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as TestWhatsappBody | null;

  if (!body?.target || !body?.message) {
    return json(
      {
        ok: false,
        message: 'target and message are required.'
      },
      { status: 400 }
    );
  }

  const result = await sendFonnteWhatsappMessage({
    target: body.target,
    message: body.message
  });

  return json(result, { status: result.ok ? 200 : result.status });
};
