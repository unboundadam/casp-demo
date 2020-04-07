import { CaspApi, CaspParticipant } from "./casp-api";
import { CaspBot } from "./casp-bot";
import fs from 'fs';
import path from 'path';
const {promisify} = require('util');
const writeFileAsync = promisify(fs.writeFile);
const config = require('config');
const data = config.data;

var casp = new CaspApi(config);
var caspBot = new CaspBot(config);
var dataRoot = path.join(__dirname, "..", "data");
var botsFolder = path.join(dataRoot, "bots");

async function init() {
  fs.mkdirSync(dataRoot, { recursive: true});
  fs.mkdirSync(botsFolder, { recursive: true});
  await casp.init();
  casp.activeAccount = await casp.findOrCreateAccount(data.account.name);
  for (let i = 0; i < data.bots.length; i++) {
      var botData = data.bots[i];
      var bot = await casp.findOrCreateParticipant(null, botData.name, botData.offline);
      if(bot.activationCode) {
        if(bot.offline) {
          await activateBot(casp, bot);
        } else {
          await caspBot.register(bot.id, bot.activationCode);
        }
      }
      if(!bot.offline) {
        caspBot.autoApprove(bot.id);
      }
      // bot = await casp.findOrCreateParticipant(null, botData.name);
      console.log(bot);
  }
}

async function activateBot(casp: CaspApi, p: CaspParticipant) {
  var outputFilePath = path.join(botsFolder, `${p.id}_activation_response.json`);
  var inputFilePath = path.join(botsFolder, `${p.id}_activation_request.json` );
  fs.writeFileSync(inputFilePath, JSON.stringify({
    name: p.name,
    serverAuthenticationKey: p.serverAuthenticationKey,
    serverEncryptionKey: p.serverEncryptionKey
  }));
  await caspBot.activateOfflineBot(p.id, p.activationCode,
    inputFilePath,
    outputFilePath);
  var activationData = fs.readFileSync(outputFilePath);
  var resp = await casp.activateOfflineParticipant(p.id, activationData);
  fs.unlinkSync(outputFilePath);
  fs.unlinkSync(inputFilePath);
}


(async function() {
  try {
    await init();
    // console.log(p);
  } catch(e) {
    console.log(e);
  }
})()

// java -Djava.library.path=/test/bots -jar /
// test/bots/BotSigner.jar -k -p e695621c-f029-4e99-b8cd-3f1b6726f02d -w 12345
// 6 -u https://localhost/casp -c 369558 -i /test/bots/offline_p_e69562_activa
// tion.json -o -t /test/bots/off1-response
// bck-i-search: java_
//

// api.getInfo({user: "", password: ""})
//   .then(resp => {
//     console.log(resp);
//   })
