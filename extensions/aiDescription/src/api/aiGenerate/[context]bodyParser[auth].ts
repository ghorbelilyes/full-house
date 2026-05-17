import bodyParser from 'body-parser';

export default (request, response, next) => {
  // Increase limit for AI responses that may include large descriptions
  bodyParser.json({ inflate: false, limit: '2mb' })(request, response, next);
};
