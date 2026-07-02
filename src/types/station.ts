export interface StationPicModel {
    title: string
    src: string
}

export interface StationModel {
    station_name: string,
    station_location: string

    birth_day: number
    suozailiuyu: string
    suozaishuixi: string
    zhuangji: number
    bengzhangongneng: string
    shejipailaoyangchen: number

    gaizaonianfen: string
    zongrongliang: number
    shouyifanwei: number
    shejipailaoshuiwei: number

    gailaoleixing: string
    suozaiweikou: string
    liuliang: number
    shouyimianji: number
    pailaozuigaochushuiwei: number

    bianyaqi_leixing: string
    bianyaqi_xinghao: string
    dianji_leixing: string
    dianji_xinghao: string
    shuibeng_leixing: string
    shuibeng_xinghao: string

    zhujifang_leixing: string
    zhujifang_mianji: number
    guanlifang_leixing: string
    guanlifang_mianji: number
    yalixiang_changdu: number
    yalixiang_koujing: string
    yalixiang_jiegou: string

    station_pic_list: StationPicModel[]
}