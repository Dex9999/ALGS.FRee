import mongoose from 'mongoose'

// Define the schema for the document
const cubeSchema = new mongoose.Schema({
  caseNum: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  algs: [{ alg: String, votes: Number, date: String }]
});

export default mongoose.model('Cube', cubeSchema)