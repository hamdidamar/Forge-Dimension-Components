import EventsEmitter from './eventsEmitter';

export default class UIComponent extends EventsEmitter {

  ///////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////
  constructor () {

    super()
  }

  ///////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////
  showPayload (uri, target = '_blank') {

    var link = document.createElement('a')
    link.target = target
    link.href = uri
    link.click()
  }

  ///////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////
  guid (format = 'xxxxxxxxxx') {

    var d = new Date().getTime()

    var guid = format.replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0
        d = Math.floor(d / 16)
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16)
      })

    return guid
  }

  ///////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////
  static guid (format = 'xxxxxxxxxx') {

    var d = new Date().getTime()

    var guid = format.replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0
        d = Math.floor(d / 16)
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16)
      })

    return guid
  }
}