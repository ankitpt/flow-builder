import express, { Router } from "express";
import cors from "cors";
import { prisma } from "./prisma.js";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware/auth.js";
import { Request, Response } from "express";

const app = express();
const router = Router();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api", router);

// User endpoints
router.post("/user", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, picture } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        picture,
      },
      create: {
        email,
        name,
        picture,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to create/update user" });
  }
});

// Get user by ID
router.get(
  "/user/:id",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (req.user?.id !== id) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }
      const user = await prisma.user.findUnique({ where: { id } });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  },
);

// Update user
router.put(
  "/user/:id",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (req.user?.id !== id) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }
      const { name, picture } = req.body;
      const user = await prisma.user.update({
        where: { id },
        data: { name, picture },
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  },
);

// Delete user
router.delete(
  "/user/:id",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (req.user?.id !== id) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }
      await prisma.user.delete({ where: { id } });
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  },
);

// List all users (with pagination)
router.get("/users", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.post(
  "/auth/google",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;
      console.log("Received token:", token ? "Token present" : "No token");

      // Get user info from Google using the access token
      console.log("Attempting to fetch user info from Google...");
      const userInfo = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      ).then((res) => {
        console.log("Google API response status:", res.status);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch user info: ${res.status} ${res.statusText}`,
          );
        }
        return res.json();
      });
      console.log("Successfully fetched user info:", {
        email: userInfo.email,
        name: userInfo.name,
        hasPicture: !!userInfo.picture,
      });

      // Create/update user
      console.log("Attempting to upsert user in database...");
      const user = await prisma.user.upsert({
        where: { email: userInfo.email },
        update: {
          name: userInfo.name,
          picture: userInfo.picture,
        },
        create: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        },
      });
      console.log("User upsert successful:", {
        userId: user.id,
        email: user.email,
      });

      // Create session token
      console.log("Creating session token...");
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
      }
      const sessionToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
        process.env.JWT_SECRET,
        { expiresIn: "30d" },
      );
      console.log("Session token created successfully");

      res.json({
        user,
        sessionToken,
      });
    } catch (error) {
      console.error("Authentication error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        error: "Authentication failed",
        details: error.message,
      });
    }
  },
);

// Protected route example
router.get(
  "/user/profile",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    res.json(req.user);
  },
);

// Flow endpoints
router.post(
  "/flow",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, flow } = req.body;
      const userId = req.user?.id; // Get userId from the decoded session token

      if (!name || !flow || !userId) {
        res
          .status(400)
          .json({ error: "Name, flow data, and userId are required" });
        return;
      }

      const savedFlow = await prisma.flow.create({
        data: {
          name,
          flow,
          userId,
        },
      });

      res.json(savedFlow);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to save flow" });
    }
  },
);

// Add this endpoint after the existing flow endpoints
router.get(
  "/flows",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const flows = await prisma.flow.findMany({
        where: {
          userId,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
      res.json(flows);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to fetch flows" });
    }
  },
);

// Add this endpoint after the other flow endpoints
router.get(
  "/flow/:id",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const flow = await prisma.flow.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!flow) {
        res.status(404).json({ error: "Flow not found" });
        return;
      }

      res.json(flow);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to fetch flow" });
    }
  },
);

// Add this endpoint after the other flow endpoints
router.put(
  "/flow/:id",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, flow } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      // First check if the flow belongs to the user
      const existingFlow = await prisma.flow.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingFlow) {
        res.status(404).json({ error: "Flow not found" });
        return;
      }

      // Update the flow
      const updatedFlow = await prisma.flow.update({
        where: {
          id,
        },
        data: {
          name,
          flow,
        },
      });

      res.json(updatedFlow);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to update flow" });
    }
  },
);

// Add this endpoint after the other flow endpoints
router.delete(
  "/flow/:id",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      // First check if the flow belongs to the user
      const existingFlow = await prisma.flow.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingFlow) {
        res.status(404).json({ error: "Flow not found" });
        return;
      }

      // Delete the flow
      await prisma.flow.delete({
        where: {
          id,
        },
      });

      res.json({ message: "Flow deleted successfully" });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to delete flow" });
    }
  },
);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
