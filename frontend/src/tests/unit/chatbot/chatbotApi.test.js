import {
  createConversation,
  listConversations,
  streamConversationMessage,
} from "../../../api/chatbot";
import { TextDecoder, TextEncoder } from "util";

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}
if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}

function createReaderFromChunks(chunks) {
  let index = 0;
  return {
    getReader() {
      return {
        async read() {
          if (index >= chunks.length) return { done: true, value: undefined };
          const value = Uint8Array.from(Buffer.from(String(chunks[index]), "utf8"));
          index += 1;
          return { done: false, value };
        },
        releaseLock() {
          // noop
        },
      };
    },
  };
}

describe("chatbot api client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.setItem("token", "front-token");
    global.fetch = jest.fn();
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test("streamConversationMessage parse les events SSE started/token/done", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      body: createReaderFromChunks([
        'event: started\ndata: {"conversationId":"c1"}\n\n',
        'event: token\ndata: {"content":"Bonjour"}\n\n',
        'event: done\ndata: {"conversationId":"c1","mode":"guide_smsi"}\n\n',
      ]),
    });

    const onStarted = jest.fn();
    const onToken = jest.fn();
    const onDone = jest.fn();

    const donePayload = await streamConversationMessage("c1", "hello", {
      onStarted,
      onToken,
      onDone,
    });

    expect(onStarted).toHaveBeenCalledWith({ conversationId: "c1" });
    expect(onToken).toHaveBeenCalledWith({ content: "Bonjour" });
    expect(onDone).toHaveBeenCalledWith({ conversationId: "c1", mode: "guide_smsi" });
    expect(donePayload).toEqual({ conversationId: "c1", mode: "guide_smsi" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchOptions = global.fetch.mock.calls[0][1];
    expect(fetchOptions.headers.Accept).toBe("text/event-stream");
    expect(fetchOptions.headers.Authorization).toBe("Bearer front-token");
  });

  test("streamConversationMessage remonte un event error SSE", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      body: createReaderFromChunks([
        'event: error\ndata: {"error":"Erreur stream","code":"CHATBOT_STREAM_ERROR"}\n\n',
      ]),
    });

    await expect(
      streamConversationMessage("c1", "hello", {})
    ).rejects.toMatchObject({
      message: "Erreur stream",
      code: "CHATBOT_STREAM_ERROR",
    });
  });

  test("createConversation/listConversations propagent les erreurs serveur structurees", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: "Acces refuse", code: "CHATBOT_PERMISSION_DENIED" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ conversations: [{ id: "c1", title: "Conv" }] }),
      });

    await expect(createConversation("x")).rejects.toMatchObject({
      message: "Acces refuse",
      code: "CHATBOT_PERMISSION_DENIED",
      status: 403,
    });

    const rows = await listConversations();
    expect(rows).toEqual([{ id: "c1", title: "Conv" }]);
  });
});
