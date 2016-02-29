require ('useless')

App = $singleton (Component, {

	//apiDebug: true,

	api: function () { return {
		'/':     this.file ('./index.html'),
		':file': this.file ('./') } },

    $depends: [
        require ('useless/server/args'),
        require ('useless/server/tests'),
        require ('useless/server/supervisor'),
        require ('useless/server/http'),
        require ('useless/server/deploy'),
        require ('useless/server/websocket'),
        require ('useless/server/devtools')],

	init: function (then) {

		then () } })