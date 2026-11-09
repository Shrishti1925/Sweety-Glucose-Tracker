const request = require("supertest");
const jwt = require("jsonwebtoken");

// Set test environment so server doesn't start app.listen
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret_for_sweety";

const app = require("../index");

describe("Sweety Glucose Tracker API Tests", () => {
  describe("Health Check Endpoint", () => {
    it("GET /api/health should return status 200 and healthy status", async () => {
      const res = await request(app).get("/api/health");
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.message).toContain("active and healthy");
    });
  });

  describe("Registration & Login Input Validation", () => {
    it("POST /api/auth/register should fail when required fields are missing", async () => {
      const res = await request(app).post("/api/auth/register").send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain("Name is required.");
      expect(res.body.errors).toContain("Email is required.");
      expect(res.body.errors).toContain("Password is required.");
    });

    it("POST /api/auth/register should fail when email format is invalid", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Sweety User",
        email: "invalid-email",
        password: "secretpassword",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining("valid email address"),
        ]),
      );
    });

    it("POST /api/auth/register should fail when password is too short", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Sweety User",
        email: "sweety@example.com",
        password: "123",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining("between 6 and 128 characters"),
        ]),
      );
    });

    it("POST /api/auth/login should fail when email or password is missing", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "" });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain("Email is required.");
      expect(res.body.errors).toContain("Password is required.");
    });
  });

  describe("JWT Authentication Middleware", () => {
    it("GET /api/auth/profile should reject requests without token (401)", async () => {
      const res = await request(app).get("/api/auth/profile");
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("No authorization header provided");
    });

    it("GET /api/readings should reject requests without token (401)", async () => {
      const res = await request(app).get("/api/readings");
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("GET /api/reports/daily should reject requests with invalid token format (401)", async () => {
      const res = await request(app)
        .get("/api/reports/daily")
        .set("Authorization", "InvalidFormat 123");

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("Format must be: Bearer <token>");
    });

    it("GET /api/reports/daily should reject invalid/tampered token (401)", async () => {
      const res = await request(app)
        .get("/api/reports/daily")
        .set("Authorization", "Bearer invalid.token.payload");

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("Invalid token");
    });
  });

  describe("Glucose Reading Validation", () => {
    let validToken;

    beforeAll(() => {
      // Generate a mock JWT for validation testing
      validToken = jwt.sign(
        { id: 999, email: "mockuser@example.com" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );
    });

    it("POST /api/readings should reject missing glucose level (400)", async () => {
      const res = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          unit: "mg/dL",
          meal_context: "fasting",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain("Glucose level is required.");
    });

    it("POST /api/readings should reject out-of-range glucose level in mg/dL (400)", async () => {
      const res = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          glucose_level: 800, // Exceeds realistic maximum of 600
          unit: "mg/dL",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.stringContaining("between 40 and 600")]),
      );
    });

    it("POST /api/readings should reject invalid meal context (400)", async () => {
      const res = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          glucose_level: 110,
          meal_context: "midnight_snack", // Not in allowed list
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Measurement slot must be one of"),
        ]),
      );
    });

    it("POST /api/readings should reject future measured_at date (400)", async () => {
      const futureDate = new Date(
        Date.now() + 10 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const res = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          glucose_level: 110,
          measured_at: futureDate,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining(["Future measurement dates are not allowed."]),
      );
    });

    it("PUT /api/readings/1 should reject request with no fields to update (400)", async () => {
      const res = await request(app)
        .put("/api/readings/1")
        .set("Authorization", `Bearer ${validToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Validation failed");
    });
  });

  describe("Report Query Parameter Validation", () => {
    let validToken;

    beforeAll(() => {
      validToken = jwt.sign(
        { id: 999, email: "mockuser@example.com" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );
    });

    it("GET /api/reports/daily should reject invalid date format (400)", async () => {
      const res = await request(app)
        .get("/api/reports/daily?date=11-07-2026")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain(
        "Expected a real date in YYYY-MM-DD format",
      );
    });

    it("GET /api/reports/monthly should reject invalid month (400)", async () => {
      const res = await request(app)
        .get("/api/reports/monthly?year=2026&month=13")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain(
        "Month must be an integer between 1 and 12",
      );
    });

    it("GET /api/reports/monthly should reject invalid year (400)", async () => {
      const res = await request(app)
        .get("/api/reports/monthly?year=1990&month=5")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Year must be between 2000 and 2100");
    });
  });

  describe("404 Route Handler", () => {
    it("should return 404 for undefined routes", async () => {
      const res = await request(app).get("/api/undefined-endpoint");
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Resource not found");
    });
  });
});
