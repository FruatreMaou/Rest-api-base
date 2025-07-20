import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import PluginLoader from './plugins/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize plugin loader
const pluginLoader = new PluginLoader();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up view engine (EJS for simplicity, can be changed)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// API endpoint to get plugin data
app.get('/api/plugins', (req, res) => {
  const pluginData = pluginLoader.getPluginData();
  res.json(pluginData);
});

// Basic route for home page
app.get('/', (req, res) => {
  const pluginData = pluginLoader.getPluginData();
  res.render('home', { 
    title: 'REST API Plugin System',
    plugins: pluginData.plugins,
    categories: pluginData.categories
  });
});

// Additional API endpoints
let visitorCount = 0;

// Hello endpoint
app.get("/api/hello", (req, res) => {
  res.json({ 
    message: "Hello from the API Hub!", 
    timestamp: new Date().toISOString(),
    status: "success"
  });
});

// Submit endpoint
app.post("/api/submit", (req, res) => {
  const { name, message } = req.body;
  if (name && message) {
    res.json({ 
      status: "success", 
      received: { name, message },
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(400).json({ 
      status: "error", 
      message: "Name and message are required.",
      timestamp: new Date().toISOString()
    });
  }
});

// Visitor count endpoint
app.get("/api/visitor-count", (req, res) => {
  visitorCount++;
  res.json({ 
    count: visitorCount,
    timestamp: new Date().toISOString()
  });
});

// System info endpoint
app.get("/api/system-info", (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    status: "online"
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    plugins: pluginLoader.plugins.size
  });
});

// Initialize and start server
async function startServer() {
  try {
    console.log('🔄 Loading plugins...');
    await pluginLoader.loadPlugins();
    
    console.log('🔗 Registering routes...');
    pluginLoader.registerRoutes(app);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📁 Plugins loaded: ${pluginLoader.plugins.size}`);
      console.log('👀 File watching enabled - plugins will auto-reload on changes');
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      pluginLoader.stopWatchers();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
}

startServer();

