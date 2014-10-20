// Generated by CoffeeScript 1.8.0
var ControllerClient, HttpClient, MemoryManager, fs;

fs = require('fs');

HttpClient = require("request-json").JsonClient;

ControllerClient = require("cozy-clients").ControllerClient;

MemoryManager = require("./memory").MemoryManager;

exports.AppManager = (function() {
  var status2XX;

  status2XX = function(res) {
    if (!res) {
      return false;
    }
    return res.statusCode / 100 === 2;
  };

  function AppManager() {
    this.proxyClient = new HttpClient("http://localhost:9104/");
    this.client = new ControllerClient({
      token: this.getAuthController()
    });
    this.memoryManager = new MemoryManager();
  }

  AppManager.prototype.getAuthController = function() {
    var err, token;
    if (process.env.NODE_ENV === 'production') {
      try {
        token = process.env.TOKEN;
        return token;
      } catch (_error) {
        err = _error;
        console.log(err.message);
        console.log(err.stack);
        return null;
      }
    } else {
      return "";
    }
  };

  AppManager.prototype.checkMemory = function(callback) {
    return this.memoryManager.isEnoughMemory((function(_this) {
      return function(err, enoughMemory) {
        if (!enoughMemory) {
          if (err == null) {
            err = 'Not enough Memory';
          }
        }
        return callback.call(_this, err);
      };
    })(this));
  };

  AppManager.prototype.resetProxy = function(callback) {
    console.info("Request for proxy reseting...");
    return this.proxyClient.get("routes/reset", function(err, res, body) {
      if (!status2XX(res)) {
        if (err == null) {
          err = new Error("Something went wrong on proxy side when reseting routes");
        }
      }
      if (err) {
        console.log("Error reseting routes");
        console.log(err.message);
        console.log(err.stack);
        return callback(err);
      } else {
        console.info("Proxy successfully reseted.");
        return callback(null);
      }
    });
  };

  AppManager.prototype.installApp = function(app, callback) {
    var manifest;
    manifest = app.getHaibuDescriptor();
    console.info("Request controller for spawning " + app.name + "...");
    console.info("with manifest : ");
    console.info(JSON.stringify(manifest));
    return this.checkMemory((function(_this) {
      return function(err) {
        if (err) {
          return callback(err);
        }
        return _this.client.start(manifest, function(err, res, body) {
          if (!status2XX(res)) {
            if (err == null) {
              err = body.error;
            }
          }
          if (err) {
            console.log("Error spawning app: " + app.name);
            return callback(err);
          } else {
            console.info("Successfully spawned app: " + app.name);
            return callback(null, body);
          }
        });
      };
    })(this));
  };

  AppManager.prototype.updateApp = function(app, callback) {
    var manifest;
    manifest = app.getHaibuDescriptor();
    console.info("Request controller for updating " + app.name + "...");
    return this.checkMemory((function(_this) {
      return function(err) {
        if (err) {
          return callback(err);
        }
        return _this.client.lightUpdate(manifest, function(err, res, body) {
          if (!status2XX(res)) {
            if (err == null) {
              err = new Error(body.error.message);
            }
          }
          if (err) {
            console.log("Error updating app: " + app.name);
            console.log(err.stack);
            return callback(err);
          } else {
            console.info("Successfully updated app: " + app.name);
            return callback(null, body);
          }
        });
      };
    })(this));
  };

  AppManager.prototype.uninstallApp = function(app, callback) {
    var manifest;
    if (app != null) {
      manifest = app.getHaibuDescriptor();
      console.info("Request controller for cleaning " + app.name + "...");
      return this.client.clean(manifest, (function(_this) {
        return function(err, res, body) {
          if (!status2XX(res)) {
            if (err == null) {
              err = body.error;
            }
          }
          if (err && err.indexOf('application not installed') === -1) {
            err = new Error(err);
            console.log("Error cleaning app: " + app.name);
            console.log(err.message);
            console.log(err.stack);
            return callback(err);
          } else {
            if (err) {
              console.log("[Warning] " + err);
            }
            console.info("Successfully cleaning app: " + app.name);
            return callback(null);
          }
        };
      })(this));
    } else {
      return callback(null);
    }
  };

  AppManager.prototype.start = function(app, callback) {
    var manifest;
    manifest = app.getHaibuDescriptor();
    console.info("Request controller for starting " + app.name + "...");
    return this.client.stop(app.slug, (function(_this) {
      return function(err, res, body) {
        return _this.checkMemory(function(err) {
          if (err) {
            return callback(err);
          }
          return this.client.start(manifest, (function(_this) {
            return function(err, res, body) {
              if (!status2XX(res)) {
                if (err == null) {
                  err = new Error(body.error.message);
                }
              }
              if (err) {
                console.log("Error starting app: " + app.name);
                console.log(err.message);
                console.log(err.stack);
                return callback(err);
              } else {
                console.info("Successfully starting app: " + app.name);
                return callback(null, res.body);
              }
            };
          })(this));
        });
      };
    })(this));
  };

  AppManager.prototype.stop = function(app, callback) {
    var manifest;
    manifest = app.getHaibuDescriptor();
    console.info("Request controller for stopping " + app.name + "...");
    return this.client.stop(app.slug, (function(_this) {
      return function(err, res, body) {
        if (!status2XX(res)) {
          if (err == null) {
            err = body.error;
          }
        }
        if (err && err.indexOf('application not started') === -1) {
          err = new Error(err);
          console.log("Error stopping app: " + app.name);
          console.log(err.message);
          console.log(err.stack);
          return callback(err);
        } else {
          if (err) {
            console.log("[Warning] " + err);
          }
          console.info("Successfully stopping app: " + app.name);
          return callback(null);
        }
      };
    })(this));
  };

  return AppManager;

})();
