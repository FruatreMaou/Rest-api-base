export default {
  name: 'Text Generator',
  category: 'AI',
  method: 'POST',
  path: '/api/ai/text-generator',
  description: 'Generate random text based on type and length',
  params: {
    type: 'string (required) - Type of text: lorem, words, sentences',
    length: 'number (optional) - Length of generated text (default: 5)'
  },
  handler: async (req, res) => {
    const { type, length = 5 } = req.body;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: type'
      });
    }
    
    const numLength = parseInt(length);
    if (isNaN(numLength) || numLength < 1) {
      return res.status(400).json({
        success: false,
        error: 'Length must be a positive number'
      });
    }
    
    let result;
    
    switch (type.toLowerCase()) {
      case 'lorem':
        const loremWords = [
          'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
          'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
          'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud'
        ];
        result = Array.from({ length: numLength }, () => 
          loremWords[Math.floor(Math.random() * loremWords.length)]
        ).join(' ');
        break;
        
      case 'words':
        const randomWords = [
          'amazing', 'brilliant', 'creative', 'dynamic', 'elegant', 'fantastic', 'gorgeous',
          'incredible', 'joyful', 'magnificent', 'outstanding', 'perfect', 'remarkable',
          'spectacular', 'wonderful', 'excellent', 'beautiful', 'awesome', 'stunning'
        ];
        result = Array.from({ length: numLength }, () => 
          randomWords[Math.floor(Math.random() * randomWords.length)]
        ).join(' ');
        break;
        
      case 'sentences':
        const sentences = [
          'This is a sample sentence.',
          'Technology is advancing rapidly.',
          'Innovation drives progress.',
          'Creativity knows no bounds.',
          'The future is bright.',
          'Learning never stops.',
          'Dreams become reality.',
          'Success requires dedication.'
        ];
        result = Array.from({ length: numLength }, () => 
          sentences[Math.floor(Math.random() * sentences.length)]
        ).join(' ');
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid type. Use: lorem, words, sentences'
        });
    }
    
    res.json({
      success: true,
      type,
      length: numLength,
      result,
      timestamp: new Date().toISOString()
    });
  }
};

