import { writeMultipleFiles } from '../../utils/fs';
import { ng } from '../../utils/process';
import { updateJsonFile } from '../../utils/project';
import { expectToFail } from '../../utils/utils';

export default async function () {
  // TODO(architect): Delete this test. It is now in devkit/build-angular.

  await ng('test', '--watch=false');

  // prepare global scripts test files
  await writeMultipleFiles({
    'src/string-script.js': `globalThis.stringScriptGlobal = 'string-scripts.js';`,
    'src/input-script.js': `globalThis.inputScriptGlobal = 'input-scripts.js';`,
    'src/typings.d.ts': `
      declare var stringScriptGlobal: any;
      declare var inputScriptGlobal: any;
    `,
    'src/app/app.ts': `
      import { Component } from '@angular/core';

      @Component({ selector: 'app-root', template: '', standalone: false })
      export class App {
        stringScriptGlobalProp = stringScriptGlobal;
        inputScriptGlobalProp = inputScriptGlobal;
      }
    `,
    'src/app/app.spec.ts': `
      import { TestBed } from '@angular/core/testing';
      import { App } from './app';

      describe('App', () => {
        beforeEach(() => TestBed.configureTestingModule({
          declarations: [App]
        }));

        it('should have access to string-script.js', () => {
          let app = TestBed.createComponent(App).debugElement.componentInstance;
          expect(app.stringScriptGlobalProp).toEqual('string-scripts.js');
        });

        it('should have access to input-script.js', () => {
          let app = TestBed.createComponent(App).debugElement.componentInstance;
          expect(app.inputScriptGlobalProp).toEqual('input-scripts.js');
        });
      });

      describe('Spec', () => {
        it('should have access to string-script.js', () => {
          expect(stringScriptGlobal).toBe('string-scripts.js');
        });

        it('should have access to input-script.js', () => {
          expect(inputScriptGlobal).toBe('input-scripts.js');
        });
      });
    `,
  });

  // should fail because the global scripts were not added to scripts array
  await expectToFail(() => ng('test', '--watch=false'));

  await updateJsonFile('angular.json', (workspaceJson) => {
    const appArchitect = workspaceJson.projects['test-project'].architect;
    appArchitect.test.options.scripts = [
      { input: 'src/string-script.js' },
      { input: 'src/input-script.js' },
    ];
  });

  // should pass now
  await ng('test', '--watch=false');
}
