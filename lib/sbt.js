'use babel';
'use strict';

import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import os from 'os';

export function provideBuilder() {
  return class SbtBuildProvider {

    constructor(cwd) {
      this.cwd = cwd;
    }

    getNiceName() {
      return 'sbt';
    }

    isEligible() {
      return fs.existsSync(path.join(this.cwd, 'project', 'build.properties'));
    }

    settings() {
      const projectSbt = path.join(this.cwd, 'sbt');
      const executable = fs.existsSync(projectSbt) ? projectSbt : 'sbt';
      const errorMatch = [
        '\\[error\\] (?<file>[^:\\n]+):(?<line>\\d+):'
      ];

      return new Promise((resolve, reject) => {
        child_process.exec(executable + ' tasks', { cwd: this.cwd }, (err, stdout, stderr) => {
          if (err != null) {
            reject(stderr);
          }
          else {
            const commands = stdout.split(os.EOL).filter(line => line.startsWith(' ')).map(line => {
              const parts = line.split(/\s+/);
              const name = parts[1];
              const description = parts.slice(2).join(' ');

              return {
                name: 'sbt: ' + name + ' - ' + description,
                exec: executable,
                args: [ name ],
                errorMatch: errorMatch,
                sh: false
              };
            });

            resolve(commands);
          }
        });
      });

    }

  }
}
