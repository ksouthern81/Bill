module.exports = function(app) {


  app.get('/api/getserverinfo', function(req, res) {
    app.logger.debug(`API request to getserverinfo for guild ${req.query.guild}`)
    const guildID = req.query.guild
    if (!guildID) {
      return res.send("Error - No guild specified")
    }
    const guild = app.discordClient.guilds.get(guildID)
    if (!guild) {
      return res.send("Error - Not a valid/known guild ID")
    }

    guild.sevendtdServer.getServerInfo().then(function(data) {
      data.guildName = guild.name
      data.guildID = guild.id
      return res.send(data)
    })
  })
}
