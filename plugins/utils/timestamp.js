export default {
  name: 'Timestamp Converter',
  category: 'Utils',
  method: 'GET',
  path: '/api/utils/timestamp',
  description: 'Convert between timestamp and human readable date',
  params: {
    timestamp: 'number (optional) - Unix timestamp to convert',
    date: 'string (optional) - Date string to convert to timestamp'
  },
  handler: async (req, res) => {
    const { timestamp, date } = req.query;
    
    if (!timestamp && !date) {
      // Return current timestamp if no parameters
      const now = new Date();
      return res.json({
        success: true,
        current: {
          timestamp: Math.floor(now.getTime() / 1000),
          iso: now.toISOString(),
          local: now.toLocaleString(),
          utc: now.toUTCString()
        }
      });
    }
    
    try {
      let result = {};
      
      if (timestamp) {
        const ts = parseInt(timestamp);
        if (isNaN(ts)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid timestamp format'
          });
        }
        
        const dateObj = new Date(ts * 1000);
        result.fromTimestamp = {
          timestamp: ts,
          iso: dateObj.toISOString(),
          local: dateObj.toLocaleString(),
          utc: dateObj.toUTCString()
        };
      }
      
      if (date) {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid date format'
          });
        }
        
        result.fromDate = {
          date: date,
          timestamp: Math.floor(dateObj.getTime() / 1000),
          iso: dateObj.toISOString(),
          local: dateObj.toLocaleString(),
          utc: dateObj.toUTCString()
        };
      }
      
      res.json({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Error processing request',
        details: error.message
      });
    }
  }
};

