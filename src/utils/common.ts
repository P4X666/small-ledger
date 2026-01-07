export const getGreetingMessage = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了，注意休息';
    if (hour < 9) return '早上好，开始新的一天';
    if (hour < 12) return '上午好，效率满满';
    if (hour < 14) return '中午好，记得午休';
    if (hour < 18) return '下午好，继续加油';
    if (hour < 22) return '晚上好，放松一下';
    return '夜深了，准备休息';
}