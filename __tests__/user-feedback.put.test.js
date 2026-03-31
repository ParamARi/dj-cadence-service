const request = require("supertest");

jest.mock("../src/db", () => ({
    pool: {
        query: jest.fn(),
    },
    testDbConnection: jest.fn(),
}));

const { pool } = require("../src/db");
const { app } = require("../app");

describe("PUT /api/v1/user-feedback", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns 400 when required fields are missing", async () => {
        const response = await request(app)
            .put("/api/v1/user-feedback")
            .send({ songTitle: "Blinding Lights" });

        expect(response.status).toBe(400);
        expect(response.body.ok).toBe(false);
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("returns 201 and saves feedback when payload is valid", async () => {
        pool.query.mockResolvedValue({
            rows: [{ id: 42, created_at: "2026-03-30T00:00:00.000Z" }],
        });

        const payload = {
            songTitle: "Levitating",
            artistName: "Dua Lipa",
            sourceName: "GetSongBPM.com",
            sourceBpm: 103.0,
            detectedBpm: 105.0,
            userExpectedBpm: 104.0,
            feedbackType: "source_mismatch",
            mismatchNotes: "Source appears slower than observed tempo.",
        };

        const response = await request(app)
            .put("/api/v1/user-feedback")
            .send(payload);

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            ok: true,
            id: 42,
            createdAt: "2026-03-30T00:00:00.000Z",
        });
        expect(pool.query).toHaveBeenCalledTimes(1);
        const [sql, params] = pool.query.mock.calls[0];
        expect(sql).toContain("ytm_song.user_feedback");
        expect(params).toEqual([
            "Levitating",
            "Dua Lipa",
            "GetSongBPM.com",
            103.0,
            105.0,
            104.0,
            "source_mismatch",
            "Source appears slower than observed tempo.",
        ]);
    });
});
