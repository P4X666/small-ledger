import dayjs from "dayjs"

const FORMAT = 'YYYY-MM-DD'

export const getToday = ()=>{
    return dayjs().format(FORMAT)
}
// 获取周的开始日期（默认周一）
export const getWeekStart = (date: string)=>{
    return dayjs(date).day(1).format(FORMAT)
}

export const getWeekEnd = (date: string)=>{
    return dayjs(date).day(7).format(FORMAT)
}

export const getMonthStart = (date: string)=>{
    return dayjs(date).startOf('month').format(FORMAT)
}

export const getMonthEnd = (date: string)=>{
    return dayjs(date).endOf('month').format(FORMAT)
}

export const getYearStart = (date: string)=>{
    return dayjs(date).startOf('year').format(FORMAT)
}

export const getYearEnd = (date: string)=>{
    return dayjs(date).endOf('year').format(FORMAT)
}

// 获取上一年的开始日期
export const getLastYearStart = (date: string)=>{
    return dayjs(date).subtract(1, 'year').startOf('year').format(FORMAT)
}
