export default {
  name: 'URL Info',
  category: 'Downloader',
  method: 'GET',
  path: '/api/downloader/url-info',
  description: 'Get information about a URL including title and meta data',
  params: {
    url: 'string (required) - URL to analyze'
  },
  handler: async (req, res) => {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: url'
      });
    }
    
    try {
      // Validate URL format
      const urlObj = new URL(url);
      
      // Simulate URL analysis (in real app, you'd fetch the page)
      const mockData = {
        url: url,
        domain: urlObj.hostname,
        protocol: urlObj.protocol,
        title: `Sample Title for ${urlObj.hostname}`,
        description: 'This is a mock description of the webpage content.',
        status: 'accessible',
        contentType: 'text/html',
        lastChecked: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: mockData,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Invalid URL format',
        details: error.message
      });
    }
  }
};

