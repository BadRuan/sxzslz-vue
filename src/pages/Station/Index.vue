<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useStationStore } from '@/store/station';
import { useRoute, useRouter } from 'vue-router';
import { url_prefix } from '@/utils/baseInfo';
const station_store = useStationStore();
const { station_array } = storeToRefs(station_store);
const route = useRoute();
const router = useRouter();
const indexValue = Number(route.query.index)
const length = station_array.value.length

if (isNaN(indexValue) || indexValue < 0 || indexValue >= length) {
    router.replace({ name: 'Home' });
}

</script>

<template>
    <section class="bg-background py-8">
        <div class="w-7xl m-auto bg-white shadow rounded pb-8">
            <h1 class="py-8 font-bold text-center text-2xl text-primary border-b border-border">{{
                station_array[indexValue]?.station_name }}</h1>

            <div class="flex items-center px-16 py-4">
                <span class="h-5 w-1 rounded bg-primary mr-4"></span>
                <div>
                    <p class="text-xs text-gray-500">Base Infomation</p>
                    <h2 class="text-lg font-semibold text-gray-900">基本情况</h2>
                </div>
            </div>

            <div class="flex flex-row justify-around">
                <div class="flex flex-col justify-center">
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">主管部门</div>
                            <div class="font-bold">鸠江区水务局</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">管理单位</div>
                            <div class="font-bold">芜湖市鸠江区沈巷镇水利站</div>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col justify-center">
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">泵站名称</div>
                            <div class="font-bold">{{ station_array[indexValue]?.station_name }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">泵站地址</div>
                            <div class="font-bold">{{ station_array[indexValue]?.station_location }}</div>
                        </div>
                    </div>
                </div>
            </div>


            <div class="flex items-center px-16 py-4">
                <span class="h-5 w-1 rounded bg-primary mr-4"></span>
                <div>
                    <p class="text-xs text-gray-500">Station Information</p>
                    <h2 class="text-lg font-semibold text-gray-900">工程情况</h2>
                </div>
            </div>

            <div class="flex flex-row items-start justify-around">
                <div class="flex flex-col justify-center">
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">建站年份</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.birth_day }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">所在流域</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.suozailiuyu }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">装机</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.zhuangji }} 台套</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">泵站功能</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.bengzhangongneng }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">设计排涝扬程</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.shejipailaoyangchen }} m</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">变压器类型</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.bianyaqi_leixing }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">变压器型号</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.bianyaqi_xinghao }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">主机泵房类型</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.zhujifang_leixing }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">主机房面积</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.zhujifang_mianji }} m<sup>2</sup>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col justify-center">
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">改造（建）年份</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.gaizaonianfen }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">所在水系</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.suozaishuixi }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">总容量</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.zongrongliang }} kw</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">收益范围</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.shouyimianji }} km<sup>2</sup></div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">设计排涝进水位</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.shejipailaoshuiwei }} m</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">电机类型</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.dianji_leixing }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">电机型号</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.dianji_xinghao }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">管理房结构形式</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.guanlifang_leixing }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">管理房面积</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.guanlifang_mianji }} m<sup>2</sup>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col justify-center">
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">改造类型</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.gailaoleixing }} </div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">所在圩口</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.suozaiweikou }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">流量</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.liuliang }} m<sup>3</sup>/s</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">收益面积</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.shouyimianji }} 万亩</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">排涝最高出水位</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.pailaozuigaochushuiwei }} m</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">水泵类型</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.shuibeng_leixing }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">水泵型号</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.shuibeng_xinghao }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">压力箱长度</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.yalixiang_changdu }} m</div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">压力箱口径</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.yalixiang_koujing }}
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="h-12 flex flex-row">
                            <div class="mr-4 text-gray-600">压力箱结构</div>
                            <div class="font-bold">{{
                                station_array[indexValue]?.yalixiang_jiegou }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <div class="flex items-center px-16 py-4">
                <span class="h-5 w-1 rounded bg-primary mr-4"></span>
                <div>
                    <p class="text-xs text-gray-500">Station Pictures</p>
                    <h2 class="text-lg font-semibold text-gray-900">泵站面貌</h2>
                </div>
            </div>


            <div class="w-6xl mx-auto">
                <div class="flex flex-col items-center">
                    <div v-for="(item, index) in station_array[indexValue]?.station_pic_list" :key="index"
                        class="w-2/3 shadow-lg my-4 bg-white">
                        <div class="flex flex-col">
                            <div class="overflow-hidden ">
                                <img alt="gallery"
                                    class="w-full h-full object-cover object-center hover:scale-110 ease-in-out transition-all duration-500"
                                    :src="url_prefix.pic_prefix + item.src">
                            </div>
                            <div class="flex flex-row items-center justify-between px-8 py-4">
                                <div>
                                    <div class="text-sm font-bold">{{ station_array[indexValue]?.station_name }}</div>
                                    <div class="text-gray-500 text-sm">2025年08月04日 09:05:10</div>
                                </div>
                                <div class="font-medium text-gray-800">{{ item.title
                                    }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>



    </section>
</template>