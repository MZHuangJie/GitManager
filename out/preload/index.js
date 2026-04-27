"use strict";
const electron = require("electron");
const IPC = {
  // Repository Management
  REPO_ADD: "repo:add",
  REPO_REMOVE: "repo:remove",
  REPO_LIST: "repo:list",
  REPO_UPDATE: "repo:update",
  REPO_VALIDATE: "repo:validate",
  REPO_OPEN_FOLDER: "repo:open-folder",
  // Git Read Operations
  GIT_STATUS: "git:status",
  GIT_LOG: "git:log",
  GIT_DIFF: "git:diff",
  GIT_DIFF_FILE: "git:diff-file",
  GIT_SHOW: "git:show",
  GIT_BRANCH_LIST: "git:branch-list",
  GIT_CURRENT_BRANCH: "git:current-branch",
  // Git Write Operations
  GIT_STAGE: "git:stage",
  GIT_UNSTAGE: "git:unstage",
  GIT_STAGE_ALL: "git:stage-all",
  GIT_COMMIT: "git:commit",
  GIT_PULL: "git:pull",
  GIT_PUSH: "git:push",
  GIT_PUSH_UPSTREAM: "git:push-upstream",
  GIT_CREATE_BRANCH: "git:create-branch",
  GIT_SWITCH_BRANCH: "git:switch-branch",
  GIT_MERGE: "git:merge",
  GIT_DELETE_BRANCH: "git:delete-branch",
  GIT_DISCARD_FILE: "git:discard-file",
  GIT_CLONE: "git:clone",
  GIT_INIT: "git:init",
  GIT_ADD_REMOTE: "git:add-remote",
  GIT_REVERT_HUNK: "git:revert-hunk",
  GIT_RESOLVE_CONFLICT: "git:resolve-conflict",
  GIT_FILE_DIFF: "git:file-diff",
  GIT_FILE_FULL_DIFF: "git:file-full-diff",
  // Settings
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",
  SETTINGS_GET_ALL: "settings:get-all",
  // GitHub
  GITHUB_CREATE_REPO: "github:create-repo",
  GITHUB_GET_TOKEN: "github:get-token",
  GITHUB_SAVE_TOKEN: "github:save-token",
  GITHUB_LIST_REPOS: "github:list-repos",
  // Window Management
  WINDOW_OPEN_DIFF: "window:open-diff"
};
const DEFAULT_THEME = "light";
const api = {
  // Repo management
  repoAdd: (path) => electron.ipcRenderer.invoke(IPC.REPO_ADD, path),
  repoRemove: (id) => electron.ipcRenderer.invoke(IPC.REPO_REMOVE, id),
  repoList: () => electron.ipcRenderer.invoke(IPC.REPO_LIST),
  repoUpdate: (id, updates) => electron.ipcRenderer.invoke(IPC.REPO_UPDATE, id, updates),
  repoValidate: (path) => electron.ipcRenderer.invoke(IPC.REPO_VALIDATE, path),
  repoOpenFolder: () => electron.ipcRenderer.invoke(IPC.REPO_OPEN_FOLDER),
  // Git reads
  gitStatus: (repoPath) => electron.ipcRenderer.invoke(IPC.GIT_STATUS, repoPath),
  gitLog: (repoPath, opts) => electron.ipcRenderer.invoke(IPC.GIT_LOG, repoPath, opts),
  gitDiff: (repoPath, hash) => electron.ipcRenderer.invoke(IPC.GIT_DIFF, repoPath, hash),
  gitDiffFile: (repoPath, file, staged) => electron.ipcRenderer.invoke(IPC.GIT_DIFF_FILE, repoPath, file, staged),
  gitShow: (repoPath, hash) => electron.ipcRenderer.invoke(IPC.GIT_SHOW, repoPath, hash),
  gitBranchList: (repoPath) => electron.ipcRenderer.invoke(IPC.GIT_BRANCH_LIST, repoPath),
  gitCurrentBranch: (repoPath) => electron.ipcRenderer.invoke(IPC.GIT_CURRENT_BRANCH, repoPath),
  // Git writes
  gitStage: (repoPath, files) => electron.ipcRenderer.invoke(IPC.GIT_STAGE, repoPath, files),
  gitUnstage: (repoPath, files) => electron.ipcRenderer.invoke(IPC.GIT_UNSTAGE, repoPath, files),
  gitStageAll: (repoPath) => electron.ipcRenderer.invoke(IPC.GIT_STAGE_ALL, repoPath),
  gitCommit: (repoPath, message) => electron.ipcRenderer.invoke(IPC.GIT_COMMIT, repoPath, message),
  gitPull: (repoPath) => electron.ipcRenderer.invoke(IPC.GIT_PULL, repoPath),
  gitPush: (repoPath) => electron.ipcRenderer.invoke(IPC.GIT_PUSH, repoPath),
  gitPushWithUpstream: (repoPath, remote, branch) => electron.ipcRenderer.invoke(IPC.GIT_PUSH_UPSTREAM, repoPath, remote, branch),
  gitCreateBranch: (repoPath, name, baseBranch, switchTo) => electron.ipcRenderer.invoke(IPC.GIT_CREATE_BRANCH, repoPath, name, baseBranch, switchTo),
  gitSwitchBranch: (repoPath, branch) => electron.ipcRenderer.invoke(IPC.GIT_SWITCH_BRANCH, repoPath, branch),
  gitMerge: (repoPath, sourceBranch, targetBranch) => electron.ipcRenderer.invoke(IPC.GIT_MERGE, repoPath, sourceBranch, targetBranch),
  gitDeleteBranch: (repoPath, branch) => electron.ipcRenderer.invoke(IPC.GIT_DELETE_BRANCH, repoPath, branch),
  gitDiscardFile: (repoPath, files) => electron.ipcRenderer.invoke(IPC.GIT_DISCARD_FILE, repoPath, files),
  gitClone: (url, targetDir) => electron.ipcRenderer.invoke(IPC.GIT_CLONE, url, targetDir),
  gitInit: (repoPath) => electron.ipcRenderer.invoke(IPC.GIT_INIT, repoPath),
  gitAddRemote: (repoPath, name, url) => electron.ipcRenderer.invoke(IPC.GIT_ADD_REMOTE, repoPath, name, url),
  gitRevertHunk: (repoPath, file, hunkHeader, hunkLines) => electron.ipcRenderer.invoke(IPC.GIT_REVERT_HUNK, repoPath, file, hunkHeader, hunkLines),
  gitResolveConflict: (repoPath, file, strategy) => electron.ipcRenderer.invoke(IPC.GIT_RESOLVE_CONFLICT, repoPath, file, strategy),
  gitFileDiff: (repoPath, file, staged) => electron.ipcRenderer.invoke(IPC.GIT_FILE_DIFF, repoPath, file, staged),
  gitFileFullDiff: (repoPath, file, staged) => electron.ipcRenderer.invoke(IPC.GIT_FILE_FULL_DIFF, repoPath, file, staged),
  // Settings
  settingsGet: (key) => electron.ipcRenderer.invoke(IPC.SETTINGS_GET, key),
  settingsSet: (key, value) => electron.ipcRenderer.invoke(IPC.SETTINGS_SET, key, value),
  settingsGetAll: () => electron.ipcRenderer.invoke(IPC.SETTINGS_GET_ALL),
  // GitHub
  githubCreateRepo: (token, name, isPrivate, description) => electron.ipcRenderer.invoke(IPC.GITHUB_CREATE_REPO, token, name, isPrivate, description),
  githubGetToken: () => electron.ipcRenderer.invoke(IPC.GITHUB_GET_TOKEN),
  githubSaveToken: (token) => electron.ipcRenderer.invoke(IPC.GITHUB_SAVE_TOKEN, token),
  githubValidateToken: (token) => electron.ipcRenderer.invoke("github:validate-token", token),
  githubListRepos: (token) => electron.ipcRenderer.invoke(IPC.GITHUB_LIST_REPOS, token),
  // Window management
  windowOpenDiff: (data) => electron.ipcRenderer.invoke(IPC.WINDOW_OPEN_DIFF, data),
  // Diff window detection
  isDiffWindow: process.argv.includes("--diff-window"),
  diffWindowTheme: process.argv.find((a) => a.startsWith("--theme="))?.replace("--theme=", "") || DEFAULT_THEME
};
electron.contextBridge.exposeInMainWorld("electronAPI", api);
