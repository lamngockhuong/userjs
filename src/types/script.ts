export interface Script {
  name: string
  version: string
  description: string
  author: string
  category: string
  filename: string
  matches: string[]
  installUrl: string
  sourceUrl: string
}

export interface Bookmark {
  name: string
  url: string
  description: string
  category: string
}
