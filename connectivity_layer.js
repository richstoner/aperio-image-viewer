// Generated by CoffeeScript 1.3.3
(function() {
  var AperioLayer,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  AperioLayer = (function(_super) {

    __extends(AperioLayer, _super);

    'Implement AperioLayer layer for Cloudmade\'s Leaflet library';


    function AperioLayer(url, imageProperties, options) {
      var i, t;
      if (options == null) {
        options = {};
      }
      this.options = options;

      console.log(this.options);

      this.baseUrl = url;
      if (!((imageProperties.width != null) && (imageProperties.height != null))) {
        throw 'width and height must be defined';
      }
      this.imageProperties = {
        width: imageProperties.width,
        height: imageProperties.height,
        tilesize: imageProperties.tilesize || 256
      };
      t = this.numOfTiers();
      this._tiers = (function() {
        var _i, _results;
        _results = [];
        for (i = _i = 1; 1 <= t ? _i <= t : _i >= t; i = 1 <= t ? ++_i : --_i) {
          _results.push(Math.ceil(this.imageProperties.width / this.imageProperties.tilesize / Math.pow(2, t - i)) * Math.ceil(this.imageProperties.height / this.imageProperties.tilesize / Math.pow(2, t - i)));
        }
        return _results;
      }).call(this);
      this.options.minZoom = 0;
      this.options.maxZoom = t - 1;
    }

    AperioLayer.prototype._getTierForResolution = function(resolution) {
      var lambda;
      lambda = function(x, r) {
        if (r < resolution) {
          return lambda(x + 1, r * 2);
        }
        return x;
      };
      return this.numOfTiers() - lambda(0, 1) - 1;
    };

    AperioLayer.prototype._getSizeForTier = function(tier) {
      var r;
      r = Math.pow(2, this.numOfTiers() - tier - 1);
      return [Math.ceil(this.imageProperties.width / r), Math.ceil(this.imageProperties.height / r)];
    };

    AperioLayer.prototype.onAdd = function(map) {
      var layerSize, offset, r, size, tier;
      AperioLayer.__super__.onAdd.call(this, map);
      size = map.getSize();
      r = Math.max(Math.ceil(this.imageProperties.width / size.x), Math.ceil(this.imageProperties.height / size.y));
      tier = this._getTierForResolution(r);
      layerSize = this._getSizeForTier(tier);
      offset = [(size.x - layerSize[0]) / 2, (size.y - layerSize[1]) / 2];
      window.ll = map.options.crs.pointToLatLng(new L.Point(size.x / 2 - offset[0], size.y / 2 - offset[1]), tier);
      return map.setView(ll, tier);
    };

    AperioLayer.prototype._createTile = function() {
      var tile;
      tile = document.createElement('img');
      tile.setAttribute('class', 'leaflet-tile');
      tile.onselectstart = tile.onmousemove = L.Util.falseFn;
      return tile;
    };

    AperioLayer.prototype._addTilesFromCenterOut = function(bounds) {
      var center, fragment, i, j, point, queue, tilesToLoad, _i, _j, _k, _ref, _ref1, _ref2, _ref3;
      queue = [];
      center = bounds.getCenter();
      for (j = _i = _ref = bounds.min.y, _ref1 = bounds.max.y; _ref <= _ref1 ? _i <= _ref1 : _i >= _ref1; j = _ref <= _ref1 ? ++_i : --_i) {
        for (i = _j = _ref2 = bounds.min.x, _ref3 = bounds.max.x; _ref2 <= _ref3 ? _j <= _ref3 : _j >= _ref3; i = _ref2 <= _ref3 ? ++_j : --_j) {
          point = new L.Point(i, j);
          if (this._tileShouldBeLoaded(point)) {
            queue.push(point);
          }
        }
      }
      tilesToLoad = queue.length;
      if (tilesToLoad === 0) {
        return;
      }
      queue.sort(function(a, b) {
        return a.distanceTo(center) - b.distanceTo(center);
      });
      fragment = document.createDocumentFragment();
      if (!this._tilesToLoad) {
        this.fire('loading');
      }
      this._tilesToLoad += tilesToLoad;
      for (i = _k = 0; 0 <= tilesToLoad ? _k < tilesToLoad : _k > tilesToLoad; i = 0 <= tilesToLoad ? ++_k : --_k) {
        this._addTile(queue[i], fragment);
      }
      return this._container.appendChild(fragment);
    };

    AperioLayer.prototype._reset = function() {
      return AperioLayer.__super__._reset.call(this);
    };

    AperioLayer.prototype._tileShouldBeLoaded = function(point) {
      var limitX, limitY, tier;
      if (point.x >= 0 && point.y >= 0) {
        tier = this._getZoomForUrl();
        limitX = Math.pow(2, this.numOfTiers() - tier - 1) * this.imageProperties.tilesize * point.x;
        limitY = Math.pow(2, this.numOfTiers() - tier - 1) * this.imageProperties.tilesize * point.y;
        return limitX <= this.imageProperties.width && limitY <= this.imageProperties.height;
      }
      return false;
    };

    AperioLayer.prototype._getTilePos = function(tilePoint) {
      var origin;
      origin = this._map.getPixelOrigin();
      return tilePoint.multiplyBy(this.imageProperties.tilesize).subtract(origin);
    };

    AperioLayer.prototype._update = function(e) {
      var bounds, nwTilePoint, seTilePoint, tileBounds, tileSize, zoom;
      if (!(this._map != null)) {
        return;
      }
      bounds = this._map.getPixelBounds();
      zoom = this._map.getZoom();
      tileSize = this.imageProperties.tilesize;
      if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
        return;
      }
      nwTilePoint = new L.Point(Math.floor(bounds.min.x / tileSize), Math.floor(bounds.min.y / tileSize));
      seTilePoint = new L.Point(Math.floor(bounds.max.x / tileSize), Math.floor(bounds.max.y / tileSize));
      tileBounds = new L.Bounds(nwTilePoint, seTilePoint);
      this._addTilesFromCenterOut(tileBounds);
      if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
        return this._removeOtherTiles(tileBounds);
      }
    };

    AperioLayer.prototype.numOfTiers = function() {
      var a, i;
      if (!(this._numOfTiers != null)) {
        i = 0;
        a = Math.ceil(Math.max(this.imageProperties.width, this.imageProperties.height) / this.imageProperties.tilesize);
        while (a > 1) {
          i += 1;
          a = Math.ceil(a / 2);
        }
        this._numOfTiers = i + 1;
      }
      return this._numOfTiers;
    };

    AperioLayer.prototype._tileGroupNumber = function(x, y, tier) {
      var height, i, idx, numOfTiers, tileSize, width, _i;
      numOfTiers = this.numOfTiers();
      width = this.imageProperties.width;
      height = this.imageProperties.height;
      tileSize = this.imageProperties.tilesize;
      idx = 0;
      for (i = _i = 0; 0 <= tier ? _i < tier : _i > tier; i = 0 <= tier ? ++_i : --_i) {
        idx += this._tiers[i];
      }
      idx += y * Math.ceil(this.imageProperties.width / this.imageProperties.tilesize / Math.pow(2, numOfTiers - tier - 1));
      idx += x;
      return Math.floor(idx / 256);
    };

    AperioLayer.prototype._getZoomForUrl = function() {
      var zoom;
      if (this.imageProperties != null) {
        zoom = this._map.getZoom();
        return zoom;
      }
      return 0;
    };

    AperioLayer.prototype.getTileUrl = function(tilePoint, zoom) {
      var tileGroup, x, y, z;
      x = tilePoint.x;
      y = tilePoint.y;
      z = this._getZoomForUrl();
      tileGroup = this._tileGroupNumber(x, y, z);


      var scale = Math.pow(2, this.numOfTiers() - z - 1);

      var x_pos = x * 256
      var y_pos = y * 256

      var tileurl = this.baseUrl + "?" + x_pos + "+" + y_pos + "+" + 256 + "+" + 256 + "+" + scale  + "+" + "80+s";



//      http://images.aperio.com/Derm1.svs?1536+1024+512+512+16.000+80


      // console.log(z, x,y, x_pos, y_pos, scale, x1, x2)

  //    console.log(tileurl);



      // console.log(x_pos, y_pos);

        //       int beta = maxLevelOfDetail + 1 - logf(scale)/logf(0.5);
        // float ts_beta = powf(2.0, maxLevelOfDetail - beta + 1);

      // console.log(scale, this.numOfTiers())


      // var tiersize = this._getSizeForTier( z - );

      // console.log(tiersize);

      // r = Math.pow(2, this.numOfTiers() - tier - 1);
      // return [Math.ceil(this.imageProperties.width / r), Math.ceil(this.imageProperties.height / r)];



  // NSString* urlPath = [NSString stringWithFormat:@"%@?%d+%d+%d+%d+%03.03f+80", self.imageName, x_pos, y_pos, _jpgSize, _jpgSize, scale];
//    NSLog(@"%@", urlPath);
    // NSURL * url = [NSURL URLWithString:urlPath];

      // return this.baseUrl + ("TileGroup" + tileGroup + "/" + z + "-" + x + "-" + y + ".jpg" + rangeString);
      return tileurl;
    };

    return AperioLayer;

  })(L.TileLayer);

  window.AperioLayer = AperioLayer;

}).call(this);
