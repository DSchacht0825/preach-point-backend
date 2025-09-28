module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'healthy',
    service: 'Preach Point Backend',
    timestamp: new Date().toISOString()
  });
};