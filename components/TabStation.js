// TabStation.js
// “设站”面板

app.component('tab-station', {
    props: {
        line: {
            type: Object,
            required: true
        },
        version: {
            type: String,
            required: true
        }
    },
    setup() {
        const map = VueReactivity.shallowRef(null);
        return{
            map,
        }
    },
    mounted() {
        if(this.version != this.componentVersion){
            alert("[警告] 版本号匹配失败，继续使用可能会出现问题！\n请按下 Ctrl+F5 或 Command+Shift+R 或清除浏览器缓存后再访问。\n" + 
                "BLD 版本号: " + this.version + "，组件版本号：" + this.componentVersion);
        }

        jscolor.presets.default = {
            format: 'hex',
            previewSize: 40
        };
        $cookies.config(Infinity);
        if($cookies.isKey("stationSettings")){
            var savedSettings = $cookies.get("stationSettings");
            for(const key in savedSettings){
                this.settings[key] = savedSettings[key];
            }
        }else{
            $cookies.set("stationSettings", this.settings);
        }

        this.mapInit();
        document.getElementById('amap').onkeydown = this.hotKey;
    },
    template:
    /* HTML */
    `
    <div class="container" id="tabStation">
        <div class="modal fade" id="modalMapSettings" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h6 class="modal-title">设置</h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body form-control" style="border: 0px;">
                        <div class="mb-3">
                            <label class="form-label">正方向</label>
                            <select class="form-select" id="stationLightness" v-model="settings.mainDirection" @change="$nextTick(() => { setCookies(); });">
                                <option selected value="0">上行</option>
                                <option value="1">下行</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">在地图上显示站名</label>
                            <select class="form-select" id="showStationName" v-model.number="settings.showStationName" @change="$nextTick(() => { mapItems.labelsLayer.setCollision(parseInt(settings.showStationName)); loadMapLine(false); setCookies(); });">
                                <option value="0">不显示</option>
                                <option selected value="1">智能显示 (防碰撞)</option>
                                <option value="0.5">全部显示</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">显示线路反向</label>
                            <select class="form-select" id="showOpposite" v-model.number="settings.showOpposite" @change="$nextTick(() => { loadMapLine(false); setCookies(); });">
                                <option value="0">不显示</option>
                                <option selected value="0.4">半透明显示</option>
                                <option value="1">不透明显示</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">地图风格</label>
                            <select class="form-select" id="mapStyle" v-model="settings.mapStyle" @change="$nextTick(() => { map.setMapStyle(settings.mapStyle); setCookies(); });">
                                <option selected value="amap://styles/normal">默认</option>
                                <option value="amap://styles/macaron">马卡龙</option>
                                <option value="amap://styles/fresh">草色青</option>
                                <option value="amap://styles/whitesmoke">远山黛</option>
                                <option value="amap://styles/light">月光银</option>
                                <option value="amap://styles/blue">靛青蓝</option>
                                <option value="amap://styles/darkblue">极夜蓝</option>
                                <option value="amap://styles/grey">雅土灰</option>
                                <option value="amap://styles/dark">幻影黑</option>
                            </select>
                        </div>
                        <div class="collapse" id="advancedSettings">
                            <div class="mb-3">
                                <label class="form-label">站点颜色明度</label>
                                <select class="form-select" id="stationLightness" v-model="settings.stationLightness" @change="$nextTick(() => { loadMapLine(false); setCookies(); });">
                                    <option selected value="-64">暗</option>
                                    <option value="-32">较暗</option>
                                    <option value="0">不变</option>
                                    <option value="32">较亮</option>
                                    <option value="64">亮</option>
                                    <option value="origin">原版</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">线路宽度</label>
                                <input type="number" class="form-control" v-model.number="settings.lineStrokeWidth" @change="$nextTick(() => { loadMapLine(false); setCookies(); });" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">站点大小</label>
                                <input type="number" class="form-control" v-model.number="settings.stationFillRadius" @change="$nextTick(() => { loadMapLine(false); setCookies(); });" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">站点宽度</label>
                                <input type="number" class="form-control" v-model.number="settings.stationStrokeWidth" @change="$nextTick(() => { loadMapLine(false); setCookies(); });" />
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-primary" data-bs-toggle="collapse" data-bs-target="#advancedSettings" aria-expanded="false" aria-controls="collapseExample">高级</button>
                        <button type="button" class="btn btn-outline-primary" @click="resetSettings()">复原</button>
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">确定</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal fade" id="modalLineMap" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h6 class="modal-title">线网</h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body form-control" style="border: 0px; padding: 0px; overflow-y:auto; overflow-x:hidden;">
                        <div class="list-group list-group-flush">
                            <li v-if="!mapItems.lineMap.length" class="list-group-item list-group-item-action">点击“添加”即可将当前线路添加至线网中</li>
                            <li v-for="(lineMapLine, index) in mapItems.lineMap" class="list-group-item list-group-item-action d-flex align-content-center justify-content-between">
                                <span class="align-self-center">{{ lineMapLine.lineName }}</span>
                                <div class="btn-group btn-group-sm pull-right" role="group">
                                    <button type="button" class="btn btn-outline-primary" :class="{ active: lineMapLine.showLineUp, disabled: !lineMapLine.polylineUp }" @click="setShowLineOfLineMap(index, 'up')">{{ settings.mainDirection!="1"?"上行":"下行" }}</button>
                                    <button type="button" class="btn btn-outline-primary" :class="{ active: lineMapLine.showLineDown, disabled: (!lineMapLine.polylineDown) || (lineMapLine.lineType % 2) != 1 }" @click="setShowLineOfLineMap(index, 'down')">{{ settings.mainDirection!="1"?"下行":"上行" }}</button>
                                    <button type="button" class="btn btn-outline-danger" title="从线网中删除线路" @click="removeLineFromLineMap(index)">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-primary" @click="appendLineToLineMap()">添加当前线路</button>
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">确定</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="alert alert-primary alert-dismissible d-flex align-items-center" role="alert" v-if="!chrome">
            <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Warning:"><use xlink:href="#info-fill" /></svg>
            <div><span>为获得更好的体验，建议使用 <a href="https://google.cn/chrome/" class="alert-link" target="_blank">Chrome</a> 浏览器。</span></div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        <h1><span class="fw-normal display-5">{{ title }}</span><span class="fw-normal display-7">{{ subtitle }}</span></h1>
        <div class="row justify-content-between">
            <div class="col-12 col-md-3 card mb-3 TabStationCard1">
                <div class="card-header">基本信息</div>
                <div class="card-body" style="overflow-y:auto; overflow-x:hidden;">
                    <div class="mb-3">
                        <label class="form-label" for="lineName">线路名称</label>
                        <input type="text" class="form-control" id="lineName" autocomplete="off" placeholder="未命名线路" v-model.trim="line.lineName"/>
                    </div>
                    <div class="mb-3">
                        <label class="form-label" for="lineType">线路类型</label>
                        <select class="form-select" id="lineType" v-model.number="line.lineType" @change="checkDirection()">
                            <option selected value="1">双向线路</option>
                            <option value="2">单向线路</option>
                            <option value="3">双向环线</option>
                            <option value="4">单向环线</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label" for="company">运营公司</label>
                        <input type="text" class="form-control" id="company" autocomplete="off" placeholder="填写运营公司名称" v-model.trim="line.company" />
                    </div>
                    <div class="mb-3">
                        <label class="form-label" for="city">所在地区</label>
                        <input type="text" class="form-control" id="city" autocomplete="off" placeholder="填写城市名称或地区行政代码" v-model.trim="cityName" @change="searchCity()" />
                    </div>
                    <div class="mb-3">
                        <label class="form-label" for="infoUp">{{ isBilateral?(settings.mainDirection!="1"?"上行信息":"下行信息"):"线路信息" }}</label>
                        <input type="text" class="form-control" id="infoUp" placeholder="0站 / 0.0km" v-model.trim="infoUp" disabled readonly />
                    </div>
                    <div class="mb-3" v-if="isBilateral">
                        <label class="form-label" for="infoDown">{{ settings.mainDirection!="1"?"下行信息":"上行信息" }}</label>
                        <input type="text" class="form-control" id="infoDown" placeholder="0站 / 0.0km" v-model.trim="infoDown" disabled readonly />
                    </div>
                    <div class="mb-3">
                    <label class="form-label" for="lineColor">线路颜色</label>
                        <input type="text" class="form-control" id="lineColor" autocomplete="off" v-model.trim="line.lineColor" data-jscolor="{}" @change="$nextTick(() => { loadMapLine(false); });" />
                    </div>
                    <div class="mb-3">
                        <label class="form-label">线路备注</label>
                        <textarea class="form-control" autocomplete="off" rows="1" v-model.trim="line.remark"></textarea>
                    </div>
                </div>
            </div>
            <div class="col-12 col-md-3 card mb-3 TabStationCard2">
                <div class="card-header">{{ showStationsOnly?"线路站点":"线路节点" }}</div>
                    <div class="card-body" style="padding: 0px; overflow-y:auto; overflow-x:hidden;">
                        <div v-if="!showStationsOnly" class="list-group list-group-flush">
                            <a v-if="!nodes.length" href="javascript: void(0)" class="list-group-item list-group-item-action">使用添加节点工具在地图上单击即可添加</a>
                            <a v-for="(node, index) in nodes" class="list-group-item list-group-item-action" :class="{ active: selectedNode == index }" @click="selectNode(index, false)">
                                <svg v-if="node.type == 'station'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-record-circle" viewBox="0 0 16 16">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                    <path d="M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                                </svg>
                                <svg v-if="node.type == 'waypoint'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/>
                                </svg>
                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="16" fill="currentColor"></svg>
                                <input v-if="renameEnabled && selectedNode == index" autocomplete="off" v-model.trim="node.name" type="text" class="h-100" style="border-style: none" @keypress="renameKeyPress()"/>
                                <span v-else>{{ node.name }}</span>
                            </a>
                        </div>
                        <div v-if="showStationsOnly" class="list-group list-group-flush">
                        <a v-if="!nodes.length" href="javascript: void(0)" class="list-group-item list-group-item-action">使用添加节点工具在地图上单击即可添加</a>
                        <a v-for="station in stations" class="list-group-item list-group-item-action" :class="{ active: selectedNode == station.id }" @click="selectNode(station.id, false)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-record-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                <path d="M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="16" fill="currentColor"></svg>
                            <input v-if="renameEnabled && selectedNode == station.id" autocomplete="off" v-model.trim="station.name" type="text" class="h-100" style="border-style: none" @keypress="renameKeyPress()"/>
                            <span v-else>{{ station.name }}</span>
                        </a>
                    </div>
                    <div style="border-width: 1px 0 0 0; border-style: solid; border-color: rgba(0,0,0,.125);"></div>
                </div>
                <div class="card-footer">
                    <div class="btn-group btn-group-sm pull-right" role="group" style="float:left" :hidden="!isBilateral">
                        <button type="button" class="btn btn-outline-primary" :class="{ active: selectedDirection == 'up' }" @click="setDirection('up')">{{ settings.mainDirection!="1"?"上行":"下行" }}</button>
                        <button type="button" class="btn btn-outline-primary" :class="{ active: selectedDirection == 'down' }" @click="setDirection('down')">{{ settings.mainDirection!="1"?"下行":"上行" }}</button>
                        <button type="button" class="btn btn-outline-primary" title="翻转上下行" @click="[line.route.up, line.route.down] = [line.route.down, line.route.up]; loadMapLine(false);">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-shuffle" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.624 9.624 0 0 0 7.556 8a9.624 9.624 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.595 10.595 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.624 9.624 0 0 0 6.444 8a9.624 9.624 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5z"/>
                                <path d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192zm0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="btn-group btn-group-sm pull-right" role="group" style="float:right">
                        <button type="button" class="btn btn-outline-primary" :class="{ active: showStationsOnly }" title="只显示站点" @click="setShowStationsOnly(null)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-record-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                <path d="M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-outline-primary" :class="{ active: renameEnabled }" title="重命名当前节点" @click="setRenameMode()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-input-cursor-text" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M5 2a.5.5 0 0 1 .5-.5c.862 0 1.573.287 2.06.566.174.099.321.198.44.286.119-.088.266-.187.44-.286A4.165 4.165 0 0 1 10.5 1.5a.5.5 0 0 1 0 1c-.638 0-1.177.213-1.564.434a3.49 3.49 0 0 0-.436.294V7.5H9a.5.5 0 0 1 0 1h-.5v4.272c.1.08.248.187.436.294.387.221.926.434 1.564.434a.5.5 0 0 1 0 1 4.165 4.165 0 0 1-2.06-.566A4.561 4.561 0 0 1 8 13.65a4.561 4.561 0 0 1-.44.285 4.165 4.165 0 0 1-2.06.566.5.5 0 0 1 0-1c.638 0 1.177-.213 1.564-.434.188-.107.335-.214.436-.294V8.5H7a.5.5 0 0 1 0-1h.5V3.228a3.49 3.49 0 0 0-.436-.294A3.166 3.166 0 0 0 5.5 2.5.5.5 0 0 1 5 2z"/>
                                <path d="M10 5h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4v1h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4v1zM6 5V4H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v-1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4z"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-outline-primary" title="更改当前节点类型 [Ctrl+/]" @click="changeNode()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-repeat" viewBox="0 0 16 16">
                                <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
                                <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-outline-danger" v-if="!showStationsOnly" title="删除当前节点 [Backspace]" @click="deleteNode()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-outline-danger" v-if="showStationsOnly" title="删除当前站点 [Backspace]" @click="deleteNodes()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div class="col-12 col-md-5 card mb-3 TabStationCard3" id="mapPanel">
	            <div class="card-header" @click="loadMapLine(true, true);">
                    <span>线路走向</span>
                </div>
	            <div class="card-body" id="amap"></div>
	            <div class="card-footer">
                    <div class="btn-group btn-group-sm pull-right" role="group" style="float: left">
                        <button type="button" class="btn btn-outline-primary" :class="{ active: satelliteEnabled }" @click="setSatelliteLayer()" title="卫星图层">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 1024 1024" fill="currentColor">
                                <path d="M702.171429 752.55873c27.631746 0 48.761905-21.130159 48.761904-47.136508 0-11.377778-4.87619-22.755556-11.377777-30.882539l39.009523-39.009524c19.504762-19.504762 19.504762-50.387302 0-68.266667l-206.425396-206.425397 92.647619-92.647619 94.273015 94.273016c19.504762 19.504762 50.387302 19.504762 68.266667 0l32.507937-32.507936c19.504762-19.504762 19.504762-50.387302 0-68.266667l-235.68254-235.68254c-19.504762-19.504762-50.387302-19.504762-68.266667 0l-32.507936 32.507937c-19.504762 19.504762-19.504762 50.387302 0 68.266666l94.273016 94.273016-92.647619 92.647619-206.425397-206.425397c-19.504762-19.504762-50.387302-19.504762-68.266667 0l-152.787301 152.787302c-19.504762 19.504762-19.504762 50.387302 0 68.266667l206.425396 206.425397-92.647619 92.647619-94.273016-94.273016c-19.504762-19.504762-50.387302-19.504762-68.266666 0l-32.507937 32.507936c-19.504762 19.504762-19.504762 50.387302 0 68.266667l235.68254 235.68254c19.504762 19.504762 50.387302 19.504762 68.266667 0l32.507936-32.507937c19.504762-19.504762 19.504762-50.387302 0-68.266667l-94.273016-94.273015 92.647619-92.64762 206.425397 206.425397c19.504762 19.504762 50.387302 19.504762 68.266667 0l45.511111-45.511111c8.126984 6.501587 19.504762 9.752381 30.88254 9.752381z" p-id="7032"></path><path d="M897.219048 658.285714h-71.517461c0 43.885714-17.879365 86.146032-50.387301 117.028572-32.507937 30.88254-76.393651 48.761905-123.530159 48.761904v68.266667c136.533333 0 245.434921-105.650794 245.434921-234.057143z" p-id="7033"></path><path d="M952.48254 658.285714c0 157.663492-134.907937 286.069841-299.073016 286.069842v68.266666c204.8 0 370.590476-159.288889 370.590476-352.711111h-71.51746z"></path>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-outline-primary" :class="{ active: mapEnabled }" @click="setMapLayer()" title="地图图层">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 1024 1024" fill="currentColor">
                                <path d="M372.350001 0v279.259092h240.629159A139.984074 139.984074 0 0 1 698.147729 194.090523V0h93.090909v194.13143a139.970438 139.970438 0 0 1 85.168569 85.182204h147.53825v93.090909H876.3663a140.065888 140.065888 0 0 1-85.086755 85.127662v54.542791A232.720455 232.720455 0 0 1 568.6086 744.509102l-10.104053 0.231806H457.477662a139.99771 139.99771 0 0 1-85.086754 85.127662v194.13143h-93.131816V829.86857a139.970438 139.970438 0 0 1-85.127662-85.182204H0v-93.077274h194.090523a140.011345 140.011345 0 0 1 85.168569-85.182204V372.350001H0V279.259092h279.259092V0z m-46.552273 651.609092A46.538637 46.538637 0 1 0 372.336365 698.147729a46.525001 46.525001 0 0 0-46.538637-46.538637z m287.222339-279.259091h-240.670066v194.13143a139.984074 139.984074 0 0 1 85.168568 85.168568h100.999614a139.643181 139.643181 0 0 0 139.397739-131.448127l0.231807-8.181418v-54.501885a140.024981 140.024981 0 0 1-85.127662-85.168568z m131.666299-93.090909a46.552272 46.552272 0 1 0 46.538636 46.538636 46.552272 46.552272 0 0 0-46.538636-46.538636z"></path>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-outline-primary" @click="elementFullScreen('mapPanel')" title="面板全屏">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-window-fullscreen" viewBox="0 0 16 16">
                                <path d="M3 3.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Zm1.5 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Zm1 .5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z"/>
                                <path d="M.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5H.5ZM1 5V2h14v3H1Zm0 1h14v8H1V6Z"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-outline-primary" @click="setMapTool('watch');elementFullScreen('amap')" title="地图全屏">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrows-fullscreen" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344 0a.5.5 0 0 1 .707 0l4.096 4.096V11.5a.5.5 0 1 1 1 0v3.975a.5.5 0 0 1-.5.5H11.5a.5.5 0 0 1 0-1h2.768l-4.096-4.096a.5.5 0 0 1 0-.707zm0-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707zm-4.344 0a.5.5 0 0 1-.707 0L1.025 1.732V4.5a.5.5 0 0 1-1 0V.525a.5.5 0 0 1 .5-.5H4.5a.5.5 0 0 1 0 1H1.732l4.096 4.096a.5.5 0 0 1 0 .707z"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-outline-primary" @click="showMapSettings()" title="设置">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear-wide-connected" viewBox="0 0 16 16">
                                <path d="M7.068.727c.243-.97 1.62-.97 1.864 0l.071.286a.96.96 0 0 0 1.622.434l.205-.211c.695-.719 1.888-.03 1.613.931l-.08.284a.96.96 0 0 0 1.187 1.187l.283-.081c.96-.275 1.65.918.931 1.613l-.211.205a.96.96 0 0 0 .434 1.622l.286.071c.97.243.97 1.62 0 1.864l-.286.071a.96.96 0 0 0-.434 1.622l.211.205c.719.695.03 1.888-.931 1.613l-.284-.08a.96.96 0 0 0-1.187 1.187l.081.283c.275.96-.918 1.65-1.613.931l-.205-.211a.96.96 0 0 0-1.622.434l-.071.286c-.243.97-1.62.97-1.864 0l-.071-.286a.96.96 0 0 0-1.622-.434l-.205.211c-.695.719-1.888.03-1.613-.931l.08-.284a.96.96 0 0 0-1.186-1.187l-.284.081c-.96.275-1.65-.918-.931-1.613l.211-.205a.96.96 0 0 0-.434-1.622l-.286-.071c-.97-.243-.97-1.62 0-1.864l.286-.071a.96.96 0 0 0 .434-1.622l-.211-.205c-.719-.695-.03-1.888.931-1.613l.284.08a.96.96 0 0 0 1.187-1.186l-.081-.284c-.275-.96.918-1.65 1.613-.931l.205.211a.96.96 0 0 0 1.622-.434l.071-.286zM12.973 8.5H8.25l-2.834 3.779A4.998 4.998 0 0 0 12.973 8.5zm0-1a4.998 4.998 0 0 0-7.557-3.779l2.834 3.78h4.723zM5.048 3.967c-.03.021-.058.043-.087.065l.087-.065zm-.431.355A4.984 4.984 0 0 0 3.002 8c0 1.455.622 2.765 1.615 3.678L7.375 8 4.617 4.322zm.344 7.646.087.065-.087-.065z"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-outline-primary" @click="showLineMap()" title="线网">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list-ul" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="btn-group btn-group-sm pull-right" role="group" style="float: right">
                        <button type="button" class="btn btn-outline-primary" :class="{ active: selectedMapTool == 'watch' }" @click="setMapTool('watch')" title="看图模式 [1]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-hand-index" viewBox="0 0 16 16">
                                <path d="M6.75 1a.75.75 0 0 1 .75.75V8a.5.5 0 0 0 1 0V5.467l.086-.004c.317-.012.637-.008.816.027.134.027.294.096.448.182.077.042.15.147.15.314V8a.5.5 0 1 0 1 0V6.435a4.9 4.9 0 0 1 .106-.01c.316-.024.584-.01.708.04.118.046.3.207.486.43.081.096.15.19.2.259V8.5a.5.5 0 0 0 1 0v-1h.342a1 1 0 0 1 .995 1.1l-.271 2.715a2.5 2.5 0 0 1-.317.991l-1.395 2.442a.5.5 0 0 1-.434.252H6.035a.5.5 0 0 1-.416-.223l-1.433-2.15a1.5 1.5 0 0 1-.243-.666l-.345-3.105a.5.5 0 0 1 .399-.546L5 8.11V9a.5.5 0 0 0 1 0V1.75A.75.75 0 0 1 6.75 1zM8.5 4.466V1.75a1.75 1.75 0 1 0-3.5 0v5.34l-1.2.24a1.5 1.5 0 0 0-1.196 1.636l.345 3.106a2.5 2.5 0 0 0 .405 1.11l1.433 2.15A1.5 1.5 0 0 0 6.035 16h6.385a1.5 1.5 0 0 0 1.302-.756l1.395-2.441a3.5 3.5 0 0 0 .444-1.389l.271-2.715a2 2 0 0 0-1.99-2.199h-.581a5.114 5.114 0 0 0-.195-.248c-.191-.229-.51-.568-.88-.716-.364-.146-.846-.132-1.158-.108l-.132.012a1.26 1.26 0 0 0-.56-.642 2.632 2.632 0 0 0-.738-.288c-.31-.062-.739-.058-1.05-.046l-.048.002zm2.094 2.025z"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-outline-primary" :class="{ active: selectedMapTool == 'newStationSmart' }" @click="setMapTool('newStationSmart')" title="智能设站模式 [2]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-circle" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V4.5z"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-outline-primary" :class="{ active: selectedMapTool == 'newStation' }" @click="setMapTool('newStation')" title="新建站点模式 [3]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-outline-primary" :class="{ active: selectedMapTool == 'newWaypoint' }" @click="setMapTool('newWaypoint')" title="新建途经点模式 [4]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="btn-group btn-group-sm pull-right me-2" role="group" style="float: right">
                        <button type="button" class="btn btn-outline-primary" :class="{ active: selectedMapMode == 'before' }" @click="setMapMode('before')" title="在当前节点前操作">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-bar-up" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M8 10a.5.5 0 0 0 .5-.5V3.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 3.707V9.5a.5.5 0 0 0 .5.5zm-7 2.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5z"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-outline-primary" :class="{ active: selectedMapMode == 'after' }" @click="setMapMode('after')" title="在当前节点后操作">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-bar-down" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M1 3.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zM8 6a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L7.5 12.293V6.5A.5.5 0 0 1 8 6z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            componentVersion: '1.3.1',
            cityName: '',
            selectedDirection: 'up',
            selectedNode: 0,
            originSelectedNode: 0,
            selectedMapTool: 'watch',
            selectedMapMode: 'after',
            showStationsOnly: true,
            lastSelectedWayPoint: null,
            renameEnabled: false,
            satelliteEnabled: false,
            mapEnabled: true,
            mapItems: {
                polyline: VueReactivity.shallowRef(null),
                polylineOpposite: VueReactivity.shallowRef(null),
                markers: VueReactivity.shallowRef([]),
                markersOpposite: VueReactivity.shallowRef([]),
                texts: VueReactivity.shallowRef([]),
                textsOpposite: VueReactivity.shallowRef([]),
                infowindow: VueReactivity.shallowRef(null),
                satelliteLayer: VueReactivity.shallowRef(null),
                labelsLayer: VueReactivity.shallowRef(null),
                lineMap: VueReactivity.shallowRef([])
            },
            settings: {
                mainDirection: 0,
                showStationName: "1",
                showOpposite: "0.4",
                mapStyle: "amap://styles/normal",
                stationLightness: -64,
                lineStrokeWidth: 6,
                stationStrokeWidth: 2,
                stationFillRadius: 5
            },
            chrome: true
        }
    },
    methods: {
        // mapInit()
        // 初始化地图div
        mapInit() {
            AMapLoader.load({
                "key": window.AMapKey,
                "version": "2.0",
                "plugins": ['AMap.PlaceSearch', 'AMap.Driving', 'AMap.DistrictSearch', 'AMap.LineSearch']
            }).then((AMap)=>{
                this.map = new AMap.Map('amap', {
                    showIndoorMap: false,
                    rotateEnable: false,
                    doubleClickZoom: false,
                    isHotspot: false,
                    resizeEnable: true,
                    features: ['bg', 'road', 'point'],
                    defaultCursor: 'move',
                    mapStyle: this.settings.mapStyle
                });

                this.mapItems.labelsLayer = new AMap.LabelsLayer({
                    zooms: [3, 20],
                    zIndex: 120,
                    visible: true,
                    collision: parseInt(this.settings.showStationName),
                    animation: true,
                });
                
                this.map.add(this.mapItems.labelsLayer);
                this.map.on('click', function(e) {
                    this.clickPoint(e.lnglat.getLng(), e.lnglat.getLat());
                }, this);

                this.loadMapLine(true);
                this.map.resize();
                this.chrome = AMap.Browser.chrome; // Browser check
            }).catch((e)=>{
                console.error(e);
            });
            /* map.setFeatures(['bg', 'road']); */
            return;
        },

        // elementFullScreen
        // 元素全屏
        elementFullScreen(id) {
            var div = document.getElementById(id);
            if(div.requestFullscreen){
                div.requestFullscreen();
            }else if(div.webkitRequestFullScreen){
                div.webkitRequestFullScreen();
            }else if(div.mozRequestFullScreen){
                div.mozRequestFullScreen();
            }else if(div.msRequestFullscreen){
                div.msRequestFullscreen();
            }
            this.map.resize();
            return;
        },
        // exitFullScreen
        // 退出全屏模式
        exitFullScreen() {
            if(document.exitFullScreen) {
                document.exitFullScreen();
            } else if(document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if(document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if(document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            this.map.resize();
            return;        
        },
        // getFullScreenElement
        // 获取当前全屏的元素
        getFullScreenElement() {
            return (        
                document.fullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullScreenElement ||
                document.webkitFullscreenElement || null
            );
        },

        // clickPoint
        // 在地图上点击一个点
        clickPoint(lng, lat) {
            if(this.selectedMapTool == 'watch'){
                return;
            }
            this.newNode(lng, lat);
        },
        // clickNode
        // 在地图上点击一个节点
        clickNode(e) {
            if(e.target.getExtData() < 0){
                this.clickPoint(e.lnglat.lng, e.lnglat.lat);
            }else if(this.selectedMapTool == 'watch'){
                this.selectedNode = e.target.getExtData();
                this.selectNode(this.selectedNode);
            }else{
                this.clickPoint(this.nodes[e.target.getExtData()].lng, this.nodes[e.target.getExtData()].lat);
            }
        },
        // clickPolyline
        // 在地图上点击折线
        clickPolyline(e) {
            this.clickPoint(e.lnglat.getLng(), e.lnglat.getLat());
        },
        // deleteNode
        // 删除列表中选中的节点
        deleteNode() {
            this.saveOriginal();
            this.line.route[this.trueDirection].splice(this.selectedNode, 1);
            this.selectedNode -= 1;
            if(this.selectedNode < 0){
                this.selectedNode = 0;
            }
            this.loadMapLine(false);
        },
        // deleteNodes
        // 删除上一个站点至选中节点间的所有节点（仅限智能规划模式）
        deleteNodes() {
            this.saveOriginal();
            this.lastSelectedWayPoint = null;
            if(this.selectedNode == 0){
                var nextStation = null;
                this.nodes.forEach((node, index) => {
                    if(index > this.selectedNode && nextStation === null && node.type == 'station'){
                        nextStation = index;
                    }
                });
                if(nextStation !== null){
                    this.nodes.splice(0, nextStation);
                }else{
                    this.nodes.splice(0, 1);
                }
            }else{
                var lastStation = 0;
                this.nodes.slice(0, this.selectedNode).forEach((node, index) => {
                    if(node.type == 'station'){
                        lastStation = index;
                    }
                });
                this.nodes.splice(lastStation + 1, this.selectedNode - lastStation);
                this.selectedNode = lastStation;

                if(this.selectedNode != this.nodes.length - 1){
                    var nextStation = this.nodes.findIndex((node, index) => {
                        return (index > this.selectedNode) && (node.type == 'station');
                    });
                    this.nodes.splice(this.selectedNode + 1, nextStation - this.selectedNode - 1);

                    var drivingSearch = new AMap.Driving({
                        policy: AMap.DrivingPolicy.LEAST_TIME
                    });
                    AMap.Event.addListener(drivingSearch, "complete", this.autoSetRouteBehind);
                    drivingSearch.search(
                        new AMap.LngLat(this.nodes[this.selectedNode].lng, this.nodes[this.selectedNode].lat),
                        new AMap.LngLat(this.nodes[this.selectedNode + 1].lng, this.nodes[this.selectedNode + 1].lat)
                    );
                }
            }
            this.loadMapLine(false);
        },
        // changeNode
        // 更改节点类型（站点/途经点）
        changeNode() {
            this.saveOriginal();
            var index = this.selectedNode;
            this.lastSelectedWayPoint = null;
            this.setShowStationsOnly(false);
            if(this.trueDirection == 'up'){
                this.line.route.up[index].type == 'station'?
                this.line.route.up[index].type = 'waypoint':
                this.line.route.up[index].type = 'station';
            }else{
                this.line.route.down[index].type == 'station'?
                this.line.route.down[index].type = 'waypoint':
                this.line.route.down[index].type = 'station';
            }
            this.loadMapLine(false);
        },
        // newNode
        // 新建一个节点
        newNode(lng, lat) {
            this.saveOriginal();
            // “自动规划”继承未完成的路径点
            if(this.selectedMapTool == 'newStationSmart'){
                if(this.lastSelectedWayPoint !== null){
                    this.selectedNode = this.lastSelectedWayPoint;
                    this.lastSelectedWayPoint = null;
                }
            }

            // 设定节点位置
            index = this.selectedNode;
            if(this.selectedMapMode == 'after'){
                index += 1;
            }

            // 新建节点
            var newNode;
            if(this.selectedMapTool == 'watch'){
                return;
            }else if(this.selectedMapTool == 'newWaypoint'){ // 路径点
                newNode = {
                    'type': 'waypoint',
                    'name': '途经点 #' + this.positionId(lng, lat),
                    'lng': lng,
                    'lat': lat
                };
            }else{ // 站点
                var stationSearch = new AMap.PlaceSearch({ // 搜索站名
                    city: '全国',
                    type: '公交车站',
                    pageSize: 1,
                    pageIndex: 1,
                    map: null,
                    panel: null
                });
                stationSearch.searchNearBy('', [lng, lat], 200, this.autoRenameStation);

                // 新增路径点
                newNode = {
                    'type': 'station',
                    'name': '正在生成站名…',
                    'lng': lng,
                    'lat': lat
                };

                // “自动规划”算路
                if(this.selectedMapTool == 'newStationSmart' && this.nodes.length){
                    var drivingSearch = new AMap.Driving({
                        policy: AMap.DrivingPolicy.LEAST_TIME
                    });
                    AMap.Event.addListener(drivingSearch, "complete", this.autoSetRouteAhead);
                    drivingSearch.search(
                        new AMap.LngLat(this.nodes[this.selectedNode].lng, this.nodes[this.selectedNode].lat),
                        new AMap.LngLat(lng, lat)
                    );
                }
            }

            // 添加节点
            this.line.route[this.trueDirection].splice(index, 0, newNode);

            // 设定新的选定点
            if(this.selectedMapMode == 'after'){
                this.selectedNode += 1;
            }
            if(this.selectedNode < 0 || this.selectedNode >= this.nodes.length){
                this.selectedNode = 0;
            }

            //刷新地图
            this.loadMapLine(false);
        },
        // newNode => autoRenameStation
        // 新建节点后自动命名车站
        autoRenameStation(status, result){
            if(status == "complete") {
                this.nodes[this.selectedNode].name = result.poiList.pois[0].name.replace(/\(.*\)$/, '');
            } else {
                this.nodes[this.selectedNode].name = '新站点 #'+ this.positionId(this.nodes[this.selectedNode].lng, this.nodes[this.selectedNode].lat);
            }

            if(this.settings.showStationName){
                this.loadMapLine(false);
            }
        },
        // newNode => autoSetRouteAhead
        // 新建节点后自动规划上一节点至当前站路径并搜索至下一节点路径（仅限自动设站模式）
        autoSetRouteAhead(result){
            if(result.routes[0].steps.length){
                var lastLngLat;
                result.routes[0].steps.forEach(step => {
                    step.path.forEach(lnglat => {
                        if(this.selectedNode && lnglat.getLng() == this.nodes[this.selectedNode - 1].lng && lnglat.getLat() == this.nodes[this.selectedNode - 1].lat){
                            return;
                        }
                        this.nodes.splice(this.selectedNode, 0, {
                            'type': 'waypoint',
                            'name': '途经点 #' + this.positionId(lnglat.getLng(), lnglat.getLat()),
                            'lng': lnglat.getLng(),
                            'lat': lnglat.getLat()
                        });
                        lastLngLat = lnglat;
                        this.selectedNode ++;
                    });
                });
                this.nodes[this.selectedNode].lng = lastLngLat.getLng();
                this.nodes[this.selectedNode].lat = lastLngLat.getLat();

                if(this.selectedNode != this.nodes.length - 1){
                    var nextStation = this.nodes.findIndex((node, index) => {
                        return (index > this.selectedNode) && (node.type == 'station');
                    });
                    this.nodes.splice(this.selectedNode + 1, nextStation - this.selectedNode - 1);

                    var drivingSearch = new AMap.Driving({
                        policy: AMap.DrivingPolicy.LEAST_TIME
                    });
                    AMap.Event.addListener(drivingSearch, "complete", this.autoSetRouteBehind);
                    drivingSearch.search(
                        new AMap.LngLat(this.nodes[this.selectedNode].lng, this.nodes[this.selectedNode].lat),
                        new AMap.LngLat(this.nodes[this.selectedNode + 1].lng, this.nodes[this.selectedNode + 1].lat)
                    );
                }

                this.loadMapLine(false);
            }
        },
        // newNode => autoSetRouteAhead => autoSetRouteBehind
        // 新建节点后自动规划当前站至下一节点路径（仅限自动设站模式）
        // deleteNodes => autoSetRouteBehind
        // 删除节点后自动重新规划（仅限“只显示站点”时）
        autoSetRouteBehind(result){
            var lastLngLat;
            var originStation = this.selectedNode;

            result.routes[0].steps.forEach(step => {
                step.path.forEach(lnglat => {
                    if(this.selectedNode && lnglat.getLng() == this.nodes[this.selectedNode].lng && lnglat.getLat() == this.nodes[this.selectedNode].lat){
                        return;
                    }
                    this.nodes.splice(this.selectedNode + 1, 0, {
                        'type': 'waypoint',
                        'name': '途经点 #' + this.positionId(lnglat.getLng(), lnglat.getLat()),
                        'lng': lnglat.getLng(),
                        'lat': lnglat.getLat()
                    });
                    lastLngLat = lnglat;
                    this.selectedNode ++;
                });
            });

            this.selectedNode = originStation;
            this.loadMapLine(false);
        },
        // selectNode
        // 在节点列表中选中节点
        selectNode(index, setCenter = false) {
            try{
                this.mapItems.infoWindow.close();
            }catch(e){}
            if(this.selectedNode == index){
                this.mapItems.infoWindow = new AMap.InfoWindow({
                    content: this.nodes[this.selectedNode].name + "<br /><small>(" + this.nodes[this.selectedNode].lng + ", "
                        + this.nodes[this.selectedNode].lat + ")</small>",
                    closeWhenClickMap: true
                });
                var position = new AMap.LngLat(this.nodes[this.selectedNode].lng, this.nodes[this.selectedNode].lat);
                this.mapItems.infoWindow.open(this.map, position);
            }else{
                this.selectedNode = index;
                this.lastSelectedWayPoint = null;
            }
            if(this.renameEnabled){
                this.loadMapLine(false);
            }
            if(setCenter){
                this.map.setCenter([this.nodes[index].lng, this.nodes[index].lat]);
            }
        },

        // setDirection
        // 切换上下行
        setDirection(direction) {
            if(this.selectedNode < 0){
                this.selectedNode = 0;
            }
            if(this.line.route.up.length && this.line.route.down.length){
                var selectedNodeName = this.nodes[this.selectedNode].name;
                this.selectedDirection = direction;
                this.selectedNode = this.nodes.findIndex((node) => {
                    return (node.name == selectedNodeName);
                });
                if(this.selectedNode < 0){
                    this.selectedNode = 0;
                }
            }else{
                this.selectedDirection = direction;
                this.selectedNode = 0;
            }
            this.loadMapLine(false);
        },
        // setMapMode
        // 切换添加节点的位置（选中节点之前/之后）
        setMapMode(mode){
            this.selectedMapMode = mode;
            if(mode == 'before' && this.selectedMapTool == 'newStationSmart'){
                this.setMapTool('newStation');
            }
        },
        // setMapTool
        // 切换地图工具（查看/智能设站/新站点/新节点）
        setMapTool(tool){
            try{
                this.mapItems.infowindow.close();
            }catch(e){};

            this.selectedMapTool = tool;

            if(tool == 'watch'){
                this.map.setDefaultCursor('move');
            }else if(tool == 'newStationSmart'){
                this.map.setDefaultCursor('crosshair');
                this.setShowStationsOnly(true);
                this.setMapMode('after');
            }else{ // newStation / newWaypoint
                this.map.setDefaultCursor('crosshair');
                this.setShowStationsOnly(false);
            }
        },
        // setShowStationsOnly
        // 设置是否只显示站点
        setShowStationsOnly(option){
            if(option === null){ // 直接点击按钮切换
                option = !this.showStationsOnly;
            }else if(option == this.showStationsOnly){ // 无须切换
                return;
            }

            if(this.nodes.length && option == true && this.nodes[this.selectedNode].type == 'waypoint'){ // 设置最后选中的路径点
                this.lastSelectedWayPoint = this.selectedNode;
            }else if(option == false && this.lastSelectedWayPoint !== null){ // 还原最后选中的路径点
                this.selectedNode = this.lastSelectedWayPoint;
                this.lastSelectedWayPoint = null;
            }

            this.showStationsOnly = option;

            if(this.nodes.length && option == true && this.nodes[this.selectedNode].type != 'station'){
                var nextStation = this.nodes.findIndex((node, index) => {
                    return (index > this.selectedNode) && (node.type == 'station');
                });
                if(nextStation != -1){ // 自动选择下一个站点
                    this.selectedNode = nextStation;
                }else{ // 没有下一个就选上一个
                    var nextStation = this.selectedNode;
                    this.nodes.forEach((node, index) => {
                        if(index < this.selectedNode && node.type == 'station'){
                            nextStation = index;
                        }
                    });
                    if(nextStation < this.selectedNode){
                        this.selectedNode = nextStation;
                    }else{ // 还不行就算了
                        this.selectedNode = 0;
                    }
                }
            }

            if(option == true && this.selectedMapTool != 'watch' && this.selectedMapTool != 'newStationSmart'){
                this.setMapTool('watch');
            }else if(option == false && this.selectedMapTool != 'newStation' && this.selectedMapTool != 'newWaypoint'){
                this.setMapTool('watch');
            }
        },
        // setSatelliteLayer
        // 设置是否显示卫星图层
        setSatelliteLayer() {
            if(this.satelliteEnabled) {
                this.map.remove(this.mapItems.satelliteLayer);
                this.mapItems.satelliteLayer.destroy();
                this.mapItems.satelliteLayer = null;
            } else {
                this.mapItems.satelliteLayer = new AMap.TileLayer.Satellite();
                this.map.add(this.mapItems.satelliteLayer);
            }
            this.satelliteEnabled = !this.satelliteEnabled;
        },
        // setMapLayer
        // 设置是否显示地图图层
        setMapLayer() {
            if(this.mapEnabled) {
                this.map.setFeatures([]);
            } else {
                this.map.setFeatures(['bg', 'road', 'point']);
            }
            this.mapEnabled = !this.mapEnabled;
        },

        // setRenameMode
        // 开关重命名模式
        setRenameMode(){
            if(!this.renameEnabled){
                this.saveOriginal();
            }
            this.renameEnabled = !this.renameEnabled;
            this.loadMapLine(false);
        },
        // renameKeyPress
        // 重命名模式开启时，按下回车完成重命名（退出重命名模式）
        renameKeyPress(e) {
            e = e?e:event;
            if(e.keyCode == 13) {
                this.setRenameMode();
            }
        },

        // searchCity
        // “所在区域”变动后，搜索所填城市
        searchCity(){
            if(!this.cityName){
                return;
            }
            var districtSearch = new AMap.DistrictSearch({
                level: 'city',
                subdistrict: 0
            })
            districtSearch.search(this.cityName, this.getCity)
        },
        // searchCity => getCity
        // 搜索到所填城市后，切换到该城市，若未搜索到则复原
        getCity(status, result){
            if(status == "complete"){
                this.cityName = result.districtList[0].name;
                this.line.cityName = result.districtList[0].name;
                this.map.setCity(result.districtList[0].adcode);
            }else{
                this.cityName = this.line.cityName;
            }
        },

        // Vue.app.loadLine => loadLine
        // 刷新线路信息（加载线路后调用）
        loadLine() {
            this.setMapTool("watch");
            this.selectedNode = 0;
            this.selectedDirection = "up";
            this.renameEnabled = false;
            this.cityName = this.line.cityName;
            this.$nextTick(() => {
                document.getElementById('lineColor').jscolor.fromString(this.line.lineColor || "#00D3FC");
                this.loadMapLine(true, true);
            });
        },

        // loadMapLine
        // 在地图上重新绘制线路
        loadMapLine(resetCenter = true, resizeMap = false){
            try {
                if(this.mapItems.polyline){
                    this.map.remove(this.mapItems.polyline);
                    this.mapItems.polyline = null;
                }
                if(this.mapItems.markers.length){
                    this.map.remove(this.mapItems.markers);
                    this.mapItems.markers = [];
                }
                if(this.mapItems.texts.length){
                    this.mapItems.labelsLayer.remove(this.mapItems.texts);
                    this.mapItems.texts = [];
                }
                if(this.mapItems.polylineOpposite){
                    this.map.remove(this.mapItems.polylineOpposite);
                    this.mapItems.polylineOpposite = null;
                }
                if(this.mapItems.markersOpposite.length){
                    this.map.remove(this.mapItems.markersOpposite);
                    this.mapItems.markersOpposite = [];
                }
                if(this.mapItems.textsOpposite.length){
                    this.mapItems.labelsLayer.remove(this.mapItems.textsOpposite);
                    this.mapItems.textsOpposite = [];
                }
                if(this.mapItems.infoWindow){
                    this.mapItems.infoWindow.close();
                }
            } catch(e) {}
            if(this.nodes.length){
                var path = [];
                this.nodes.forEach((node) => {
                    path.push(new AMap.LngLat(node.lng, node.lat));
                });
                this.mapItems.polyline = new AMap.Polyline({
                    path: path,
                    zIndex: 15,
                    strokeWeight: this.settings.lineStrokeWidth,
                    strokeColor: this.line.lineColor || (this.line.lineColor = "#00D3FC"),
                    strokeOpacity: 1,
                    showDir: true,
                    lineJoin: 'round',
                    lineCap: 'round'
                });
                this.mapItems.polyline.on('click', this.clickPolyline, this);
                var stationImage = this.getStationImage();
                this.stations.forEach((station) => {
                    var marker = new AMap.Marker({
                        position: new AMap.LngLat(station.lng, station.lat),
                        zIndex: 18,
                        offset: new AMap.Pixel(0, 0),
                        anchor: 'center',
                        icon: stationImage,
                        extData: station.id,
                    });
                    marker.on('click', this.clickNode, this);
                    this.mapItems.markers.push(marker);

                    if(this.settings.showStationName != "0"){
                        var position = this.roadNamePosition(this.trueDirection, station.id);
                        var text = new AMap.LabelMarker({
                            name: station.name,
                            position: new AMap.LngLat(station.lng, station.lat),
                            zIndex: 20,
                            rank: 2,
                            text: {
                                content: station.name,
                                direction: position.direc,
                                offset: position.offset,
                                style: {
                                    fontSize: 12,
                                    fontWeight: 'normal',
                                    fillColor: 'black',
                                    strokeColor: 'white',
                                    strokeWidth: 4
                                }
                            }
                        });
                        this.mapItems.texts.push(text);
                    }
                });
                if(this.mapItems.texts.length){
                    this.mapItems.texts[this.mapItems.texts.length - 1].setRank(4);
                    this.mapItems.texts[0].setRank(5);
                }

                this.map.add(this.mapItems.polyline);
                this.map.add(this.mapItems.markers);
                this.mapItems.labelsLayer.add(this.mapItems.texts);
            }

            var opposite = this.trueDirection == 'up'?'down':'up';
            if(this.isBilateral && this.settings.showOpposite != "0" && this.line.route[opposite].length){
                var pathOpposite = [];
                this.line.route[opposite].forEach(node => {
                    pathOpposite.push(new AMap.LngLat(node.lng, node.lat));
                });
                this.mapItems.polylineOpposite = new AMap.Polyline({
                    path: pathOpposite,
                    zIndex: 10,
                    strokeWeight: this.settings.lineStrokeWidth,
                    strokeColor: this.line.lineColor,
                    strokeOpacity: parseFloat(this.settings.showOpposite),
                    showDir: true,
                    lineJoin: 'round',
                    lineCap: 'round'
                });
                this.mapItems.polylineOpposite.on('click', this.clickPolyline, this);
                var stationImage = this.getStationImage(this.settings.showOpposite != "1");
                this.line.route[opposite].forEach((node, index) => {
                    if(node.type == "station"){
                        var marker = new AMap.Marker({
                            position: new AMap.LngLat(node.lng, node.lat),
                            zIndex: 11,
                            offset: new AMap.Pixel(0, 0),
                            anchor: 'center',
                            icon: stationImage,
                            extData: -1
                        });
                        marker.on('click', this.clickNode, this);
                        this.mapItems.markersOpposite.push(marker);

                        if(this.settings.showStationName != "0"){
                            var position = this.roadNamePosition(opposite, index);
                            var text = new AMap.LabelMarker({
                                name: node.name,
                                position: new AMap.LngLat(node.lng, node.lat),
                                zIndex: 20,
                                rank: 1,
                                opacity: parseFloat(this.settings.showOpposite),
                                text: {
                                    content: node.name,
                                    direction: position.direc,
                                    offset: position.offset,
                                    style: {
                                        fontSize: 12,
                                        fontWeight: 'normal',
                                        fillColor: 'black',
                                        strokeColor: 'white',
                                        strokeWidth: 4
                                    }
                                }
                            });
                            this.mapItems.textsOpposite.push(text);
                        }
                    }
                });
                this.map.add(this.mapItems.polylineOpposite);
                this.map.add(this.mapItems.markersOpposite);
                this.mapItems.labelsLayer.add(this.mapItems.textsOpposite);
            }
            if(resizeMap){
                this.map.resize();
            }
            if(resetCenter){
                this.map.setFitView()
            }
        },

        // appendLineToLineMap
        // 添加当前线路至线网
        appendLineToLineMap(){
            var newLineOnLineMap = {
                lineName: this.line.lineName,
                lineType: this.line.lineType,
                polylineUp: null,
                polylineDown: null,
                showLineUp: false,
                showLineDown: false
            };

            if(this.line.route.up.length){
                var pathUp = [];
                this.line.route.up.forEach(node => {
                    pathUp.push(new AMap.LngLat(node.lng, node.lat));
                });
                newLineOnLineMap.polylineUp = new AMap.Polyline({
                    path: pathUp,
                    zIndex: 15,
                    strokeWeight: this.settings.lineStrokeWidth,
                    strokeColor: this.line.lineColor,
                    strokeOpacity: 1,
                    showDir: true,
                    lineJoin: 'round',
                    lineCap: 'round'
                });
                newLineOnLineMap.polylineUp.on('click', this.clickPolyline, this);
                this.map.add(newLineOnLineMap.polylineUp);
                newLineOnLineMap.showLineUp = true;
            }
            if(this.isBilateral && this.line.route.down.length){
                var pathDown = [];
                this.line.route.down.forEach(node => {
                    pathDown.push(new AMap.LngLat(node.lng, node.lat));
                });
                newLineOnLineMap.polylineDown = new AMap.Polyline({
                    path: pathDown,
                    zIndex: 15,
                    strokeWeight: this.settings.lineStrokeWidth,
                    strokeColor: this.line.lineColor,
                    strokeOpacity: 1,
                    showDir: true,
                    lineJoin: 'round',
                    lineCap: 'round'
                });
                newLineOnLineMap.polylineDown.on('click', this.clickPolyline, this);
                this.map.add(newLineOnLineMap.polylineDown);
                newLineOnLineMap.showLineDown = true;
            }

            this.mapItems.lineMap.push(newLineOnLineMap);
            this.$forceUpdate();
        },

        // removeLineFromLineMap
        // 从线网中移除线路
        removeLineFromLineMap(index){
            if(this.mapItems.lineMap[index].showLineUp){
                this.map.remove(this.mapItems.lineMap[index].polylineUp);
            }
            if(this.mapItems.lineMap[index].showLineDown){
                this.map.remove(this.mapItems.lineMap[index].polylineDown);
            }
            this.mapItems.lineMap.splice(index, 1);
            this.$forceUpdate();
        },

        // setShowLineOfLineMap
        // 设置线路某方向是否显示
        setShowLineOfLineMap(index, direction){
            if(direction == 'up'){
                if(this.mapItems.lineMap[index].showLineUp){
                    this.map.remove(this.mapItems.lineMap[index].polylineUp);
                }else{
                    this.map.add(this.mapItems.lineMap[index].polylineUp);
                }
                this.mapItems.lineMap[index].showLineUp = !this.mapItems.lineMap[index].showLineUp;
            }else{
                if(this.mapItems.lineMap[index].showLineDown){
                    this.map.remove(this.mapItems.lineMap[index].polylineDown);
                }else{
                    this.map.add(this.mapItems.lineMap[index].polylineDown);
                }
                this.mapItems.lineMap[index].showLineDown = !this.mapItems.lineMap[index].showLineDown;
            }
            this.$forceUpdate();
        },

        // checkDirection
        // 切换为单向线路时选择正确的方向
        checkDirection(){
            this.$nextTick(() => {
                if(!this.isBilateral && this.line.route.up.length == 0){
                    [this.line.route.up, this.line.route.down] = [this.line.route.down, this.line.route.up];
                }
                this.loadMapLine(false);
            });
        },

        // showMapSettings
        // 显示地图设置Modal
        showMapSettings(){
            if(this.getFullScreenElement()){
                this.exitFullScreen();
            }
            var m = new bootstrap.Modal(document.getElementById("modalMapSettings"));
            m.show();
        },
        // showLineMap
        // 显示线网Modal
        showLineMap(){
            if(this.getFullScreenElement()){
                this.exitFullScreen();
            }
            var m = new bootstrap.Modal(document.getElementById("modalLineMap"));
            m.show();
        },

        // positionId
        // 根据经纬度返回一个编码过的神秘序号
        // 别问，问就是避免不同节点同名或同节点不同名
        positionId(lng, lat){
            return ('00000000' + Math.abs(CRC32C.str('(' + lng + ',' + lat + ')')).toString(16).toUpperCase()).slice(-8);
        },

        // getStationImage
        // 根据颜色生成站点svg的 Data URL
        getStationImage(opacity = false){
            if(this.settings.stationLightness == "origin"){
                return './assets/station.png';
            }else{
                var prefix = "data:image/svg+xml;base64,";
                var color = this.colorLightness(this.line.lineColor, parseInt(this.settings.stationLightness));
                var side = 2 * this.settings.stationFillRadius + this.settings.stationStrokeWidth;
                var svg = "<svg xmlns='http://www.w3.org/2000/svg' version='2' width='" + side + "' height='" + side + "'>" + 
                    "<circle cx='" + (side / 2) + "' cy='" + (side / 2) +
                    "' r='" + this.settings.stationFillRadius + "' stroke='" + color + "' stroke-width='" + this.settings.stationStrokeWidth + "' " + 
                    (opacity?"stroke-opacity='0.4' ":"") + "fill='white' /></svg>";
                return prefix + window.btoa(svg);
            }
        },
        // colorLightness
        // 调整颜色明度
        colorLightness(col, amt) {
            if(col.slice(0, 1) == "#"){
                col = col.slice(1);
            }
            var num = parseInt(col, 16);
            var r = (num >> 16) + amt;
            if (r > 255) r = 255;
            else if (r < 0) r = 0;
            var g = ((num >> 8) & 0x00FF) + amt;
            if (g > 255) g = 255;
            else if (g < 0) g = 0;
            var b = (num & 0x0000FF) + amt;
            if (b > 255) b = 255;
            else if (b < 0) b = 0;
            return "#" + ('000000' + (b | (g << 8) | (r << 16)).toString(16)).slice(-6);
        },

        // roadNamePosition
        // 计算路名应该出现的位置
        roadNamePosition(direction, index){
            var position = {
                direc: 'center',
                offset: [0, 0]
            };
            var nodes = this.line.route[direction];
            var nodeAhead = (index <= 1)?0:(index - 2);
            while(nodeAhead > 0 && nodes[index].lng == nodes[nodeAhead].lng & nodes[index].lat == nodes[nodeAhead].lat){
                nodeAhead --;
            }
            var dLng = nodes[index].lng - nodes[nodeAhead].lng;
            var dLat = nodes[index].lat - nodes[nodeAhead].lat;
            var angle = Math.atan2(dLat, dLng); // / Math.PI * 180;
            var p = Math.PI / 8;

            if(angle < p && angle > -p){ // 朝东，标下
                position.direc = 'bottom';
                position.offset = [0, 2];
            }else if(angle < -p && angle > -3*p){ // 朝东南，标左下
                position.direc = 'left';
                position.offset = [-2, 10];
            }else if(angle < -3*p && angle > -5*p){ // 朝南，标左
                position.direc = 'left';
                position.offset = [-2, -2];
            }else if(angle < -5*p && angle > -7*p){ // 朝西南，标左上
                position.direc = 'left';
                position.offset = [-2, -12];
            }else if(angle > p && angle < 3*p){ // 朝东北，标右下
                position.direc = 'right';
                position.offset = [2, 10];
            }else if(angle > 3*p && angle < 5*p){ // 朝北，标右
                position.direc = 'right';
                position.offset = [4, -2];
            }else if(angle > 5*p && angle < 7*p){ // 朝西北，标右上
                position.direc = 'right';
                position.offset = [2, -12];
            }else{ // 朝西，标上
                position.direc = 'top';
                position.offset = [0, -4];
            }

            return position;
        },

        // setCookies
        // 保存设置到 cookie
        setCookies(){
            $cookies.set("stationSettings", this.settings);
        },
        // resetSettings
        // 复原设置
        resetSettings(){
            this.settings = {
                mainDirection: 0,
                showStationName: "1",
                showOpposite: "0.4",
                mapStyle: "amap://styles/normal",
                stationLightness: -64,
                lineStrokeWidth: 6,
                stationStrokeWidth: 2,
                stationFillRadius: 5
            };
            
            this.mapItems.labelsLayer.setCollision(parseInt(this.settings.showStationName));
            this.map.setMapStyle(this.settings.mapStyle);
            this.setCookies();
            this.loadMapLine(false);
        },

        // saveOriginal
        // 保存当前线路文件供撤销
        saveOriginal(){
            this.originSelectedNode = this.selectedNode;
            this.$emit('modified');
        },
        // undo
        // 撤销后重新加载线路文件和选中站点
        undo(){
            this.selectedNode = this.originSelectedNode;
            this.$nextTick(() => {
                this.loadMapLine(false);
            });
        },

        // hotKey
        // 地图快捷键
        hotKey(event){
            var e = event || window.event || arguments.callee.caller.arguments[0];
            if(!e){ return; }
            console.log(e);
            if(e.ctrlKey || e.metaKey){
                switch(e.key){ // 按下 Ctrl 或 Command 时
                    case 'z':
                    case 'Z':
                        this.$emit('undo');
                        break;
                    case '/':
                        this.changeNode();
                        break;
                }
            }else{
                switch(e.key){ // 其他情况
                    case 'Delete':
                    case 'Backspace':
                        if(this.showStationsOnly){
                            this.deleteNodes();
                        }else{
                            this.deleteNode();
                        }
                        break;
                    case '1':
                        this.setMapTool("watch");
                        break;
                    case '2':
                        this.setMapTool("newStationSmart");
                        break;
                    case '3':
                        this.setMapTool("newStation");
                        break;
                    case '4':
                        this.setMapTool("newWaypoint");
                        break;
                }
            }
        }
    },
    computed: {
        title() {
            return this.line.lineName.length?this.line.lineName:'未命名线路';
        },
        subtitle() {
            var startStationName, endStationName;
            var routeUp = this.line.route.up;
            var routeDown = this.line.route.down;
        
            // 获取上行起讫站
            if(routeUp.length){
                var startStation = routeUp.find((node) => {
                    return node.type == "station"
                });
                if(startStation){
                    startStationName = startStation.name;
                }
                if(this.isRingLine) {
                    endStationName = startStationName;
                } else {
                    routeUp.forEach(node => {
                        if(node.type == "station"){
                            endStationName = node.name;
                        }
                    });
                }
            }
        
            // 获取下行起讫站，如果和上行不同就在上行的起讫站后面加括号
            if(this.isBilateral && routeDown.length){
                var startStationNameDown, endStationNameDown;
                var startStationDown = routeDown.find((node) => {
                    return node.type == "station"
                });
                if(startStationDown){
                    startStationNameDown = startStationDown.name;
                }
                if(this.isRingLine) {
                    endStationNameDown = startStationNameDown;
                } else {
                    routeDown.forEach(node => {
                        if(node.type == "station"){
                            endStationNameDown = node.name;
                        }
                    });
                }

                if(endStationName && startStationNameDown != endStationName){
                    endStationName = endStationName + ' / ' + startStationNameDown;
                }
                if(startStationName && endStationNameDown != startStationName){
                    startStationName = startStationName + ' / ' + endStationNameDown;
                }
                if(!startStationName){
                    startStationName = endStationNameDown;
                }
                if(!endStationName){
                    endStationName = startStationNameDown;
                }
            }
        
            // 返回结果
            if(startStationName && endStationName){
                return ('\u2002' + startStationName + (this.isBilateral?" ⇌ ":" ⇀ ") + endStationName);
            }
        },
        isBilateral() {
            return (this.line.lineType % 2) == 1;
        },
        isRingLine() {
            return this.line.lineType >= 3;
        },
        trueDirection() {
            return this.isBilateral?this.selectedDirection:'up';
        },
        nodes() {
            return this.line['route'][this.trueDirection];
        },
        stations() {
            var stations = [];
            this.nodes.forEach((node, index) => {
                if(node.type == "station"){
                    node.id = index;
                    stations.push(node);
                }
            });
            return stations;
        },
        infoUp() {
            var length = 0, stationCount = 0;
            var route = [];
            if(this.line['route']['up'].length){
                this.line['route']['up'].forEach(node => {
                    route.push([node.lng, node.lat]);
                    if(node.type == 'station'){
                        stationCount ++;
                    }
                });
                length = AMap.GeometryUtil.distanceOfLine(route);
            }
            return stationCount + "站 / " + (length / 1000).toFixed(1) + "km";
        },
        infoDown() {
            var length = 0, stationCount = 0;
            var route = [];
            if(this.line['route']['down'].length){
                this.line['route']['down'].forEach(node => {
                    route.push([node.lng, node.lat]);
                    if(node.type == 'station'){
                        stationCount ++;
                    }
                });
                length = AMap.GeometryUtil.distanceOfLine(route);
            }
            return stationCount + "站 / " + (length / 1000).toFixed(1) + "km";
        },
    }
})