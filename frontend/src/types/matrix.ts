// 矩阵视图专用类型：行列统一抽象成轴，转置时直接互换。

export type MatrixAxisKind = 'person' | 'project'

export interface MatrixAxis {
  id: number
  kind: MatrixAxisKind
  name: string
  color: string
  isSystem: boolean
  /** 当前筛选下该行／列是否没有任何任务（空行／空列标记）。 */
  empty: boolean
}

/** 当前打开的格子，始终以人员 × 项目表示，与是否转置无关。 */
export interface MatrixCellKey {
  personId: number
  projectId: number
}
