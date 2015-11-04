'use babel';
'use strict';

function provideBuilder() {

  var fs = require('fs');
  var os = require('os');
  var path = require('path');
  var Promise = require('bluebird');
  var stat = Promise.promisify(fs.stat);
  var exec = Promise.promisify(require('child_process').exec);
  var errorMatch = [
    '\\[error\\] (?<file>[^:\\n]+):(?<line>\\d+):'
  ];

  function lineToTask(line) {
    if (line.startsWith(' ')) {
      return line;
    } else {
      return null;
    }
  }

  function taskToConfig(executable, task) {
    var parts = task.split(/\s+/);
    var name = parts[1];
    var description = parts.slice(2).join(' ');

    return {
      name: 'sbt: ' + name + ' - ' + description,
      exec: executable,
      args: [ name ],
      errorMatch: errorMatch,
      sh: false
    };
  }

  function isFalsy (value) {
    return !!value;
  }

  return {
    niceName: 'sbt',

    isEligable: function (cwd) {
      return fs.existsSync(path.join(cwd, 'project', 'build.properties'));
    },

    settings: function (cwd) {
      return stat(path.join(cwd, 'sbt')).bind({}).then(function () {
        this.executable = path.join(cwd, 'sbt');
      }).catch(function (err) {
        this.executable = 'sbt';
      }).then(function () {
        return exec(this.executable + ' tasks', { cwd: cwd });
      }).then(function (outputBuffer) {
        return outputBuffer
          .toString('utf8')
          .split(os.EOL)
          .map(lineToTask)
          .filter(isFalsy)
          .map(taskToConfig.bind(null, this.executable));
      });
    }
  };
}

module.exports.provideBuilder = provideBuilder;
