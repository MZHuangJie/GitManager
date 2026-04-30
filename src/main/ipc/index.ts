import { registerRepoIpc } from './repo.ipc'
import { registerGitIpc } from './git.ipc'
import { registerSettingsIpc } from './settings.ipc'
import { registerWindowIpc } from './window.ipc'
import { registerGithubIpc } from './github.ipc'
import { registerFsIpc } from './fs.ipc'

export function registerAllIpc(): void {
  registerRepoIpc()
  registerGitIpc()
  registerSettingsIpc()
  registerWindowIpc()
  registerGithubIpc()
  registerFsIpc()
}
