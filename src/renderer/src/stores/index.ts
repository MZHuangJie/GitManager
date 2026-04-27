import { create } from 'zustand'
import { createRepoSlice, RepoSlice } from './repo.slice'
import { createGitSlice, GitSlice } from './git.slice'
import { createUiSlice, UiSlice } from './ui.slice'

export type AppStore = RepoSlice & GitSlice & UiSlice

export const useStore = create<AppStore>()((...a) => ({
  ...createRepoSlice(...a),
  ...createGitSlice(...a),
  ...createUiSlice(...a)
}))
