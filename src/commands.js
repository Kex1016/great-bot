require("dotenv").config();

const requireText = require("require-text");
import { getAnnouncementEmbed, getFromNextDays, query } from "./util";
import main from "./main";
import flatten from "array-flatten";
const fs = require("fs");
const nekoC = require('nekos.life');
const neko = new nekoC();
const moment = require('moment');
const momentTz = require('moment-timezone');
const Discord = require("discord.js");

const alIdRegex = /anilist\.co\/anime\/(.\d*)/;
const malIdRegex = /myanimelist\.net\/anime\/(.\d*)/;

const commands = {
  carnage: {
    description: "No u",
    async handle(message) {
      var resp1 = await neko.sfw.neko();
      var resp2 = await neko.sfw.kemonomimi();
      var resp3 = await neko.sfw.nekoGif();
      var resp, text;
      var random = getRandomInt(2);
      if (random === 0) {
        resp = resp1; text = "Neko";
      } else if (random === 1) {
        resp = resp2; text = "Kemonomimi";
      } else if (random == 2) {
        resp = resp3; text = "Neko GIF";
      }
      var embed = {
        author: {
          name: text,
          icon_url: message.client.user.avatarURL
        },
        color: 4044018,
        image: {
          url: resp.url,
        },
        footer: {
          text: "take this carnage"
        },
        fields: []
      };
      message.channel.send({ embed });
    }
  },
  setup: {
    description: "Kex only, dangerous command",
    async handle(message, args, data) {
      if (message.author.id === "147709526357966848") {
        var guild = message.guild;
        var json1 = `{`
        var i = 0, members = 0;
        guild.members.forEach(element => {
          if (!element.user.bot) {
            if (i === guild.members.length - 1) {
              json1 += `"${element.id}": {"message": 0}}`
            } else {
              json1 += `"${element.id}": {"message": 0},`
            }
            members++;
          }
          i++;
        });
        await fs.writeFileSync('./members.json', json1);
        message.channel.send(`Set up data for ${members} members`);
      }
      else {
        return message.channel.send(`Bad ${message.author.username}, this command is not for you.`);
      }
    }
  },
  rankings: {
    description: "Ranks everyone based on how many messages they've written this week.",
    handle(message, args, data) {
      moment.updateLocale('en', {
        week: {
          dow: 1
        }
      });
      var obj = JSON.parse(fs.readFileSync("./members.json", "utf8")), sorted = [];

      for (var a in obj) {
        sorted.push([a, obj[a]])
      }
      sorted.sort(function (a, b) { return a[1] - b[1] });
      sorted.reverse();

      var placement = 1;
      var embed = {
        title: "Rankings",
        author: {
          name: "praise me",
          icon_url: message.client.user.avatarURL
        },
        color: 4044018,
        description: "Placements so far this week:",
        footer: {
          text: `Rankings updating ${moment().endOf('week').fromNow()}`
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
      message.channel.send({ embed })
    }
  },
  '8ball': {
    description: "Ask the 8ball.",
    async handle(message, args, data) {
      var { neko } = await NekoGet(message, '8Ball');

      const embed = {
        title: "8ball",
        author: {
          name: "praise me",
          icon_url: message.client.user.avatarURL
        },
        color: 4044018,
        description: `${neko.response}, <@${message.author.id}>`,
        footer: {
          text: "Nice."
        },
        image: {
          url: neko.url,
        }
      };

      return message.channel.send({ embed });
    }
  },
  help: {
    description: "Prints out all available commands with a short description.",
    handle(message, args, data) {
      const embed = {
        title: "Commands",
        author: {
          name: "yes",
          icon_url: message.client.user.avatarURL
        },
        color: 4044018,
        description: "Commands must be prefixed by `" + (process.env.COMMAND_PREFIX || "!") + "`",
        footer: {
          text: "Nice."
        },
        fields: []
      };

      Object.entries(commands).forEach((k, v) => embed.fields.push({ name: k[0], value: k[1].description, inline: true }));

      message.channel.send({ embed });
    }
  },
  test1: {
    description: "test command #1",
    handle(message, args, data) {
      var guild = message.guild;
      var general = message.client.channels.get('540633148791455756');
      var obj = JSON.parse(fs.readFileSync('./time.json', 'utf8'));
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
          icon_url: message.client.user.avatarURL
        },
        color: 4044018,
        description: "***The week has ended! Here are the rankings for next week's time:***",
        footer: {
          text: `Rankings updating ${moment().endOf('week').fromNow()}`
        },
        fields: []
      };
      var lurkRole = guild.roles.get('672811156523712522');
      var separator = guild.roles.get('673201333658189856');
      var lurkers = "";
      sorted.forEach(async element => {
        process.setMaxListeners(0);
        if (element[1] > 0) {
          embed.fields.push({ name: `#${placement}`, value: `<@${element[0]}>\n${element[1]} messages`, inline: true });
          setTimeout(async () => {
            await guild.members.get(element[0]).roles.forEach(async element => {
              if (element.name != "Lurker" || element.name != "@everyone") {
                await element.setPosition(separator.position - placement);
              }
            });
          }, 50);
          placement++;
        } else {
          process.setMaxListeners(0);
          lurkers += `<@${element[0]}> `;
          var userE = await message.client.fetchUser(element[0]);
          var memE = await message.guild.member(userE);
          setTimeout(async () => {
            await memE.roles.forEach(async element => {
              if (element.name != "Lurker" || element.name != "@everyone") {
                await element.setPosition(lurkRole.position - 1);
              }
            });
            await memE.addRole('672811156523712522').catch(console.error());
          }, 50);
        }
      });
      embed.fields.push({ name: `Lurkers`, value: lurkers, inline: false });

      message.channel.send({ embed });
    }
  },
  test2: {
    description: "test command #2",
    async handle(message, args, data) {
      var guild = message.guild;
      var general = message.client.channels.get('540633148791455756');
      var pos = guild.roles.get("672811156523712522").position - 1;
      var separator = guild.roles.get('673201333658189856');


    }
  }
};

export default commands;

function getPermissionString() {
  switch (process.env.PERMISSION_TYPE) {
    case "CHANNEL_MANAGER":
      return "Requires the Channel Manager permission.";
    case "SERVER_OWNER":
      return "May only be used by the server owner.";
    default:
      return null;
  }
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function sortByKey(jsObj) {
  var sortedArray = [];

  // Push each JSON Object entry in array by [key, value]
  for (var i in jsObj) {
    sortedArray.push([i, jsObj[i]]);
  }

  // Run native sort function and returns sorted array.
  return sortedArray.sort();
}

async function NekoGet(message, type, text) {
  const client = require('nekos.life');
  const { sfw } = await new client();
  if (type === "OwOify") {
    var neko = await sfw[type]({ text: text });
  } else { var neko = await sfw[type](); }

  return {
    neko: neko,
  };
}