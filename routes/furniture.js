const express = require('express');
const router = express.Router();
const {
    getFurniture,
    getFurnitureById,
    createFurniture,
    updateFurniture,
    deleteFurniture
} = require('../controllers/furnitureController');

router.route('/').get(getFurniture).post(createFurniture);
router.route('/:id').get(getFurnitureById).put(updateFurniture).delete(deleteFurniture);

module.exports = router;