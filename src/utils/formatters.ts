import dayjs from 'dayjs';

/**
 * 格式化日期为 YYYY-MM-DD 格式
 */
export const date_text = (date_value: string): string => {
    return dayjs(date_value).format('YYYY-MM-DD')
};

export const easy_date_text = (date_value: string): string => {
    return dayjs(date_value).format('MM/DD')
};
