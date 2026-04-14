const request = require("supertest");

jest.mock("../src/db", () => ({
    pool: {
        query: jest.fn(),
    },
    testDbConnection: jest.fn(),
}));

const { pool } = require("../src/db");
const { app } = require("../app");

describe("POST /api/bpm/tap", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns 400 when song identity and calculatedBpm are missing", async () => {
        const response = await request(app)
            .post("/api/bpm/tap")
            .send({ calculatedBpm: 120 });

        expect(response.status).toBe(400);
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("returns 201 and inserts when payload is valid", async () => {
        pool.query.mockResolvedValue({
            rows: [{ id: 99, created_at: "2026-03-31T12:00:00.000Z" }],
        });

        const response = await request(app)
            .post("/api/bpm/tap")
            .send({
                userId: "user-1",
                calculatedBpm: 127.25,
                referenceBpm: 128,
                tapCount: 16,
                durationMs: 8000,
                rawTitle: "Song (remix)",
                videoId: "xyz",
                playlistId: "pl1",
                parsedSong: "Song",
                parsedArtist: "Artist",
                artistName: "Artist",
                clientSentAt: "2026-03-31T11:59:00.000Z",
            });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            ok: true,
            id: 99,
            createdAt: "2026-03-31T12:00:00.000Z",
        });

        const [sql, params] = pool.query.mock.calls[0];
        expect(sql).toContain("ytm_song.user_tap_bpm");
        expect(params[0]).toBe("user-1");
        expect(params[1]).toBe("Song (remix)");
        expect(params[2]).toBe("xyz");
        expect(params[3]).toBe(127.25);
        expect(params[4]).toBe(128);
        expect(params[5]).toBe("Song");
        expect(params[6]).toBe(null);
        expect(params[7]).toBe("Artist");
        expect(params[8]).toBe(null);
        expect(params[9]).toBe("Artist");
    });
});
