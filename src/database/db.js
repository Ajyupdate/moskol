
const mongoose = require('mongoose');

// const uri = 'mongodb://127.0.0.1:27017/moskol';
const uri = 'mongodb+srv://Ajy14:emmanuel2001@cluster0.imd9dxq.mongodb.net/moskol?retryWrites=true&w=majority';

const connectToDb = async () => {
  return await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
};

module.exports = {
  connectToDb,
};