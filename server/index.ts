import "dotenv/config";
import express, { Router } from "express";
import cors from "cors";
import { prisma } from "./prisma.js";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware/auth.js";
import { Request, Response } from "express";
import { CollaboratorRole } from "../src/nodes/types";

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
          OR: [
            { userId },
            {
              collaborators: {
                some: { userId },
              },
            },
          ],
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          collaborators: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
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
          OR: [
            { userId },
            {
              collaborators: {
                some: { userId },
              },
            },
          ],
        },
        include: {
          user: {
            select: { name: true, email: true },
          },
          collaborators: {
            include: {
              user: {
                select: { name: true, email: true, picture: true },
              },
            },
          },
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

      // Check if the user owns the flow OR is a collaborator with EDITOR/OWNER role
      const existingFlow = await prisma.flow.findFirst({
        where: {
          id,
          OR: [
            { userId }, // Original owner
            {
              collaborators: {
                some: {
                  userId,
                  role: {
                    in: [CollaboratorRole.OWNER, CollaboratorRole.EDITOR],
                  },
                },
              },
            },
          ],
        },
      });

      if (!existingFlow) {
        res.status(404).json({ error: "Flow not found or access denied" });
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

// Add this endpoint after the existing flow endpoints
router.get(
  "/admin/flows",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminToken = req.headers.authorization?.split(" ")[1];

      if (!adminToken) {
        res.status(401).json({ error: "No admin token provided" });
        return;
      }

      // Verify admin token
      const decoded = jwt.verify(adminToken, process.env.JWT_SECRET!) as {
        type: "admin";
        username: string;
      };

      if (decoded.type !== "admin") {
        res.status(401).json({ error: "Invalid admin token" });
        return;
      }

      // Get all flows with user information
      const flows = await prisma.flow.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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

// Simple admin login route - designed for easy migration to secret management
router.post("/admin", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // TODO: Replace with secret management service call
    // const adminCredentials = await getAdminCredentials(); // Future: AWS Secrets Manager, etc.
    const adminCredentials = {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
    };

    if (!adminCredentials.username || !adminCredentials.password) {
      res.status(500).json({ error: "Admin credentials not configured" });
      return;
    }

    if (
      username === adminCredentials.username &&
      password === adminCredentials.password
    ) {
      const adminToken = jwt.sign(
        { type: "admin", username },
        process.env.JWT_SECRET!,
        { expiresIn: "24h" },
      );

      res.json({
        success: true,
        adminToken,
        message: "Admin login successful",
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Admin authentication failed" });
  }
});

// Add this endpoint after the existing admin endpoints
router.get(
  "/admin/flow/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminToken = req.headers.authorization?.split(" ")[1];

      if (!adminToken) {
        res.status(401).json({ error: "No admin token provided" });
        return;
      }

      // Verify admin token
      const decoded = jwt.verify(adminToken, process.env.JWT_SECRET!) as {
        type: "admin";
        username: string;
      };

      if (decoded.type !== "admin") {
        res.status(401).json({ error: "Invalid admin token" });
        return;
      }

      // Get flow with user information
      const flow = await prisma.flow.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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

// Collaboration endpoints
router.post(
  "/flow/:id/share",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { email, role = "EDITOR" } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      // Check if user owns the flow (ONLY owners can share)
      const flow = await prisma.flow.findFirst({
        where: {
          id,
          userId, // Only the original owner can share
        },
      });

      if (!flow) {
        res
          .status(404)
          .json({
            error:
              "Flow not found or access denied. Only the flow owner can share flows.",
          });
        return;
      }

      // Find the user to add as collaborator
      const userToAdd = await prisma.user.findUnique({
        where: { email },
      });

      if (!userToAdd) {
        res.status(404).json({ error: "User not found with this email" });
        return;
      }

      // Check if user is already a collaborator
      const existingCollaborator = await prisma.flowCollaborator.findUnique({
        where: {
          flowId_userId: {
            flowId: id,
            userId: userToAdd.id,
          },
        },
      });

      if (existingCollaborator) {
        res.status(400).json({ error: "User is already a collaborator" });
        return;
      }

      // Add user as collaborator
      const collaborator = await prisma.flowCollaborator.create({
        data: {
          flowId: id,
          userId: userToAdd.id,
          role: role as CollaboratorRole,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, picture: true },
          },
        },
      });

      res.json(collaborator);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to share flow" });
    }
  },
);

router.get(
  "/flow/:id/collaborators",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      // Check if user has access to the flow
      const flow = await prisma.flow.findFirst({
        where: {
          id,
          OR: [
            { userId },
            {
              collaborators: {
                some: { userId },
              },
            },
          ],
        },
      });

      if (!flow) {
        res.status(404).json({ error: "Flow not found or access denied" });
        return;
      }

      const collaborators = await prisma.flowCollaborator.findMany({
        where: { flowId: id },
        include: {
          user: {
            select: { id: true, name: true, email: true, picture: true },
          },
        },
      });

      res.json({ collaborators });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to fetch collaborators" });
    }
  },
);

router.put(
  "/flow/:id/collaborator/:collaboratorId",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, collaboratorId } = req.params;
      const { role } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      // Check if user owns the flow
      const flow = await prisma.flow.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!flow) {
        res.status(404).json({ error: "Flow not found or access denied" });
        return;
      }

      const collaborator = await prisma.flowCollaborator.update({
        where: { id: collaboratorId },
        data: { role: role as CollaboratorRole },
        include: {
          user: {
            select: { id: true, name: true, email: true, picture: true },
          },
        },
      });

      res.json(collaborator);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to update collaborator" });
    }
  },
);

router.delete(
  "/flow/:id/collaborator/:collaboratorId",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, collaboratorId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      // Check if user owns the flow
      const flow = await prisma.flow.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!flow) {
        res.status(404).json({ error: "Flow not found or access denied" });
        return;
      }

      await prisma.flowCollaborator.delete({
        where: { id: collaboratorId },
      });

      res.json({ message: "Collaborator removed successfully" });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to remove collaborator" });
    }
  },
);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
