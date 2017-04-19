module.exports = Request;


function Request(url) {
  this.url = url;
  this.headers = Object.create(null);
}
