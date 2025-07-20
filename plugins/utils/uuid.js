export default {
  name: 'UUID Generator',
  category: 'Utils',
  method: 'GET',
  path: '/api/utils/uuid',
  description: 'Generate UUID v4 or multiple UUIDs',
  params: {
    count: 'number (optional) - Number of UUIDs to generate (default: 1, max: 100)'
  },
  handler: async (req, res) => {
    const { count = 1 } = req.query;
    
    const numCount = parseInt(count);
    if (isNaN(numCount) || numCount < 1 || numCount > 100) {
      return res.status(400).json({
        success: false,
        error: 'Count must be a number between 1 and 100'
      });
    }
    
    // Simple UUID v4 generator
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    const uuids = Array.from({ length: numCount }, () => generateUUID());
    
    res.json({
      success: true,
      count: numCount,
      uuids: numCount === 1 ? uuids[0] : uuids,
      timestamp: new Date().toISOString()
    });
  }
};

