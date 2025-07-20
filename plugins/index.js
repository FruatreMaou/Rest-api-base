import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PluginLoader {
  constructor() {
    this.plugins = new Map();
    this.categories = new Map();
    this.watchers = new Map();
    this.app = null;
    this.routes = new Map(); // Track registered routes
    this.watchedDirectories = new Set(); // Track watched directories
  }

  setApp(app) {
    this.app = app;
  }

  async loadPlugins() {
    const pluginsDir = __dirname;
    await this.scanDirectory(pluginsDir);
    this.setupFileWatchers();
    return this.getPluginData();
  }

  async scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && item !== 'node_modules') {
        await this.scanDirectory(fullPath);
      } else if (stat.isFile() && item.endsWith('.js') && item !== 'index.js') {
        await this.loadPlugin(fullPath);
      }
    }
  }

  async loadPlugin(filePath) {
    try {
      // Convert to file URL for dynamic import with cache busting
      const timestamp = Date.now();
      const fileUrl = `file://${filePath}?t=${timestamp}`;
      const module = await import(fileUrl);
      const plugin = module.default;
      
      if (this.validatePlugin(plugin)) {
        const pluginId = this.generatePluginId(filePath);
        plugin.id = pluginId;
        plugin.filePath = filePath;
        
        // Remove old plugin if exists
        if (this.plugins.has(pluginId)) {
          this.removePlugin(pluginId);
        }
        
        this.plugins.set(pluginId, plugin);
        
        // Group by category
        if (!this.categories.has(plugin.category)) {
          this.categories.set(plugin.category, []);
        }
        this.categories.get(plugin.category).push(plugin);
        
        // Register route if app is available
        if (this.app) {
          this.registerSingleRoute(plugin);
        }
        
        console.log(`✅ Plugin loaded: ${plugin.name} (${plugin.category})`);
      } else {
        console.warn(`⚠️  Invalid plugin format: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error loading plugin ${filePath}:`, error.message);
    }
  }

  removePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      // Remove from category
      const categoryPlugins = this.categories.get(plugin.category);
      if (categoryPlugins) {
        const index = categoryPlugins.findIndex(p => p.id === pluginId);
        if (index !== -1) {
          categoryPlugins.splice(index, 1);
        }
        
        // Remove category if empty
        if (categoryPlugins.length === 0) {
          this.categories.delete(plugin.category);
        }
      }
      
      // Remove route tracking
      this.routes.delete(pluginId);
      
      this.plugins.delete(pluginId);
      console.log(`🗑️  Plugin removed: ${plugin.name}`);
    }
  }

  validatePlugin(plugin) {
    return (
      plugin &&
      typeof plugin.name === 'string' &&
      typeof plugin.category === 'string' &&
      typeof plugin.method === 'string' &&
      typeof plugin.path === 'string' &&
      typeof plugin.handler === 'function'
    );
  }

  generatePluginId(filePath) {
    const relativePath = path.relative(__dirname, filePath);
    return relativePath.replace(/\\/g, '/').replace('.js', '');
  }

  getPluginData() {
    return {
      plugins: Array.from(this.plugins.values()),
      categories: Object.fromEntries(this.categories),
      pluginMap: Object.fromEntries(this.plugins)
    };
  }

  registerSingleRoute(plugin) {
    const method = plugin.method.toLowerCase();
    
    if (typeof this.app[method] === 'function') {
      this.app[method](plugin.path, plugin.handler);
      this.routes.set(plugin.id, { method, path: plugin.path });
      console.log(`🔗 Route registered: ${plugin.method} ${plugin.path}`);
    } else {
      console.warn(`⚠️  Unsupported HTTP method: ${plugin.method}`);
    }
  }

  registerRoutes(app) {
    this.app = app;
    for (const plugin of this.plugins.values()) {
      this.registerSingleRoute(plugin);
    }
  }

  setupFileWatchers() {
    const watchDirectory = (dir) => {
      // Skip if already watching this directory
      if (this.watchedDirectories.has(dir)) {
        return;
      }

      try {
        const watcher = fs.watch(dir, { recursive: false }, async (eventType, filename) => {
          if (!filename) return;

          const fullPath = path.join(dir, filename);
          
          // Handle directory creation/deletion
          if (fs.existsSync(fullPath)) {
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
              console.log(`📁 New directory detected: ${filename}`);
              // Watch the new directory
              this.watchNewDirectory(fullPath);
              // Scan for plugins in the new directory
              await this.scanDirectory(fullPath);
            } else if (filename.endsWith('.js') && filename !== 'index.js') {
              console.log(`📄 File ${eventType}: ${filename}`);
              await this.handleFileChange(fullPath, eventType);
            }
          } else {
            // File or directory was deleted
            if (filename.endsWith('.js') && filename !== 'index.js') {
              console.log(`🗑️  File deleted: ${filename}`);
              const pluginId = this.generatePluginId(fullPath);
              this.removePlugin(pluginId);
            } else {
              // Check if it was a directory deletion
              console.log(`🗑️  Directory may have been deleted: ${filename}`);
              await this.handleDirectoryDeletion(fullPath);
            }
          }
        });
        
        this.watchers.set(dir, watcher);
        this.watchedDirectories.add(dir);
        console.log(`👀 Watching directory: ${dir}`);
      } catch (error) {
        console.error(`❌ Error setting up watcher for ${dir}:`, error.message);
      }
    };

    // Watch the plugins directory and all existing subdirectories
    this.watchDirectoryRecursively(__dirname);
  }

  watchDirectoryRecursively(dir) {
    const watchDirectory = (currentDir) => {
      // Skip if already watching this directory
      if (this.watchedDirectories.has(currentDir)) {
        return;
      }

      try {
        const watcher = fs.watch(currentDir, { recursive: false }, async (eventType, filename) => {
          if (!filename) return;

          const fullPath = path.join(currentDir, filename);
          
          // Handle directory creation/deletion
          if (fs.existsSync(fullPath)) {
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && filename !== 'node_modules') {
              console.log(`📁 New directory detected: ${filename}`);
              // Watch the new directory recursively
              this.watchDirectoryRecursively(fullPath);
              // Scan for plugins in the new directory
              await this.scanDirectory(fullPath);
            } else if (filename.endsWith('.js') && filename !== 'index.js') {
              console.log(`📄 File ${eventType}: ${filename}`);
              await this.handleFileChange(fullPath, eventType);
            }
          } else {
            // File or directory was deleted
            if (filename.endsWith('.js') && filename !== 'index.js') {
              console.log(`🗑️  File deleted: ${filename}`);
              const pluginId = this.generatePluginId(fullPath);
              this.removePlugin(pluginId);
            } else {
              // Check if it was a directory deletion
              console.log(`🗑️  Directory deleted: ${filename}`);
              await this.handleDirectoryDeletion(fullPath);
            }
          }
        });
        
        this.watchers.set(currentDir, watcher);
        this.watchedDirectories.add(currentDir);
        console.log(`👀 Watching directory: ${currentDir}`);

        // Watch subdirectories
        if (fs.existsSync(currentDir)) {
          const items = fs.readdirSync(currentDir);
          for (const item of items) {
            const fullPath = path.join(currentDir, item);
            if (fs.existsSync(fullPath)) {
              const stat = fs.statSync(fullPath);
              if (stat.isDirectory() && item !== 'node_modules') {
                watchDirectory(fullPath);
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error setting up watcher for ${currentDir}:`, error.message);
      }
    };

    watchDirectory(dir);
  }

  async handleFileChange(fullPath, eventType) {
    if (eventType === 'change' || eventType === 'rename') {
      // Check if file still exists (for rename events)
      if (fs.existsSync(fullPath)) {
        // Reload the plugin
        await this.reloadPlugin(fullPath);
      } else {
        // File was deleted, remove plugin
        const pluginId = this.generatePluginId(fullPath);
        this.removePlugin(pluginId);
      }
    }
  }

  async handleDirectoryDeletion(dirPath) {
    // Remove all plugins from the deleted directory
    const pluginsToRemove = [];
    
    for (const [pluginId, plugin] of this.plugins.entries()) {
      if (plugin.filePath && plugin.filePath.startsWith(dirPath)) {
        pluginsToRemove.push(pluginId);
      }
    }
    
    for (const pluginId of pluginsToRemove) {
      this.removePlugin(pluginId);
    }
    
    // Stop watching the deleted directory
    if (this.watchers.has(dirPath)) {
      this.watchers.get(dirPath).close();
      this.watchers.delete(dirPath);
      this.watchedDirectories.delete(dirPath);
      console.log(`👁️  Stopped watching deleted directory: ${dirPath}`);
    }
  }

  watchNewDirectory(dirPath) {
    if (!this.watchedDirectories.has(dirPath)) {
      this.watchDirectoryRecursively(dirPath);
    }
  }

  async reloadPlugin(filePath) {
    try {
      // Small delay to ensure file write is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const pluginId = this.generatePluginId(filePath);
      
      // Remove existing plugin
      this.removePlugin(pluginId);
      
      // Load the updated plugin
      await this.loadPlugin(filePath);
      
      console.log(`🔄 Plugin reloaded: ${filePath}`);
    } catch (error) {
      console.error(`❌ Error reloading plugin ${filePath}:`, error.message);
    }
  }

  stopWatchers() {
    for (const [dir, watcher] of this.watchers.entries()) {
      watcher.close();
      console.log(`👁️  Stopped watching: ${dir}`);
    }
    this.watchers.clear();
    this.watchedDirectories.clear();
  }

  // Method to manually refresh plugins (useful for debugging)
  async refreshPlugins() {
    console.log('🔄 Manually refreshing all plugins...');
    
    // Clear existing plugins
    this.plugins.clear();
    this.categories.clear();
    this.routes.clear();
    
    // Reload all plugins
    await this.scanDirectory(__dirname);
    
    // Re-register routes
    if (this.app) {
      for (const plugin of this.plugins.values()) {
        this.registerSingleRoute(plugin);
      }
    }
    
    console.log(`✅ Plugin refresh complete. Loaded ${this.plugins.size} plugins.`);
    return this.getPluginData();
  }
}

export default PluginLoader;

