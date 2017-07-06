var fs = require('fs');
var bing = require('bingspeech-api-client');

var audioStream = fs.createReadStream('d:\\wave.m4a'); 
var subscriptionKey = 'e891c4019cfd40c4b867e69fb066f1f7';

var client = new bing.BingSpeechClient(subscriptionKey);
client.recognizeStream(audioStream)
      .then(response => console.log(response.results[0].name));