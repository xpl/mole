var MoleTests = {
    merge: function () {
      $assert (merge ([['all','your',                'to','us'],
                       [      'your',       'belong',     'us'],
                       [             'base','belong','to'     ],
                       [      'your','base'                   ]]),
                       ['all','your','base','belong','to','us']) } }

function merge (arrays, cfg) { cfg = cfg || { key: _.identity }

    var head = { key: null, next: {} }
    var nodes = {}

    _.each (arrays, function (arr) {
        for (var i = 0, n = arr.length, prev = head, node = undefined; i < n; i++, prev = node) {
            var item = arr[i]
            var key  = cfg.key (item)
            node = nodes[key] || (nodes[key] = { key: key, item: item, next: {} })
            if (prev) {
                prev.next[key] = node } } })

    var decyclize = function (visited, node) { visited[node.key] = true

        node.next = _.chain (_.values (node.next))
                        .filter (function (node) { return !(node.key in visited) })
                        .map (decyclize.partial (visited)).value ()
        
        delete visited[node.key]; return node }

    var ordered = function (a, b) {
        return (a === b) || _.some (a.next, function (aa) { return ordered (aa, b) }) }

    var flatten = function (node) { if (!node) return []

        var next = cfg.sort ? _.sortBy (node.next || [], cfg.sort) : (node.next || [])

        return [node].concat (flatten (_.reduce (next, function (a, b) {

            if (a === b)             { return a }
            else if (ordered (b, a)) { b.next.push (a); return b }
            else                     { a.next.push (b); return a } }))) }

    return _.rest (_.pluck (flatten (decyclize ({}, head)), 'item'))
}

if (_.hasAsserts) {
    Testosterone.run ({                             
        codebase: false,
        verbose:  true,
        silent:   false,
        suites:   [{ name: 'Mole', tests: MoleTests }] },
        function (okay) { }) }