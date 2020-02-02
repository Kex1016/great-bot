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
      let resp1 = await neko.sfw.neko();
      let resp2 = await neko.sfw.kemonomimi();
      let resp3 = await neko.sfw.nekoGif();
      let resp, text;
      let random = getRandomInt(2);
      if (random === 0) {
        resp = resp1;
        text = "Neko";
      } else if (random === 1) {
        resp = resp2;
        text = "Kemonomimi";
      } else if (random == 2) {
        resp = resp3;
        text = "Neko GIF";
      }
      let embed = {
        author: { name: text, icon_url: message.client.user.avatarURL },
        color: 4044018,
        image: {
          url: resp.url,
        },
        footer: { text: "take this carnage" },
        fields: []
      };
      message.channel.send({ embed });
    }
  },
  setup: {
    description: "Kex only, dangerous command",
    async handle(message, args, data) {
      if (message.author.id === "147709526357966848") {
        let guild = message.guild;
        let json1 = `{`
        let i = 0, members = 0;
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
      } else {
        return message.channel.send(
          `Bad ${message.author.username}, this command is not for you.`);
      }
    }
  },
  rankings: {
    description:
      "Ranks everyone based on how many messages they've written this week.",
    handle(message, args, data) {
      moment.updateLocale('en', { week: { dow: 1 } });
      let obj = JSON.parse(fs.readFileSync("./members.json", "utf8")),
        sorted = [];

      for (let a in obj) {
        sorted.push([a, obj[a]])
      }
      sorted.sort(function (a, b) { return a[1] - b[1] });
      sorted.reverse();

      let placement = 1;
      let embed = {
        title: "Rankings",
        author: { name: "praise me", icon_url: message.client.user.avatarURL },
        color: 4044018,
        description: "Placements so far this week:",
        footer:
          { text: `Rankings updating ${moment().endOf('week').fromNow()}` },
        fields: []
      };
      let lurkers = "";
      sorted.forEach(element => {
        if (element[1] > 0) {
          embed.fields.push({
            name: `#${placement}`,
            value: `<@${element[0]}>\n${element[1]} messages`,
            inline: true
          });
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
      let { neko } = await NekoGet(message, '8Ball');

      const embed = {
        title: "8ball",
        author: { name: "praise me", icon_url: message.client.user.avatarURL },
        color: 4044018,
        description: `${neko.response}, <@${message.author.id}>`,
        footer: { text: "Nice." },
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
        author: { name: "yes", icon_url: message.client.user.avatarURL },
        color: 4044018,
        description: "Commands must be prefixed by `" +
          (process.env.COMMAND_PREFIX || "!") + "`",
        footer: { text: "Nice." },
        fields: []
      };

      Object.entries(commands).forEach(
        (k, v) => embed.fields.push(
          { name: k[0], value: k[1].description, inline: true }));

      message.channel.send({ embed });
    }
  },
  forcerank: {
    description: "Kex only, force ranks the members",
    async handle(message, args, data) {
      if (message.author.id === "147709526357966848") {
        try {
          let guild = message.guild;
          let GENERAL_CHAT = message.client.channels.get('540633148791455756');

          let obj = JSON.parse(fs.readFileSync('./time.json', 'utf8'));
          obj.week = moment().week();

          console.log(`[EOW CHECK] Week ended! Updated rankings.`);

          obj.week = moment().week();
          fs.writeFileSync('./time.json', JSON.stringify(obj));

          obj = JSON.parse(fs.readFileSync("./members.json", "utf8"));
          let sortedArray = [];

          for (let a in obj) {
            sortedArray.push([a, obj[a]])
          }

          sortedArray.sort(function (a, b) { return a[1] - b[1]; });
          sortedArray.reverse();

          let placement = 1;

          // Embed Declaration
          let rankingEmbed =
            new Discord.RichEmbed()
              .setColor('#ADBCE6')
              .setTitle('Ranking')
              .setAuthor('praise me', message.client.user.avatarURL)
              .setDescription(
                '***The week has ended! Here are the rankings for next week\'s time:***');

          let sum = 0, total = 0, avg = 0;

          sortedArray.forEach(element => {
            if (element[1] !== 0) {
              sum += element[1];
              total++;
            }
          })

          avg = sum / total;
          rankingEmbed.setFooter(
            `Average amount of messages this week: ${Math.round(avg)}`);

          let top = "", close = "", regular = "", barely = "", lurk = "", lurkers = "";

          process.setMaxListeners(0);

          (async () => {
            for (let i = 0; i < sortedArray.length; i++) {
              const element = sortedArray[i];

              if (element[1] !== 0) {
                rankingEmbed.fields.push({
                  name: `#${placement}`,
                  value: `<@${element[0]}>\n${element[1]} messages`,
                  inline: true
                }); // fields get pushed into embed

                guild.members.forEach(async member => {
                  if (member.id === element[0]) {
                    console.log(`Element: ${element[0]} - ${element[1]}\nMember: ${member.id}`)
                    if (placement < 4) {
                      top += `${member.id};s;`
                    } else if (placement >= Math.round(total / 5) && placement <= Math.round(total / 3)) {
                      close += `${member.id};s;`
                    } else if (placement >= Math.round(total / 3) && placement <= Math.round(total / 2)) {
                      regular += `${member.id};s;`
                    } else if (placement >= Math.round(total / 2) && placement <= total) {
                      barely += `${member.id};s;`
                    }
                  }
                });

                placement++;
              } else if (element[1] === 0) {
                lurkers += `<@${element[0]}> `;
                lurk += `${element[0]};s;`
              }
            }
          })().catch(console.error);

          memberRank(guild, top, close, regular, barely, lurk); //Determine rankings

          rankingEmbed.fields.push(
            { name: `Lurkers`, value: lurkers, inline: false });

          return message.channel.send(rankingEmbed);
        } catch (err) {
          console.log(err);
        }
      } else {
        return message.channel.send(
          `Bad ${message.author.username}, this command is not for you.`);
      }
    }
  },
  forceunrank: {
    description: "Kex only, force unranks the members",
    async handle(message, args, data) {
      if (message.author.id === "147709526357966848") {
        try {
          let guild = message.guild;
          let GENERAL_CHAT = message.client.channels.get('540633148791455756');

          let obj = JSON.parse(fs.readFileSync("./members.json", "utf8"));
          let sortedArray = [];

          for (let a in obj) {
            sortedArray.push([a, obj[a]])
          }

          sortedArray.sort(function (a, b) { return a[1] - b[1]; });
          sortedArray.reverse();

          let members = "";

          process.setMaxListeners(0);

          (async () => {
            for (let i = 0; i < sortedArray.length; i++) {
              const element = sortedArray[i];
              members += `${element[0]};s;`
            }
          })().catch(console.error);

          memberUnrank(guild, members);

          return message.channel.send("Members forcefully unranked. Rude.");
        } catch (err) {
          console.log(err);
        }
      } else {
        return message.channel.send(
          `Bad ${message.author.username}, this command is not for you.`);
      }
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
  let sortedArray = [];

  // Push each JSON Object entry in array by [key, value]
  for (let i in jsObj) {
    sortedArray.push([i, jsObj[i]]);
  }

  // Run native sort function and returns sorted array.
  return sortedArray.sort();
}

async function NekoGet(message, type, text) {
  const client = require('nekos.life');
  const { sfw } = await new client();
  if (type === "OwOify") {
    let neko = await sfw[type]({ text: text });
  } else {
    let neko = await sfw[type]();
  }

  return {
    neko: neko,
  };
}

async function memberRank(guild, top, close, regular, barely, lurk) {
  let topA = top.split(';s;');
  let closeA = close.split(';s;');
  let regularA = regular.split(';s;');
  let barelyA = barely.split(';s;');
  let lurkA = lurk.split(';s;');

  // Role Declarations
  let unrankR = guild.roles.get("673284195468050434");
  let lurkR = guild.roles.get("672811156523712522");
  let barelyR = guild.roles.get("673281903335571467");
  let regularR = guild.roles.get("673282194743099392");
  let closeR = guild.roles.get("673281913179471892");
  let topR = guild.roles.get("673281909547335691");

  console.log("Determining top 3")
  for (let i = 0; i < topA.length; i++) {
    const member = await guild.members.get(topA[i]);
    if (member !== undefined) {
      console.log(`Top: ${topA[i]}`)
      const member = await guild.members.get(topA[i]);
      await member.addRole(topR);
      if (member.roles.has("673284195468050434")) await member.removeRole(unrankR)
      if (member.roles.has("672811156523712522")) await member.removeRole(lurkR)
      if (member.roles.has("673282194743099392")) await member.removeRole(regularR)
      if (member.roles.has("673281913179471892")) await member.removeRole(closeR)
      if (member.roles.has("673281903335571467")) await member.removeRole(barelyR)
    }
  }
  console.log("Determining those who came close")
  for (let i = 0; i < closeA.length; i++) {
    const member = await guild.members.get(closeA[i]);
    if (member !== undefined) {
      console.log(`Close: ${closeA[i]}`)
      await member.addRole(closeR);
      if (member.roles.has("673284195468050434")) await member.removeRole(unrankR)
      if (member.roles.has("672811156523712522")) await member.removeRole(lurkR)
      if (member.roles.has("673282194743099392")) await member.removeRole(regularR)
      if (member.roles.has("673281903335571467")) await member.removeRole(barelyR)
      if (member.roles.has("673281909547335691")) await member.removeRole(topR)
    }
  }
  console.log("Determining Regulars")
  for (let i = 0; i < regularA.length; i++) {
    const member = await guild.members.get(regularA[i]);
    if (member !== undefined) {
      console.log(`Regular: ${regularA[i]}`)
      await member.addRole(regularR);
      if (member.roles.has("673284195468050434")) await member.removeRole(unrankR)
      if (member.roles.has("672811156523712522")) await member.removeRole(lurkR)
      if (member.roles.has("673281903335571467")) await member.removeRole(barelyR)
      if (member.roles.has("673281913179471892")) await member.removeRole(closeR)
      if (member.roles.has("673281909547335691")) await member.removeRole(topR)
    }
  }
  console.log("Determining Barely Active")
  for (let i = 0; i < barelyA.length; i++) {
    const member = await guild.members.get(barelyA[i]);
    if (member !== undefined) {
      console.log(`Barely active: ${barelyA[i]}`)
      await member.addRole(barelyR);
      if (member.roles.has("673284195468050434")) await member.removeRole(unrankR)
      if (member.roles.has("672811156523712522")) await member.removeRole(lurkR)
      if (member.roles.has("673282194743099392")) await member.removeRole(regularR)
      if (member.roles.has("673281913179471892")) await member.removeRole(closeR)
      if (member.roles.has("673281909547335691")) await member.removeRole(topR)
    }
  }
  console.log("Determining Lurkers")
  for (let i = 0; i < lurkA.length; i++) {
    const member = await guild.members.get(lurkA[i]);
    if (member !== undefined) {
      console.log(`Lurker: ${lurkA[i]}`)
      await member.addRole(lurkR);
      if (member.roles.has("673284195468050434")) await member.removeRole(unrankR)
      if (member.roles.has("673281903335571467")) await member.removeRole(barelyR)
      if (member.roles.has("673282194743099392")) await member.removeRole(regularR)
      if (member.roles.has("673281913179471892")) await member.removeRole(closeR)
      if (member.roles.has("673281909547335691")) await member.removeRole(topR)
    }
  }
}

async function memberUnrank(guild, mem) {
  let memA = mem.split(';s;');

  // Role Declarations
  let unrankR = guild.roles.get("673284195468050434");
  let lurkR = guild.roles.get("672811156523712522");
  let barelyR = guild.roles.get("673281903335571467");
  let regularR = guild.roles.get("673282194743099392");
  let closeR = guild.roles.get("673281913179471892");
  let topR = guild.roles.get("673281909547335691");

  console.log("Making everyone unranked")
  for (let i = 0; i < memA.length; i++) {
    const member = await guild.members.get(memA[i]);
    if (member !== undefined) {
      console.log(`Unranked: ${memA[i]}`)
      const member = await guild.members.get(memA[i]);
      await member.addRole(unrankR);
      if (member.roles.has("673281909547335691")) await member.removeRole(topR)
      if (member.roles.has("672811156523712522")) await member.removeRole(lurkR)
      if (member.roles.has("673282194743099392")) await member.removeRole(regularR)
      if (member.roles.has("673281913179471892")) await member.removeRole(closeR)
      if (member.roles.has("673281903335571467")) await member.removeRole(barelyR)
    }
  }
}