'use strict';

var path = require('path')

var gutil = require('gulp-util')
var through = require('through2')

module.exports = function(dict, replace) {
  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      cb(null, file)
      return
    }

    if (file.isStream()) {
      cb(new gutil.PluginError('dong-replace', 'Streaming not supported'))
      return
    }

    var regexp

    if (dict || !replace) {
      regexp = (function(ext) {
        switch (ext) {
          case '.handlebars':
          case '.html':
            return /(["'>])([^\n"'><]*[^\x00-\x7f]+?[^\n"'><]*)(["'<])/g
          case '.js':
            return /(')([^\n']*[^\x00-\x7f]+?[^\n']*)(\1)/g
          case '.json':
            return /(")([^\n"]*[^\x00-\x7f]+?[^\n"]*)(\1)/g
        }
      })(path.extname(file.history[0]))
    }

    var content

    if (regexp) {
      content = file.contents.toString()

      if (replace) {
        // translate
        content = content
          .replace(regexp,
            /*jshint maxparams:4*/
            function(all, begin, key, end) {
              if (key in dict) {
                return begin + dict[key] + end
              }

              return all;
            })
      } else {
        // generate keys
        file.keys = content.match(regexp)
      }
    }

    try {
      if (content) {
        file.contents = new Buffer(content)
      }

      this.push(file)
    } catch (err) {
      this.emit('error', new gutil.PluginError('dong-replace', err, {
        fileName: file.path
      }))
    }

    cb()
  })
}
