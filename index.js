import express from 'express';
import cors from 'cors';
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
app.use(cors());
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up view engine (EJS for simplicity, can be changed)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('trust proxy', true);
// API endpoint to get plugin data
app.get('/api/plugins', (req, res) => {
  const pluginData = pluginLoader.getPluginData();
  res.json(pluginData);
});

app.get('/swagger.json', (req, res) => {
  try {
  const pluginData = pluginLoader.getPluginData();
  const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Rest API',
    description: 'A REST API with plugin-based endpoints',
    version: '1.0.0',
  },
  servers: [
    {
      url: `${req.protocol}://${req.get('host')}`,
      description: 'Local server',
    },
  ],
  paths: {},
};

pluginData.plugins.forEach((plugin) => {
    const parameters = Object.entries(plugin.params || {}).map(([name, description]) => {
    const isRequired = description.includes('(required)');
    const match = description.match(/^(string|number|array|object)/i);
    const type = match ? match[0].toLowerCase() : 'string';

    return {
      name,
      in: plugin.method.toLowerCase() === 'get' ? 'query' : 'body',
      required: isRequired,
      description: description.split(' - ')[1] || description,
      schema: {
        type,
      },
    };
  });

  openApiSpec.paths[plugin.path] = {
    [plugin.method.toLowerCase()]: {
      tags: [plugin.category],
      operationId: plugin.name.replace(/\s+/g, ''),
      summary: plugin.description,
      parameters: parameters.length > 0 ? parameters : undefined,
      requestBody: plugin.method.toLowerCase() !== 'get' && parameters.length > 0 ? {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: Object.fromEntries(
                parameters.map(param => [
                  param.name,
                  { type: param.schema.type, description: param.description }
                ])
              ),
              required: parameters.filter(p => p.required).map(p => p.name),
            },
          },
        },
      } : undefined,
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'boolean' },
                  result: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
  };
});
    res.json(openApiSpec)
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to generate OpenAPI spec' });
  }
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

app.get('/docs', (req, res) => {
  res.render('docs')
})
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

