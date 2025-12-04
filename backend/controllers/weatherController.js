const { getWeatherForDate } = require('../services/weatherService');

const getWeatherPreview = async (req, res, next) => {
  try {
    const { date, city } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'date query parameter is required' });
    }
    const weather = await getWeatherForDate(date, city);
    res.json(weather);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWeatherPreview,
};


