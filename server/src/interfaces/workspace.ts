import { UserWorkspace, Workspace } from '@prisma/client'

type ExtendedWorkspace = Workspace

export interface IWorkspace extends UserWorkspace {
  Workspace: ExtendedWorkspace
  updatedAt: Date
}
