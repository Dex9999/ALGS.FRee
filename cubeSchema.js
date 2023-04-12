const mongoose = require('mongoose');

// Define the schema for the document
const cubeSchema = new mongoose.Schema({
  caseNum: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  algs: [{ alg: String, votes: Number, date: String, _id: false }]
});
//SpeedcubeRanker goes in the .env string after the slash
//'OLL' is the name of the *collection* in the database
module.exports = mongoose.model('OLL', cubeSchema, 'OLL');