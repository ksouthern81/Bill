const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const validateIP = require('validate-ip-node');
const request = require('request-promise');

class Init extends Commando.Command {
  constructor(client) {
    super(client, {
      name: 'init',
      aliases: ['setup', 'setupinit', 'serverinit', 'serversetup'],
      group: 'config',
      memberName: 'init',
      guildOnly: true,
      description: 'Initialize a server',
      examples: ['init ip port name token', '?init 192.168.01 1004 testName testToken'],
      args: [{
          key: 'ip',
          label: 'IP',
          prompt: 'Specify the server ip please',
          type: 'string',
          validate: validateIP
        },
        {
          key: 'port',
          label: 'Port',
          prompt: 'Specify the server port please',
          type: 'integer'
        },
        {
          key: 'name',
          label: 'Authorization name',
          prompt: 'Specify a authorization name please',
          type: 'string'
        },
        {
          key: 'token',
          label: 'Authorization token',
          prompt: 'Specify a authorization token please',
          type: 'string'
        }
      ]
    });
  }

  async run(msg, args) {
    const client = this.client
    const ip = args.ip
    const port = args.port
    const name = args.name
    const token = args.token
    let embed = makeStatusEmbed(client.makeBillEmbed());
    let errorReceived

    client.logger.info("Initializing a server. Discord name: " + msg.guild.name + " args: " + ip + " " + port);
    embed.title = ":gear: Verifying your server.";
    msg.channel.send({
      embed
    }).then(async function(message) {
      let statusMesssage = message
      embed.description = "Checking for access to necessary api endpoints\n";
      client.logger.info("Checking for access to necessary api endpoints")
      updateStatus(embed, statusMesssage);

      let requestOptions = {
        uri: "http://" + ip + ":" + port + "/api/getstats",
        json: true,
        timeout: 10000,
        qs: {
          adminuser: name,
          admintoken: token
        },
        useQuerystring: true
      };
      await request(requestOptions)
        .then(function(response) {
          addLineToDescription(embed, ":white_check_mark: Day 7 data loaded succesfully.");
          client.logger.debug("Day 7 data loaded succesfully");
          updateStatus(embed, statusMesssage);
        })
        .catch(function(error) {
          embed.title = ":x: Server not initialized";
          addLineToDescription(embed, ":x: Check if day7 data can be read has failed");
          client.logger.error("Check if day7data can be read has failed. error: " + error);
          updateStatus(embed, statusMesssage);
        }).then(async function() {
          let requestOptions = {
            uri: "http://" + ip + ":" + port + "/api/executeconsolecommand",
            json: true,
            timeout: 10000,
            qs: {
              adminuser: name,
              admintoken: token
            },
            useQuerystring: true
          };
          requestOptions.qs.command = "mem"
          await request(requestOptions)
            .then(function(response) {
              embed.title = ":white_check_mark: Server initialized";
              addLineToDescription(embed, ":white_check_mark: Test command executed succesfully.");
              client.logger.debug("Test command executed succesfully.");
              updateStatus(embed, statusMesssage);
            })
            .catch(function(error) {
              embed.title = ":warning: Initialization failed, see below for errors."
              addLineToDescription(embed, ":warning: Console commands cannot be executed, some functions may not work.");
              client.logger.error("Check if console commands can be executed has failed. error: " + error);
              updateStatus(embed, statusMesssage);
            })
            .finally(function() {
              updateStatus(embed, statusMesssage);
            })
        })


    })

    function addLineToDescription(embed, line) {
      embed.description += line + "\n";
      return embed
    }
    function updateStatus(embed, statusMesssage) {
      return statusMesssage.edit({
        embed
      });
    }

    function makeStatusEmbed(embed) {
      embed.addField("IP", ip, true)
        .addField("Port", port, true);
      return embed
    }

    function resolveErrorCode(error) {
      switch (error.error.code) {
        case "ETIMEDOUT":
          error.Error = "Server took too long to respond. Confirm IP and port are correct.\n"
          break;
        case "ECONNREFUSED":
          error.Error = ":warning: Cannot execute console commands. Certain functions will not work.\n"
          break;
        default:
          error.Error = error.error.code
      }
      return error
    }

    async function checkDay7Data() {
      let requestOptions = {
        uri: "http://" + ip + ":" + port + "/api'/getplayerslocation",
        json: true,
        timeout: 10000,
        qs: {
          adminuser: name,
          admintoken: token
        },
        useQuerystring: true
      };
      await request(requestOptions)
        .then(function(response) {
          return true
        })
        .catch(function(error) {
          client.logger.error("Check if getstats can be accessed has failed. error: " + error.error.code);
          errorReceived = error;
          return false
        })
    }
  }
}
module.exports = Init;