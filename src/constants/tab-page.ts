export enum TAB_PAGE  {
    INDEX= '/pages/index/index',
    TODOLIST= '/pages/todolist/index',
    ACCOUNTING= '/pages/accounting/index',
    GOALS= '/pages/goals/index'
}

export const TAB_PAGE_REVERSE = Object.fromEntries(
    Object.entries(TAB_PAGE).map(([key, value]) => [value, key])
) as Record<typeof TAB_PAGE[keyof typeof TAB_PAGE], keyof typeof TAB_PAGE>;