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
  let general = client.channels.get('540633148791455756');
  let server = general.guild;
  let eow = moment().endOf('week').fromNow();
  let timeObj = JSON.parse(fs.readFileSync('./time.json', 'utf8'));
  timeObj.week = moment().week();
  fs.writeFileSync('./time.json', JSON.stringify(timeObj));
  general.setTopic(`Season ${timeObj.season}.\nRankings update ${eow}.\nCurrent placements: **!!rankings**`);

  console.log(`Logged in as ${client.user.tag}\n\nEnd of week ${eow}\nWeek of year: ${timeObj.week}`);

  setInterval(() => {
    let timeObj = JSON.parse(fs.readFileSync('./time.json', 'utf8'));
    if (moment().week() > timeObj.week) {
      try {
        let guild = client.guilds.get("540633148791455754");
        let GENERAL_CHAT = client.channels.get('540633148791455756');

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
            .setAuthor('praise me', client.user.avatarURL)
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
                    top += `${member.id};s;`;
                    obj[member.id] = 0;
                  } else if (placement >= Math.round(total / 5) && placement <= Math.round(total / 3)) {
                    close += `${member.id};s;`;
                    obj[member.id] = 0;
                  } else if (placement >= Math.round(total / 3) && placement <= Math.round(total / 2)) {
                    regular += `${member.id};s;`;
                    obj[member.id] = 0;
                  } else if (placement >= Math.round(total / 2) && placement <= total) {
                    barely += `${member.id};s;`;
                    obj[member.id] = 0;
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

        timeObj.season++;
        fs.writeFileSync('./time.json', JSON.stringify(timeObj));
        fs.writeFileSync('./members.json', JSON.stringify(obj));

        return general.send(rankingEmbed);
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log(`[EOW CHECK] End of week in: ${eow}`);
      timeObj.week = moment().week();
      fs.writeFileSync('./time.json', JSON.stringify(timeObj));
    }
    general.setTopic(`Season ${timeObj.season}.\nRankings update ${eow}.\nCurrent placements: **!!rankings**`);
    //  Check this week's ranking with \`!!ranking\`
  }, 60000);

  // handleSchedules(Math.round(getFromNextDays().getTime() / 1000)); // Initial run
  // setInterval(() => handleSchedules(Math.round(getFromNextDays().getTime() / 1000)), 1000 * 60 * 60 * 24); // Schedule future runs every 24 hours
});

client.on('error', console.error);

client.on("message", async msg => {
  if (!msg.guild) return;

  if (msg.author.bot) return;

  let hooks = await msg.guild.fetchWebhooks();

  hooks.forEach(element => {
    if (msg.channel.id === element.channelID) {
      let obj = JSON.parse(fs.readFileSync('./members.json', 'utf8'));
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
      if (member.roles.has("673284195468050434")) member.removeRole(unrankR)
      if (member.roles.has("672811156523712522")) member.removeRole(lurkR)
      if (member.roles.has("673282194743099392")) member.removeRole(regularR)
      if (member.roles.has("673281913179471892")) member.removeRole(closeR)
      if (member.roles.has("673281903335571467")) member.removeRole(barelyR)
    }
  }
  console.log("Determining those who came close")
  for (let i = 0; i < closeA.length; i++) {
    const member = await guild.members.get(closeA[i]);
    if (member !== undefined) {
      console.log(`Close: ${closeA[i]}`)
      await member.addRole(closeR);
      if (member.roles.has("673284195468050434")) member.removeRole(unrankR)
      if (member.roles.has("672811156523712522")) member.removeRole(lurkR)
      if (member.roles.has("673282194743099392")) member.removeRole(regularR)
      if (member.roles.has("673281903335571467")) member.removeRole(barelyR)
      if (member.roles.has("673281909547335691")) member.removeRole(topR)
    }
  }
  console.log("Determining Regulars")
  for (let i = 0; i < regularA.length; i++) {
    const member = await guild.members.get(regularA[i]);
    if (member !== undefined) {
      console.log(`Regular: ${regularA[i]}`)
      await member.addRole(regularR);
      if (member.roles.has("673284195468050434")) member.removeRole(unrankR)
      if (member.roles.has("672811156523712522")) member.removeRole(lurkR)
      if (member.roles.has("673281903335571467")) member.removeRole(barelyR)
      if (member.roles.has("673281913179471892")) member.removeRole(closeR)
      if (member.roles.has("673281909547335691")) member.removeRole(topR)
    }
  }
  console.log("Determining Barely Active")
  for (let i = 0; i < barelyA.length; i++) {
    const member = await guild.members.get(barelyA[i]);
    if (member !== undefined) {
      console.log(`Barely active: ${barelyA[i]}`)
      await member.addRole(barelyR);
      if (member.roles.has("673284195468050434")) member.removeRole(unrankR)
      if (member.roles.has("672811156523712522")) member.removeRole(lurkR)
      if (member.roles.has("673282194743099392")) member.removeRole(regularR)
      if (member.roles.has("673281913179471892")) member.removeRole(closeR)
      if (member.roles.has("673281909547335691")) member.removeRole(topR)
    }
  }
  console.log("Determining Lurkers")
  for (let i = 0; i < lurkA.length; i++) {
    const member = await guild.members.get(lurkA[i]);
    if (member !== undefined) {
      console.log(`Lurker: ${lurkA[i]}`)
      await member.addRole(lurkR);
      if (member.roles.has("673284195468050434")) member.removeRole(unrankR)
      if (member.roles.has("673281903335571467")) member.removeRole(barelyR)
      if (member.roles.has("673282194743099392")) member.removeRole(regularR)
      if (member.roles.has("673281913179471892")) member.removeRole(closeR)
      if (member.roles.has("673281909547335691")) member.removeRole(topR)
    }
  }
}