import { api, ApiError, setOnUnauthorized } from "@/lib/api/client";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const secureStore = jest.requireMock("expo-secure-store") as {
  getItemAsync: jest.Mock;
  deleteItemAsync: jest.Mock;
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeResponse(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body ?? {}),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  secureStore.getItemAsync.mockResolvedValue(null);
});

describe("api client — headers", () => {
  it("inclut Authorization quand un token existe", async () => {
    secureStore.getItemAsync.mockResolvedValue("my-jwt");
    mockFetch.mockResolvedValue(makeResponse(200, { ok: true }));

    await api.get("/test");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer my-jwt");
  });

  it("n'inclut pas Authorization sans token", async () => {
    secureStore.getItemAsync.mockResolvedValue(null);
    mockFetch.mockResolvedValue(makeResponse(200, {}));

    await api.get("/test");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });
});

describe("api client — erreurs HTTP", () => {
  it("401 : supprime le token, appelle onUnauthorized, lève ApiError(401)", async () => {
    secureStore.getItemAsync.mockResolvedValue("expired-token");
    mockFetch.mockResolvedValue(makeResponse(401));
    const onUnauthorized = jest.fn();
    setOnUnauthorized(onUnauthorized);

    await expect(api.get("/protected")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
    });

    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith("access_token");
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("404 : lève ApiError avec le message de la réponse", async () => {
    mockFetch.mockResolvedValue(makeResponse(404, { error: "Not found" }));

    await expect(api.get("/missing")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "Not found",
    });
  });

  it("500 sans body json : lève ApiError avec message générique", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("invalid json")),
    });

    await expect(api.get("/crash")).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
    });
  });
});

describe("api client — codes spéciaux", () => {
  it("204 retourne undefined", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 204, json: jest.fn() });

    const result = await api.delete("/resource/1");
    expect(result).toBeUndefined();
  });
});

describe("api client — méthodes", () => {
  it("POST envoie method=POST et le body JSON", async () => {
    mockFetch.mockResolvedValue(makeResponse(201, { id: "abc" }));

    await api.post("/items", { name: "pomme", calories: 52 });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual({ name: "pomme", calories: 52 });
  });

  it("PATCH envoie method=PATCH", async () => {
    mockFetch.mockResolvedValue(makeResponse(200, {}));

    await api.patch("/items/1", { calories: 60 });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("PATCH");
  });
});
