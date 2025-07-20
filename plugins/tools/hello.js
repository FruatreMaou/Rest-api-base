export default {
  name: 'Hello World',
  category: 'Tools',
  method: 'GET',
  path: '/api/tools/hello',
  description: 'Simple hello world endpoint with optional name parameter',
  params: {
    name: 'string (optional) - Name to greet'
  },
  handler: async (req, res) => {
    const { name } = req.query;
    const greeting = name ? `Hello, ${name}!` : 'Hello, World!';
    
    res.json({
      success: true,
      message: greeting,
      timestamp: new Date().toISOString(),
      endpoint: 'hello'
    });
  }
};

