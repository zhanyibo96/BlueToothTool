// pages/firstPage.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  water:function(){
    wx.navigateTo({
      url: '../firstPage-article/water/water'
    })
  },
  nature: function () {
    wx.navigateTo({
      url: '../firstPage-article/nature/nature'
    })
  },
  desert: function () {
    wx.navigateTo({
      url: '../firstPage-article/desert/desert'
    })
  },
  sandstorm: function () {
    wx.navigateTo({
      url: '../firstPage-article/sand storm/sand storm'
    })
  },
  smog: function () {
    wx.navigateTo({
      url: '../firstPage-article/smog/smog'
    })
  },
  whitetrash: function () {
    wx.navigateTo({
      url: '../firstPage-article/white trash/white trash'
    })
  },
  nuclearpollution: function () {
    wx.navigateTo({
      url: '../firstPage-article/nuclear pollution/nuclear pollution'
    })
  },
  climatewarming: function () {
    wx.navigateTo({
      url: '../firstPage-article/climate warming/climate warming'
    })
  },
  ozonehole: function () {
    wx.navigateTo({
      url: '../firstPage-article/ozone hole/ozone hole'
    })
  },
})