import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import http from "http";
import { spawn } from "child_process";
import chalk from "chalk";

const ENV_VARS = {
  NODE_ENV: process.env.NODE_ENV || "development",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000"
};

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ENV_VARS.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const port = 4545;

// Basic Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// CORS Configuration
app.use(
  cors({
    origin: ENV_VARS.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "device-remember-token",
      "Access-Control-Allow-Origin",
      "Origin",
      "Accept",
    ],
    exposedHeaders: ["set-cookie"],
  })
);

// Development logging
app.use(morgan("dev"));

// Global Error Handler
const errorHandler = (error, req, res, next) => {
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);

  // Handle specific error types
  if (error.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: "Validation Error",
      details: error.message,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      status: "error",
      message: "Invalid ID format",
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      status: "error",
      message: "Duplicate key error",
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    status: "error",
    message: error.message || "Internal Server Error",
    ...(ENV_VARS.NODE_ENV === "development" && { stack: error.stack }),
  });
};

app.use(errorHandler);

// Tshark data processing
const processTsharkData = (data) => {
  try {
    const lines = data.toString().split('\n');
    const packets = [];
    let currentPacket = null;

    for (const line of lines) {
      // Empty line indicates end of a frame
      if (line.trim() === '') {
        if (currentPacket) {
          packets.push(currentPacket);
          currentPacket = null;
        }
        continue;
      }

      // New frame information
      if (line.startsWith('Frame ')) {
        const frameNumMatch = line.match(/Frame (\d+):/);
        if (frameNumMatch) {
          currentPacket = {
            frameNumber: parseInt(frameNumMatch[1]),
            info: {},
            rawData: {}
          };
        }
        continue;
      }

      // Extract source and destination IP
      if (currentPacket) {
        // IPv4
        if (line.includes('Internet Protocol Version 4')) {
          const ipMatch = line.match(/Src: ([^,]+), Dst: ([^\s]+)/);
          if (ipMatch) {
            currentPacket.sourceIP = ipMatch[1];
            currentPacket.destinationIP = ipMatch[2];
            currentPacket.protocol = 'IPv4';
          }
        }
        // IPv6
        else if (line.includes('Internet Protocol Version 6')) {
          const ipMatch = line.match(/Src: ([^,]+), Dst: ([^\s]+)/);
          if (ipMatch) {
            currentPacket.sourceIP = ipMatch[1];
            currentPacket.destinationIP = ipMatch[2];
            currentPacket.protocol = 'IPv6';
          }
        }
        // UDP
        else if (line.includes('User Datagram Protocol')) {
          const portMatch = line.match(/Src Port: (\d+), Dst Port: (\d+)/);
          if (portMatch) {
            currentPacket.sourcePort = parseInt(portMatch[1]);
            currentPacket.destPort = parseInt(portMatch[2]);
            currentPacket.service = identifyService(parseInt(portMatch[2]));
          }
          currentPacket.protocol = 'UDP';
        }
        // TCP
        else if (line.includes('Transmission Control Protocol')) {
          const portMatch = line.match(/Src Port: (\d+), Dst Port: (\d+)/);
          if (portMatch) {
            currentPacket.sourcePort = parseInt(portMatch[1]);
            currentPacket.destPort = parseInt(portMatch[2]);
            currentPacket.service = identifyService(parseInt(portMatch[2]));
          }
          currentPacket.protocol = 'TCP';
        }
        // Length
        else if (line.includes('Frame Length:')) {
          const lengthMatch = line.match(/Frame Length: (\d+) bytes/);
          if (lengthMatch) {
            currentPacket.length = parseInt(lengthMatch[1]);
            currentPacket.sourceBytes = parseInt(lengthMatch[1]);
          }
        }

        // Store any other relevant information
        if (line.includes(':')) {
          const [key, value] = line.split(':', 2);
          if (key && value) {
            currentPacket.info[key.trim()] = value.trim();
            currentPacket.rawData[key.trim()] = value.trim();
          }
        }
      }
    }

    // Add any remaining packet
    if (currentPacket) {
      packets.push(currentPacket);
    }

    return packets;
  } catch (error) {
    console.error(chalk.red('Error processing tshark data:'), error);
    return [];
  }
};

// Identify service based on port number
const identifyService = (port) => {
  const portServiceMap = {
    80: 'http',
    443: 'https',
    22: 'ssh',
    21: 'ftp',
    25: 'smtp',
    53: 'dns',
    67: 'dhcp',
    68: 'dhcp',
    110: 'pop3',
    143: 'imap',
    161: 'snmp',
    5353: 'mdns',
    3389: 'rdp',
    8080: 'http-alt',
    // Add more as needed
  };

  return portServiceMap[port] || 'unknown';
};

// Start tshark process
let tsharkProcess = null;

const startTshark = () => {
  console.log(chalk.blue('Starting tshark capture...'));

  try {
    // Use sudo to run tshark with elevated privileges
    tsharkProcess = spawn('wsl', ['sudo', 'tshark', '-i', 'eth0', '-V']);

      // Send the password to the sudo command
      tsharkProcess.stdin.write('Raghav@3912\n');

    tsharkProcess.stdout.on('data', (data) => {
      const packets = processTsharkData(data);
      console.log(chalk.green(`Processed ${packets.length} packets`));

      if (packets.length > 0) {
        // Emit to all connected clients
        io.emit('packet-data', packets);
      }
    });

    tsharkProcess.stderr.on('data', (data) => {
      console.error(chalk.yellow('tshark stderr:'), data.toString());
    });

    tsharkProcess.on('close', (code) => {
      console.log(chalk.yellow(`tshark process exited with code ${code}`));
      // Restart after delay if process exits
      setTimeout(() => {
        if (tsharkProcess === null) {
          startTshark();
        }
      }, 5000);
    });
  } catch (error) {
    console.error(chalk.red('Failed to start tshark:'), error);
    tsharkProcess = null;
  }
};

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Backend of the IDS",
    version: "1.0.0",
    timestamp: new Date(),
    environment: ENV_VARS.NODE_ENV,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    FRONTEND_URL: ENV_VARS.FRONTEND_URL,
  });
});

// Health Check Route
app.get("/health", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy!",
    timestamp: new Date(),
    environment: ENV_VARS.NODE_ENV,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    tsharkStatus: tsharkProcess ? "running" : "stopped",
    FRONTEND_URL: ENV_VARS.FRONTEND_URL,
  });
});

// Endpoint to manually start/restart tshark
app.post("/api/tshark/start", (req, res) => {
  if (tsharkProcess) {
    tsharkProcess.kill();
    tsharkProcess = null;
  }

  startTshark();

  res.status(200).json({
    success: true,
    message: "tshark capture started"
  });
});

app.post("/api/tshark/stop", (req, res) => {
  if (tsharkProcess) {
    tsharkProcess.kill();
    tsharkProcess = null;

    res.status(200).json({
      success: true,
      message: "tshark capture stopped"
    });
  } else {
    res.status(200).json({
      success: true,
      message: "tshark was not running"
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Improved error logging function
const logError = (error, context) => {
  console.error(chalk.red(`[${context}] Error occurred:`));
  console.error(chalk.red(`Name: ${error.name}`));
  console.error(chalk.red(`Message: ${error.message}`));
  console.error(chalk.red(`Stack: ${error.stack}`));
};

// Server startup function
const startServer = async () => {
  try {
    server.listen(port, () => {
      console.log(chalk.bgWhite.black(`Server running on port ${port}`));
      console.log(
        chalk.bgYellow.blue(`Frontend URL: ${ENV_VARS.FRONTEND_URL}`)
      );

      // Start tshark capture
      startTshark();
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
      console.log(
        chalk.yellow(`\n${signal} received. Starting graceful shutdown...`)
      );

      try {
        // Stop tshark process if running
        if (tsharkProcess) {
          tsharkProcess.kill();
          tsharkProcess = null;
          console.log(chalk.yellow("✓ tshark process terminated"));
        }

        await new Promise((resolve) => {
          server.close(resolve);
        });
        console.log(chalk.yellow("✓ Server closed"));

        console.log(chalk.green("Graceful shutdown completed"));
        process.exit(0);
      } catch (err) {
        logError(err, "Graceful Shutdown");
        process.exit(1);
      }
    };

    // Process event handlers
    process.on("unhandledRejection", (error) => {
      logError(error, "Unhandled Rejection");
      // Don't shutdown, just log the error
    });

    process.on("uncaughtException", (error) => {
      logError(error, "Uncaught Exception");
      // Don't shutdown, just log the error
    });

    // Shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (err) {
    logError(err, "Server Startup");
    process.exit(1);
  }
};

// Start the server
startServer().catch((err) => {
  logError(err, "Fatal Startup Error");
  process.exit(1);
});

export { app as default };
