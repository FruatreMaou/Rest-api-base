export default {
  name: 'Calculator',
  category: 'Tools',
  method: 'POST',
  path: '/api/tools/calculator',
  description: 'Simple calculator for basic arithmetic operations',
  params: {
    operation: 'string (required) - Operation type: add, subtract, multiply, divide',
    a: 'number (required) - First number',
    b: 'number (required) - Second number'
  },
  handler: async (req, res) => {
    const { operation, a, b } = req.body;
    
    if (!operation || a === undefined || b === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: operation, a, b'
      });
    }
    
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    
    if (isNaN(numA) || isNaN(numB)) {
      return res.status(400).json({
        success: false,
        error: 'Parameters a and b must be valid numbers'
      });
    }
    
    let result;
    
    switch (operation.toLowerCase()) {
      case 'add':
        result = numA + numB;
        break;
      case 'subtract':
        result = numA - numB;
        break;
      case 'multiply':
        result = numA * numB;
        break;
      case 'divide':
        if (numB === 0) {
          return res.status(400).json({
            success: false,
            error: 'Division by zero is not allowed'
          });
        }
        result = numA / numB;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid operation. Use: add, subtract, multiply, divide'
        });
    }
    
    res.json({
      success: true,
      operation,
      a: numA,
      b: numB,
      result,
      timestamp: new Date().toISOString()
    });
  }
};

