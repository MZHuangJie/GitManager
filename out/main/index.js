"use strict";
const electron = require("electron");
const path = require("path");
const promises = require("fs/promises");
const Store = require("electron-store");
const uuid = require("uuid");
const simpleGit = require("simple-git");
const fs = require("fs");
const os = require("os");
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
  GIT_RESET: "git:reset",
  // Settings
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",
  SETTINGS_GET_ALL: "settings:get-all",
  // GitHub
  GITHUB_CREATE_REPO: "github:create-repo",
  GITHUB_GET_TOKEN: "github:get-token",
  GITHUB_SAVE_TOKEN: "github:save-token",
  GITHUB_LIST_REPOS: "github:list-repos",
  GITHUB_FORK_REPO: "github:fork-repo",
  GITHUB_SEARCH_REPOS: "github:search-repos",
  GITHUB_GET_COMMITS: "github:get-commits",
  GITHUB_GET_BRANCHES: "github:get-branches",
  GITHUB_GET_COMMIT_DIFF: "github:get-commit-diff",
  // Window Management
  WINDOW_OPEN_DIFF: "window:open-diff",
  // File System
  FS_LIST_DRIVES: "fs:list-drives",
  FS_READ_DIR: "fs:read-dir"
};
const store$1 = new Store({
  defaults: {
    repositories: []
  }
});
async function getRemoteUrl(repoPath) {
  try {
    const git = simpleGit.simpleGit(repoPath);
    const remotes = await git.getRemotes(true);
    const origin = remotes.find((r) => r.name === "origin");
    if (origin && origin.refs.push) {
      return origin.refs.push;
    }
    if (remotes.length > 0 && remotes[0].refs.push) {
      return remotes[0].refs.push;
    }
    return void 0;
  } catch {
    return void 0;
  }
}
const repoManager = {
  async addRepo(repoPath) {
    const normalized = repoPath.replace(/\\/g, "/");
    const existing = store$1.get("repositories", []);
    const dup = existing.find((r) => r.path === normalized);
    if (dup) return dup;
    const isValid = await this.validateRepo(normalized);
    if (!isValid) {
      throw new Error("NOT_A_REPO: The selected folder is not a valid Git repository");
    }
    const name = normalized.split("/").pop() || normalized;
    const remoteUrl = await getRemoteUrl(normalized);
    const repo = {
      id: uuid.v4(),
      path: normalized,
      name,
      addedAt: Date.now(),
      remoteUrl
    };
    const updated = [...existing, repo];
    store$1.set("repositories", updated);
    return repo;
  },
  removeRepo(id) {
    const repos = store$1.get("repositories", []);
    store$1.set(
      "repositories",
      repos.filter((r) => r.id !== id)
    );
  },
  listRepos() {
    return store$1.get("repositories", []);
  },
  updateRepo(id, updates) {
    const repos = store$1.get("repositories", []);
    const idx = repos.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    repos[idx] = { ...repos[idx], ...updates };
    store$1.set("repositories", repos);
    return repos[idx];
  },
  async validateRepo(repoPath) {
    try {
      const git = require("simple-git").simpleGit(repoPath);
      await git.status();
      return true;
    } catch {
      return false;
    }
  }
};
function registerRepoIpc() {
  electron.ipcMain.handle(IPC.REPO_LIST, async () => {
    try {
      const repos = repoManager.listRepos();
      return { success: true, data: repos };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  electron.ipcMain.handle(
    IPC.REPO_ADD,
    async (_e, repoPath) => {
      try {
        const repo = await repoManager.addRepo(repoPath);
        return { success: true, data: repo };
      } catch (err) {
        return { success: false, error: err.message, code: err.message?.startsWith("NOT_A_REPO") ? "NOT_A_REPO" : void 0 };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.REPO_REMOVE,
    async (_e, id) => {
      try {
        repoManager.removeRepo(id);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.REPO_UPDATE,
    async (_e, id, updates) => {
      try {
        const repo = repoManager.updateRepo(id, updates);
        return { success: true, data: repo };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.REPO_VALIDATE,
    async (_e, repoPath) => {
      try {
        const valid = await repoManager.validateRepo(repoPath);
        return { success: true, data: valid };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.REPO_OPEN_FOLDER,
    async () => {
      try {
        const result = await electron.dialog.showOpenDialog({
          properties: ["openDirectory"]
        });
        if (result.canceled || result.filePaths.length === 0) {
          return { success: true, data: null };
        }
        return { success: true, data: result.filePaths[0] };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
}
function getGit(repoPath) {
  return simpleGit.simpleGit(repoPath);
}
function resolveConflictContent(content, oursFirst) {
  const lines = content.split("\n");
  const result = [];
  let inConflict = false;
  let inOurs = false;
  let inTheirs = false;
  const oursLines = [];
  const theirsLines = [];
  for (const line of lines) {
    if (line.startsWith("<<<<<<< ")) {
      inConflict = true;
      inOurs = true;
      continue;
    }
    if (line.startsWith("=======") && inConflict) {
      inOurs = false;
      inTheirs = true;
      continue;
    }
    if (line.startsWith(">>>>>>> ") && inConflict) {
      inTheirs = false;
      inConflict = false;
      if (oursFirst) {
        result.push(...oursLines, ...theirsLines);
      } else {
        result.push(...theirsLines, ...oursLines);
      }
      oursLines.length = 0;
      theirsLines.length = 0;
      continue;
    }
    if (inOurs) {
      oursLines.push(line);
    } else if (inTheirs) {
      theirsLines.push(line);
    } else {
      result.push(line);
    }
  }
  return result.join("\n");
}
const gitService = {
  async getStatus(repoPath) {
    const git = getGit(repoPath);
    const status = await git.status();
    const allPaths = [
      ...status.staged,
      ...status.modified,
      ...status.created,
      ...status.deleted
    ];
    let ignoredPaths = /* @__PURE__ */ new Set();
    if (allPaths.length > 0) {
      const input = allPaths.join("\n") + "\n";
      try {
        const result = await git.raw(["check-ignore", "--stdin", "-n"], input);
        result.split("\n").filter((line) => !line.startsWith("::") && line.trim() !== "").forEach((line) => ignoredPaths.add(line.trim()));
      } catch {
      }
    }
    const filterIgnored = (files) => files.filter((f) => !ignoredPaths.has(f));
    return {
      staged: filterIgnored(status.staged).map((file) => ({
        path: file,
        index: "M",
        working_dir: " "
      })),
      unstaged: filterIgnored(status.modified).map((file) => ({
        path: file,
        index: " ",
        working_dir: "M"
      })),
      created: filterIgnored(status.created),
      deleted: filterIgnored(status.deleted),
      renamed: status.renamed.filter(
        (r) => !ignoredPaths.has(r.from) && !ignoredPaths.has(r.to)
      ).map((r) => ({
        from: r.from,
        to: r.to
      })),
      ahead: status.ahead,
      behind: status.behind
    };
  },
  async getLog(repoPath, opts = {}) {
    const git = getGit(repoPath);
    const logOpts = {
      "--all": null,
      maxCount: opts.maxCount ?? 50,
      ...opts.skip ? { "--skip": opts.skip } : {}
    };
    const log = await git.log(logOpts);
    return log.all.map((entry) => ({
      hash: entry.hash,
      message: entry.message,
      author: entry.author_name,
      email: entry.author_email,
      date: entry.date,
      refs: entry.refs ? entry.refs.split(", ").filter(Boolean) : []
    }));
  },
  async getDiff(repoPath, hash) {
    const git = getGit(repoPath);
    const diff = await git.diff([`${hash}^!`]);
    const lines = diff.split("\n");
    if (lines.length > 5e3) {
      return lines.slice(0, 5e3).join("\n") + "\n\n... (diff truncated at 5000 lines)";
    }
    return diff;
  },
  async getDiffForFile(repoPath, file, staged) {
    const git = getGit(repoPath);
    const args = staged ? ["--cached", "--", file] : ["--", file];
    return await git.diff(args);
  },
  async getShow(repoPath, hash) {
    const git = getGit(repoPath);
    const show = await git.show([hash]);
    const lines = show.split("\n");
    if (lines.length > 5e3) {
      return lines.slice(0, 5e3).join("\n") + "\n\n... (output truncated at 5000 lines)";
    }
    return show;
  },
  async getBranchList(repoPath) {
    const git = getGit(repoPath);
    const branches = await git.branch(["-a"]);
    const localNames = new Set(branches.all.filter((n) => !n.startsWith("remotes/")));
    const result = [];
    for (const name of branches.all) {
      if (name.startsWith("remotes/")) {
        if (name.endsWith("/HEAD")) continue;
        const shortName = name.replace(/^remotes\/\w+\//, "");
        if (localNames.has(shortName)) continue;
        result.push({
          name: shortName,
          current: false,
          remote: true,
          remoteRef: name,
          commit: branches.branches[name]?.commit || "",
          label: branches.branches[name]?.label || ""
        });
      } else {
        result.push({
          name,
          current: name === branches.current,
          commit: branches.branches[name]?.commit || "",
          label: branches.branches[name]?.label || ""
        });
      }
    }
    return result;
  },
  async getCurrentBranch(repoPath) {
    const git = getGit(repoPath);
    const branches = await git.branch();
    return branches.current;
  },
  // Write operations
  async stageFiles(repoPath, files) {
    const git = getGit(repoPath);
    await git.add(files);
  },
  async unstageFiles(repoPath, files) {
    const git = getGit(repoPath);
    await git.reset(["--", ...files]);
  },
  async stageAll(repoPath) {
    const git = getGit(repoPath);
    await git.add(".");
  },
  async commit(repoPath, message) {
    const git = getGit(repoPath);
    const result = await git.commit(message);
    return { hash: result.commit || "" };
  },
  async pull(repoPath) {
    const git = getGit(repoPath);
    const result = await git.pull();
    return {
      files: result.files || [],
      summary: {
        changes: result.summary.changes,
        insertions: result.summary.insertions,
        deletions: result.summary.deletions
      }
    };
  },
  async push(repoPath) {
    const git = getGit(repoPath);
    try {
      const result = await git.push();
      return { pushed: result.pushed || false };
    } catch (err) {
      const msg = err?.message || "";
      if (msg.includes("no upstream") || msg.includes("--set-upstream")) {
        const branch = await git.branch();
        const currentBranch = branch.current;
        await git.push("origin", currentBranch, ["-u"]);
        return { pushed: true };
      }
      throw err;
    }
  },
  async createBranch(repoPath, name, baseBranch, switchTo = true) {
    const git = getGit(repoPath);
    if (switchTo) {
      if (baseBranch) {
        await git.checkout(baseBranch);
      }
      await git.checkoutLocalBranch(name);
    } else {
      if (baseBranch) {
        await git.raw(["branch", name, baseBranch]);
      } else {
        await git.branch([name]);
      }
    }
  },
  async switchBranch(repoPath, branch, remoteRef) {
    const git = getGit(repoPath);
    if (remoteRef) {
      await git.checkoutBranch(branch, remoteRef);
    } else {
      await git.checkout(branch);
    }
  },
  async merge(repoPath, sourceBranch, targetBranch) {
    const git = getGit(repoPath);
    const branches = await git.branch();
    if (branches.current !== targetBranch) {
      await git.checkout(targetBranch);
    }
    try {
      const result = await git.merge([sourceBranch]);
      await git.checkout(targetBranch);
      return {
        merged: true,
        summary: {
          changes: result.summary?.changes || 0,
          insertions: result.summary?.insertions || 0,
          deletions: result.summary?.deletions || 0
        }
      };
    } catch (err) {
      await git.checkout(targetBranch);
      if (err?.message?.includes("CONFLICT") || err?.message?.includes("conflict")) {
        const status = await git.status();
        return {
          merged: false,
          conflicts: status.conflicted
        };
      }
      throw err;
    }
  },
  async deleteBranch(repoPath, branch) {
    const git = getGit(repoPath);
    await git.deleteLocalBranch(branch);
  },
  async discardFiles(repoPath, files) {
    const git = getGit(repoPath);
    await git.reset(["HEAD", "--", ...files]);
    await git.checkout(["--", ...files]);
  },
  async revertHunk(repoPath, file, hunkHeader, hunkLines) {
    const git = getGit(repoPath);
    const patch = `--- a/${file}
+++ b/${file}
${hunkHeader}
${hunkLines}`;
    await git.raw(["apply", "--reverse"], patch);
  },
  async resolveConflict(repoPath, file, strategy) {
    const git = getGit(repoPath);
    if (strategy === "ours") {
      await git.raw(["checkout", "--ours", file]);
      await git.add([file]);
    } else if (strategy === "theirs") {
      await git.raw(["checkout", "--theirs", file]);
      await git.add([file]);
    } else {
      const filePath = path.join(repoPath, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const resolved = resolveConflictContent(content, strategy === "both-ours-first");
        fs.writeFileSync(filePath, resolved, "utf-8");
      }
      await git.add([file]);
    }
  },
  async getFileDiff(repoPath, file, staged) {
    const git = getGit(repoPath);
    const args = staged ? ["--cached", "--", file] : ["--", file];
    return await git.diff(args);
  },
  async getFullFileDiff(repoPath, file, staged) {
    const git = getGit(repoPath);
    const args = staged ? ["--unified=999999", "--cached", "--", file] : ["--unified=999999", "--", file];
    return await git.diff(args);
  },
  async init(repoPath) {
    const git = getGit(repoPath);
    await git.init();
  },
  async addRemote(repoPath, name, url) {
    const git = getGit(repoPath);
    try {
      const remotes = await git.getRemotes(false);
      if (remotes.some((r) => r.name === name)) {
        await git.remote(["set-url", name, url]);
        return;
      }
    } catch {
    }
    await git.addRemote(name, url);
  },
  async pushWithUpstream(repoPath, remote, branch) {
    const git = getGit(repoPath);
    await git.push(remote, branch, ["-u"]);
  },
  async resetToCommit(repoPath, hash) {
    const git = getGit(repoPath);
    await git.reset(["--hard", hash]);
  },
  async clone(url, targetDir) {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const repoName = url.split("/").pop()?.replace(".git", "") || "repo";
    const destPath = path.join(targetDir, repoName);
    await simpleGit.simpleGit().clone(url, destPath);
    return { repoPath: destPath };
  }
};
function registerGitIpc() {
  electron.ipcMain.handle(
    IPC.GIT_STATUS,
    async (_e, repoPath) => {
      try {
        const status = await gitService.getStatus(repoPath);
        return { success: true, data: status };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_LOG,
    async (_e, repoPath, opts) => {
      try {
        const log = await gitService.getLog(repoPath, opts);
        return { success: true, data: log };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_DIFF,
    async (_e, repoPath, hash) => {
      try {
        const diff = await gitService.getDiff(repoPath, hash);
        return { success: true, data: diff };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_DIFF_FILE,
    async (_e, repoPath, file, staged) => {
      try {
        const diff = await gitService.getDiffForFile(repoPath, file, staged);
        return { success: true, data: diff };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_SHOW,
    async (_e, repoPath, hash) => {
      try {
        const show = await gitService.getShow(repoPath, hash);
        return { success: true, data: show };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_BRANCH_LIST,
    async (_e, repoPath) => {
      try {
        const branches = await gitService.getBranchList(repoPath);
        return { success: true, data: branches };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_CURRENT_BRANCH,
    async (_e, repoPath) => {
      try {
        const branch = await gitService.getCurrentBranch(repoPath);
        return { success: true, data: branch };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_CLONE,
    async (_e, url, targetDir) => {
      try {
        const result = await gitService.clone(url, targetDir);
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_DISCARD_FILE,
    async (_e, repoPath, files) => {
      try {
        await gitService.discardFiles(repoPath, files);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_STAGE,
    async (_e, repoPath, files) => {
      try {
        await gitService.stageFiles(repoPath, files);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_UNSTAGE,
    async (_e, repoPath, files) => {
      try {
        await gitService.unstageFiles(repoPath, files);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_STAGE_ALL,
    async (_e, repoPath) => {
      try {
        await gitService.stageAll(repoPath);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_COMMIT,
    async (_e, repoPath, message) => {
      try {
        const result = await gitService.commit(repoPath, message);
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_PULL,
    async (_e, repoPath) => {
      try {
        const result = await gitService.pull(repoPath);
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_PUSH,
    async (_e, repoPath) => {
      try {
        const result = await gitService.push(repoPath);
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_PUSH_UPSTREAM,
    async (_e, repoPath, remote, branch) => {
      try {
        await gitService.pushWithUpstream(repoPath, remote, branch);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_CREATE_BRANCH,
    async (_e, repoPath, name, baseBranch, switchTo) => {
      try {
        await gitService.createBranch(repoPath, name, baseBranch, switchTo);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_SWITCH_BRANCH,
    async (_e, repoPath, branch, remoteRef) => {
      try {
        await gitService.switchBranch(repoPath, branch, remoteRef);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_MERGE,
    async (_e, repoPath, sourceBranch, targetBranch) => {
      try {
        const result = await gitService.merge(repoPath, sourceBranch, targetBranch);
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_DELETE_BRANCH,
    async (_e, repoPath, branch) => {
      try {
        await gitService.deleteBranch(repoPath, branch);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_REVERT_HUNK,
    async (_e, repoPath, file, hunkHeader, hunkLines) => {
      try {
        await gitService.revertHunk(repoPath, file, hunkHeader, hunkLines);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_RESOLVE_CONFLICT,
    async (_e, repoPath, file, strategy) => {
      try {
        await gitService.resolveConflict(repoPath, file, strategy);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_FILE_DIFF,
    async (_e, repoPath, file, staged) => {
      try {
        const diff = await gitService.getFileDiff(repoPath, file, staged);
        return { success: true, data: diff };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_FILE_FULL_DIFF,
    async (_e, repoPath, file, staged) => {
      try {
        const diff = await gitService.getFullFileDiff(repoPath, file, staged);
        return { success: true, data: diff };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_INIT,
    async (_e, repoPath) => {
      try {
        await gitService.init(repoPath);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_RESET,
    async (_e, repoPath, hash) => {
      try {
        await gitService.resetToCommit(repoPath, hash);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GIT_ADD_REMOTE,
    async (_e, repoPath, name, url) => {
      try {
        await gitService.addRemote(repoPath, name, url);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
}
const store = new Store({
  defaults: {
    windowBounds: null,
    sidebarCollapsed: false,
    diffFormat: "side-by-side",
    theme: "dark",
    lastSelectedRepoId: null,
    githubToken: ""
  }
});
const settingsStore = {
  get(key) {
    return store.get(key);
  },
  set(key, value) {
    store.set(key, value);
  },
  getAll() {
    return store.store;
  }
};
function registerSettingsIpc() {
  electron.ipcMain.handle(
    IPC.SETTINGS_GET,
    async (_e, key) => {
      try {
        const value = settingsStore.get(key);
        return { success: true, data: value };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.SETTINGS_SET,
    async (_e, key, value) => {
      try {
        settingsStore.set(key, value);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.SETTINGS_GET_ALL,
    async () => {
      try {
        const all = settingsStore.getAll();
        return { success: true, data: all };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
}
const DEFAULT_THEME = "light";
function registerWindowIpc() {
  electron.ipcMain.handle(
    IPC.WINDOW_OPEN_DIFF,
    async (_e, data) => {
      const isDev = !!process.env["ELECTRON_RENDERER_URL"];
      const win = new electron.BrowserWindow({
        width: 1100,
        height: 750,
        minWidth: 700,
        minHeight: 400,
        title: data.filePath ? `Diff Show - ${data.filePath}` : "Diff Show",
        autoHideMenuBar: true,
        webPreferences: {
          preload: path.join(__dirname, "../preload/index.js"),
          contextIsolation: true,
          sandbox: false,
          nodeIntegration: false,
          additionalArguments: ["--diff-window", `--theme=${data.theme || DEFAULT_THEME}`]
        }
      });
      const winTitle = data.filePath ? `Diff Show - ${data.filePath}` : "Diff Show";
      win.webContents.on("did-finish-load", () => {
        win.setTitle(winTitle);
        const json = JSON.stringify(data);
        win.webContents.executeJavaScript(`window.__diffData = ${json};`).catch(() => {
        });
      });
      if (isDev) {
        win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
      } else {
        win.loadFile(path.join(__dirname, "../renderer/index.html"));
      }
      return { id: 0 };
    }
  );
}
const githubService = {
  getToken() {
    return settingsStore.getAll()["githubToken"] || "";
  },
  saveToken(token) {
    settingsStore.set("githubToken", token);
  },
  async validateToken(token) {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "GitManager"
      }
    });
    if (!res.ok) {
      throw new Error("Token 无效，请检查后重试");
    }
    const data = await res.json();
    return {
      login: data.login,
      avatarUrl: data.avatar_url
    };
  },
  async listUserRepos(token) {
    const allRepos = [];
    let page = 1;
    while (true) {
      const res = await fetch(`https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "GitManager"
        }
      });
      if (!res.ok) {
        throw new Error("无法获取仓库列表");
      }
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;
      allRepos.push(...data);
      if (data.length < 100) break;
      page++;
    }
    return allRepos.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner?.login || "",
      cloneUrl: r.clone_url,
      htmlUrl: r.html_url,
      private: r.private,
      description: r.description,
      updatedAt: r.updated_at
    }));
  },
  async createRepo(token, name, isPrivate, description) {
    const res = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "User-Agent": "GitManager"
      },
      body: JSON.stringify({
        name,
        private: isPrivate,
        description: description || ""
      })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `GitHub API error: ${res.status}`);
    }
    const data = await res.json();
    return {
      id: data.id,
      name: data.name,
      fullName: data.full_name,
      owner: data.owner?.login || "",
      cloneUrl: data.clone_url,
      htmlUrl: data.html_url,
      private: data.private,
      description: data.description,
      updatedAt: data.updated_at
    };
  },
  async forkRepo(token, owner, repo) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/forks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "GitManager"
      }
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `GitHub API error: ${res.status}`);
    }
    const data = await res.json();
    return {
      id: data.id,
      name: data.name,
      fullName: data.full_name,
      owner: data.owner?.login || "",
      cloneUrl: data.clone_url,
      htmlUrl: data.html_url,
      private: data.private,
      description: data.description,
      updatedAt: data.updated_at
    };
  },
  async searchRepos(token, query) {
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=20&sort=stars`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "GitManager"
        }
      }
    );
    if (!res.ok) {
      throw new Error(`GitHub 搜索失败: ${res.status}`);
    }
    const data = await res.json();
    return (data.items || []).map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner?.login || "",
      cloneUrl: r.clone_url,
      htmlUrl: r.html_url,
      private: r.private,
      description: r.description,
      updatedAt: r.updated_at
    }));
  },
  async getRepoCommits(token, owner, repo) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "GitManager"
        }
      }
    );
    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`);
    }
    const data = await res.json();
    return (data || []).map((c) => ({
      hash: c.sha,
      message: c.commit?.message || "",
      author: c.commit?.author?.name || c.author?.login || "",
      email: c.commit?.author?.email || "",
      date: c.commit?.author?.date || "",
      refs: []
    }));
  },
  async getCommitDiff(token, owner, repo, sha) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3.diff",
          "User-Agent": "GitManager"
        }
      }
    );
    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`);
    }
    const diff = await res.text();
    const lines = diff.split("\n");
    if (lines.length > 5e3) {
      return lines.slice(0, 5e3).join("\n") + "\n\n... (diff truncated at 5000 lines)";
    }
    return diff;
  },
  async getRepoBranches(token, owner, repo) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches?per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "GitManager"
        }
      }
    );
    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`);
    }
    const data = await res.json();
    return (data || []).map((b) => ({
      name: b.name,
      current: false,
      commit: b.commit?.sha || "",
      label: b.name
    }));
  }
};
function registerGithubIpc() {
  electron.ipcMain.handle(
    "github:validate-token",
    async (_e, token) => {
      try {
        const user = await githubService.validateToken(token);
        return { success: true, data: user };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GITHUB_LIST_REPOS,
    async (_e, token) => {
      try {
        const repos = await githubService.listUserRepos(token);
        return { success: true, data: repos };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GITHUB_CREATE_REPO,
    async (_e, token, name, isPrivate, description) => {
      try {
        const result = await githubService.createRepo(token, name, isPrivate, description);
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GITHUB_GET_TOKEN,
    async () => {
      try {
        const token = githubService.getToken();
        return { success: true, data: token };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GITHUB_FORK_REPO,
    async (_e, token, owner, repo) => {
      try {
        const result = await githubService.forkRepo(token, owner, repo);
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GITHUB_SEARCH_REPOS,
    async (_e, token, query) => {
      try {
        const repos = await githubService.searchRepos(token, query);
        return { success: true, data: repos };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GITHUB_GET_COMMITS,
    async (_e, token, owner, repo) => {
      try {
        const commits = await githubService.getRepoCommits(token, owner, repo);
        return { success: true, data: commits };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GITHUB_GET_BRANCHES,
    async (_e, token, owner, repo) => {
      try {
        const branches = await githubService.getRepoBranches(token, owner, repo);
        return { success: true, data: branches };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GITHUB_GET_COMMIT_DIFF,
    async (_e, token, owner, repo, sha) => {
      try {
        const diff = await githubService.getCommitDiff(token, owner, repo, sha);
        return { success: true, data: diff };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.GITHUB_SAVE_TOKEN,
    async (_e, token) => {
      try {
        githubService.saveToken(token);
        return { success: true, data: void 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
}
const VIDEO_EXTENSIONS = /* @__PURE__ */ new Set([
  ".mp4",
  ".webm",
  ".ogg",
  ".mkv",
  ".avi",
  ".mov",
  ".wmv",
  ".flv"
]);
function isVideoFile(filename) {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return VIDEO_EXTENSIONS.has(ext);
}
function listDrives() {
  if (os.platform() === "win32") {
    const drives = [];
    for (let charCode = 65; charCode <= 90; charCode++) {
      const letter = String.fromCharCode(charCode) + ":\\";
      if (fs.existsSync(letter)) {
        drives.push(letter);
      }
    }
    return drives;
  }
  const roots = ["/"];
  const home = os.homedir();
  if (home && home !== "/") {
    roots.push(home);
  }
  return roots;
}
function registerFsIpc() {
  electron.ipcMain.handle(
    IPC.FS_LIST_DRIVES,
    async () => {
      try {
        const drives = listDrives();
        return { success: true, data: drives };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.FS_READ_DIR,
    async (_e, dirPath) => {
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        const dirs = [];
        const videos = [];
        for (const entry of entries) {
          if (entry.isDirectory()) {
            dirs.push(entry.name);
          } else if (entry.isFile() && isVideoFile(entry.name)) {
            const fullPath = path.join(dirPath, entry.name);
            try {
              const stat = fs.statSync(fullPath);
              videos.push({ name: entry.name, size: stat.size, path: fullPath });
            } catch {
            }
          }
        }
        dirs.sort((a, b) => a.localeCompare(b, "zh-CN"));
        videos.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
        return { success: true, data: { dirs, videos } };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
}
function registerAllIpc() {
  registerRepoIpc();
  registerGitIpc();
  registerSettingsIpc();
  registerWindowIpc();
  registerGithubIpc();
  registerFsIpc();
}
electron.app.commandLine.appendSwitch("enable-features", "PlatformHEVCDecoderSupport,PlatformHEVCEncoderSupport");
let mainWindow = null;
function createWindow() {
  const bounds = settingsStore.get("windowBounds");
  mainWindow = new electron.BrowserWindow({
    ...bounds || { width: 1200, height: 800 },
    minWidth: 900,
    minHeight: 600,
    title: "GitManager",
    icon: path.join(__dirname, "../../resources/icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false
    }
  });
  mainWindow.on("resize", () => {
    if (mainWindow) {
      const [width, height] = mainWindow.getSize();
      const [x, y] = mainWindow.getPosition();
      settingsStore.set("windowBounds", { x, y, width, height });
    }
  });
  mainWindow.on("moved", () => {
    if (mainWindow) {
      const [width, height] = mainWindow.getSize();
      const [x, y] = mainWindow.getPosition();
      settingsStore.set("windowBounds", { x, y, width, height });
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    electron.shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("console-message", (_e, level, message) => {
    console.log("[renderer]", level === 2 ? "WARN" : level === 3 ? "ERROR" : "LOG", message);
  });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  if (process.env.NODE_ENV === "development" || process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.webContents.openDevTools();
  }
}
electron.protocol.registerSchemesAsPrivileged([
  { scheme: "local-file", privileges: { bypassCSP: true, stream: true, supportFetchAPI: true } }
]);
electron.app.whenReady().then(() => {
  electron.protocol.handle("local-file", async (request) => {
    const rawPath = decodeURIComponent(request.url.slice("local-file:///".length));
    const filePath = path.normalize(rawPath);
    console.log("[local-file] Request:", request.url);
    console.log("[local-file] Range:", request.headers.get("range"));
    try {
      const fileStat = await promises.stat(filePath);
      const total = fileStat.size;
      console.log("[local-file] File size:", total);
      const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
      const mimeMap = {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".ogg": "video/ogg",
        ".mkv": "video/x-matroska",
        ".avi": "video/x-msvideo",
        ".mov": "video/quicktime",
        ".wmv": "video/x-ms-wmv",
        ".flv": "video/x-flv"
      };
      const mimeType = mimeMap[ext] || "application/octet-stream";
      const rangeHeader = request.headers.get("range");
      const start = rangeHeader?.match(/bytes=(\d+)-/)?.[1] ? parseInt(rangeHeader.match(/bytes=(\d+)-/)[1], 10) : 0;
      const endMatch = rangeHeader?.match(/bytes=\d+-(\d+)/);
      const end = endMatch?.[1] ? parseInt(endMatch[1], 10) : total - 1;
      const length = end - start + 1;
      console.log("[local-file] Range:", start, "-", end, "/", total, "length:", length);
      const fileHandle = await promises.open(filePath, "r");
      const buf = Buffer.alloc(length);
      await fileHandle.read(buf, 0, length, start);
      await fileHandle.close();
      console.log("[local-file] Returning 206, Content-Range:", `bytes ${start}-${end}/${total}`);
      return new Response(buf, {
        status: 206,
        headers: {
          "Content-Type": mimeType,
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Content-Length": String(length),
          "Accept-Ranges": "bytes"
        }
      });
    } catch (err) {
      console.error("[local-file] Error:", err);
      return new Response("File not found", { status: 404 });
    }
  });
  electron.Menu.setApplicationMenu(null);
  registerAllIpc();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("before-quit", () => {
  mainWindow = null;
});
