const express = require('express');
const { getWeatherPreview } = require('../controllers/weatherController');

const router = express.Router();

router.get('/', getWeatherPreview);

module.exports = router;


