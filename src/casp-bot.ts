var child_process = require('child_process');
import path from 'path';
const DEFAULT_KEYSTORE_PASSWORD = "123456";
const DEFAUTL_BOT_JAR_DIR = `${__dirname}/../casp-bot`;
export class CaspBot {
    constructor(
      readonly config: {
        caspServerUrl: string,
        botKeyStorePassword?: string,
        caspBotFolder?: string
      }) {

    }

    private async spawn(...args: string[]): Promise<any> {
      var botsDir = this.config.caspBotFolder || DEFAUTL_BOT_JAR_DIR;
      var child =  child_process.spawn(
        'java',
        [
          '-Djava.library.path=' + botsDir,
          '-jar', path.join(botsDir, "BotSigner.jar"),
          '-k',
          '-u', this.config.caspServerUrl,
          '-w', this.config.botKeyStorePassword || DEFAULT_KEYSTORE_PASSWORD,
          ...args
        ],
        {
          cwd: botsDir
        }

      );
      return new Promise((resolve, reject) => {
        child.on('exit', code => {
          console.log(`Exit code is: ${code}`);
          resolve();
        });

        child.stdout.on('data', function(data) {
            console.log(data.toString());
        });

        child.stderr.on("data", function (data) {
            console.log(data.toString());
        });

      })

    }

    async register(
      participantID: string,
      activationCode: string) {
        return this.spawn(
          '-p', participantID,
          '-c', activationCode
      );
    }

    async autoApprove(
      participantID: string) {
        return this.spawn(
          '-p', participantID
      );
    }

    async activateOfflineBot(participantID: string,
      activationCode: string,
      inputFilePath: string,
      outputFilePath: string
    ) {
      return this.spawn(
        '-p', participantID,
        '-c', activationCode,
        '-i', inputFilePath,
        '-t', outputFilePath,
        '--offline'
      );
    }
}
