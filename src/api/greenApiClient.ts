const GREEN_API_URL = import.meta.env.VITE_GREEN_API_URL;

if (!GREEN_API_URL) {
  throw new Error(
    "VITE_GREEN_API_URL is not set. Copy .env.example to .env and fill in your GREEN-API instance host.",
  );
}

async function readJson<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

const RETRYABLE_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 600;

async function fetchWithRetry(
  url: string,
  init?: RequestInit,
): Promise<Response | null> {
  for (let attempt = 0; attempt < RETRYABLE_ATTEMPTS; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch {
      return null;
    }

    const isLastAttempt = attempt === RETRYABLE_ATTEMPTS - 1;
    if (response.status !== 429 || isLastAttempt) {
      return response;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, RETRY_BASE_DELAY_MS * 2 ** attempt),
    );
  }

  return null;
}

function requestKey(url: string, init?: RequestInit): string {
  const method = init?.method ?? "GET";
  const body = typeof init?.body === "string" ? init.body : "";
  return `${method} ${url} ${body}`;
}

const inFlightRequests = new Map<string, Promise<unknown>>();
// Идемпотентная чтобы не обрабатывать  в useEffect
function dedupeInFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = run().finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, promise);
  return promise;
}

export type GreenApiCredentials = {
  idInstance: string;
  apiTokenInstance: string;
};

export type StateInstance =
  | "authorized"
  | "notAuthorized"
  | "blocked"
  | "suspended"
  | "starting"
  | "pendingPassword";

export type GreenApiAuthError =
  | { type: "invalidIdInstance" }
  | { type: "invalidApiTokenInstance" }
  | { type: "serviceUnavailable" };

// 401/403 mean the credentials themselves are bad (wrong/revoked token,
// wrong/deauthorized instance) — distinct from a transient failure, and
// worth telling the caller apart from "try again later" so the UI can react
// (log out instead of just showing a generic error). Everything else that
// isn't `response.ok` collapses to `serviceUnavailable`.
function classifyHttpError(response: Response): GreenApiAuthError {
  if (response.status === 401) {
    return { type: "invalidApiTokenInstance" };
  }
  if (response.status === 403) {
    return { type: "invalidIdInstance" };
  }
  return { type: "serviceUnavailable" };
}

export type GetStateInstanceResult =
  | { ok: true; state: StateInstance }
  | { ok: false; error: GreenApiAuthError };

export async function getStateInstance(
  credentials: GreenApiCredentials,
): Promise<GetStateInstanceResult> {
  const { idInstance, apiTokenInstance } = credentials;
  const url = `${GREEN_API_URL}/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`;

  const response = await fetchWithRetry(url);
  if (!response) {
    return { ok: false, error: { type: "serviceUnavailable" } };
  }

  if (!response.ok) {
    return { ok: false, error: classifyHttpError(response) };
  }

  const body = await readJson<{ stateInstance: StateInstance }>(response);
  if (!body) {
    return { ok: false, error: { type: "serviceUnavailable" } };
  }
  return { ok: true, state: body.stateInstance };
}

export type CheckAccountParams = { phoneNumber: number } | { username: string };

export type CheckAccountResult =
  | { ok: true; exist: true; chatId: string }
  | { ok: true; exist: false }
  | { ok: false; error: GreenApiAuthError };

export async function checkAccount(
  credentials: GreenApiCredentials,
  params: CheckAccountParams,
): Promise<CheckAccountResult> {
  const { idInstance, apiTokenInstance } = credentials;
  const url = `${GREEN_API_URL}/waInstance${idInstance}/checkAccount/${apiTokenInstance}`;

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response) {
    return { ok: false, error: { type: "serviceUnavailable" } };
  }

  if (!response.ok) {
    return { ok: false, error: classifyHttpError(response) };
  }

  const body = await readJson<{ exist: boolean; chatId?: string }>(response);
  if (!body) {
    return { ok: false, error: { type: "serviceUnavailable" } };
  }
  if (!body.exist || !body.chatId) {
    return { ok: true, exist: false };
  }
  return { ok: true, exist: true, chatId: body.chatId };
}

export type SendMessageParams = {
  chatId: string;
  message: string;
  quotedMessageId?: string;
};

export type SendMessageResult =
  | { ok: true; idMessage: string }
  | { ok: false; error: GreenApiAuthError };

// Deliberately not wrapped in `dedupeInFlight`: two deliberate sends of the
// same text to the same chat are a legitimate case (user types "ok" twice),
// not a redundant re-fetch of the same data — coalescing by (url+body)
// would silently drop the second message.
export async function sendMessage(
  credentials: GreenApiCredentials,
  params: SendMessageParams,
): Promise<SendMessageResult> {
  const { idInstance, apiTokenInstance } = credentials;
  const url = `${GREEN_API_URL}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response) {
    return { ok: false, error: { type: "serviceUnavailable" } };
  }

  if (!response.ok) {
    return { ok: false, error: classifyHttpError(response) };
  }

  const body = await readJson<{ idMessage: string }>(response);
  if (!body) {
    return { ok: false, error: { type: "serviceUnavailable" } };
  }
  return { ok: true, idMessage: body.idMessage };
}

export type GetChatHistoryResult =
  | {
    ok: true;
    messages: { id: string; author: "me" | "them"; text: string }[];
  }
  | { ok: false; error: GreenApiAuthError };

export function getChatHistory(
  credentials: GreenApiCredentials,
  chatId: string,
): Promise<GetChatHistoryResult> {
  const { idInstance, apiTokenInstance } = credentials;
  const url = `${GREEN_API_URL}/waInstance${idInstance}/getChatHistory/${apiTokenInstance}`;
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId }),
  };

  return dedupeInFlight(requestKey(url, init), () =>
    fetchChatHistory(url, init),
  );
}

async function fetchChatHistory(
  url: string,
  init: RequestInit,
): Promise<GetChatHistoryResult> {
  const response = await fetchWithRetry(url, init);
  if (!response) {
    return { ok: false, error: { type: "serviceUnavailable" } };
  }

  if (!response.ok) {
    return { ok: false, error: classifyHttpError(response) };
  }

  const body = await readJson<
    Array<{
      type?: "incoming" | "outgoing";
      idMessage?: string;
      timestamp?: number;
      typeMessage?: string;
      textMessage?: string;
      extendedTextMessage?: string;
    }>
  >(response);
  if (!body) {
    return { ok: false, error: { type: "serviceUnavailable" } };
  }

  const messages = body
    .filter(
      (item) =>
        item.typeMessage === "textMessage" ||
        item.typeMessage === "extendedTextMessage",
    )
    .map((item) => ({
      id: item.idMessage ?? `${item.timestamp}`,
      author: (item.type === "outgoing" ? "me" : "them") as "me" | "them",
      text: item.textMessage ?? item.extendedTextMessage ?? "",
      timestamp: item.timestamp ?? 0,
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ id, author, text }) => ({ id, author, text }));

  return { ok: true, messages };
}

export type SetSettingsResult =
  | { ok: true }
  | { ok: false; error: "serviceUnavailable" };

export async function setSettings(
  credentials: GreenApiCredentials,
): Promise<SetSettingsResult> {
  const { idInstance, apiTokenInstance } = credentials;
  const url = `${GREEN_API_URL}/waInstance${idInstance}/setSettings/${apiTokenInstance}`;

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      webhookUrl: "",
      outgoingWebhook: "yes",
      stateWebhook: "yes",
      incomingWebhook: "yes",
    }),
  });
  if (!response) {
    return { ok: false, error: "serviceUnavailable" };
  }

  if (!response.ok) {
    return { ok: false, error: "serviceUnavailable" };
  }
  return { ok: true };
}

export type GreenApiNotification = {
  receiptId: number;
  chatId: string | undefined;
  text: string | undefined;
};

export type ReceiveNotificationResult =
  | { ok: true; notification: GreenApiNotification | null }
  | { ok: false; error: GreenApiAuthError };

export async function receiveNotification(
  credentials: GreenApiCredentials,
): Promise<ReceiveNotificationResult> {
  const { idInstance, apiTokenInstance } = credentials;
  const url = `${GREEN_API_URL}/waInstance${idInstance}/receiveNotification/${apiTokenInstance}`;

  const response = await fetchWithRetry(url);
  if (!response) {
    return { ok: false, error: { type: "serviceUnavailable" } };
  }

  if (!response.ok) {
    return { ok: false, error: classifyHttpError(response) };
  }

  let raw: string;
  try {
    raw = await response.text();
  } catch {
    return { ok: false, error: { type: "serviceUnavailable" } };
  }

  if (!raw || raw === "null") {
    return { ok: true, notification: null };
  }

  let body: {
    receiptId: number;
    body?: {
      typeWebhook?: string;
      senderData?: { chatId?: string };
      messageData?: {
        typeMessage?: string;
        textMessageData?: { textMessage?: string };
        extendedTextMessageData?: { text?: string };
      };
    };
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return { ok: false, error: { type: "serviceUnavailable" } };
  }

  const webhook = body.body;
  const chatId = webhook?.senderData?.chatId;
  const text =
    webhook?.messageData?.textMessageData?.textMessage ??
    webhook?.messageData?.extendedTextMessageData?.text;
  const isIncomingText = webhook?.typeWebhook === "incomingMessageReceived";

  return {
    ok: true,
    notification: {
      receiptId: body.receiptId,
      chatId: isIncomingText ? chatId : undefined,
      text: isIncomingText ? text : undefined,
    },
  };
}

export type DeleteNotificationResult =
  | { ok: true }
  | { ok: false; error: "serviceUnavailable" };

export async function deleteNotification(
  credentials: GreenApiCredentials,
  receiptId: number,
): Promise<DeleteNotificationResult> {
  const { idInstance, apiTokenInstance } = credentials;
  const url = `${GREEN_API_URL}/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${receiptId}`;

  const response = await fetchWithRetry(url, { method: "DELETE" });
  if (!response) {
    return { ok: false, error: "serviceUnavailable" };
  }

  if (!response.ok) {
    return { ok: false, error: "serviceUnavailable" };
  }
  return { ok: true };
}
