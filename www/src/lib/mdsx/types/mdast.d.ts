declare global {
  declare module 'mdast' {
    export interface Tabs {
      type: 'tabs'
      children: (TabsList | TabsContent)[]
      sync?: boolean
      groupId?: string
      value?: string
    }

    export type GitHubAlertVariant = 'TIP' | 'NOTE' | 'IMPORTANT' | 'WARNING' | 'CAUTION'

    export interface GitHubAlert extends Parent {
      type: 'gitHubAlert'
      title: string
      variant: GitHubAlertVariant
    }

    export interface TabsList extends Parent {
      type: 'tabsList'
    }

    export interface TabsTrigger extends Literal, Parent {
      type: 'tabsTrigger'
    }

    export interface TabsContent extends Literal, Parent {
      type: 'tabsContent'
    }

    export interface Details extends Parent {
      type: 'details'
      title?: string
      open?: boolean
    }

    export interface RootContentMap {
      tabs: Tabs
      tabsList: TabsList
      tabsTrigger: TabsTrigger
      tabsContent: TabsContent
      gitHubAlert: GitHubAlert
      details: Details
    }
  }
}
