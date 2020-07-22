const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Web3 = require('web3');
const configERC = require('./app/config/configERC');
const configMongo = require('./app/config/configMongo');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
console.log(configMongo.connection_string);
mongoose.connect(configMongo.connection_string);

app.listen(configERC.port, () => console.log('App running!'));

app.get(configERC.api_path, (req, res) => {
  const transactionCollectionSchema = new mongoose.Schema({}, { strict: false });
  const TransactionCollection = mongoose.model('transactions', transactionCollectionSchema);
  TransactionCollection.find().sort({transactionIndex: -1}).skip(Number(req.query.skip)).limit(Number(req.query.limit)).exec(function(err, transactions){
    res.send(transactions);
  });
});

app.post(configERC.api_path, (req, res) => {
  const web3 = new Web3(new Web3.providers.HttpProvider(configERC.infura_endpoint + req.query.owner));
  web3.eth.getBlockNumber().then(blockNumber => {
    web3.eth.getBlockTransactionCount(blockNumber).then(countTransactions => {
      for (var i=0; i <= countTransactions; i++) {
        web3.eth.getTransactionFromBlock(blockNumber, i).then(transaction => {
          saveData(transaction);
          res.send({
              "msg": "Data Saved Successfully"
          });
        });
      }
    });
  });
});

async function saveData(object) {
  try {
      const TransactionCollection = mongoose.model('transactions');
      const transactionCollectionData = new TransactionCollection(object);
      await transactionCollectionData.save();
  } catch (error) {
      const transactionCollectionSchema = new mongoose.Schema({}, { strict: false });
      const TransactionCollection = mongoose.model('transactions', transactionCollectionSchema);
      const transactionCollectionData = new TransactionCollection(object);
      await transactionCollectionData.save();
  }
};
