const express = require('express');
const { getWeatherPreview } = require('../controllers/weatherController');

const router = express.Router();

// Exposes GET /api/weather?date&city for client-side previews.
router.get('/', getWeatherPreview);

module.exports = router;


