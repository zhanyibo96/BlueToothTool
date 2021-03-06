// pages/funtionPage/funtionPage.js
// var app = getApp();
var utils = require("../../utils/util.js");

const ctx = wx.createCanvasContext("bgCanvas")
import * as echarts from '../../ec-canvas/echarts';

//获取应用实例
const app = getApp();
let ChartPer = null;
let ChartPer2 = null;
let time24;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    textLog:"",
    deviceId: "",
    name: "",
    allRes:"",
    serviceId:"",
    readCharacteristicId:"",
    writeCharacteristicId: "",
    notifyCharacteristicId: "",
    connected: true,
    canWrite: false,
    rfidId:"空",
    rfidSignalQ: "0",
    rfidSignalI: "0",
    time: 60,         //初始时间
    interval: "",      //定时器

    //echarts图变量
    option: {},
    br: {
      lazyLoad: true
    },
    hb: {
      lazyLoad: true
    },
    brData: [],
    hbData: [],


    //GPS部分
    //设置标记点
    markers: [
      {
        iconPath: "/images/ljx.png",
        id: 4,
        latitude: 31.938841,
        longitude: 118.799698,
        width: 30,
        height: 30
      }
    ],
    //当前定位位置
    latitude: '',
    longitude: '',
  },
  /**
     * 生命周期函数--监听页面初次渲染完成
     */
  onReady: function () {
    this.echartsHb = this.selectComponent("#mychart-line");
    this.echartsBr = this.selectComponent("#mychart2-line");
    this.init_hb_echarts();
    this.init_br_echarts();
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var devid = decodeURIComponent(options.deviceId);
    var devname = decodeURIComponent(options.name);
    var devserviceid = decodeURIComponent(options.serviceId);
    var log = that.data.textLog + "设备名=" + devname +"\n设备UUID="+devid+"\n服务UUID="+devserviceid+ "\n";

    this.mqtt();
    let brData = [];
    let hbData = [];
    for (let i = 0; i < 60; i++) {
      hbData.push(null);
      brData.push(null);
    }
  
    //options页面跳转的参数,上个页面的参数可以通过options取得
    this.setData({
      textLog: log,
      deviceId: devid,
      name: devname,
      serviceId: devserviceid,
      hbData,
      brData 
    });
    //获取特征值
    that.getBLEDeviceCharacteristics();
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        console.log(res)
        this.setData({
          latitude: res.latitude,//经度
          longitude: res.longitude//纬度
        })
      }
    })
  
  },

  //销毁时清空Chart
  onUnload: function () {
    ChartPer = null;
    ChartPer2 = null;
    ChartPer3 = null;
    that.clearTimeInterval(that);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (wx.setKeepScreenOn) {
      wx.setKeepScreenOn({
        keepScreenOn: true,
        success: function (res) {
          //console.log('保持屏幕常亮')
        }
      })
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    var that = this;
    that.clearTimeInterval(that)
  },

  //返回蓝牙是否正处于链接状态
  onBLEConnectionStateChange:function (onFailCallback) {
    wx.onBLEConnectionStateChange(function (res) {
      // 该方法回调中可以用于处理连接意外断开等异常情况
      console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`);
      return res.connected;
    });
  },
  
  //断开与低功耗蓝牙设备的连接
  closeBLEConnection: function () {
    var that = this;
    wx.closeBLEConnection({
      deviceId: that.data.deviceId
    })
    that.setData({
      connected: false,

    });
    wx.showToast({
      title: '连接已断开',
      icon: 'success'
    });
    setTimeout(function () {
      wx.navigateBack();
    }, 2000)
  },

  //获取蓝牙设备某个服务中的所有 characteristic（特征值）
  getBLEDeviceCharacteristics: function (order){
    var that = this;
    wx.getBLEDeviceCharacteristics({
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      success: function (res) {
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          if (item.properties.read) {//该特征值是否支持 read 操作
            var log = that.data.textLog + "该特征值支持 read 操作:" + item.uuid + "\n";
            that.setData({
              textLog: log,
              readCharacteristicId: item.uuid
            });
          }
          if (item.properties.write) {//该特征值是否支持 write 操作
            var log = that.data.textLog + "该特征值支持 write 操作:" + item.uuid + "\n";
            that.setData({
              textLog: log,
              writeCharacteristicId: item.uuid,
              canWrite:true
            });
            
          }
          if (item.properties.notify || item.properties.indicate) {//该特征值是否支持 notify或indicate 操作
            var log = that.data.textLog + "该特征值支持 notify 操作:" + item.uuid + "\n";
            that.setData({
              textLog: log,
              notifyCharacteristicId: item.uuid,
            });
            that.notifyBLECharacteristicValueChange();
          }

        }

      }
    })
    // that.onBLECharacteristicValueChange();   //监听特征值变化
  },

  //启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值。
  //注意：必须设备的特征值支持notify或者indicate才可以成功调用，具体参照 characteristic 的 properties 属性
  notifyBLECharacteristicValueChange: function (){
    var that = this;
    wx.notifyBLECharacteristicValueChange({
      state: true, // 启用 notify 功能
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      characteristicId: that.data.notifyCharacteristicId,
      success: function (res) {
        var log = that.data.textLog + "notify启动成功" + res.errMsg+"\n";
        that.setData({ 
          textLog: log,
        });
        that.onBLECharacteristicValueChange();   //监听特征值变化
      },
      fail: function (res) {
        wx.showToast({
          title: 'notify启动失败',
          mask: true
        });
        setTimeout(function () {
          wx.hideToast();
        }, 2000)
      }

    })

  },

  //监听低功耗蓝牙设备的RFID标签ID特征值变化。必须先启用notify接口才能接收到设备推送的notification。
  onBLECharacteristicValueChange:function(){
    var that = this;
    wx.onBLECharacteristicValueChange(function (res) {
      var resValue = utils.ab2hext(res.value); //16进制字符串
      // var resValueStr = utils.hexToString(resValue);
      var log0 = resValue.slice(20);
      var logQ = parseInt(resValue.slice(6,7), 16)*2;
      var logI = parseInt(resValue.slice(7,8), 16)*2;

      that.setData({
        rfidId: log0,
        rfidSignalQ: logQ,
        rfidSignalI: logI
      });
    });
  },

  //orderInput
  orderInput:function(e){
    this.setData({
      orderInputStr: e.detail.value
    })
  },

  //发送指令
  sentOrder:function(){
    var that = this; 
    var orderStr = "430301";//310301指令
    let order = utils.stringToBytes(orderStr);
    console.log(order);
    that.writeBLECharacteristicValue(order);
  },

  //向低功耗蓝牙设备特征值中写入二进制数据。
  //注意：必须设备的特征值支持write才可以成功调用，具体参照 characteristic 的 properties 属性
  writeBLECharacteristicValue: function (order){
    var that = this;
    let byteLength = order.byteLength;
    // var log = that.data.textLog + "当前执行指令的字节长度:" + byteLength + "\n";
    // that.setData({
    //   textLog: log,
    // });

    wx.writeBLECharacteristicValue({
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      characteristicId: that.data.writeCharacteristicId,
      // 这里的value是ArrayBuffer类型
      value: order.slice(0, 20),
      success: function (res) {
        if (byteLength > 20) {
          setTimeout(function(){
            // that.writeBLECharacteristicValue(order.slice(20, byteLength));
          },150);
        }
        var log = that.data.textLog + "发送成功：" + res.errMsg + "\n";
        that.setData({
          textLog: log,
        });
      },

      fail: function (res) {
        var log = that.data.textLog + "发送失败" + res.errMsg+"\n";
        that.setData({
          textLog: log,
        });
      }
      
    })
  },

//获取RFID的信号
  SendSignl: function () {
    var that = this;
    var orderStr = "430301";//获取RFID信号指令
    let order = utils.stringToBytes(orderStr);
    that.writeBLECharacteristicValue(order);
  },

  //连续获取RFID的信号
  continuousSentOrder:function(){
    var that = this;
    that.stop(that); 
    var time = that.data.time;
    var orderStr = "430301";//获取RFID信号指令
    wx.showToast({
      title: '开始连续获取信号',
      icon: 'loading'
    });
    that.data.interval = setInterval(function () {
      time--;
      console.log("第" + time + "次获取");
      let order = utils.stringToBytes(orderStr);
      that.writeBLECharacteristicValue(order);
      if (time == 0) {           //归0时回到60
        that.restartTap();
      }
    }, 500)
    
  },
  stop: function (that) {
    var time = 60;
    var interval = ""
    that.clearTimeInterval(that)
    that.setData({
      time: time,
      interval: interval,
    })
  },
  clearTimeInterval: function (that) {
    var interval = that.data.interval;
    clearInterval(interval)
  },
  //停止获取RFID的信号
  stopSentOrder:function(){
    var that = this;
    
    var interval = that.data.interval;
    that.clearTimeInterval(that)
    // clearInterval(that.data.interval);
    wx.showToast({
      title: '停止获取信号',
      icon: 'success'
    });
    console.log("循环暂停")
    this.setData({
      rfidId: "无",
      rfidSignalQ: "0",
      rfidSignalI: "0",
    });
  },
  restartTap: function () {
    var that = this;
    that.stop(that);
    console.log("倒计时重新开始")
    that.continuousSentOrder()
  },
  //echarts图设置
  init_hb_echarts: function () {
    this.echartsHb.init((canvas, width, height) => {
      //初始化图标
      ChartPer = echarts.init(canvas, null, {
        width: width,
        height: height
      });
      this.setHb();
      //返回值为chart实列否则会有影响
      return ChartPer;
    })
  },

  init_br_echarts: function () {
    this.echartsBr.init((canvas, width, height) => {
      //初始化图标
      ChartPer2 = echarts.init(canvas, null, {
        width: width,
        height: height
      });
      //返回值为chart实列否则会有影响
      this.setBr();
      return ChartPer2;
    })
  },

  initOption: function (set) {
    let {
      yMax,
      yMin,
      ySplitNumber,
      markAreaMin,
      markAreaMax
    } = set
    let option = {

      tooltip: {
        show: false
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '10%',
        bottom: '10%',
        height: 'auto',
        z: 2,
        containLavel: true,
      },
      xAxis: [{
        type: 'category',
        boundaryGap: false,
        inverse: true, //反向x轴

        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        data: this.data.xData
      }],
      yAxis: [{
        type: 'value',
        max: yMax,
        min: yMin,
        splitNumber: ySplitNumber,
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#cecff1',
          fontSize: 12,
        },

        splitLine: {
          show: true,
          lineStyle: {
            color: '#333756',
            width: '1'
          }
        },
      }],
      series: [{
        name: '数值',
        type: 'line',
        color: '#FFFFFF',
        lineStyle: {
          width: 1
        },
        showSymbol: true,
        hoverAnimation: false, //圆点
        markArea: {
          silent: true,
          data: [
            [{
              yAxis: markAreaMin
            }, {
              yAxis: markAreaMax
            }]
          ]
        },
        // data: this.data.hbData
      }]
    };
    return option
  },

  setHb: function () {
    let option = this.initOption({
      yMax: 40,//Y轴最大值
      yMin: 0,
      ySplitNumber: 4,
      markAreaMin: 10,
      markAreaMax: 20
    });
    ChartPer.setOption(option);
    return ChartPer;
  },

  setBr: function () {
    let option = this.initOption({
      yMax: 40,//Y轴最大值
      yMin: 0,
      ySplitNumber: 4,
      markAreaMin: 10,
      markAreaMax: 20
    });
    ChartPer2.setOption(option);
    return ChartPer2;
  },

  mqtt: function () {
    let that = this;

    that.bhUpdata()


  },
  //实时更新
  bhUpdata: function (newData) {

    let set = setInterval(() => {
      let {
        brData,
        hbData,
        rfidSignalQ,
        rfidSignalI,
      } = this.data;
      hbData.push(rfidSignalQ);
      brData.push(rfidSignalI);
      if (brData.length >= 60) {
        hbData.shift();
        brData.shift();
      }
      ChartPer.setOption({
        series: [{
          data: hbData
        }]
      });
      ChartPer2.setOption({
        series: [{
          data: brData, 
        }]
      });

      this.setData({
        hbData,
        brData,
      })
    }, 500)
  }
})