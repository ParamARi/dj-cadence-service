const request = require("supertest");

jest.mock("../src/db", () => ({
    pool: {
        query: jest.fn(),
    },
    testDbConnection: jest.fn(),
}));

const { pool } = require("../src/db");
const { app } = require("../app");

describe("POST /api/feedback/bpm", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns 400 when userId is missing", async () => {
        const response = await request(app)
            .post("/api/feedback/bpm")
            .send({
                rawTitle: "Test",
                videoId: "v1",
                reportedTempo: 128,
            });

        expect(response.status).toBe(400);
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("returns 201 and upserts user_tap_bpm when payload is valid", async () => {
        pool.query.mockResolvedValue({
            rows: [{ id: 7, created_at: "2026-03-31T00:00:00.000Z" }],
        });

        const payload = {
            userId: "user-42",
            vote: "up",
            source: "GetSongBPM.com",
            rowIndex: 3,
            rawTitle: "Some Title (Official Video)",
            reportedTempo: 128,
            referenceBpm: 126,
            usedParsedFallback: true,
            videoId: "abc123",
            parsedSong: "Some Title",
            parsedArtist: "Some Artist",
            matchedSong: "Some Title",
            matchedArtist: "Some Artist",
            suggestedSong: "Some Title",
            suggestedArtist: "Some Artist",
            playlistId: "pl_1",
            artistName: "Some Artist",
            clientSentAt: "2026-03-31T00:00:00.000Z",
        };

        const response = await request(app)
            .post("/api/feedback/bpm")
            .send(payload);

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            ok: true,
            id: 7,
            createdAt: "2026-03-31T00:00:00.000Z",
        });

        const [sql, params] = pool.query.mock.calls[0];
        expect(sql).toContain("ytm_song.user_tap_bpm");
        expect(sql).toContain("ON CONFLICT (user_id, video_id)");
        expect(params[0]).toBe("user-42");
        expect(params[1]).toBe("Some Title (Official Video)");
        expect(params[2]).toBe("abc123");
        expect(params[3]).toBe(128);
        expect(params[4]).toBe(126);
        expect(params[5]).toBe("Some Title");
        expect(params[6]).toBe("Some Title");
        expect(params[7]).toBe("Some Artist");
        expect(params[8]).toBe("Some Artist");
        expect(params[9]).toBe("Some Artist");
    });
});
