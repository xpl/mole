Sounds = $singleton ({

    audioContext: undefined,
    samples: [],

    preferredAudioFormat: $property (function () {
        return (navigator.userAgent.indexOf ('OPR') < 0) ? 'mp3' : 'ogg' }),

    loadSample: function (i, fmt, decodeFailure) {
        try {
            Http.loadFile ('sound/' + i + '.' + fmt, {
                success: this.$ (function (response) {                  console.log ('Loaded sample',  i, fmt)
                    this.audioContext.decodeAudioData (response,
                        this.$ (function (sample) {                     console.log ('Decoded sample', i, fmt)
                            this.samples[i] = sample }),
                        this.$ (decodeFailure)) }) }) }
        catch (e) {
            console.log (e) } },

    constructor: function () {

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext) () }
        catch (e) {
            console.log (e) }

        if (!this.audioContext) {
            alert ('Sorry but your browser does not support HTML5 audio :(\n\nSo imagine it\'s a deaf mole simulator :)'); return }

        _.each ([1,2,3,4], function (i) {
            this.loadSample (i, this.preferredAudioFormat, function () {
                this.loadSample (i, 'ogg', function () {
                    console.log ('Failed to decode sample', i) }) }) }, this) },

    play: function (i, gain) {
        if (this.samples[i]) {
            var sourceNode = this.audioContext.createBufferSource ()
            var gainNode = this.audioContext.createGain ()

            gainNode.connect (this.audioContext.destination)
            gainNode.gain.value = (gain === undefined) ? 1 : gain

            sourceNode.buffer = this.samples[i]
            sourceNode.connect (gainNode)
            sourceNode.start (0) }
        else {
            console.log ('no sample', i) } }
})