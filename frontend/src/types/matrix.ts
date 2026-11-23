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
  /** 该轴上的任务数；系统人员用于显示未指派数量。 */
  count: number
  /** 「待分配」为空时压缩成窄行／窄列，但不隐藏，仍作为拖放目标。 */
  compact: boolean
}

/** 当前打开的格子，始终以人员 × 项目表示，与是否转置无关。 */
export interface MatrixCellKey {
  personId: number
  projectId: number
}
