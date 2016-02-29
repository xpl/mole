if ((('xpl.github.io'  === window.location.host) ||
     ('xpl.github.com' === window.location.host)) && (window.location.protocol != "https:")) {
    window.location.protocol = "https"
}

function speedEntered () {
    window.location = 'http://lurkmore.to/%D0%9A%D0%BE%D0%BF%D0%B8%D0%BF%D0%B0%D1%81%D1%82%D0%B0:%D0%A1%D0%BF%D0%B8%D0%B4_%D0%B8%D0%B7_%D0%BA%D1%80%D0%BE%D1%82%D0%B0' }

$.fn.extend ({
    notify: function () {
        this.css ('display', '')
        this.animateWith ('active', function () { this.css ('display', 'none') }) },

    toggleVisibility: function (yes) { yes = (yes === undefined) ? true : yes
        if (yes) {
            this.css ('display', '') }
        this.animateWith (yes ? 'appear' : 'disappear', function () {
            if (!yes) {
                this.css ('display', 'none') } }) } })

var wasd = { 87: 'w', 65: 'a', 83: 's', 68: 'd' }
var keyToSound = { 'w': 3, 'a': 1, 's': 2, 'd': 4 }

_.preventsDefault = function (fn) { return function (e) {
    if (fn (e) === false) { e.preventDefault (); return false } } }

$(document).ready (function () { //if (_.hasBroTools) { Bro.server ({ port: 1338 }).darkMode ().init () }

    var chat = new Chat ({ init: false })

    if (!Sounds.audioContext) {
        $('.main-menu h1').text ('Deaf Mole Simulator') }

    if (_.hasAsserts) {
        $('.main-menu h1').text ('Mole Simulator (DEBUG MODE)') }

    document.body.style.webkitTransform = 'translate3d(0,0,0)'

    $('.main-menu .play').click (function () {

        $('.main-menu').toggleVisibility (false)
        $('.controls').toggleVisibility (true)
        if (Sounds.audioContext) {
            $('.sound-notice').notify () }

        chat.init () })

    if (_.hasBroTools) {
        $('.main-menu .play').click () }

    var keyDown = {}

    var lastKeysPressed = []
    var wasEntered = function (s) {
        return (s === _.last (lastKeysPressed, s.length).join ('')) }

    $(document).keydown (_.preventsDefault (function (e) { if (!keyDown[e.keyCode]) { keyDown[e.keyCode] = true

        if ($('.chat input').is (':focus')) {
            return }
       
        lastKeysPressed.push (String.fromCharCode (e.keyCode).lowercase)

        if (wasEntered ('speed')) {
            speedEntered () }
        
        if (e.keyCode == 27) {
            $('.main-menu').toggleVisibility (true)
            return false }

        else if (e.keyCode in wasd) {
                $('.controls .' + wasd[e.keyCode]).addClass ('pressed')

                var sound = keyToSound[wasd[e.keyCode]]

                Sounds.play (sound)
                chat.sendNoise (sound)

                return false } } }))

    $(document).keyup (_.preventsDefault (function (e) { keyDown[e.keyCode] = false
        if (e.keyCode in wasd) {
            $('.controls .' + wasd[e.keyCode]).removeClass ('pressed') } }))

    $('.main-menu').toggleVisibility (true)

    if (Platform.touch) {
        $('.controls .key')

            .on ('touchstart', function (e) { $(e.delegateTarget).addClass ('pressed');
                                              Sounds.play (keyToSound[$(e.delegateTarget).attr ('data-key')]) })

            .on ('touchend',   function (e) { $(e.delegateTarget).removeClass ('pressed') }) }
    else {
        $('.controls .key').mousedown (function (e) {
            Sounds.play (keyToSound[$(e.delegateTarget).attr ('data-key')]) }) } })
