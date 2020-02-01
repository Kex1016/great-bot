require("dotenv").config();
const requireText = require("require-text");
const discord = require("discord.js");
const client = new discord.Client();
const flatten = require("array-flatten");
const fs = require("fs");
import commands from "./commands";
import { getAnnouncementEmbed, getFromNextDays, query } from "./util";
const moment = require('moment');
const momentTz = require('moment-timezone');

const commandPrefix = process.env.COMMAND_PREFIX || "!";
const dataFile = "./data.json";
let data = {};
let queuedNotifications = [];

client.on("ready", () => {
  moment.updateLocale('en', {
    week: {
      dow: 1
    }
  });
  var general = client.channels.get('540633148791455756');
  var server = general.guild;
  var eow = moment().endOf('week').fromNow();
  var obj = JSON.parse(fs.readFileSync('./time.json', 'utf8'));
  obj.week = moment().week();
  fs.writeFileSync('./time.json', JSON.stringify(obj));
  general.setTopic(`Season ${obj.season}.\nRankings update ${eow}.\nCurrent placements: **!!rankings**`);

  console.log(`Logged in as ${client.user.tag}\n\nEnd of week ${eow}\nWeek of year: ${obj.week}`);

  setInterval(() => {
    var obj = JSON.parse(fs.readFileSync('./time.json', 'utf8'));
    if (moment().week() > obj.week) {
      console.log(`[EOW CHECK] Week ended! Updated rankings.`);
      obj.week = moment().week();
      fs.writeFileSync('./time.json', JSON.stringify(obj));

      var obj = JSON.parse(fs.readFileSync("./members.json", "utf8")), sorted = [];

      for (var a in obj) {
        sorted.push([a, obj[a]])
      }
      sorted.sort(function (a, b) { return a[1] - b[1] });
      sorted.reverse();

      var placement = 1;
      var embed = {
        title: "Ranking",
        author: {
          name: "praise me",
          icon_url: client.user.avatarURL
        },
        color: 4044018,
        description: "***The week has ended! Here are the rankings for next week's time:***",
        footer: {
          text: `The bot is currently in test mode, so none of the roles will be actually changed.`
        },
        fields: []
      };
      var lurkers = "";
      sorted.forEach(element => {
        if (element[1] > 0) {
          embed.fields.push({ name: `#${placement}`, value: `<@${element[0]}>\n${element[1]} messages`, inline: true });
          placement++;
        } else {
          lurkers += `<@${element[0]}> `;
        }
      });
      embed.fields.push({ name: `Lurkers`, value: lurkers, inline: false });

      general.send({ embed });
    } else {
      console.log(`[EOW CHECK] End of week in: ${eow}`);
      obj.week = moment().week();
      fs.writeFileSync('./time.json', JSON.stringify(obj));
    }
    general.setTopic(`Season ${obj.season}.\nRankings update ${eow}.\nCurrent placements: **!!rankings**`);
    //  Check this week's ranking with \`!!ranking\`
  }, 60000);

  // handleSchedules(Math.round(getFromNextDays().getTime() / 1000)); // Initial run
  // setInterval(() => handleSchedules(Math.round(getFromNextDays().getTime() / 1000)), 1000 * 60 * 60 * 24); // Schedule future runs every 24 hours
});

client.on('error', console.error);

client.on("message", async msg => {
  if (!msg.guild) return;

  if (msg.author.bot) return;

  var hooks = await msg.guild.fetchWebhooks();

  hooks.forEach(element => {
    if (msg.channel.id === element.channelID) {
      var obj = JSON.parse(fs.readFileSync('./members.json', 'utf8'));
      obj[msg.author.id]++;
      console.log(`[MSG - ${msg.author.tag} - #${msg.channel.name}] ${obj[msg.author.id]} messages`);
      fs.writeFileSync('./members.json', JSON.stringify(obj));
    }
  });



  const msgContent = msg.content.split(" ");

  if (msgContent[0].startsWith(commandPrefix)) {
    const command = commands[msgContent[0].substr(commandPrefix.length)];
    if (command) {
      const serverData = data[msg.guild.id] || {};
      const promise = command.handle(msg, msgContent.slice(1), serverData);
      if (promise) {
        promise.then(ret => {
          if (ret) {
            data[msg.guild.id] = ret;
            // fs.writeFileSync(dataFile, JSON.stringify(data));
          }
        });
      }
    }
  }
});

client.login(process.env.BOT_TOKEN);

export default {
  commandPrefix,
  client
}
