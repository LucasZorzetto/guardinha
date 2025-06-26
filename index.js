const http = require('http');

const port = process.env.PORT || 8080;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running!');
}).listen(port, () => {
  console.log(`fs running on port ${port}`);
});

const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource
} = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');

//const config = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 21 || hour < 5;
}

function getRandomTimeout() {
  const min = 15 * 60 * 1000;
  const max = 30 * 60 * 1000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function nightLoop() {
  if (isNightTime()) {
    console.log('real shit');
    console.log(`Running on Node.js version: ${process.version}`);

    const guilds = await client.guilds.fetch();

    for (const [guildId] of guilds) {
      try {
        const guild = await client.guilds.fetch(guildId);
        const fullGuild = await guild.fetch();

        const voiceChannels = fullGuild.channels.cache.filter(
          c => c.type === 2 && c.members.size > 0
        );

        if (voiceChannels.size === 0) {
          console.log(`No active voice channels in ${guild.name}`);
          continue;
        }

        const randomChannel = voiceChannels.random();
        console.log(`Joining ${randomChannel.name} in ${guild.name}`);

        const connection = joinVoiceChannel({
          channelId: randomChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'mix', 'guardinha sirene left right.wav'));

        connection.subscribe(player);
        player.play(resource);

        setTimeout(() => {
          console.log(`Leaving ${guild.name}`);
          player.stop();
          connection.destroy();
        }, 8000);

        break;

      } catch (err) {
        console.error(`Error in guild ${guildId}:`, err);
      }
    }

  } else {
    console.log('i sleep');
  }

  const nextTimeout = getRandomTimeout();
  console.log(`Waiting ${Math.floor(nextTimeout / 1000)} seconds until next check...`);
  setTimeout(nightLoop, nextTimeout);
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  nightLoop();
});

client.login(process.env.TOKEN);