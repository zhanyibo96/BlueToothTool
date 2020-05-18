// pages/firstPage-article/desert/desert.js
var app = getApp();
var pieChart = null;
Page({
  data: {
  },
  touchHandler: function (e) {
    console.log(pieChart.getCurrentDataIndex(e));
  },
  onLoad: function (e) {
    var windowWidth = 300;
    try {
      var res = wx.getSystemInfoSync();
      windowWidth = res.windowWidth;
    } catch (e) {
      console.error('getSystemInfoSync failed!');
    }

    pieChart = new wxCharts({
      animation: true,
      canvasId: 'pieCanvas',
      type: 'pie',
      series: [{
        name: '海洋',
        data: 71,
      }, {
        name: '陆地-沙漠面积',
        data: 5.8,
      }, {
        name: '陆地-非沙漠面积',
        data: 23.2,
      }],
      width: windowWidth,
      height: 300,
      dataLabel: true,
    });
  }
});