export const IPC = {
  // Repository Management
  REPO_ADD: 'repo:add',
  REPO_REMOVE: 'repo:remove',
  REPO_LIST: 'repo:list',
  REPO_UPDATE: 'repo:update',
  REPO_VALIDATE: 'repo:validate',
  REPO_OPEN_FOLDER: 'repo:open-folder',

  // Git Read Operations
  GIT_STATUS: 'git:status',
  GIT_LOG: 'git:log',
  GIT_DIFF: 'git:diff',
  GIT_DIFF_FILE: 'git:diff-file',
  GIT_SHOW: 'git:show',
  GIT_BRANCH_LIST: 'git:branch-list',
  GIT_CURRENT_BRANCH: 'git:current-branch',

  // Git Write Operations
  GIT_STAGE: 'git:stage',
  GIT_UNSTAGE: 'git:unstage',
  GIT_STAGE_ALL: 'git:stage-all',
  GIT_COMMIT: 'git:commit',
  GIT_PULL: 'git:pull',
  GIT_PUSH: 'git:push',
  GIT_PUSH_UPSTREAM: 'git:push-upstream',
  GIT_CREATE_BRANCH: 'git:create-branch',
  GIT_SWITCH_BRANCH: 'git:switch-branch',
  GIT_MERGE: 'git:merge',
  GIT_DELETE_BRANCH: 'git:delete-branch',
  GIT_DISCARD_FILE: 'git:discard-file',
  GIT_CLONE: 'git:clone',
  GIT_INIT: 'git:init',
  GIT_ADD_REMOTE: 'git:add-remote',
  GIT_REVERT_HUNK: 'git:revert-hunk',
  GIT_RESOLVE_CONFLICT: 'git:resolve-conflict',
  GIT_FILE_DIFF: 'git:file-diff',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:get-all',

  // GitHub
  GITHUB_CREATE_REPO: 'github:create-repo',
  GITHUB_GET_TOKEN: 'github:get-token',
  GITHUB_SAVE_TOKEN: 'github:save-token',
  GITHUB_LIST_REPOS: 'github:list-repos',

  // Window Management
  WINDOW_OPEN_DIFF: 'window:open-diff'
} as const
