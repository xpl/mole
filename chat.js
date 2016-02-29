Chat = $component ({

    connected: false,
    peers: {},
    peerNames: {},
    history: [],

    maxMessagesToSave: $property (50),
    currentProtocolVersion: $property (1337 + 2),

    saveHistory: $debounce (function (opts) { opts = opts || {}
        this.history = _.last (this.history, this.maxMessagesToSave)
        window.localStorage.setItem ('heestory', _.json ({ messages: this.history }))
        if (opts.publish !== false) {
            this.updateUserData ({ history: this.history }) } }),

    renderHistory: function () {
        try {
            var el = $('.chat .messages').empty ()
            el.append (_.map (this.history, this.$ (this.renderMessage))) }
        catch (e) {
            console.log ('Error while rendering history (resetting):', e)
            this.clearHistory () } }, // try reset (probly a bug in sync protocol)

    clearHistory: function () {
        this.history = []
        this.saveHistory ()
        $('.chat .messages').empty () },

    /*peerDataByName: function (name) {
        return (_.find (this.peers, function (peer) { return peer.userData.name === name }) || {}).userData },

    showMessagesForPeer: function (name) {
        console.log (_.stringify (_.pluck (this.peerDataByName (name).history, 'what'), { pretty: true, maxArrayLength: 100 })) },*/

    mergePeerHistories: function () {

        var peers = _.nonempty (_.pluck (this.peers, 'userData'))
        var peerHistories = _.nonempty (_.map (_.sortBy (peers, 'uptime'), function (peerData) {
            return ((peerData.protocolVersion === this.currentProtocolVersion) && peerData.history) || undefined }, this))

        this.history = merge (peerHistories, { key: _.property ('tag') })
        this.saveHistory ()
        this.renderHistory () },

    initUptimeUpdating: function (interval) {
        window.setInterval (this.$ (function () {
            if (this.connected) {
                this.updateUserData ({ uptime: this.userData.uptime + interval }) } }), interval * 1000) },
        
    init: function () {

        this.history = (_.json (window.localStorage.getItem ('heestory')) || {}).messages || []

        this.renderHistory ()

        this.skylink = new Skylink ()

        this.skylink.init ({ apiKey: '5508b369-a58a-4e6c-ba16-af433f66b77d' }, this.$ (function () {
        
            this.skylink.setUserData (this.userData = {
                uptime: 0,
                protocolVersion: this.currentProtocolVersion,
                history: this.history,
                name: window.localStorage.getItem ('nick') || ('mole_' + Format.randomHexString (3)) })

            this.skylink.joinRoom ({ audio: false, video: false })

            this.initUptimeUpdating (10) }))

        this.initUI ()

        this.skylink.on ('peerJoined', this.$ (function (peerId, peerInfo, isSelf) {

                       this.peers    [peerId] = peerInfo
            var name = this.peerNames[peerId] = this.peerName (peerId, peerInfo)

            if (isSelf) {
                $('.chat').toggleVisibility (true)
                $('.peers').toggleVisibility (true)
                this.connected = true }

            else {
                this.mergePeerHistories ()

                $('<div class="peer">')
                    .append ('<i class="fa fa-user-secret"></i>')
                    .addClass ('id' + peerId)
                    .append ($('<span class="name">').text (name))
                    .appendTo ('.peers')
                    .animateWith ('appear') } }))

        this.skylink.on ('peerUpdated', this.$ (function (peerId, peerInfo, isSelf) {

            this.peers[peerId] = peerInfo

            var oldName = this.peerNames[peerId]
            var newName = this.peerNames[peerId] = this.peerName (peerId, peerInfo)

            if (oldName) {
                if (oldName !== newName) {
                    if (isSelf) {
                        this.sendSystemMessage ({ newNick: newName, oldNick: oldName }) }
                    $('.peer.id' + peerId + ' .name').text (newName) } } }))

        this.skylink.on ('peerLeft', this.$ (function (peerId, peerInfo, isSelf) {

            delete this.peers[peerId]
            delete this.peerNames[peerId]

            $('.peer.id' + peerId).animateWith ('disappear', function () { $(this).remove () })

            if (!isSelf) {
                $('#' + peerId).remove ()
                this.updateAudioUsersCount () }
            else {
                this.connected = false
                this.updateUserData ({ uptime: 0 }) } }))

        this.skylink.on ('incomingStream', this.$ (function (peerId, stream, isSelf) {
            if (!isSelf) {

                console.log ('incoming stream from', peerId)

                //$('#' + peerId).remove () // remove prev video element if any

                var vid = $('#' + peerId)
                
                if (!vid.length) {
                    vid = $('<video style="pointer-events:none; transform: rotateY(-180deg);" autoplay>')
                                .attr ('id', peerId)
                                .appendTo (document.body) }

                this.updateAudioUsersCount ()

                $('.peer.id' + peerId + ' i').attr ('class', 'fa fa-microphone')

                attachMediaStream (vid[0], stream) } }))

        this.skylink.on ('incomingMessage', this.$ (function (message, peerId, peerInfo, isSelf) {
            var sys = this.parseSystemMessage (message.content)
            var name = this.peerName (peerId, peerInfo)
           
            if (sys) {

                if (sys.noise) {
                    if (!isSelf) {
                        Sounds.play (sys.noise, 0.5) } }

                else if (sys.me) {
                    this.logMessage ({ tag: sys.tag, when: sys.when, action: 'me', what: sys.me, who: name }) }

                else if (sys.newNick) {
                    this.logMessage ({ tag: sys.tag, when: sys.when, action: 'nick-change', what: 'changed nick to ' + sys.newNick, who: sys.oldNick }) }

                else if (sys.text) {
                    this.logMessage ({ tag: sys.tag, when: sys.when, action: 'message', what: sys.text, who: name }) } }

            else {
                this.addMessage ({ action: 'message', what: message.content, who: name }) } }))
    },

    initUI: function () {
        $('.enable-audio').touchClick (this.$ (function (e) { var btn = $(e.delegateTarget)
            btn.addClass ('wait')
            $('.peers').addClass ('wait')
            var yes = !(btn.hasClass ('active') || false)
            this.updateUserData ({ uptime: 0 })
            this.skylink.joinRoom ({ audio: yes, video: false }, function () {
                $('.peers').removeClass ('wait')
                $(e.delegateTarget).removeClass ('wait').toggleClass ('active', yes) }) }))

        $('.chat input').keydown (this.$ (function (e) {
            if (e.keyCode === 13) { var text = e.delegateTarget.value
                if ((text || '').trimmed.length) {
                    if (text.lowercase === 'speed') {
                        speedEntered () }
                    else {
                        this.sendMessage (text)
                        e.delegateTarget.value = '' } } } }))

        $('.chat-help').touchClick (this.$ (function () {
            this.addMessage ({ action: 'help', what: '\nAvailable commands:\n\n/nick new_nick\n/me something\n\n' }) })) },

    updateAudioUsersCount: function () {
        $('.enable-audio .users')
            .text ($('video').length)
            .css ('display', $('video').length ? '' : 'none') },

    sendMessage: function (text) {
        var cmd = text.match (/^\/([^\s]+)\s(.+)$/)
        if (cmd) {
            if (cmd[1] === 'nick') { var nick = cmd[2].trimmed
                if (nick.length > 0) {
                    window.localStorage.setItem ('nick', nick)
                    this.updateUserData ({ name: nick }) } }

            else if (cmd[1] === 'me') {
                this.sendSystemMessage ({ me: cmd[2] }) } }
        else {
            this.sendSystemMessage ({ text: text }) } },

    updateUserData: function (what) {
        this.skylink.setUserData (_.extend (this.userData, what)) },

    parseSystemMessage: function (text) {
        var parsed = text.match (/^###(.+)/)
        return parsed && _.json (parsed[1]) },

    sendSystemMessage: function (obj, peerId) {
        var str = '###' + _.json (_.extend ({ tag: Format.randomHexString (6), when: Date.now () }, obj))
        return peerId ?
            this.skylink.sendP2PMessage (str, peerId) :
            this.skylink.sendP2PMessage (str) },

    sendNoise: function (i) {
        this.sendSystemMessage ({ noise: i }) },

    peerName: function (peerId, peerInfo) {
        return (peerInfo && peerInfo.userData && peerInfo.userData.name) || peerId || '' },

    renderMessage: function (msg) {
        return $('<div class="entry">')
            .addClass (msg.action)
            .css ('opacity', 0.3)
            .append ($('<span class="who">').text (msg.who || ''))
            .append ($('<span class="what">').html ((msg.what || '').escaped.replace (/\n/g, '<br>'))) },

   logMessage: function (msg) {
        this.addMessage (msg)
        this.history.push (msg)
        this.saveHistory () },

    addMessage: function (msg) {
        $('.chat .messages')
            .append (this.renderMessage (msg)) }
})