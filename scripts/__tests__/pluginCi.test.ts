import fs from 'fs'
import path from 'path'

// Model CI invocation and artifact handoff between jobs.
test('[model] CI invokes external build and deploy commands', () => {
  const yaml = jest.requireActual<{ load: (source: string) => unknown }>('js-yaml')
  const config = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../.gitlab-ci.yml'), 'utf8'))
  expect(config).toMatchObject({
    image: 'node:24.21.0',
    before_script: ['scripts/setupDependenciesCache.sh'],
    stages: ['test', 'build', 'deploy'],
    variables: { PLUGINS_SCRIPTS_DIR: '/opt/plugins/scripts' },
    build: { artifacts: { paths: ['build/'] }, script: ['node "$PLUGINS_SCRIPTS_DIR/build.ts"'] },
    deploy: {
      stage: 'deploy',
      before_script: [],
      needs: [{ job: 'build', artifacts: true }],
      resource_group: 'plugins-dist',
      script: ['node "$PLUGINS_SCRIPTS_DIR/deploy.ts"']
    }
  })
})
